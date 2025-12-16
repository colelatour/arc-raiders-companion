// src/routes/admin.ts
import { Hono } from 'hono';
import { Bindings } from '../index';
import { authMiddleware, adminMiddleware } from '../middleware/auth.ts';

const app = new Hono<{ Bindings: Bindings }>();

// Protect all routes in this module with both auth and admin middleware
app.use('*', authMiddleware);
app.use('*', adminMiddleware);

// =============================================
// Quest Management
// =============================================

app.get('/quests', async (c) => {
    const db = c.env.DB;
    try {
        // D1 supports JSON functions, so this query should work as intended.
        const { results } = await db.prepare(`
            SELECT
                q.id, q.name, q.locations, q.url,
                (SELECT json_group_array(json_object('text', objective_text, 'order', order_index)) FROM quest_objectives WHERE quest_id = q.id) as objectives,
                (SELECT json_group_array(json_object('text', reward_text, 'order', order_index)) FROM quest_rewards WHERE quest_id = q.id) as rewards
            FROM quests q
            ORDER BY q.id
        `).all();
        
        // Parse the JSON strings from the database
        const quests = results.map((quest: any) => ({
            ...quest,
            objectives: JSON.parse(quest.objectives || '[]'),
            rewards: JSON.parse(quest.rewards || '[]')
        }));

        return c.json({ quests });
    } catch (error: any) {
        console.error('Error fetching quests:', error.message);
        return c.json({ error: 'Failed to fetch quests' }, 500);
    }
});

app.post('/quests', async (c) => {
    const { id, name, locations, url, objectives, rewards } = await c.req.json();
    const db = c.env.DB;
      
    if (!id || !name) {
        return c.json({ error: 'Quest ID and name are required' }, 400);
    }

    try {
        const statements = [
            db.prepare('INSERT INTO quests (id, name, locations, url) VALUES (?1, ?2, ?3, ?4)').bind(id, name, locations || '', url || null)
        ];

        (objectives || []).forEach((objective: string, i: number) => {
            if (objective && objective.trim()) {
                statements.push(db.prepare('INSERT INTO quest_objectives (quest_id, objective_text, order_index) VALUES (?1, ?2, ?3)').bind(id, objective.trim(), i));
            }
        });
        (rewards || []).forEach((reward: string, i: number) => {
            if (reward && reward.trim()) {
                statements.push(db.prepare('INSERT INTO quest_rewards (quest_id, reward_text, order_index) VALUES (?1, ?2, ?3)').bind(id, reward.trim(), i));
            }
        });

        await db.batch(statements);
        return c.json({ message: 'Quest created successfully', questId: id }, 201);

    } catch (error: any) {
        console.error('Error creating quest:', error.message);
        if (error.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'Quest ID already exists' }, 409);
        }
        return c.json({ error: 'Failed to create quest' }, 500);
    }
});

app.put('/quests/:id', async (c) => {
    const questId = c.req.param('id');
    const { name, locations, url, objectives, rewards } = await c.req.json();
    const db = c.env.DB;
    
    try {
        const statements = [
            db.prepare('UPDATE quests SET name = ?1, locations = ?2, url = ?3 WHERE id = ?4').bind(name, locations, url || null, questId),
            db.prepare('DELETE FROM quest_objectives WHERE quest_id = ?1').bind(questId),
            db.prepare('DELETE FROM quest_rewards WHERE quest_id = ?1').bind(questId)
        ];

        (objectives || []).forEach((objective: string, i: number) => {
             if (objective && objective.trim()) {
                statements.push(db.prepare('INSERT INTO quest_objectives (quest_id, objective_text, order_index) VALUES (?1, ?2, ?3)').bind(questId, objective.trim(), i));
            }
        });

        (rewards || []).forEach((reward: string, i: number) => {
            if (reward && reward.trim()) {
                statements.push(db.prepare('INSERT INTO quest_rewards (quest_id, reward_text, order_index) VALUES (?1, ?2, ?3)').bind(questId, reward.trim(), i));
            }
        });

        await db.batch(statements);
        return c.json({ message: 'Quest updated successfully' });

    } catch (error: any) {
        console.error('Error updating quest:', error.message);
        return c.json({ error: 'Failed to update quest' }, 500);
    }
});

app.delete('/quests/:id', async (c) => {
    const questId = c.req.param('id');
    const db = c.env.DB;
    try {
        await db.batch([
            db.prepare('DELETE FROM quest_objectives WHERE quest_id = ?1').bind(questId),
            db.prepare('DELETE FROM quest_rewards WHERE quest_id = ?1').bind(questId),
            db.prepare('DELETE FROM raider_completed_quests WHERE quest_id = ?1').bind(questId),
            db.prepare('DELETE FROM quests WHERE id = ?1').bind(questId)
        ]);
        return c.json({ message: 'Quest deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting quest:', error.message);
        return c.json({ error: 'Failed to delete quest' }, 500);
    }
});


// =============================================
// User Management
// =============================================

app.get('/users', async (c) => {
    const db = c.env.DB;
    try {
        const { results } = await db.prepare(`
          SELECT u.id, u.email, u.username, u.role, u.created_at, u.last_login, u.is_active,
                 rp.expedition_level
          FROM users u
          LEFT JOIN raider_profiles rp ON u.id = rp.user_id
          ORDER BY u.id
        `).all();
        return c.json({ users: results });
      } catch (error: any) {
        console.error('Error fetching users:', error.message);
        return c.json({ error: 'Failed to fetch users' }, 500);
      }
});

// Needed for user creation
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

app.post('/users', async (c) => {
    const db = c.env.DB;
    try {
        const { email, username, password, role = 'user' } = await c.req.json();
        if (!email || !username || !password) {
            return c.json({ error: 'Email, username, and password are required' }, 400);
        }
        const passwordHash = await hashPassword(password);
        await db.prepare(
          'INSERT INTO users (email, username, password_hash, role) VALUES (?1, ?2, ?3, ?4)'
        ).bind(email, username, passwordHash, role).run();
        
        return c.json({ message: 'User created successfully' }, 201);
    } catch (error: any) {
        console.error('Error creating user:', error.message);
        if (error.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'Email or username already exists' }, 409);
        }
        return c.json({ error: 'Failed to create user' }, 500);
    }
});

app.delete('/users/:id', async (c) => {
    const db = c.env.DB;
    const userId = c.req.param('id');
    const payload = c.get('jwtPayload');

    if (parseInt(userId, 10) === payload.sub) {
        return c.json({ error: 'For security, you cannot delete your own account from the admin panel.' }, 400);
    }

    try {
        const { success } = await db.prepare('DELETE FROM users WHERE id = ?1').bind(userId).run();
        if (!success) {
            return c.json({ error: 'User not found' }, 404);
        }
        return c.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting user:', error.message);
        return c.json({ error: 'Failed to delete user' }, 500);
    }
});

app.put('/users/:id/role', async (c) => {
    const db = c.env.DB;
    const userId = c.req.param('id');
    const payload = c.get('jwtPayload');
    const { role } = await c.req.json();

    if (parseInt(userId, 10) === payload.sub) {
        return c.json({ error: 'You cannot change your own role.' }, 400);
    }
    if (!role || !['user', 'admin'].includes(role)) {
        return c.json({ error: 'Invalid role specified' }, 400);
    }

    try {
        const { success } = await db.prepare('UPDATE users SET role = ?1 WHERE id = ?2').bind(role, userId).run();
        if (!success) {
            return c.json({ error: 'User not found' }, 404);
        }
        return c.json({ message: 'User role updated successfully' });
    } catch (error: any) {
        console.error('Error updating user role:', error.message);
        return c.json({ error: 'Failed to update user role' }, 500);
    }
});

app.put('/users/:id/expedition-level', async (c) => {
    const db = c.env.DB;
    const userId = c.req.param('id');
    const { expeditionLevel } = await c.req.json();

    if (expeditionLevel === undefined || isNaN(parseInt(expeditionLevel, 10))) {
        return c.json({ error: 'A valid expeditionLevel is required' }, 400);
    }

    try {
        const { success } = await db.prepare(
            'UPDATE raider_profiles SET expedition_level = ?1 WHERE user_id = ?2'
        ).bind(expeditionLevel, userId).run();

        if (!success) {
            return c.json({ error: 'Raider profile not found for this user' }, 404);
        }
        return c.json({ message: 'Expedition level updated successfully' });
    } catch (error: any) {
        console.error('Error updating expedition level:', error.message);
        return c.json({ error: 'Failed to update expedition level' }, 500);
    }
});

// =============================================
// Blueprint Management
// =============================================

app.get('/blueprints', async (c) => {
    const db = c.env.DB;
    try {
        const { results } = await db.prepare('SELECT * FROM blueprints ORDER BY name').all();
        return c.json({ blueprints: results });
    } catch (error: any) {
        console.error('Error fetching blueprints:', error.message);
        return c.json({ error: 'Failed to fetch blueprints' }, 500);
    }
});

app.post('/blueprints', async (c) => {
    const db = c.env.DB;
    try {
        const { name, workshop, recipe, is_lootable, is_quest_reward, is_harvester_event, is_trails_reward } = await c.req.json();
        if (!name || !workshop) {
            return c.json({ error: 'Name and workshop are required' }, 400);
        }
        await db.prepare(
            `INSERT INTO blueprints (name, workshop, recipe, is_lootable, is_quest_reward, is_harvester_event, is_trails_reward)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
        ).bind(name, workshop, recipe, !!is_lootable, !!is_quest_reward, !!is_harvester_event, !!is_trails_reward).run();
        
        return c.json({ message: 'Blueprint created successfully' }, 201);
    } catch (error: any) {
        console.error('Error creating blueprint:', error.message);
        if (error.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'A blueprint with this name already exists' }, 409);
        }
        return c.json({ error: 'Failed to create blueprint' }, 500);
    }
});

app.put('/blueprints/:id', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    try {
        const { name, workshop, recipe, is_lootable, is_quest_reward, is_harvester_event, is_trails_reward } = await c.req.json();
        if (!name || !workshop) {
            return c.json({ error: 'Name and workshop are required' }, 400);
        }
        const { success } = await db.prepare(
            `UPDATE blueprints 
             SET name = ?1, workshop = ?2, recipe = ?3, is_lootable = ?4, is_quest_reward = ?5, is_harvester_event = ?6, is_trails_reward = ?7
             WHERE id = ?8`
        ).bind(name, workshop, recipe, !!is_lootable, !!is_quest_reward, !!is_harvester_event, !!is_trails_reward, id).run();

        if (!success) {
             return c.json({ error: 'Blueprint not found' }, 404);
        }
        return c.json({ message: 'Blueprint updated successfully' });
    } catch (error: any) {
        console.error('Error updating blueprint:', error.message);
        if (error.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'A blueprint with this name already exists' }, 409);
        }
        return c.json({ error: 'Failed to update blueprint' }, 500);
    }
});

app.delete('/blueprints/:id', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    try {
        // Also delete from player's owned blueprints
        await db.batch([
            db.prepare('DELETE FROM raider_owned_blueprints WHERE blueprint_id = ?1').bind(id),
            db.prepare('DELETE FROM blueprints WHERE id = ?1').bind(id)
        ]);
        return c.json({ message: 'Blueprint deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting blueprint:', error.message);
        return c.json({ error: 'Failed to delete blueprint' }, 500);
    }
});


// =============================================
// Expedition Requirements Management
// =============================================

app.get('/expedition-requirements/:level', async (c) => {
    const db = c.env.DB;
    const level = c.req.param('level');
    try {
        const { results } = await db.prepare(
            'SELECT * FROM expedition_requirements WHERE expedition_level = ?1 ORDER BY part_number, display_order'
        ).bind(level).all();
        return c.json({ requirements: results });
    } catch (error: any) {
        console.error(`Error fetching requirements for level ${level}:`, error.message);
        return c.json({ error: `Failed to fetch requirements for level ${level}` }, 500);
    }
});

app.get('/expedition-requirements-levels', async (c) => {
    const db = c.env.DB;
    try {
        const { results } = await db.prepare(
            'SELECT DISTINCT expedition_level FROM expedition_requirements ORDER BY expedition_level'
        ).all();
        return c.json({ levels: results.map((r: any) => r.expedition_level) });
    } catch (error: any) {
        console.error('Error fetching expedition levels:', error.message);
        return c.json({ error: 'Failed to fetch expedition levels' }, 500);
    }
});

app.post('/expedition-requirements', async (c) => {
    const db = c.env.DB;
    try {
        const { expedition_level, part_number, item_name, quantity, location, display_order } = await c.req.json();
        if (!expedition_level || !part_number || !item_name || !quantity || !location) {
            return c.json({ error: 'Missing required fields' }, 400);
        }
        
        await db.prepare(
          `INSERT INTO expedition_requirements 
           (expedition_level, part_number, item_name, quantity, location, display_order) 
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
        ).bind(expedition_level, part_number, item_name, quantity, location, display_order || 0).run();
        
        return c.json({ message: 'Requirement created successfully' }, 201);
    } catch (error: any) {
        console.error('Error creating expedition requirement:', error.message);
        return c.json({ error: 'Failed to create expedition requirement' }, 500);
    }
});

app.put('/expedition-requirements/:id', async (c) => {
    const db = c.env.DB;
    try {
        const { id } = c.req.param();
        const { item_name, quantity, location, display_order } = await c.req.json();
        
        const { success } = await db.prepare(
          `UPDATE expedition_requirements 
           SET item_name = ?1, quantity = ?2, location = ?3, display_order = ?4, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?5`
        ).bind(item_name, quantity, location, display_order, id).run();
        
        if (!success) {
            return c.json({ error: 'Requirement not found' }, 404);
        }
        
        return c.json({ message: 'Requirement updated successfully' });
    } catch (error: any) {
        console.error('Error updating expedition requirement:', error.message);
        return c.json({ error: 'Failed to update expedition requirement' }, 500);
    }
});

app.delete('/expedition-requirements/:id', async (c) => {
    const db = c.env.DB;
    try {
        const { id } = c.req.param();
        const { success } = await db.prepare(
          'DELETE FROM expedition_requirements WHERE id = ?1'
        ).bind(id).run();
        
        if (!success) {
            return c.json({ error: 'Requirement not found' }, 404);
        }
        
        return c.json({ message: 'Requirement deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting expedition requirement:', error.message);
        return c.json({ error: 'Failed to delete expedition requirement' }, 500);
    }
});

app.post('/expedition-requirements/copy', async (c) => {
    const db = c.env.DB;
    try {
        const { from_level, to_level } = await c.req.json();
        if (!from_level || !to_level) {
            return c.json({ error: 'Missing required fields: from_level and to_level' }, 400);
        }
        
        const existing = await db.prepare(
          'SELECT COUNT(*) as count FROM expedition_requirements WHERE expedition_level = ?1'
        ).bind(to_level).first<{ count: number }>();
        
        if (existing && existing.count > 0) {
            return c.json({ error: `Expedition ${to_level} already has requirements. Delete them first if you want to copy.` }, 400);
        }
        
        // This is a bit tricky in a single query with D1. We'll read and then write.
        const { results } = await db.prepare(
            'SELECT part_number, item_name, quantity, location, display_order FROM expedition_requirements WHERE expedition_level = ?1'
        ).bind(from_level).all();

        if (!results || results.length === 0) {
            return c.json({ error: `No requirements found for Expedition ${from_level} to copy.`}, 404);
        }

        const insertStatements = results.map((r: any) => 
            db.prepare(
                `INSERT INTO expedition_requirements (expedition_level, part_number, item_name, quantity, location, display_order)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
            ).bind(to_level, r.part_number, r.item_name, r.quantity, r.location, r.display_order)
        );

        await db.batch(insertStatements);
        
        return c.json({ message: `Copied ${insertStatements.length} requirements to Expedition ${to_level}` });
    } catch (error: any) {
        console.error('Error copying expedition requirements:', error.message);
        return c.json({ error: 'Failed to copy expedition requirements' }, 500);
    }
});

export default app;
