import express from 'express';
import pool from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all raider profiles for current user
router.get('/profiles', async (req, res) => {
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
});

// Create new raider profile
router.post('/profiles', async (req, res) => {
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
});

// Delete raider profile
router.delete('/profiles/:profileId', async (req, res) => {
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
});

// Get raider stats (quests/blueprints/expedition level)
router.get('/profiles/:profileId/stats', async (req, res) => {
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
});

// Get completed quests for a profile
router.get('/profiles/:profileId/quests', async (req, res) => {
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
});

// Toggle quest completion
router.post('/profiles/:profileId/quests/:questId', async (req, res) => {
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
});

// Get owned blueprints for a profile
router.get('/profiles/:profileId/blueprints', async (req, res) => {
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
});

// Toggle blueprint ownership
router.post('/profiles/:profileId/blueprints/:blueprintName', async (req, res) => {
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
});

// Get completed workbenches for a profile
router.get('/profiles/:profileId/workbenches', async (req, res) => {
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
});

// Toggle workbench completion
router.post('/profiles/:profileId/workbenches/:workbenchName', async (req, res) => {
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
});

// Get completed expedition parts for a profile
router.get('/profiles/:profileId/expedition-parts', async (req, res) => {
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
});

// Toggle expedition part completion
router.post('/profiles/:profileId/expedition-parts/:partName', async (req, res) => {
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
});

// Increment expedition level (wipe progress)
router.post('/profiles/:profileId/expedition/complete', async (req, res) => {
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

      await client.query('COMMIT');

      res.json({ 
        message: 'Expedition completed successfully',
        newExpeditionLevel: profile.rows[0].expedition_level + 1
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
});

// Get all quests (public data with URLs)
router.get('/quests', async (req, res) => {
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
});

// Get all workbenches
router.get('/workbenches', async (req, res) => {
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
});

// Get raider profile by username (public search)
router.get('/search', async (req, res) => {
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
});

// Get user's favorite raiders
router.get('/favorites', async (req, res) => {
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
});

// Add raider to favorites
router.post('/favorites/:raiderProfileId', async (req, res) => {
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
});

// Remove raider from favorites
router.delete('/favorites/:raiderProfileId', async (req, res) => {
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
});

export default router;
