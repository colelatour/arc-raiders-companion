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
      `SELECT id, raider_name, expedition_level, created_at, updated_at 
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
  const { raiderName } = req.body;

  try {
    if (!raiderName || raiderName.trim().length === 0) {
      return res.status(400).json({ error: 'Raider name is required' });
    }

    // Check if name already exists for this user
    const existing = await pool.query(
      'SELECT id FROM raider_profiles WHERE user_id = $1 AND raider_name = $2',
      [req.user.userId, raiderName.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Raider name already exists' });
    }

    const result = await pool.query(
      `INSERT INTO raider_profiles (user_id, raider_name, expedition_level) 
       VALUES ($1, $2, 0) 
       RETURNING id, raider_name, expedition_level, created_at`,
      [req.user.userId, raiderName.trim()]
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
        rp.raider_name,
        rp.expedition_level,
        COUNT(DISTINCT rcq.quest_id) as quests_completed,
        COUNT(DISTINCT rob.blueprint_id) as blueprints_owned
       FROM raider_profiles rp
       LEFT JOIN raider_completed_quests rcq ON rp.id = rcq.raider_profile_id
       LEFT JOIN raider_owned_blueprints rob ON rp.id = rob.raider_profile_id
       WHERE rp.id = $1
       GROUP BY rp.id, rp.raider_name, rp.expedition_level`,
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

export default router;
