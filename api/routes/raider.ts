// src/routes/raider.ts
import { Hono } from 'hono';
import { Bindings } from '../index';
import { authMiddleware } from '../middleware/auth.ts';
import * as bcrypt from 'bcryptjs';

// Define the shape of the JWT payload that our middleware adds to the context
type JWTPayload = {
    sub: number; // user ID
    role: string;
    // ... any other claims
};

const app = new Hono<{ Bindings: Bindings, Variables: { jwtPayload: JWTPayload } }>();

// Protect all routes in this module
app.use('*', authMiddleware);

// Helper to check ownership of a profile
const verifyProfileOwnership = async (c: any, profileId: number): Promise<boolean> => {
    const payload = c.get('jwtPayload');
    const db = c.env.DB;
    const profile = await db.prepare(
        'SELECT id FROM raider_profiles WHERE id = ?1 AND user_id = ?2'
    ).bind(profileId, payload.sub).first();
    return !!profile;
};


// GET /api/raider/profiles - Get all profiles for the logged-in user
app.get('/profiles', async (c) => {
    const payload = c.get('jwtPayload');
    const db = c.env.DB;

    // Defensive check to ensure payload exists
    if (!payload) {
        return c.json({ error: 'Unauthorized: JWT payload missing.' }, 401);
    }

    try {
        const { results } = await db.prepare(
            `SELECT id, expedition_level, created_at, updated_at 
             FROM raider_profiles 
             WHERE user_id = ?1 AND is_active = true 
             ORDER BY created_at ASC`
        ).bind(payload.sub).all();
        return c.json({ profiles: results });
    } catch (error: any) {
        console.error('Error fetching profiles:', error.message);
        return c.json({ error: 'Failed to fetch profiles' }, 500);
    }
});

// POST /api/raider/profiles - Create a new raider profile
app.post('/profiles', async (c) => {
    const payload = c.get('jwtPayload');
    const db = c.env.DB;

    if (!payload) {
        return c.json({ error: 'Unauthorized: JWT payload missing.' }, 401);
    }

    try {
        const existing = await db.prepare('SELECT id FROM raider_profiles WHERE user_id = ?1').bind(payload.sub).first();
        if (existing) {
            return c.json({ error: 'Profile already exists for this user' }, 409);
        }

        const user = await db.prepare('SELECT username FROM users WHERE id = ?1').bind(payload.sub).first<{ username: string }>();
        if (!user) {
            return c.json({ error: 'Associated user not found' }, 404);
        }

        const { success } = await db.prepare(
            `INSERT INTO raider_profiles (user_id, raider_name) VALUES (?1, ?2)`
        ).bind(payload.sub, user.username).run();

        if (!success) {
            throw new Error("Failed to insert new profile.");
        }

        const newProfile = await db.prepare("SELECT id, expedition_level, created_at FROM raider_profiles WHERE user_id = ?1").bind(payload.sub).first();

        return c.json({ profile: newProfile }, 201);
    } catch (error: any) {
        console.error('Error creating profile:', error.message);
        return c.json({ error: 'Failed to create profile' }, 500);
    }
});

// GET /api/raider/search - Search for a raider by name
app.get('/search', async (c) => {
    const { raiderName } = c.req.query();
    const db = c.env.DB;
    const payload = c.get('jwtPayload');

    if (!payload) {
        return c.json({ error: 'Unauthorized: JWT payload missing.' }, 401);
    }

    if (!raiderName) {
        return c.json({ error: 'Raider name query is required' }, 400);
    }

    try {
        const profile = await db.prepare(
            `SELECT rp.id, rp.expedition_level, rp.created_at, u.username
             FROM raider_profiles rp JOIN users u ON rp.user_id = u.id
             WHERE LOWER(u.username) = LOWER(?1) AND rp.is_active = true`
        ).bind(raiderName).first<{ id: number; expedition_level: number; created_at: string; username: string }>();

        if (!profile) {
            return c.json({ error: 'Raider not found' }, 404);
        }

        const [quests, blueprints, isFavorited] = await Promise.all([
            db.prepare('SELECT quest_id FROM raider_completed_quests WHERE raider_profile_id = ?1').bind(profile.id).all(),
            db.prepare('SELECT b.name FROM raider_owned_blueprints rob JOIN blueprints b ON rob.blueprint_id = b.id WHERE rob.raider_profile_id = ?1').bind(profile.id).all(),
            db.prepare('SELECT id FROM favorite_raiders WHERE user_id = ?1 AND raider_profile_id = ?2').bind(payload.sub, profile.id).first()
        ]);

        return c.json({
            raider: {
                profileId: profile.id,
                username: profile.username,
                expeditionLevel: profile.expedition_level,
                createdAt: profile.created_at,
                questsCompleted: quests.results?.map((r: any) => r.quest_id) || [],
                blueprintsOwned: blueprints.results?.map((r: any) => r.name) || [],
                isFavorited: !!isFavorited,
                stats: {
                    totalQuestsCompleted: quests.results?.length || 0,
                    totalBlueprintsOwned: blueprints.results?.length || 0,
                }
            }
        });
    } catch (error: any) {
        console.error('Error searching for raider:', error.message);
        return c.json({ error: 'Failed to search for raider' }, 500);
    }
});


// GET /api/raider/tips/random - Get a random tip
app.get('/tips/random', (c) => {
    const tips = [
        "Use the \"Free Loadout\" when starting out or learning a map—no risk if you die.",
        "Upgrade stamina/mobility early to improve survivability.",
        "Use the Safe Pocket for valuable loot or keys.",
        "Don't rush fights; survival matters more than kills.",
        "Focus on exploration and map learning early.",
        "Sound is critical—footsteps and looting noises give away position.",
        "Crouch-walk and reduce noise whenever possible.",
        "After fights, stop and listen before looting.",
        "Craft custom loadouts once stable.",
        "Prioritize high-value loot over junk.",
        "Use crafting benches for weapon/equipment improvements.",
        "Bring utility items like grenades and smokes.",
        "Use cover and high ground; positioning beats aim.",
        "Learn alternate routes to avoid ambushes.",
        "Master map knowledge: ARC patrols, loot, extraction points.",
        "Extraction points are loud and risky—scout first.",
        "Raider Hatch Keys offer quiet extraction options.",
        "Even while downed, extraction may still be possible.",
        "Extracting with decent loot is better than dying with rare loot.",
        "Choose fights wisely—avoid unnecessary engagements.",
        "Use weapons effective against armored ARC enemies.",
        "Melee weak AI enemies to conserve ammo and reduce noise.",
        "Use tactical gear proactively.",
        "Solo is viable with cautious play: awareness, retreating, early extracts.",
        "Don't let gear-fear stop you—deaths are learning moments.",
        "Practice in low-stakes runs before bringing valuable gear."
      ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    return c.json({ tip: randomTip });
});


// All routes below this require a profile ID and ownership verification
const profileRoutes = new Hono<{ Bindings: Bindings, Variables: { jwtPayload: JWTPayload } }>();

profileRoutes.use('/:profileId/*', async (c, next) => {
    const profileId = parseInt(c.req.param('profileId'), 10);
    if (isNaN(profileId)) {
        return c.json({ error: 'Invalid profile ID' }, 400);
    }
    const isOwner = await verifyProfileOwnership(c, profileId);
    if (!isOwner) {
        return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
});


profileRoutes.delete('/:profileId', async (c) => {
    const profileId = parseInt(c.req.param('profileId'), 10);
    const db = c.env.DB;
    try {
        const { success } = await db.prepare('DELETE FROM raider_profiles WHERE id = ?1').bind(profileId).run();
        if (!success) {
            return c.json({ error: 'Profile not found or could not be deleted' }, 404);
        }
        return c.json({ message: 'Profile deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting profile:', error.message);
        return c.json({ error: 'Failed to delete profile' }, 500);
    }
});


profileRoutes.get('/:profileId/stats', async (c) => {
    const profileId = parseInt(c.req.param('profileId'), 10);
    const db = c.env.DB;
    try {
        const stats = await db.prepare(
            `SELECT
              rp.expedition_level,
              COUNT(DISTINCT rcq.quest_id) as quests_completed,
              COUNT(DISTINCT rob.blueprint_id) as blueprints_owned
             FROM raider_profiles rp
             LEFT JOIN raider_completed_quests rcq ON rp.id = rcq.raider_profile_id
             LEFT JOIN raider_owned_blueprints rob ON rp.id = rob.raider_profile_id
             WHERE rp.id = ?1
             GROUP BY rp.id, rp.expedition_level`
        ).bind(profileId).first();

        return c.json({ stats: stats || {} });
    } catch (error: any) {
        console.error('Error fetching stats:', error.message);
        return c.json({ error: 'Failed to fetch stats' }, 500);
    }
});

// GET /api/raider/profiles/:profileId/quests
profileRoutes.get('/:profileId/quests', async (c) => {
    const profileId = parseInt(c.req.param('profileId'), 10);
    const db = c.env.DB;
    try {
        const { results } = await db.prepare(
            `SELECT quest_id FROM raider_completed_quests WHERE raider_profile_id = ?1`
        ).bind(profileId).all();
        return c.json({ completedQuests: results.map((r: any) => r.quest_id) });
    } catch (error: any) {
        console.error('Error fetching quests:', error.message);
        return c.json({ error: 'Failed to fetch quests' }, 500);
    }
});

// POST /api/raider/profiles/:profileId/quests/:questId
profileRoutes.post('/:profileId/quests/:questId', async (c) => {
    const profileId = parseInt(c.req.param('profileId'), 10);
    const questId = parseInt(c.req.param('questId'), 10);
    const db = c.env.DB;
    try {
        const existing = await db.prepare(
            `SELECT id FROM raider_completed_quests WHERE raider_profile_id = ?1 AND quest_id = ?2`
        ).bind(profileId, questId).first();

        if (existing) {
            await db.prepare(
                'DELETE FROM raider_completed_quests WHERE raider_profile_id = ?1 AND quest_id = ?2'
            ).bind(profileId, questId).run();
            return c.json({ completed: false });
        } else {
            await db.prepare(
                'INSERT INTO raider_completed_quests (raider_profile_id, quest_id) VALUES (?1, ?2)'
            ).bind(profileId, questId).run();
            return c.json({ completed: true });
        }
    } catch (error: any) {
        console.error('Error toggling quest:', error.message);
        return c.json({ error: 'Failed to toggle quest' }, 500);
    }
});

profileRoutes.post('/:profileId/blueprints/:blueprintName', async (c) => {
    const profileId = parseInt(c.req.param('profileId'), 10);
    const blueprintName = c.req.param('blueprintName');
    const db = c.env.DB;
    try {
        const blueprint = await db.prepare('SELECT id FROM blueprints WHERE name = ?1').bind(blueprintName).first<{ id: number }>();
        if (!blueprint) {
            return c.json({ error: 'Blueprint not found' }, 404);
        }

        const existing = await db.prepare(
            'SELECT id FROM raider_owned_blueprints WHERE raider_profile_id = ?1 AND blueprint_id = ?2'
        ).bind(profileId, blueprint.id).first();

        if (existing) {
            await db.prepare('DELETE FROM raider_owned_blueprints WHERE id = ?1').bind(existing.id).run();
            return c.json({ owned: false });
        } else {
            await db.prepare('INSERT INTO raider_owned_blueprints (raider_profile_id, blueprint_id) VALUES (?1, ?2)').bind(profileId, blueprint.id).run();
            return c.json({ owned: true });
        }
    } catch (error: any) {
        console.error('Error toggling blueprint:', error.message);
        return c.json({ error: 'Failed to toggle blueprint' }, 500);
    }
});

profileRoutes.post('/:profileId/workbenches/:workbenchName', async (c) => {
    const profileId = parseInt(c.req.param('profileId'), 10);
    const workbenchName = c.req.param('workbenchName');
    const db = c.env.DB;
    try {
        const workbench = await db.prepare('SELECT id FROM workbenches WHERE name = ?1').bind(workbenchName).first<{ id: number }>();
        if (!workbench) {
            return c.json({ error: 'Workbench not found' }, 404);
        }

        const existing = await db.prepare(
            'SELECT id FROM raider_completed_workbenches WHERE raider_profile_id = ?1 AND workbench_id = ?2'
        ).bind(profileId, workbench.id).first();

        if (existing) {
            await db.prepare('DELETE FROM raider_completed_workbenches WHERE id = ?1').bind(existing.id).run();
            return c.json({ completed: false });
        } else {
            await db.prepare('INSERT INTO raider_completed_workbenches (raider_profile_id, workbench_id) VALUES (?1, ?2)').bind(profileId, workbench.id).run();
            return c.json({ completed: true });
        }
    } catch (error: any) {
        console.error('Error toggling workbench:', error.message);
        return c.json({ error: 'Failed to toggle workbench' }, 500);
    }
});

profileRoutes.post('/:profileId/expedition-items/:partName/:itemName', async (c) => {
    const profileId = parseInt(c.req.param('profileId'), 10);
    const { partName, itemName } = c.req.param();
    const db = c.env.DB;

    try {
        const existing = await db.prepare(
            'SELECT id FROM raider_completed_expedition_items WHERE raider_profile_id = ?1 AND part_name = ?2 AND item_name = ?3'
        ).bind(profileId, partName, itemName).first();

        if (existing) {
            await db.prepare('DELETE FROM raider_completed_expedition_items WHERE id = ?1').bind(existing.id).run();
            return c.json({ completed: false });
        } else {
            await db.prepare(
                'INSERT INTO raider_completed_expedition_items (raider_profile_id, part_name, item_name) VALUES (?1, ?2, ?3)'
            ).bind(profileId, partName, itemName).run();
            return c.json({ completed: true });
        }
    } catch (error: any) {
        console.error('Error toggling expedition item:', error.message);
        return c.json({ error: 'Failed to toggle expedition item' }, 500);
    }
});

// GET /api/raider/profiles/:profileId/blueprints
profileRoutes.get('/:profileId/blueprints', async (c) => {
    const profileId = parseInt(c.req.param('profileId'), 10);
    const db = c.env.DB;
    try {
        const { results } = await db.prepare(
            `SELECT b.name FROM raider_owned_blueprints rob
             JOIN blueprints b ON rob.blueprint_id = b.id
             WHERE rob.raider_profile_id = ?1`
        ).bind(profileId).all();
        return c.json({ ownedBlueprints: results.map((r: any) => r.name) });
    } catch (error: any) {
        console.error('Error fetching blueprints:', error.message);
        return c.json({ error: 'Failed to fetch blueprints' }, 500);
    }
});

// GET /api/raider/profiles/:profileId/workbenches
profileRoutes.get('/:profileId/workbenches', async (c) => {
    const profileId = parseInt(c.req.param('profileId'), 10);
    const db = c.env.DB;
    try {
        const { results } = await db.prepare(
            `SELECT w.name FROM raider_completed_workbenches rcw
             JOIN workbenches w ON rcw.workbench_id = w.id
             WHERE rcw.raider_profile_id = ?1`
        ).bind(profileId).all();
        return c.json({ completedWorkbenches: results.map((r: any) => r.name) });
    } catch (error: any) {
        console.error('Error fetching completed workbenches:', error.message);
        return c.json({ error: 'Failed to fetch completed workbenches' }, 500);
    }
});

// GET /api/raider/profiles/:profileId/expedition-parts
profileRoutes.get('/:profileId/expedition-parts', async (c) => {
    const profileId = parseInt(c.req.param('profileId'), 10);
    const db = c.env.DB;
    try {
        // This table stores the name directly, so no join is needed.
        const { results } = await db.prepare(
            `SELECT part_name FROM raider_completed_expedition_parts
             WHERE raider_profile_id = ?1`
        ).bind(profileId).all();
        return c.json({ completedExpeditionParts: results.map((r: any) => r.part_name) });
    } catch (error: any) {
        console.error('Error fetching completed expedition parts:', error.message);
        return c.json({ error: 'Failed to fetch completed expedition parts' }, 500);
    }
});

// GET /api/raider/profiles/:profileId/expedition-items
profileRoutes.get('/:profileId/expedition-items', async (c) => {
    const profileId = parseInt(c.req.param('profileId'), 10);
    const db = c.env.DB;
    try {
        // This table also stores names directly.
        const { results } = await db.prepare(
            `SELECT part_name, item_name FROM raider_completed_expedition_items
             WHERE raider_profile_id = ?1`
        ).bind(profileId).all();
        return c.json({ completedExpeditionItems: results });
    } catch (error: any) {
        console.error('Error fetching completed expedition items:', error.message);
        return c.json({ error: 'Failed to fetch completed expedition items' }, 500);
    }
});

profileRoutes.post('/:profileId/expedition/complete', (c) => c.json({ message: 'POST /:profileId/expedition/complete not implemented' }, 501));
profileRoutes.post('/:profileId/expedition-parts/:partName', (c) => c.json({ message: `POST /:profileId/expedition-parts/${c.req.param('partName')} not implemented` }, 501));



// Mount the sub-router for profile-specific actions
app.route('/profiles', profileRoutes);

// =============================================
// User Settings, Favorites, etc.
// =============================================
// NOTE: These operate on the logged-in user's own data, so they use the main 'app' router.

// Favorites
app.get('/favorites', async (c) => {
    const payload = c.get('jwtPayload');
    const db = c.env.DB;

    if (!payload) {
        return c.json({ error: 'Unauthorized: JWT payload missing.' }, 401);
    }

    try {
        const { results } = await db.prepare(
            `SELECT rp.id, rp.expedition_level, u.username, fr.created_at as favorited_at
             FROM favorite_raiders fr
             JOIN raider_profiles rp ON fr.raider_profile_id = rp.id
             JOIN users u ON rp.user_id = u.id
             WHERE fr.user_id = ?1 AND rp.is_active = true
             ORDER BY fr.created_at DESC`
        ).bind(payload.sub).all();
        return c.json({ favorites: results });
    } catch (error: any) {
        console.error('Error fetching favorites:', error.message);
        return c.json({ error: 'Failed to fetch favorites' }, 500);
    }
});

app.post('/favorites/:raiderProfileId', async (c) => {
    const raiderProfileId = parseInt(c.req.param('raiderProfileId'), 10);
    const payload = c.get('jwtPayload');
    const db = c.env.DB;

    if (!payload) {
        return c.json({ error: 'Unauthorized: JWT payload missing.' }, 401);
    }

    try {
        const profile = await db.prepare('SELECT id FROM raider_profiles WHERE id = ?1 AND is_active = true').bind(raiderProfileId).first();
        if (!profile) {
            return c.json({ error: 'Raider profile not found' }, 404);
        }
        await db.prepare(
            'INSERT INTO favorite_raiders (user_id, raider_profile_id) VALUES (?1, ?2) ON CONFLICT DO NOTHING'
        ).bind(payload.sub, raiderProfileId).run();
        return c.json({ message: 'Raider added to favorites' });
    } catch (error: any) {
        console.error('Error adding favorite:', error.message);
        return c.json({ error: 'Failed to add favorite' }, 500);
    }
});

app.delete('/favorites/:raiderProfileId', async (c) => {
    const raiderProfileId = parseInt(c.req.param('raiderProfileId'), 10);
    const payload = c.get('jwtPayload');
    const db = c.env.DB;

    if (!payload) {
        return c.json({ error: 'Unauthorized: JWT payload missing.' }, 401);
    }

    try {
        await db.prepare('DELETE FROM favorite_raiders WHERE user_id = ?1 AND raider_profile_id = ?2').bind(payload.sub, raiderProfileId).run();
        return c.json({ message: 'Raider removed from favorites' });
    } catch (error: any) {
        console.error('Error removing favorite:', error.message);
        return c.json({ error: 'Failed to remove favorite' }, 500);
    }
});


import * as bcrypt from 'bcryptjs';

// Settings
app.put('/settings/password', async (c) => {
    const { currentPassword, newPassword } = await c.req.json();
    const payload = c.get('jwtPayload');
    const db = c.env.DB;

    if (!payload) {
        return c.json({ error: 'Unauthorized: JWT payload missing.' }, 401);
    }

    if (!currentPassword || !newPassword || newPassword.length < 6) {
        return c.json({ error: 'Both passwords are required and the new password must be at least 6 characters.' }, 400);
    }

    try {
        const user = await db.prepare('SELECT password_hash FROM users WHERE id = ?1').bind(payload.sub).first<{ password_hash: string }>();
        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }

        const isValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValid) {
            return c.json({ error: 'Current password is incorrect' }, 401);
        }

        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        await db.prepare('UPDATE users SET password_hash = ?1 WHERE id = ?2').bind(newPasswordHash, payload.sub).run();

        return c.json({ message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Error updating password:', error.message);
        return c.json({ error: 'Failed to update password' }, 500);
    }
});

app.put('/settings/theme', async (c) => {
    const { theme } = await c.req.json();
    const payload = c.get('jwtPayload');
    const db = c.env.DB;

    if (!payload) {
        return c.json({ error: 'Unauthorized: JWT payload missing.' }, 401);
    }

    if (theme !== 'light' && theme !== 'dark') {
        return c.json({ error: 'Invalid theme. Must be "light" or "dark"' }, 400);
    }

    try {
        await db.prepare('UPDATE users SET theme = ?1 WHERE id = ?2').bind(theme, payload.sub).run();
        return c.json({ message: 'Theme updated successfully', theme });
    } catch (error: any) {
        console.error('Error updating theme:', error.message);
        return c.json({ error: 'Failed to update theme' }, 500);
    }
});

app.put('/settings/username', (c) => c.json({ message: 'PUT /settings/username not implemented' }, 501));
app.post('/settings/reset', (c) => c.json({ message: 'POST /settings/reset not implemented' }, 501));
app.delete('/settings/account', (c) => c.json({ message: 'DELETE /settings/account not implemented' }, 501));



// Expedition Requirements
app.get('/expedition-requirements', async (c) => {
    const payload = c.get('jwtPayload');
    const db = c.env.DB;

    if (!payload) {
        return c.json({ error: 'Unauthorized: JWT payload missing.' }, 401);
    }

    try {
        const profile = await db.prepare(
            'SELECT expedition_level FROM raider_profiles WHERE user_id = ?1 AND is_active = true LIMIT 1'
        ).bind(payload.sub).first<{ expedition_level: number }>();
        
        if (!profile) {
            return c.json({ error: 'Profile not found' }, 404);
        }
        
        const { results } = await db.prepare(
           `SELECT * FROM expedition_requirements WHERE expedition_level = ?1 ORDER BY part_number, display_order`
        ).bind(profile.expedition_level).all();
        
        return c.json({
          expeditionLevel: profile.expedition_level,
          requirements: results
        });
      } catch (error: any) {
        console.error('Error fetching expedition requirements:', error.message);
        return c.json({ error: 'Failed to fetch expedition requirements' }, 500);
      }
});

app.get('/workbenches', async (c) => {
    const db = c.env.DB;
    try {
        const { results } = await db.prepare(`
          SELECT id, name, category, level, display_order
          FROM workbenches
          ORDER BY display_order, level
        `).all();
        
        return c.json({ workbenches: results });
      } catch (error: any) {
        console.error('Error fetching workbenches:', error.message);
        return c.json({ error: 'Failed to fetch workbenches' }, 500);
      }
});

app.get('/quests', async (c) => {
    const db = c.env.DB;
    try {
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

app.get('/expedition-parts', async (c) => {
    const db = c.env.DB;
    try {
        const { results } = await db.prepare(
            `SELECT * FROM expedition_parts ORDER BY display_order`
        ).all();
        return c.json({ expeditionParts: results });
    } catch (error: any) {
        console.error('Error fetching expedition parts:', error.message);
        return c.json({ error: 'Failed to fetch expedition parts' }, 500);
    }
});

app.get('/expedition-items', async (c) => {
    const db = c.env.DB;
    try {
        const { results } = await db.prepare(`
            SELECT
                er.id,
                er.expedition_level,
                ep.name as part_name,
                er.part_number,
                er.item_name,
                er.quantity,
                er.location,
                er.display_order
            FROM expedition_requirements er
            JOIN expedition_parts ep ON er.part_number = ep.part_number
            ORDER BY er.expedition_level, ep.display_order, er.display_order
        `).all();
        return c.json({ expeditionItems: results });
    } catch (error: any) {
        console.error('Error fetching expedition items:', error.message);
        return c.json({ error: 'Failed to fetch expedition items' }, 500);
    }
});

export default app;
