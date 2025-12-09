import express from 'express';
import pool from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is admin/manager
const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const role = result.rows[0].role;
    if (role !== 'admin' && role !== 'manager') {
      return res.status(403).json({ error: 'Admin or Manager access required' });
    }
    
    req.userRole = role;
    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ error: 'Failed to verify permissions' });
  }
};

// All routes require authentication AND admin/manager role
router.use(authenticateToken);
router.use(requireAdmin);

// ===== QUEST MANAGEMENT =====

// Get all quests (with objectives and rewards)
router.get('/quests', async (req, res) => {
  try {
    const quests = await pool.query(`
      SELECT q.id, q.name, q.locations,
             array_agg(DISTINCT qo.objective_text ORDER BY qo.objective_text) FILTER (WHERE qo.objective_text IS NOT NULL) as objectives,
             array_agg(DISTINCT qr.reward_text ORDER BY qr.reward_text) FILTER (WHERE qr.reward_text IS NOT NULL) as rewards
      FROM quests q
      LEFT JOIN quest_objectives qo ON q.id = qo.quest_id
      LEFT JOIN quest_rewards qr ON q.id = qr.quest_id
      GROUP BY q.id, q.name, q.locations
      ORDER BY q.id
    `);
    
    res.json({ quests: quests.rows });
  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

// Create new quest
router.post('/quests', async (req, res) => {
  const { id, name, locations, objectives, rewards } = req.body;
  
  try {
    // Validation
    if (!id || !name) {
      return res.status(400).json({ error: 'Quest ID and name are required' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert quest
      await client.query(
        'INSERT INTO quests (id, name, locations) VALUES ($1, $2, $3)',
        [id, name, locations || '']
      );
      
      // Insert objectives
      if (objectives && objectives.length > 0) {
        for (let i = 0; i < objectives.length; i++) {
          const objective = objectives[i];
          if (objective && objective.trim()) {
            await client.query(
              'INSERT INTO quest_objectives (quest_id, objective_text, order_index) VALUES ($1, $2, $3)',
              [id, objective.trim(), i]
            );
          }
        }
      }
      
      // Insert rewards
      if (rewards && rewards.length > 0) {
        for (let i = 0; i < rewards.length; i++) {
          const reward = rewards[i];
          if (reward && reward.trim()) {
            await client.query(
              'INSERT INTO quest_rewards (quest_id, reward_text, order_index) VALUES ($1, $2, $3)',
              [id, reward.trim(), i]
            );
          }
        }
      }
      
      await client.query('COMMIT');
      res.status(201).json({ message: 'Quest created successfully', questId: id });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating quest:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Quest ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create quest' });
    }
  }
});

// Update existing quest
router.put('/quests/:id', async (req, res) => {
  const questId = req.params.id;
  const { name, locations, objectives, rewards } = req.body;
  
  console.log('Updating quest:', questId, { name, locations, objectives, rewards });
  
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update quest
      await client.query(
        'UPDATE quests SET name = $1, locations = $2 WHERE id = $3',
        [name, locations, questId]
      );
      console.log('Quest updated');
      
      // Delete existing objectives and rewards
      await client.query('DELETE FROM quest_objectives WHERE quest_id = $1', [questId]);
      console.log('Old objectives deleted');
      await client.query('DELETE FROM quest_rewards WHERE quest_id = $1', [questId]);
      console.log('Old rewards deleted');
      
      // Insert new objectives
      if (objectives && objectives.length > 0) {
        for (let i = 0; i < objectives.length; i++) {
          const objective = objectives[i];
          if (objective && objective.trim()) {
            await client.query(
              'INSERT INTO quest_objectives (quest_id, objective_text, order_index) VALUES ($1, $2, $3)',
              [questId, objective.trim(), i]
            );
          }
        }
      }
      console.log('Objectives inserted');
      
      // Insert new rewards
      if (rewards && rewards.length > 0) {
        for (let i = 0; i < rewards.length; i++) {
          const reward = rewards[i];
          if (reward && reward.trim()) {
            await client.query(
              'INSERT INTO quest_rewards (quest_id, reward_text, order_index) VALUES ($1, $2, $3)',
              [questId, reward.trim(), i]
            );
          }
        }
      }
      console.log('Rewards inserted');
      
      await client.query('COMMIT');
      console.log('Transaction committed');
      res.json({ message: 'Quest updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating quest:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update quest', details: error.message });
  }
});

// Delete quest
router.delete('/quests/:id', async (req, res) => {
  const questId = req.params.id;
  
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete related data (cascades should handle this, but being explicit)
      await client.query('DELETE FROM quest_objectives WHERE quest_id = $1', [questId]);
      await client.query('DELETE FROM quest_rewards WHERE quest_id = $1', [questId]);
      await client.query('DELETE FROM raider_completed_quests WHERE quest_id = $1', [questId]);
      await client.query('DELETE FROM quests WHERE id = $1', [questId]);
      
      await client.query('COMMIT');
      res.json({ message: 'Quest deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting quest:', error);
    res.status(500).json({ error: 'Failed to delete quest' });
  }
});

// ===== BLUEPRINT MANAGEMENT =====

// Get all blueprints
router.get('/blueprints', async (req, res) => {
  try {
    const blueprints = await pool.query('SELECT * FROM blueprints ORDER BY id');
    res.json({ blueprints: blueprints.rows });
  } catch (error) {
    console.error('Error fetching blueprints:', error);
    res.status(500).json({ error: 'Failed to fetch blueprints' });
  }
});

// Create blueprint
router.post('/blueprints', async (req, res) => {
  const { name, workshop, recipe, is_lootable, is_quest_reward, is_harvester_event, is_trails_reward } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO blueprints (name, workshop, recipe, is_lootable, is_quest_reward, is_harvester_event, is_trails_reward)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [name, workshop, recipe, is_lootable || false, is_quest_reward || false, is_harvester_event || false, is_trails_reward || false]
    );
    
    res.status(201).json({ message: 'Blueprint created successfully', blueprintId: result.rows[0].id });
  } catch (error) {
    console.error('Error creating blueprint:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Blueprint already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create blueprint' });
    }
  }
});

// Update blueprint
router.put('/blueprints/:id', async (req, res) => {
  const { name, workshop, recipe, is_lootable, is_quest_reward, is_harvester_event, is_trails_reward } = req.body;
  
  try {
    await pool.query(
      `UPDATE blueprints 
       SET name = $1, workshop = $2, recipe = $3, is_lootable = $4, is_quest_reward = $5, 
           is_harvester_event = $6, is_trails_reward = $7
       WHERE id = $8`,
      [name, workshop, recipe, is_lootable, is_quest_reward, is_harvester_event, is_trails_reward, req.params.id]
    );
    
    res.json({ message: 'Blueprint updated successfully' });
  } catch (error) {
    console.error('Error updating blueprint:', error);
    res.status(500).json({ error: 'Failed to update blueprint' });
  }
});

// Delete blueprint
router.delete('/blueprints/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM raider_owned_blueprints WHERE blueprint_id = $1', [req.params.id]);
    await pool.query('DELETE FROM blueprints WHERE id = $1', [req.params.id]);
    res.json({ message: 'Blueprint deleted successfully' });
  } catch (error) {
    console.error('Error deleting blueprint:', error);
    res.status(500).json({ error: 'Failed to delete blueprint' });
  }
});

export default router;
