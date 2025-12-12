import { Hono } from 'hono';
import { authMiddleware, requireAdmin } from '../middleware/auth-worker.js';
import dbAdapter from '../database.js';
import { hashPassword } from '../utils/crypto.js';

const admin = new Hono();

admin.use('*', authMiddleware());
admin.use('*', requireAdmin());

admin.get('/quests', async (c) => {
    try {
        const quests = await dbAdapter.query(`
          SELECT 
            q.id, 
            q.name, 
            q.locations, 
            q.url,
            (SELECT json_group_array(objective_text) FROM (SELECT objective_text FROM quest_objectives WHERE quest_id = q.id ORDER BY order_index)) as objectives,
            (SELECT json_group_array(reward_text) FROM (SELECT reward_text FROM quest_rewards WHERE quest_id = q.id ORDER BY order_index)) as rewards
          FROM quests q
          ORDER BY q.id
        `);
        
        return c.json({ quests: quests.rows });
      } catch (error) {
        console.error('Error fetching quests:', error);
        return c.json({ error: 'Failed to fetch quests' }, 500);
      }
});

admin.post('/quests', async (c) => {
    const { id, name, locations, url, objectives, rewards } = await c.req.json();
      
    try {
        if (!id || !name) {
            return c.json({ error: 'Quest ID and name are required' }, 400);
        }
        
        const statements = [
            dbAdapter.db.prepare('INSERT INTO quests (id, name, locations, url) VALUES (?1, ?2, ?3, ?4)').bind(id, name, locations || '', url || null)
        ];

        if (objectives && objectives.length > 0) {
            for (let i = 0; i < objectives.length; i++) {
                const objective = objectives[i];
                if (objective && objective.trim()) {
                    statements.push(dbAdapter.db.prepare('INSERT INTO quest_objectives (quest_id, objective_text, order_index) VALUES (?1, ?2, ?3)').bind(id, objective.trim(), i));
                }
            }
        }
        if (rewards && rewards.length > 0) {
            for (let i = 0; i < rewards.length; i++) {
                const reward = rewards[i];
                if (reward && reward.trim()) {
                    statements.push(dbAdapter.db.prepare('INSERT INTO quest_rewards (quest_id, reward_text, order_index) VALUES (?1, ?2, ?3)').bind(id, reward.trim(), i));
                }
            }
        }

        await dbAdapter.db.batch(statements);
        
        return c.json({ message: 'Quest created successfully', questId: id }, 201);
    } catch (error) {
        console.error('Error creating quest:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'Quest ID already exists' }, 409);
        }
        return c.json({ error: 'Failed to create quest' }, 500);
    }
});

admin.put('/quests/:id', async (c) => {
    const questId = c.req.param('id');
    const { name, locations, url, objectives, rewards } = await c.req.json();
    
    try {
        const statements = [
            dbAdapter.db.prepare('UPDATE quests SET name = ?1, locations = ?2, url = ?3 WHERE id = ?4').bind(name, locations, url || null, questId),
            dbAdapter.db.prepare('DELETE FROM quest_objectives WHERE quest_id = ?1').bind(questId),
            dbAdapter.db.prepare('DELETE FROM quest_rewards WHERE quest_id = ?1').bind(questId)
        ];

        if (objectives && objectives.length > 0) {
            for (let i = 0; i < objectives.length; i++) {
                const objective = objectives[i];
                if (objective && objective.trim()) {
                    statements.push(dbAdapter.db.prepare('INSERT INTO quest_objectives (quest_id, objective_text, order_index) VALUES (?1, ?2, ?3)').bind(questId, objective.trim(), i));
                }
            }
        }

        if (rewards && rewards.length > 0) {
            for (let i = 0; i < rewards.length; i++) {
                const reward = rewards[i];
                if (reward && reward.trim()) {
                    statements.push(dbAdapter.db.prepare('INSERT INTO quest_rewards (quest_id, reward_text, order_index) VALUES (?1, ?2, ?3)').bind(questId, reward.trim(), i));
                }
            }
        }

        await dbAdapter.db.batch(statements);

        return c.json({ message: 'Quest updated successfully' });
    } catch (error) {
        console.error('Error updating quest:', error);
        return c.json({ error: 'Failed to update quest' }, 500);
    }
});

admin.delete('/quests/:id', async (c) => {
    const questId = c.req.param('id');
    
    try {
        await dbAdapter.db.batch([
            dbAdapter.db.prepare('DELETE FROM quest_objectives WHERE quest_id = ?1').bind(questId),
            dbAdapter.db.prepare('DELETE FROM quest_rewards WHERE quest_id = ?1').bind(questId),
            dbAdapter.db.prepare('DELETE FROM raider_completed_quests WHERE quest_id = ?1').bind(questId),
            dbAdapter.db.prepare('DELETE FROM quests WHERE id = ?1').bind(questId)
        ]);

        return c.json({ message: 'Quest deleted successfully' });
    } catch (error) {
        console.error('Error deleting quest:', error);
        return c.json({ error: 'Failed to delete quest' }, 500);
    }
});

admin.get('/users', async (c) => {
    try {
        const users = await dbAdapter.query(`
          SELECT u.id, u.email, u.username, u.role, u.created_at, u.last_login, u.is_active,
                 rp.expedition_level
          FROM users u
          LEFT JOIN raider_profiles rp ON u.id = rp.user_id
          ORDER BY u.id
        `);
        return c.json({ users: users.rows });
      } catch (error) {
        console.error('Error fetching users:', error);
        return c.json({ error: 'Failed to fetch users' }, 500);
      }
});

admin.post('/users', async (c) => {
    const { email, username, password, role = 'user' } = await c.req.json();
    try {
        if (!email || !username || !password) {
            return c.json({ error: 'Email, username, and password are required' }, 400);
        }
        if (username.length < 3) {
            return c.json({ error: 'Username must be at least 3 characters' }, 400);
        }
        if (password.length < 6) {
            return c.json({ error: 'Password must be at least 6 characters' }, 400);
        }

        const hashedPassword = await hashPassword(password);
        
        const result = await dbAdapter.query(
          'INSERT INTO users (email, username, password_hash, role) VALUES (?1, ?2, ?3, ?4) RETURNING id',
          [email, username, hashedPassword, role]
        );
        
        return c.json({ message: 'User created successfully', userId: result.rows[0].id }, 201);
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'Email or username already exists' }, 409);
        }
        return c.json({ error: 'Failed to create user' }, 500);
    }
});

admin.delete('/users/:id', async (c) => {
    const userId = parseInt(c.req.param('id'));
    const payload = c.get('jwtPayload');
    try {
        if (userId === payload.userId) {
            return c.json({ error: 'Cannot delete your own account' }, 400);
        }
        
        const result = await dbAdapter.query('DELETE FROM users WHERE id = ?1 RETURNING id', [userId]);
        
        if (result.rows.length === 0) {
            return c.json({ error: 'User not found' }, 404);
        }
        
        return c.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return c.json({ error: 'Failed to delete user' }, 500);
    }
});

admin.put('/users/:id/role', async (c) => {
    const userId = parseInt(c.req.param('id'));
    const { role } = await c.req.json();
    const payload = c.get('jwtPayload');
    
    try {
        if (!role || !['user', 'admin'].includes(role)) {
            return c.json({ error: 'Invalid role. Must be "user" or "admin"' }, 400);
        }
        
        if (userId === payload.userId) {
            return c.json({ error: 'Cannot change your own role' }, 400);
        }
        
        const result = await dbAdapter.query(
          'UPDATE users SET role = ?1 WHERE id = ?2 RETURNING id',
          [role, userId]
        );
        
        if (result.rows.length === 0) {
            return c.json({ error: 'User not found' }, 404);
        }
        
        return c.json({ message: 'User role updated successfully' });
      } catch (error) {
        console.error('Error updating user role:', error);
        return c.json({ error: 'Failed to update user role' }, 500);
      }
});

admin.get('/expedition-requirements-levels', async (c) => {
    try {
        const result = await dbAdapter.query(
            'SELECT DISTINCT expedition_level FROM expedition_requirements ORDER BY expedition_level'
        );
        
        return c.json({ levels: result.rows.map(r => r.expedition_level) });
    } catch (error) {
        console.error('Error fetching expedition levels:', error);
        return c.json({ error: 'Failed to fetch expedition levels' }, 500);
    }
});

admin.post('/expedition-requirements', async (c) => {
    try {
        const { expedition_level, part_number, item_name, quantity, location, display_order } = await c.req.json();
        
        if (!expedition_level || !part_number || !item_name || !quantity || !location) {
            return c.json({ error: 'Missing required fields' }, 400);
        }
        
        const result = await dbAdapter.query(
          `INSERT INTO expedition_requirements 
           (expedition_level, part_number, item_name, quantity, location, display_order) 
           VALUES (?1, ?2, ?3, ?4, ?5, ?6) 
           RETURNING *`,
          [expedition_level, part_number, item_name, quantity, location, display_order || 0]
        );
        
        return c.json({ requirement: result.rows[0] });
    } catch (error) {
        console.error('Error creating expedition requirement:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'This item already exists for this expedition and part' }, 400);
        }
        return c.json({ error: 'Failed to create expedition requirement' }, 500);
    }
});

admin.put('/expedition-requirements/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const { item_name, quantity, location, display_order } = await c.req.json();
        
        const result = await dbAdapter.query(
          `UPDATE expedition_requirements 
           SET item_name = ?1, quantity = ?2, location = ?3, display_order = ?4, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?5
           RETURNING *`,
          [item_name, quantity, location, display_order, id]
        );
        
        if (result.rows.length === 0) {
            return c.json({ error: 'Requirement not found' }, 404);
        }
        
        return c.json({ requirement: result.rows[0] });
    } catch (error) {
        console.error('Error updating expedition requirement:', error);
        return c.json({ error: 'Failed to update expedition requirement' }, 500);
    }
});

admin.delete('/expedition-requirements/:id', async (c) => {
    try {
        const { id } = c.req.param();
        
        const result = await dbAdapter.query(
          'DELETE FROM expedition_requirements WHERE id = ?1 RETURNING *',
          [id]
        );
        
        if (result.rows.length === 0) {
            return c.json({ error: 'Requirement not found' }, 404);
        }
        
        return c.json({ message: 'Requirement deleted successfully' });
    } catch (error) {
        console.error('Error deleting expedition requirement:', error);
        return c.json({ error: 'Failed to delete expedition requirement' }, 500);
    }
});

admin.post('/expedition-requirements/copy', async (c) => {
    try {
        const { from_level, to_level } = await c.req.json();
        
        if (!from_level || !to_level) {
            return c.json({ error: 'Missing required fields: from_level and to_level' }, 400);
        }
        
        const existing = await dbAdapter.query(
          'SELECT COUNT(*) as count FROM expedition_requirements WHERE expedition_level = ?1',
          [to_level]
        );
        
        if (existing.rows[0].count > 0) {
            return c.json({ error: `Expedition ${to_level} already has requirements. Delete them first if you want to copy.` }, 400);
        }
        
        const result = await dbAdapter.query(
          `INSERT INTO expedition_requirements (expedition_level, part_number, item_name, quantity, location, display_order)
           SELECT ?1, part_number, item_name, quantity, location, display_order
           FROM expedition_requirements
           WHERE expedition_level = ?2
           RETURNING *`,
          [to_level, from_level]
        );
        
        return c.json({ message: `Copied ${result.rows.length} requirements to Expedition ${to_level}`, requirements: result.rows });
    } catch (error) {
        console.error('Error copying expedition requirements:', error);
        return c.json({ error: 'Failed to copy expedition requirements' }, 500);
    }
});

export default admin;