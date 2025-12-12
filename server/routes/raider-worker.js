import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth-worker.js';
import dbAdapter from '../database.js';
import { comparePassword, hashPassword } from '../utils/crypto.js';

const raider = new Hono();

raider.use('*', authMiddleware());

raider.get('/profiles', async (c) => {
    try {
      const payload = c.get('jwtPayload');
      const result = await dbAdapter.query(
        `SELECT id, expedition_level, created_at, updated_at 
         FROM raider_profiles 
         WHERE user_id = ?1 AND is_active = true 
         ORDER BY created_at ASC`,
        [payload.userId]
      );

      return c.json({ profiles: result.rows });
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return c.json({ error: 'Failed to fetch profiles' }, 500);
    }
});

raider.post('/profiles', async (c) => {
    try {
      const payload = c.get('jwtPayload');
      // Check if user already has a profile
      const existing = await dbAdapter.query(
        'SELECT id FROM raider_profiles WHERE user_id = ?1',
        [payload.userId]
      );

      if (existing.rows.length > 0) {
        return c.json({ error: 'Profile already exists for this user' }, 409);
      }

      // Get username for raider_name
      const userResult = await dbAdapter.query(
        'SELECT username FROM users WHERE id = ?1',
        [payload.userId]
      );
      const username = userResult.rows[0].username;

      const result = await dbAdapter.query(
        `INSERT INTO raider_profiles (user_id, raider_name, expedition_level) 
         VALUES (?1, ?2, 0) 
         RETURNING id, expedition_level, created_at`,
        [payload.userId, username]
      );

      return c.json({ profile: result.rows[0] }, 201);
    } catch (error) {
      console.error('Error creating profile:', error);
      return c.json({ error: 'Failed to create profile' }, 500);
    }
});

raider.delete('/profiles/:profileId', async (c) => {
    const  profileId  = c.req.param('profileId');
    const payload = c.get('jwtPayload');

    try {
      // Verify ownership
      const result = await dbAdapter.query(
        'DELETE FROM raider_profiles WHERE id = ?1 AND user_id = ?2 RETURNING id',
        [profileId, payload.userId]
      );

      if (result.rows.length === 0) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      return c.json({ message: 'Profile deleted successfully' });
    } catch (error) {
      console.error('Error deleting profile:', error);
      return c.json({ error: 'Failed to delete profile' }, 500);
    }
});

raider.get('/profiles/:profileId/stats', async (c) => {
    const  profileId  = c.req.param('profileId');
    const payload = c.get('jwtPayload');

    try {
      // Verify ownership
      const profile = await dbAdapter.query(
        'SELECT * FROM raider_profiles WHERE id = ?1 AND user_id = ?2',
        [profileId, payload.userId]
      );

      if (profile.rows.length === 0) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      const stats = await dbAdapter.query(
        `SELECT 
          rp.expedition_level,
          COUNT(DISTINCT rcq.quest_id) as quests_completed,
          COUNT(DISTINCT rob.blueprint_id) as blueprints_owned
         FROM raider_profiles rp
         LEFT JOIN raider_completed_quests rcq ON rp.id = rcq.raider_profile_id
         LEFT JOIN raider_owned_blueprints rob ON rp.id = rob.raider_profile_id
         WHERE rp.id = ?1
         GROUP BY rp.id, rp.expedition_level`,
        [profileId]
      );

      return c.json({ stats: stats.rows[0] });
    } catch (error) {
      console.error('Error fetching stats:', error);
      return c.json({ error: 'Failed to fetch stats' }, 500);
    }
});

raider.get('/profiles/:profileId/quests', async (c) => {
    const  profileId  = c.req.param('profileId');
    const payload = c.get('jwtPayload');
    try {
        const result = await dbAdapter.query(
            `SELECT quest_id FROM raider_completed_quests 
             WHERE raider_profile_id = ?1
             AND raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = ?2
             )`,
            [profileId, payload.userId]
        );

        return c.json({ completedQuests: result.rows.map(r => r.quest_id) });
    } catch (error) {
        console.error('Error fetching quests:', error);
        return c.json({ error: 'Failed to fetch quests' }, 500);
    }
});

raider.post('/profiles/:profileId/quests/:questId', async (c) => {
    const { profileId, questId } = c.req.param();
    const payload = c.get('jwtPayload');
    try {
        const existing = await dbAdapter.query(
            `SELECT id FROM raider_completed_quests
             WHERE raider_profile_id = ?1 AND quest_id = ?2
             AND raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = ?3
             )`,
            [profileId, questId, payload.userId]
        );

        if (existing.rows.length > 0) {
            await dbAdapter.query(
                'DELETE FROM raider_completed_quests WHERE raider_profile_id = ?1 AND quest_id = ?2',
                [profileId, questId]
            );
            return c.json({ completed: false });
        } else {
            await dbAdapter.query(
                'INSERT INTO raider_completed_quests (raider_profile_id, quest_id) VALUES (?1, ?2)',
                [profileId, questId]
            );
            return c.json({ completed: true });
        }
    } catch (error) {
        console.error('Error toggling quest:', error);
        return c.json({ error: 'Failed to toggle quest' }, 500);
    }
});

raider.get('/profiles/:profileId/blueprints', async (c) => {
    const { profileId } = c.req.param();
    const payload = c.get('jwtPayload');
    try {
        const result = await dbAdapter.query(
            `SELECT b.name FROM raider_owned_blueprints rob
             JOIN blueprints b ON rob.blueprint_id = b.id
             WHERE rob.raider_profile_id = ?1 
             AND rob.raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = ?2
             )`,
            [profileId, payload.userId]
        );

        return c.json({ ownedBlueprints: result.rows.map(r => r.name) });
    } catch (error) {
        console.error('Error fetching blueprints:', error);
        return c.json({ error: 'Failed to fetch blueprints' }, 500);
    }
});

raider.post('/profiles/:profileId/blueprints/:blueprintName', async (c) => {
    const { profileId, blueprintName } = c.req.param();
    const payload = c.get('jwtPayload');
    try {
        const blueprint = await dbAdapter.query('SELECT id FROM blueprints WHERE name = ?1', [blueprintName]);
        if (blueprint.rows.length === 0) {
            return c.json({ error: 'Blueprint not found' }, 404);
        }
        const blueprintId = blueprint.rows[0].id;

        const existing = await dbAdapter.query(
            `SELECT id FROM raider_owned_blueprints
             WHERE raider_profile_id = ?1 AND blueprint_id = ?2
             AND raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = ?3
             )`,
            [profileId, blueprintId, payload.userId]
        );

        if (existing.rows.length > 0) {
            await dbAdapter.query(
                'DELETE FROM raider_owned_blueprints WHERE raider_profile_id = ?1 AND blueprint_id = ?2',
                [profileId, blueprintId]
            );
            return c.json({ owned: false });
        } else {
            await dbAdapter.query(
                'INSERT INTO raider_owned_blueprints (raider_profile_id, blueprint_id) VALUES (?1, ?2)',
                [profileId, blueprintId]
            );
            return c.json({ owned: true });
        }
    } catch (error) {
        console.error('Error toggling blueprint:', error);
        return c.json({ error: 'Failed to toggle blueprint' }, 500);
    }
});

raider.get('/workbenches', async (c) => {
    try {
        const workbenches = await dbAdapter.query(`
          SELECT id, name, category, level, display_order
          FROM workbenches
          ORDER BY display_order, level
        `);
        
        return c.json({ workbenches: workbenches.rows });
      } catch (error) {
        console.error('Error fetching workbenches:', error);
        return c.json({ error: 'Failed to fetch workbenches' }, 500);
      }
});

raider.get('/search', async (c) => {
    try {
        const { raiderName } = c.req.query();
        
        if (!raiderName) {
          return c.json({ error: 'Username is required' }, 400);
        }
        
        const profile = await dbAdapter.query(
          `SELECT rp.id, rp.expedition_level, rp.created_at, u.username
           FROM raider_profiles rp
           JOIN users u ON rp.user_id = u.id
           WHERE LOWER(u.username) = LOWER(?1) AND rp.is_active = true
           LIMIT 1`,
          [raiderName]
        );
        
        if (profile.rows.length === 0) {
          return c.json({ error: 'Raider not found' }, 404);
        }
        
        const raiderProfile = profile.rows[0];
        const profileId = raiderProfile.id;
        const payload = c.get('jwtPayload');

        const [
            completedQuests, 
            ownedBlueprints, 
            completedWorkbenches, 
            completedExpeditionParts, 
            completedExpeditionItems, 
            expeditionRequirements,
            isFavorited
        ] = await Promise.all([
            dbAdapter.query('SELECT quest_id FROM raider_completed_quests WHERE raider_profile_id = ?1', [profileId]),
            dbAdapter.query(`SELECT b.name FROM raider_owned_blueprints rob JOIN blueprints b ON rob.blueprint_id = b.id WHERE rob.raider_profile_id = ?1`, [profileId]),
            dbAdapter.query(`SELECT w.name FROM raider_completed_workbenches rcw JOIN workbenches w ON rcw.workbench_id = w.id WHERE rcw.raider_profile_id = ?1`, [profileId]),
            dbAdapter.query(`SELECT ep.name FROM raider_completed_expedition_parts rcep JOIN expedition_parts ep ON rcep.expedition_part_id = ep.id WHERE rcep.raider_profile_id = ?1`, [profileId]),
            dbAdapter.query(`SELECT part_name, item_name FROM raider_completed_expedition_items WHERE raider_profile_id = ?1`, [profileId]),
            dbAdapter.query(`SELECT * FROM expedition_requirements WHERE expedition_level = ?1 ORDER BY part_number, display_order`, [raiderProfile.expedition_level]),
            dbAdapter.query('SELECT id FROM favorite_raiders WHERE user_id = ?1 AND raider_profile_id = ?2', [payload.userId, profileId])
        ]);
        
        return c.json({
          raider: {
            profileId: raiderProfile.id,
            username: raiderProfile.username,
            expeditionLevel: raiderProfile.expedition_level,
            createdAt: raiderProfile.created_at,
            questsCompleted: completedQuests.rows.map(r => r.quest_id),
            blueprintsOwned: ownedBlueprints.rows.map(r => r.name),
            workbenchesCompleted: completedWorkbenches.rows.map(r => r.name),
            expeditionPartsCompleted: completedExpeditionParts.rows.map(r => r.name),
            expeditionItemsCompleted: completedExpeditionItems.rows,
            expeditionRequirements: expeditionRequirements.rows,
            isFavorited: isFavorited.rows.length > 0,
            stats: {
              totalQuestsCompleted: completedQuests.rows.length,
              totalBlueprintsOwned: ownedBlueprints.rows.length,
              totalWorkbenchesCompleted: completedWorkbenches.rows.length,
              totalExpeditionPartsCompleted: completedExpeditionParts.rows.length
            }
          }
        });
      } catch (error) {
        console.error('Error searching for raider:', error);
        return c.json({ error: 'Failed to search for raider' }, 500);
      }
});

raider.get('/favorites', async (c) => {
    const payload = c.get('jwtPayload');
    try {
        const favorites = await dbAdapter.query(
            `SELECT rp.id, rp.expedition_level, u.username, fr.created_at as favorited_at
             FROM favorite_raiders fr
             JOIN raider_profiles rp ON fr.raider_profile_id = rp.id
             JOIN users u ON rp.user_id = u.id
             WHERE fr.user_id = ?1 AND rp.is_active = true
             ORDER BY fr.created_at DESC`,
            [payload.userId]
        );
        
        return c.json({ favorites: favorites.rows });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return c.json({ error: 'Failed to fetch favorites' }, 500);
    }
});

raider.post('/favorites/:raiderProfileId', async (c) => {
    const { raiderProfileId } = c.req.param();
    const payload = c.get('jwtPayload');
    try {
        const profile = await dbAdapter.query(
            'SELECT id FROM raider_profiles WHERE id = ?1 AND is_active = true',
            [raiderProfileId]
        );
        
        if (profile.rows.length === 0) {
            return c.json({ error: 'Raider profile not found' }, 404);
        }
        
        await dbAdapter.query(
            'INSERT INTO favorite_raiders (user_id, raider_profile_id) VALUES (?1, ?2) ON CONFLICT DO NOTHING',
            [payload.userId, raiderProfileId]
        );
        
        return c.json({ message: 'Raider added to favorites' });
    } catch (error) {
        console.error('Error adding favorite:', error);
        return c.json({ error: 'Failed to add favorite' }, 500);
    }
});

raider.delete('/favorites/:raiderProfileId', async (c) => {
    const { raiderProfileId } = c.req.param();
    const payload = c.get('jwtPayload');
    try {
        await dbAdapter.query(
            'DELETE FROM favorite_raiders WHERE user_id = ?1 AND raider_profile_id = ?2',
            [payload.userId, raiderProfileId]
        );
        
        return c.json({ message: 'Raider removed from favorites' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        return c.json({ error: 'Failed to remove favorite' }, 500);
    }
});

raider.put('/settings/username', async (c) => {
    const { newUsername } = await c.req.json();
    const payload = c.get('jwtPayload');

    try {
        if (!newUsername || newUsername.trim().length < 3) {
            return c.json({ error: 'Username must be at least 3 characters' }, 400);
        }

        const existingUser = await dbAdapter.query(
            'SELECT id FROM users WHERE username = ?1 AND id != ?2',
            [newUsername.trim(), payload.userId]
        );

        if (existingUser.rows.length > 0) {
            return c.json({ error: 'Username already taken' }, 409);
        }

        await dbAdapter.db.batch([
            dbAdapter.db.prepare('UPDATE users SET username = ?1 WHERE id = ?2').bind(newUsername.trim(), payload.userId),
            dbAdapter.db.prepare('UPDATE raider_profiles SET raider_name = ?1 WHERE user_id = ?2').bind(newUsername.trim(), payload.userId)
        ]);

        return c.json({ message: 'Username updated successfully', username: newUsername.trim() });
    } catch (error) {
        console.error('Error updating username:', error);
        return c.json({ error: 'Failed to update username' }, 500);
    }
});

raider.put('/settings/password', async (c) => {
    const { currentPassword, newPassword } = await c.req.json();
    const payload = c.get('jwtPayload');

    try {
        if (!currentPassword || !newPassword) {
            return c.json({ error: 'Current password and new password are required' }, 400);
        }

        if (newPassword.length < 6) {
            return c.json({ error: 'New password must be at least 6 characters' }, 400);
        }

        const userResult = await dbAdapter.query(
            'SELECT password_hash FROM users WHERE id = ?1',
            [payload.userId]
        );

        if (userResult.rows.length === 0) {
            return c.json({ error: 'User not found' }, 404);
        }

        const user = userResult.rows[0];

        const isValidPassword = await comparePassword(currentPassword, user.password_hash);

        if (!isValidPassword) {
            return c.json({ error: 'Current password is incorrect' }, 401);
        }

        const newPasswordHash = await hashPassword(newPassword);

        await dbAdapter.query(
            'UPDATE users SET password_hash = ?1 WHERE id = ?2',
            [newPasswordHash, payload.userId]
        );

        return c.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        return c.json({ error: 'Failed to update password' }, 500);
    }
});

raider.put('/settings/theme', async (c) => {
    const { theme } = await c.req.json();
    const payload = c.get('jwtPayload');

    try {
        if (!theme || (theme !== 'light' && theme !== 'dark')) {
            return c.json({ error: 'Invalid theme. Must be "light" or "dark"' }, 400);
        }

        await dbAdapter.query(
            'UPDATE users SET theme = ?1 WHERE id = ?2',
            [theme, payload.userId]
        );

        return c.json({ message: 'Theme updated successfully', theme });
    } catch (error) {
        console.error('Error updating theme:', error);
        return c.json({ error: 'Failed to update theme' }, 500);
    }
});

raider.post('/settings/reset', async (c) => {
    const payload = c.get('jwtPayload');
    try {
        const profileResult = await dbAdapter.query(
            'SELECT id FROM raider_profiles WHERE user_id = ?1',
            [payload.userId]
        );

        if (profileResult.rows.length === 0) {
            return c.json({ error: 'Profile not found' }, 404);
        }
        const profileId = profileResult.rows[0].id;

        const statements = [
            dbAdapter.db.prepare('DELETE FROM raider_completed_quests WHERE raider_profile_id = ?1').bind(profileId),
            dbAdapter.db.prepare('DELETE FROM raider_owned_blueprints WHERE raider_profile_id = ?1').bind(profileId),
            dbAdapter.db.prepare('DELETE FROM raider_completed_workbenches WHERE raider_profile_id = ?1').bind(profileId),
            dbAdapter.db.prepare('DELETE FROM raider_completed_expedition_parts WHERE raider_profile_id = ?1').bind(profileId),
            dbAdapter.db.prepare('DELETE FROM raider_completed_expedition_items WHERE raider_profile_id = ?1').bind(profileId),
            dbAdapter.db.prepare('UPDATE raider_profiles SET expedition_level = 1 WHERE id = ?1').bind(profileId)
        ];

        await dbAdapter.db.batch(statements);

        return c.json({ message: 'Account reset successfully' });

    } catch (error) {
        console.error('Error resetting account:', error);
        return c.json({ error: 'Failed to reset account' }, 500);
    }
});

raider.delete('/settings/account', async (c) => {
    const payload = c.get('jwtPayload');
    try {
        const profileResult = await dbAdapter.query(
            'SELECT id FROM raider_profiles WHERE user_id = ?1',
            [payload.userId]
        );

        const statements = [];
        if (profileResult.rows.length > 0) {
            const profileId = profileResult.rows[0].id;
            statements.push(dbAdapter.db.prepare('DELETE FROM raider_completed_quests WHERE raider_profile_id = ?1').bind(profileId));
            statements.push(dbAdapter.db.prepare('DELETE FROM raider_owned_blueprints WHERE raider_profile_id = ?1').bind(profileId));
            statements.push(dbAdapter.db.prepare('DELETE FROM raider_completed_workbenches WHERE raider_profile_id = ?1').bind(profileId));
            statements.push(dbAdapter.db.prepare('DELETE FROM raider_completed_expedition_parts WHERE raider_profile_id = ?1').bind(profileId));
            statements.push(dbAdapter.db.prepare('DELETE FROM raider_completed_expedition_items WHERE raider_profile_id = ?1').bind(profileId));
            statements.push(dbAdapter.db.prepare('DELETE FROM raider_profiles WHERE id = ?1').bind(profileId));
        }

        statements.push(dbAdapter.db.prepare('DELETE FROM favorite_raiders WHERE user_id = ?1').bind(payload.userId));
        statements.push(dbAdapter.db.prepare('DELETE FROM users WHERE id = ?1').bind(payload.userId));

        await dbAdapter.db.batch(statements);

        return c.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return c.json({ error: 'Failed to delete account' }, 500);
    }
});

raider.get('/expedition-requirements', async (c) => {
    const payload = c.get('jwtPayload');
    try {
        const profileResult = await dbAdapter.query(
            'SELECT expedition_level FROM raider_profiles WHERE user_id = ?1 AND is_active = true LIMIT 1',
            [payload.userId]
        );
        
        if (profileResult.rows.length === 0) {
            return c.json({ error: 'Profile not found' }, 404);
        }
        
        const expeditionLevel = profileResult.rows[0].expedition_level;
        
        const result = await dbAdapter.query(
           `SELECT * FROM expedition_requirements 
            WHERE expedition_level = ?1 
            ORDER BY part_number, display_order`,
           [expeditionLevel]
        );
        
        return c.json({
          expeditionLevel,
          requirements: result.rows
        });
      } catch (error) {
        console.error('Error fetching expedition requirements:', error);
        return c.json({ error: 'Failed to fetch expedition requirements' }, 500);
      }
});

raider.get('/tips/random', async (c) => {
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

      try {
        if (tips.length === 0) {
          return c.json({ tip: 'Stay alert, Raider!' });
        }
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        return c.json({ tip: randomTip });
      } catch (error) {
        console.error('Error fetching random tip:', error);
        return c.json({ tip: 'Master the battlefield, Raider!' });
      }
});

export default raider;
