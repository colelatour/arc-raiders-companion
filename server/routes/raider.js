import pool from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const routes = [
  {
    method: 'GET',
    path: '/profiles',
    handler: async (req, res) => {
      try {
        const result = await pool.query(
          `SELECT id, expedition_level, created_at, updated_at 
           FROM raider_profiles 
           WHERE user_id = $1 AND is_active = true 
           ORDER BY created_at ASC`,
          [req.user.userId]
        );

        res.json({ profiles: result.rows });
      } catch (error) {
        console.error('Error fetching profiles:', error);
        res.status(500).json({ error: 'Failed to fetch profiles' });
      }
    }
  },
  {
    method: 'POST',
    path: '/profiles',
    handler: async (req, res) => {
      try {
        // Check if user already has a profile
        const existing = await pool.query(
          'SELECT id FROM raider_profiles WHERE user_id = $1',
          [req.user.userId]
        );

        if (existing.rows.length > 0) {
          return res.status(409).json({ error: 'Profile already exists for this user' });
        }

        // Get username for raider_name
        const userResult = await pool.query(
          'SELECT username FROM users WHERE id = $1',
          [req.user.userId]
        );
        const username = userResult.rows[0].username;

        const result = await pool.query(
          `INSERT INTO raider_profiles (user_id, raider_name, expedition_level) 
           VALUES ($1, $2, 0) 
           RETURNING id, expedition_level, created_at`,
          [req.user.userId, username]
        );

        res.status(201).json({ profile: result.rows[0] });
      } catch (error) {
        console.error('Error creating profile:', error);
        res.status(500).json({ error: 'Failed to create profile' });
      }
    }
  },
  {
    method: 'DELETE',
    path: '/profiles/:profileId',
    handler: async (req, res) => {
      const { profileId } = req.params;

      try {
        // Verify ownership
        const result = await pool.query(
          'DELETE FROM raider_profiles WHERE id = $1 AND user_id = $2 RETURNING id',
          [profileId, req.user.userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({ message: 'Profile deleted successfully' });
      } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).json({ error: 'Failed to delete profile' });
      }
    }
  },
  {
    method: 'GET',
    path: '/profiles/:profileId/stats',
    handler: async (req, res) => {
      const { profileId } = req.params;

      try {
        // Verify ownership
        const profile = await pool.query(
          'SELECT * FROM raider_profiles WHERE id = $1 AND user_id = $2',
          [profileId, req.user.userId]
        );

        if (profile.rows.length === 0) {
          return res.status(404).json({ error: 'Profile not found' });
        }

        const stats = await pool.query(
          `SELECT 
            rp.expedition_level,
            COUNT(DISTINCT rcq.quest_id) as quests_completed,
            COUNT(DISTINCT rob.blueprint_id) as blueprints_owned
           FROM raider_profiles rp
           LEFT JOIN raider_completed_quests rcq ON rp.id = rcq.raider_profile_id
           LEFT JOIN raider_owned_blueprints rob ON rp.id = rob.raider_profile_id
           WHERE rp.id = $1
           GROUP BY rp.id, rp.expedition_level`,
          [profileId]
        );

        res.json({ stats: stats.rows[0] });
      } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
      }
    }
  },
  {
    method: 'GET',
    path: '/profiles/:profileId/quests',
    handler: async (req, res) => {
      const { profileId } = req.params;

      try {
        const result = await pool.query(
          `SELECT quest_id FROM raider_completed_quests 
           WHERE raider_profile_id = $1 
           AND raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = $2
           )`,
          [profileId, req.user.userId]
        );

        res.json({ completedQuests: result.rows.map(r => r.quest_id) });
      } catch (error) {
        console.error('Error fetching quests:', error);
        res.status(500).json({ error: 'Failed to fetch quests' });
      }
    }
  },
  {
    method: 'POST',
    path: '/profiles/:profileId/quests/:questId',
    handler: async (req, res) => {
      const { profileId, questId } = req.params;

      try {
        // Check if quest is already completed
        const existing = await pool.query(
          `SELECT id FROM raider_completed_quests 
           WHERE raider_profile_id = $1 AND quest_id = $2
           AND raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = $3
           )`,
          [profileId, questId, req.user.userId]
        );

        if (existing.rows.length > 0) {
          // Remove completion
          await pool.query(
            'DELETE FROM raider_completed_quests WHERE raider_profile_id = $1 AND quest_id = $2',
            [profileId, questId]
          );
          res.json({ completed: false });
        } else {
          // Add completion
          await pool.query(
            'INSERT INTO raider_completed_quests (raider_profile_id, quest_id) VALUES ($1, $2)',
            [profileId, questId]
          );
          res.json({ completed: true });
        }
      } catch (error) {
        console.error('Error toggling quest:', error);
        res.status(500).json({ error: 'Failed to toggle quest' });
      }
    }
  },
  {
    method: 'GET',
    path: '/profiles/:profileId/blueprints',
    handler: async (req, res) => {
      const { profileId } = req.params;

      try {
        const result = await pool.query(
          `SELECT b.name FROM raider_owned_blueprints rob
           JOIN blueprints b ON rob.blueprint_id = b.id
           WHERE rob.raider_profile_id = $1 
           AND rob.raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = $2
           )`,
          [profileId, req.user.userId]
        );

        res.json({ ownedBlueprints: result.rows.map(r => r.name) });
      } catch (error) {
        console.error('Error fetching blueprints:', error);
        res.status(500).json({ error: 'Failed to fetch blueprints' });
      }
    }
  },
  {
    method: 'POST',
    path: '/profiles/:profileId/blueprints/:blueprintName',
    handler: async (req, res) => {
      const { profileId, blueprintName } = req.params;

      try {
        // Get blueprint ID
        const blueprint = await pool.query('SELECT id FROM blueprints WHERE name = $1', [blueprintName]);
        
        if (blueprint.rows.length === 0) {
          return res.status(404).json({ error: 'Blueprint not found' });
        }

        const blueprintId = blueprint.rows[0].id;

        // Check if already owned
        const existing = await pool.query(
          `SELECT id FROM raider_owned_blueprints 
           WHERE raider_profile_id = $1 AND blueprint_id = $2
           AND raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = $3
           )`,
          [profileId, blueprintId, req.user.userId]
        );

        if (existing.rows.length > 0) {
          // Remove ownership
          await pool.query(
            'DELETE FROM raider_owned_blueprints WHERE raider_profile_id = $1 AND blueprint_id = $2',
            [profileId, blueprintId]
          );
          res.json({ owned: false });
        } else {
          // Add ownership
          await pool.query(
            'INSERT INTO raider_owned_blueprints (raider_profile_id, blueprint_id) VALUES ($1, $2)',
            [profileId, blueprintId]
          );
          res.json({ owned: true });
        }
      } catch (error) {
        console.error('Error toggling blueprint:', error);
        res.status(500).json({ error: 'Failed to toggle blueprint' });
      }
    }
  },
  {
    method: 'GET',
    path: '/profiles/:profileId/workbenches',
    handler: async (req, res) => {
      const { profileId } = req.params;

      try {
        const result = await pool.query(
          `SELECT w.name FROM raider_completed_workbenches rcw
           JOIN workbenches w ON rcw.workbench_id = w.id
           WHERE rcw.raider_profile_id = $1 
           AND rcw.raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = $2
           )`,
          [profileId, req.user.userId]
        );

        res.json({ completedWorkbenches: result.rows.map(r => r.name) });
      } catch (error) {
        console.error('Error fetching workbenches:', error);
        res.status(500).json({ error: 'Failed to fetch workbenches' });
      }
    }
  },
  {
    method: 'POST',
    path: '/profiles/:profileId/workbenches/:workbenchName',
    handler: async (req, res) => {
      const { profileId, workbenchName } = req.params;

      try {
        // Get workbench ID
        const workbench = await pool.query('SELECT id FROM workbenches WHERE name = $1', [workbenchName]);
        
        if (workbench.rows.length === 0) {
          return res.status(404).json({ error: 'Workbench not found' });
        }

        const workbenchId = workbench.rows[0].id;

        // Check if already completed
        const existing = await pool.query(
          `SELECT id FROM raider_completed_workbenches 
           WHERE raider_profile_id = $1 AND workbench_id = $2
           AND raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = $3
           )`,
          [profileId, workbenchId, req.user.userId]
        );

        if (existing.rows.length > 0) {
          // Remove completion
          await pool.query(
            'DELETE FROM raider_completed_workbenches WHERE raider_profile_id = $1 AND workbench_id = $2',
            [profileId, workbenchId]
          );
          res.json({ completed: false });
        } else {
          // Add completion
          await pool.query(
            'INSERT INTO raider_completed_workbenches (raider_profile_id, workbench_id) VALUES ($1, $2)',
            [profileId, workbenchId]
          );
          res.json({ completed: true });
        }
      } catch (error) {
        console.error('Error toggling workbench:', error);
        res.status(500).json({ error: 'Failed to toggle workbench' });
      }
    }
  },
  {
    method: 'GET',
    path: '/profiles/:profileId/expedition-parts',
    handler: async (req, res) => {
      const { profileId } = req.params;

      try {
        const result = await pool.query(
          `SELECT ep.name FROM raider_completed_expedition_parts rcep
           JOIN expedition_parts ep ON rcep.expedition_part_id = ep.id
           WHERE rcep.raider_profile_id = $1 
           AND rcep.raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = $2
           )`,
          [profileId, req.user.userId]
        );

        res.json({ completedExpeditionParts: result.rows.map(r => r.name) });
      } catch (error) {
        console.error('Error fetching expedition parts:', error);
        res.status(500).json({ error: 'Failed to fetch expedition parts' });
      }
    }
  },
  {
    method: 'POST',
    path: '/profiles/:profileId/expedition-parts/:partName',
    handler: async (req, res) => {
      const { profileId, partName } = req.params;

      try {
        // Get expedition part ID
        const expeditionPart = await pool.query('SELECT id FROM expedition_parts WHERE name = $1', [partName]);
        
        if (expeditionPart.rows.length === 0) {
          return res.status(404).json({ error: 'Expedition part not found' });
        }

        const expeditionPartId = expeditionPart.rows[0].id;

        // Check if already completed
        const existing = await pool.query(
          `SELECT id FROM raider_completed_expedition_parts 
           WHERE raider_profile_id = $1 AND expedition_part_id = $2
           AND raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = $3
           )`,
          [profileId, expeditionPartId, req.user.userId]
        );

        if (existing.rows.length > 0) {
          // Remove completion
          await pool.query(
            'DELETE FROM raider_completed_expedition_parts WHERE raider_profile_id = $1 AND expedition_part_id = $2',
            [profileId, expeditionPartId]
          );
          res.json({ completed: false });
        } else {
          // Add completion
          await pool.query(
            'INSERT INTO raider_completed_expedition_parts (raider_profile_id, expedition_part_id) VALUES ($1, $2)',
            [profileId, expeditionPartId]
          );
          res.json({ completed: true });
        }
      } catch (error) {
        console.error('Error toggling expedition part:', error);
        res.status(500).json({ error: 'Failed to toggle expedition part' });
      }
    }
  },
  {
    method: 'GET',
    path: '/profiles/:profileId/expedition-items',
    handler: async (req, res) => {
      const { profileId } = req.params;

      try {
        const result = await pool.query(
          `SELECT part_name, item_name 
           FROM raider_completed_expedition_items
           WHERE raider_profile_id = $1 
           AND raider_profile_id IN (
             SELECT id FROM raider_profiles WHERE user_id = $2
           )`,
          [profileId, req.user.userId]
        );

        res.json({ completedExpeditionItems: result.rows });
      } catch (error) {
        console.error('Error fetching expedition items:', error);
        res.status(500).json({ error: 'Failed to fetch expedition items' });
      }
    }
  },
  {
    method: 'POST',
    path: '/profiles/:profileId/expedition-items/:partName/:itemName',
    handler: async (req, res) => {
      const { profileId, partName, itemName} = req.params;

      try {
        // Verify profile ownership
        const profile = await pool.query(
          'SELECT id FROM raider_profiles WHERE id = $1 AND user_id = $2',
          [profileId, req.user.userId]
        );

        if (profile.rows.length === 0) {
          return res.status(404).json({ error: 'Profile not found' });
        }

        // Check if already completed
        const existing = await pool.query(
          `SELECT id FROM raider_completed_expedition_items 
           WHERE raider_profile_id = $1 AND part_name = $2 AND item_name = $3`,
          [profileId, partName, itemName]
        );

        if (existing.rows.length > 0) {
          // Remove completion
          await pool.query(
            'DELETE FROM raider_completed_expedition_items WHERE raider_profile_id = $1 AND part_name = $2 AND item_name = $3',
            [profileId, partName, itemName]
          );
          res.json({ completed: false });
        } else {
          // Add completion
          await pool.query(
            'INSERT INTO raider_completed_expedition_items (raider_profile_id, part_name, item_name) VALUES ($1, $2, $3)',
            [profileId, partName, itemName]
          );
          res.json({ completed: true });
        }
      } catch (error) {
        console.error('Error toggling expedition item:', error);
        res.status(500).json({ error: 'Failed to toggle expedition item' });
      }
    }
  },
  {
    method: 'POST',
    path: '/profiles/:profileId/expedition/complete',
    handler: async (req, res) => {
      const { profileId } = req.params;

      try {
        const client = await pool.connect();
        
        try {
          await client.query('BEGIN');

          // Verify ownership
          const profile = await client.query(
            'SELECT expedition_level FROM raider_profiles WHERE id = $1 AND user_id = $2',
            [profileId, req.user.userId]
          );

          if (profile.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Profile not found' });
          }

          const currentLevel = profile.rows[0].expedition_level;
          const nextLevel = currentLevel + 1;

          // Get all requirements for current expedition level
          const currentRequirements = await client.query(
            'SELECT * FROM expedition_requirements WHERE expedition_level = $1',
            [currentLevel]
          );

          if (currentRequirements.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
              error: 'NO_REQUIREMENTS',
              message: `Current expedition has no requirements configured.`
            });
          }

          // Get all completed items for this profile
          const completedItems = await client.query(
            'SELECT part_name, item_name FROM raider_completed_expedition_items WHERE raider_profile_id = $1',
            [profileId]
          );

          // Check if ALL requirements are completed
          const totalRequirements = currentRequirements.rows.length;
          const completedItemsSet = new Set(
            completedItems.rows.map(item => `${item.part_name}|${item.item_name}`)
          );

          const allCompleted = currentRequirements.rows.every(req => {
            const partName = `Part ${req.part_number}`;
            const key = `${partName}|${req.item_name}`;
            return completedItemsSet.has(key);
          });

          if (!allCompleted) {
            await client.query('ROLLBACK');
            const completedCount = completedItems.rows.length;
            return res.status(400).json({
              error: 'EXPEDITION_INCOMPLETE',
              message: `You must complete all expedition requirements before progressing!`,
              completedCount: completedCount,
              totalCount: totalRequirements
            });
          }

          // Check if next expedition level has requirements
          const nextExpeditionCheck = await client.query(
            'SELECT COUNT(*) FROM expedition_requirements WHERE expedition_level = $1',
            [nextLevel]
          );

          if (parseInt(nextExpeditionCheck.rows[0].count) === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
              error: 'EXPEDITION_NOT_AVAILABLE',
              message: `Expedition ${nextLevel} has not been released yet!`,
              currentLevel: currentLevel
            });
          }

          // Increment expedition level
          await client.query(
            'UPDATE raider_profiles SET expedition_level = expedition_level + 1 WHERE id = $1',
            [profileId]
          );

          // Wipe quest progress
          await client.query(
            'DELETE FROM raider_completed_quests WHERE raider_profile_id = $1',
            [profileId]
          );

          // Wipe blueprint progress
          await client.query(
            'DELETE FROM raider_owned_blueprints WHERE raider_profile_id = $1',
            [profileId]
          );

          // Wipe workbench progress
          await client.query(
            'DELETE FROM raider_completed_workbenches WHERE raider_profile_id = $1',
            [profileId]
          );

          // Wipe expedition parts progress
          await client.query(
            'DELETE FROM raider_completed_expedition_parts WHERE raider_profile_id = $1',
            [profileId]
          );

          // Wipe expedition items progress
          await client.query(
            'DELETE FROM raider_completed_expedition_items WHERE raider_profile_id = $1',
            [profileId]
          );

          await client.query('COMMIT');

          res.json({
            message: 'Expedition completed successfully',
            newExpeditionLevel: nextLevel
          });

        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('Error completing expedition:', error);
        res.status(500).json({ error: 'Failed to complete expedition' });
      }
    }
  },
  {
    method: 'GET',
    path: '/quests',
    handler: async (req, res) => {
      try {
        const quests = await pool.query(`
          SELECT 
            q.id, 
            q.name, 
            q.locations, 
            q.url,
            COALESCE(
              (SELECT array_agg(objective_text ORDER BY order_index)
               FROM quest_objectives 
               WHERE quest_id = q.id),
              ARRAY[]::text[]
            ) as objectives,
            COALESCE(
              (SELECT array_agg(reward_text ORDER BY order_index)
               FROM quest_rewards 
               WHERE quest_id = q.id),
              ARRAY[]::text[]
            ) as rewards
          FROM quests q
          ORDER BY q.id
        `);
        
        res.json({ quests: quests.rows });
      } catch (error) {
        console.error('Error fetching quests:', error);
        res.status(500).json({ error: 'Failed to fetch quests' });
      }
    }
  },
  {
    method: 'GET',
    path: '/workbenches',
    handler: async (req, res) => {
      try {
        const workbenches = await pool.query(`
          SELECT id, name, category, level, display_order
          FROM workbenches
          ORDER BY display_order, level
        `);
        
        res.json({ workbenches: workbenches.rows });
      } catch (error) {
        console.error('Error fetching workbenches:', error);
        res.status(500).json({ error: 'Failed to fetch workbenches' });
      }
    }
  },
  {
    method: 'GET',
    path: '/search',
    handler: async (req, res) => {
      try {
        const { raiderName } = req.query;
        
        if (!raiderName) {
          return res.status(400).json({ error: 'Username is required' });
        }
        
        // Find raider profile by username
        const profile = await pool.query(
          `SELECT rp.id, rp.expedition_level, rp.created_at, u.username
           FROM raider_profiles rp
           JOIN users u ON rp.user_id = u.id
           WHERE LOWER(u.username) = LOWER($1) AND rp.is_active = true
           LIMIT 1`,
          [raiderName]
        );
        
        if (profile.rows.length === 0) {
          return res.status(404).json({ error: 'Raider not found' });
        }
        
        const raiderProfile = profile.rows[0];
        const profileId = raiderProfile.id;
        
        // Get completed quests
        const completedQuests = await pool.query(
          'SELECT quest_id FROM raider_completed_quests WHERE raider_profile_id = $1',
          [profileId]
        );
        
        // Get owned blueprints
        const ownedBlueprints = await pool.query(
          `SELECT b.name FROM raider_owned_blueprints rob
           JOIN blueprints b ON rob.blueprint_id = b.id
           WHERE rob.raider_profile_id = $1`,
          [profileId]
        );
        
        // Get completed workbenches
        const completedWorkbenches = await pool.query(
          `SELECT w.name FROM raider_completed_workbenches rcw
           JOIN workbenches w ON rcw.workbench_id = w.id
           WHERE rcw.raider_profile_id = $1`,
          [profileId]
        );
        
        // Get completed expedition parts
        const completedExpeditionParts = await pool.query(
          `SELECT ep.name FROM raider_completed_expedition_parts rcep
           JOIN expedition_parts ep ON rcep.expedition_part_id = ep.id
           WHERE rcep.raider_profile_id = $1`,
          [profileId]
        );
        
        // Get completed expedition items (individual materials)
        const completedExpeditionItems = await pool.query(
          `SELECT part_name, item_name FROM raider_completed_expedition_items
           WHERE raider_profile_id = $1`,
          [profileId]
        );
        
        // Get expedition requirements for this raider's expedition level
        const expeditionRequirements = await pool.query(
          `SELECT * FROM expedition_requirements
           WHERE expedition_level = $1
           ORDER BY part_number, display_order`,
          [raiderProfile.expedition_level]
        );
        
        // Check if current user has this raider favorited
        const isFavorited = await pool.query(
          'SELECT id FROM favorite_raiders WHERE user_id = $1 AND raider_profile_id = $2',
          [req.user.userId, profileId]
        );
        
        res.json({
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
        res.status(500).json({ error: 'Failed to search for raider' });
      }
    }
  },
  {
    method: 'GET',
    path: '/favorites',
    handler: async (req, res) => {
      try {
        const favorites = await pool.query(
          `SELECT rp.id, rp.expedition_level, u.username, fr.created_at as favorited_at
           FROM favorite_raiders fr
           JOIN raider_profiles rp ON fr.raider_profile_id = rp.id
           JOIN users u ON rp.user_id = u.id
           WHERE fr.user_id = $1 AND rp.is_active = true
           ORDER BY fr.created_at DESC`,
          [req.user.userId]
        );
        
        res.json({ favorites: favorites.rows });
      } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: 'Failed to fetch favorites' });
      }
    }
  },
  {
    method: 'POST',
    path: '/favorites/:raiderProfileId',
    handler: async (req, res) => {
      try {
        const { raiderProfileId } = req.params;
        
        // Verify raider profile exists
        const profile = await pool.query(
          'SELECT id FROM raider_profiles WHERE id = $1 AND is_active = true',
          [raiderProfileId]
        );
        
        if (profile.rows.length === 0) {
          return res.status(404).json({ error: 'Raider profile not found' });
        }
        
        // Add to favorites (will ignore if already exists due to UNIQUE constraint)
        await pool.query(
          'INSERT INTO favorite_raiders (user_id, raider_profile_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.user.userId, raiderProfileId]
        );
        
        res.json({ message: 'Raider added to favorites' });
      } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ error: 'Failed to add favorite' });
      }
    }
  },
  {
    method: 'DELETE',
    path: '/favorites/:raiderProfileId',
    handler: async (req, res) => {
      try {
        const { raiderProfileId } = req.params;
        
        await pool.query(
          'DELETE FROM favorite_raiders WHERE user_id = $1 AND raider_profile_id = $2',
          [req.user.userId, raiderProfileId]
        );
        
        res.json({ message: 'Raider removed from favorites' });
      } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ error: 'Failed to remove favorite' });
      }
    }
  },
  {
    method: 'PUT',
    path: '/settings/username',
    handler: async (req, res) => {
      const { newUsername } = req.body;

      try {
        if (!newUsername || newUsername.trim().length < 3) {
          return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        // Check if username is already taken
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE username = $1 AND id != $2',
          [newUsername.trim(), req.user.userId]
        );

        if (existingUser.rows.length > 0) {
          return res.status(409).json({ error: 'Username already taken' });
        }

        // Update username in users table
        await pool.query(
          'UPDATE users SET username = $1 WHERE id = $2',
          [newUsername.trim(), req.user.userId]
        );

        // Update raider_name in raider_profiles table
        await pool.query(
          'UPDATE raider_profiles SET raider_name = $1 WHERE user_id = $2',
          [newUsername.trim(), req.user.userId]
        );

        res.json({ message: 'Username updated successfully', username: newUsername.trim() });
      } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).json({ error: 'Failed to update username' });
      }
    }
  },
  {
    method: 'PUT',
    path: '/settings/password',
    handler: async (req, res) => {
      const { currentPassword, newPassword } = req.body;

      console.log('🔐 Password update request received from user:', req.user.userId);

      try {
        if (!currentPassword || !newPassword) {
          console.log('❌ Missing password fields');
          return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
          console.log('❌ New password too short');
          return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Get user's current password hash
        const userResult = await pool.query(
          'SELECT password_hash FROM users WHERE id = $1',
          [req.user.userId]
        );

        if (userResult.rows.length === 0) {
          console.log('❌ User not found:', req.user.userId);
          return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];
        console.log('✅ User found, verifying current password...');

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isValidPassword) {
          console.log('❌ Current password incorrect');
          return res.status(401).json({ error: 'Current password is incorrect' });
        }

        console.log('✅ Current password verified, hashing new password...');

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        console.log('✅ New password hashed, updating database...');

        // Update password
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2',
          [newPasswordHash, req.user.userId]
        );

        console.log('✅ Password updated successfully for user:', req.user.userId);

        res.json({ message: 'Password updated successfully' });
      } catch (error) {
        console.error('❌ Error updating password:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
          error: 'Failed to update password',
          details: error.message
        });
      }
    }
  },
  {
    method: 'PUT',
    path: '/settings/theme',
    handler: async (req, res) => {
      const { theme } = req.body;

      try {
        if (!theme || (theme !== 'light' && theme !== 'dark')) {
          return res.status(400).json({ error: 'Invalid theme. Must be "light" or "dark"' });
        }

        await pool.query(
          'UPDATE users SET theme = $1 WHERE id = $2',
          [theme, req.user.userId]
        );

        res.json({ message: 'Theme updated successfully', theme });
      } catch (error) {
        console.error('Error updating theme:', error);
        res.status(500).json({ error: 'Failed to update theme' });
      }
    }
  },
  {
    method: 'POST',
    path: '/settings/reset',
    handler: async (req, res) => {
      console.log('🔄 Reset account request received from user:', req.user.userId);
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        console.log('Transaction started');

        // Get user's profile
        const profileResult = await client.query(
          'SELECT id FROM raider_profiles WHERE user_id = $1',
          [req.user.userId]
        );

        if (profileResult.rows.length === 0) {
          console.log('❌ Profile not found for user:', req.user.userId);
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Profile not found' });
        }

        const profileId = profileResult.rows[0].id;
        console.log('Found profile ID:', profileId);

        // Delete all completed quests
        const questsDeleted = await client.query(
          'DELETE FROM raider_completed_quests WHERE raider_profile_id = $1',
          [profileId]
        );
        console.log('Deleted quests:', questsDeleted.rowCount);

        // Delete all owned blueprints
        const blueprintsDeleted = await client.query(
          'DELETE FROM raider_owned_blueprints WHERE raider_profile_id = $1',
          [profileId]
        );
        console.log('Deleted blueprints:', blueprintsDeleted.rowCount);

        // Delete all completed workbenches
        const workbenchesDeleted = await client.query(
          'DELETE FROM raider_completed_workbenches WHERE raider_profile_id = $1',
          [profileId]
        );
        console.log('Deleted workbenches:', workbenchesDeleted.rowCount);

        // Delete all completed expedition parts
        const partsDeleted = await client.query(
          'DELETE FROM raider_completed_expedition_parts WHERE raider_profile_id = $1',
          [profileId]
        );
        console.log('Deleted expedition parts:', partsDeleted.rowCount);

        // Delete all completed expedition items (individual materials)
        const itemsDeleted = await client.query(
          'DELETE FROM raider_completed_expedition_items WHERE raider_profile_id = $1',
          [profileId]
        );
        console.log('Deleted expedition items:', itemsDeleted.rowCount);

        // Reset expedition level to 1
        await client.query(
          'UPDATE raider_profiles SET expedition_level = 1 WHERE id = $1',
          [profileId]
        );
        console.log('Reset expedition level to 1 in raider_profiles');

        await client.query('COMMIT');
        console.log('✅ Account reset successful for user:', req.user.userId);

        res.json({ message: 'Account reset successfully' });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error resetting account:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
          error: 'Failed to reset account',
          details: error.message
        });
      } finally {
        client.release();
      }
    }
  },
  {
    method: 'DELETE',
    path: '/settings/account',
    handler: async (req, res) => {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Get user's profile
        const profileResult = await client.query(
          'SELECT id FROM raider_profiles WHERE user_id = $1',
          [req.user.userId]
        );

        if (profileResult.rows.length > 0) {
          const profileId = profileResult.rows[0].id;

          // Delete all completed quests
          await client.query(
            'DELETE FROM raider_completed_quests WHERE raider_profile_id = $1',
            [profileId]
          );

          // Delete all owned blueprints
          await client.query(
            'DELETE FROM raider_owned_blueprints WHERE raider_profile_id = $1',
            [profileId]
          );

          // Delete all completed workbenches
          await client.query(
            'DELETE FROM raider_completed_workbenches WHERE raider_profile_id = $1',
            [profileId]
          );

          // Delete all completed expedition parts
          await client.query(
            'DELETE FROM raider_completed_expedition_parts WHERE raider_profile_id = $1',
            [profileId]
          );

          // Delete all completed expedition items (individual materials)
          await client.query(
            'DELETE FROM raider_completed_expedition_items WHERE raider_profile_id = $1',
            [profileId]
          );

          // Delete raider profile
          await client.query(
            'DELETE FROM raider_profiles WHERE id = $1',
            [profileId]
          );
        }

        // Delete favorite raiders
        await client.query(
          'DELETE FROM favorite_raiders WHERE user_id = $1',
          [req.user.userId]
        );

        // Delete user
        await client.query(
          'DELETE FROM users WHERE id = $1',
          [req.user.userId]
        );

        await client.query('COMMIT');

        res.json({ message: 'Account deleted successfully' });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
      } finally {
        client.release();
      }
    }
  },
  {
    method: 'GET',
    path: '/expedition-requirements',
    handler: async (req, res) => {
      try {
        // Get user's current expedition level
        const profileResult = await pool.query(
          'SELECT expedition_level FROM raider_profiles WHERE user_id = $1 AND is_active = true LIMIT 1',
          [req.user.userId]
        );
        
        if (profileResult.rows.length === 0) {
          return res.status(404).json({ error: 'Profile not found' });
        }
        
        const expeditionLevel = profileResult.rows[0].expedition_level;
        
        // Get requirements for this expedition level
        const result = await pool.query(
          `SELECT * FROM expedition_requirements 
           WHERE expedition_level = $1 
           ORDER BY part_number, display_order`,
          [expeditionLevel]
        );
        
        res.json({
          expeditionLevel,
          requirements: result.rows
        });
      } catch (error) {
        console.error('Error fetching expedition requirements:', error);
        res.status(500).json({ error: 'Failed to fetch expedition requirements' });
      }
    }
  },
  {
    method: 'GET',
    path: '/tips/random',
    handler: async (req, res) => {
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
          return res.json({ tip: 'Stay alert, Raider!' });
        }
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        res.json({ tip: randomTip });
      } catch (error) {
        console.error('Error fetching random tip:', error);
        res.json({ tip: 'Master the battlefield, Raider!' });
      }
    }
  }
];

// Apply authenticateToken middleware to all routes
const protectedRoutes = routes.map(route => {
  return {
    ...route,
    handler: async (req, res) => {
      const authenticated = await authenticateToken(req, res);
      if (authenticated) {
        return route.handler(req, res);
      }
    }
  };
});

export default protectedRoutes;
