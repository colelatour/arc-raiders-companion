import pool from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

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

const routes = [
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
    method: 'POST',
    path: '/quests',
    handler: async (req, res) => {
      const { id, name, locations, url, objectives, rewards } = req.body;
      
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
            'INSERT INTO quests (id, name, locations, url) VALUES ($1, $2, $3, $4)',
            [id, name, locations || '', url || null]
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
    }
  },
  {
    method: 'PUT',
    path: '/quests/:id',
    handler: async (req, res) => {
      const questId = req.params.id;
      const { name, locations, url, objectives, rewards } = req.body;
      
      console.log('Updating quest:', questId, { name, locations, url, objectives, rewards });
      
      try {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // Update quest
          await client.query(
            'UPDATE quests SET name = $1, locations = $2, url = $3 WHERE id = $4',
            [name, locations, url || null, questId]
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
    }
  },
  {
    method: 'DELETE',
    path: '/quests/:id',
    handler: async (req, res) => {
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
    }
  },
  {
    method: 'GET',
    path: '/blueprints',
    handler: async (req, res) => {
      try {
        const blueprints = await pool.query('SELECT * FROM blueprints ORDER BY id');
        res.json({ blueprints: blueprints.rows });
      } catch (error) {
        console.error('Error fetching blueprints:', error);
        res.status(500).json({ error: 'Failed to fetch blueprints' });
      }
    }
  },
  {
    method: 'POST',
    path: '/blueprints',
    handler: async (req, res) => {
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
    }
  },
  {
    method: 'PUT',
    path: '/blueprints/:id',
    handler: async (req, res) => {
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
    }
  },
  {
    method: 'DELETE',
    path: '/blueprints/:id',
    handler: async (req, res) => {
      try {
        await pool.query('DELETE FROM raider_owned_blueprints WHERE blueprint_id = $1', [req.params.id]);
        await pool.query('DELETE FROM blueprints WHERE id = $1', [req.params.id]);
        res.json({ message: 'Blueprint deleted successfully' });
      } catch (error) {
        console.error('Error deleting blueprint:', error);
        res.status(500).json({ error: 'Failed to delete blueprint' });
      }
    }
  },
  {
    method: 'GET',
    path: '/users',
    handler: async (req, res) => {
      try {
        const users = await pool.query(`
          SELECT u.id, u.email, u.username, u.role, u.created_at, u.last_login, u.is_active,
                 rp.expedition_level
          FROM users u
          LEFT JOIN raider_profiles rp ON u.id = rp.user_id
          ORDER BY u.id
        `);
        res.json({ users: users.rows });
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
      }
    }
  },
  {
    method: 'POST',
    path: '/users',
    handler: async (req, res) => {
      const { email, username, password, role = 'user' } = req.body;
      
      try {
        // Validation
        if (!email || !username || !password) {
          return res.status(400).json({ error: 'Email, username, and password are required' });
        }
        
        if (username.length < 3) {
          return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }
        
        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
          'INSERT INTO users (email, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
          [email, username, hashedPassword, role]
        );
        
        res.status(201).json({ message: 'User created successfully', userId: result.rows[0].id });
      } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === '23505') {
          res.status(409).json({ error: 'Email or username already exists' });
        } else {
          res.status(500).json({ error: 'Failed to create user' });
        }
      }
    }
  },
  {
    method: 'DELETE',
    path: '/users/:id',
    handler: async (req, res) => {
      const userId = parseInt(req.params.id);
      
      try {
        // Prevent deleting yourself
        if (userId === req.user.userId) {
          return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        // Delete user (cascades will handle raider profiles and related data)
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
      } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
      }
    }
  },
  {
    method: 'PUT',
    path: '/users/:id/role',
    handler: async (req, res) => {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      try {
        // Validation
        if (!role || !['user', 'admin'].includes(role)) {
          return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
        }
        
        // Prevent changing your own role
        if (userId === req.user.userId) {
          return res.status(400).json({ error: 'Cannot change your own role' });
        }
        
        // Update role
        const result = await pool.query(
          'UPDATE users SET role = $1 WHERE id = $2 RETURNING id',
          [role, userId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User role updated successfully' });
      } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
      }
    }
  },
  {
    method: 'PUT',
    path: '/users/:id/expedition-level',
    handler: async (req, res) => {
      const userId = parseInt(req.params.id);
      const { expeditionLevel } = req.body;
      
      try {
        // Validation
        if (expeditionLevel === undefined || expeditionLevel === null) {
          return res.status(400).json({ error: 'Expedition level is required' });
        }
        
        const level = parseInt(expeditionLevel);
        if (isNaN(level) || level < 0) {
          return res.status(400).json({ error: 'Expedition level must be a positive number or 0' });
        }
        
        // Update expedition level in raider_profiles
        const result = await pool.query(
          'UPDATE raider_profiles SET expedition_level = $1 WHERE user_id = $2 RETURNING id',
          [level, userId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User profile not found' });
        }
        
        res.json({ message: 'Expedition level updated successfully' });
      } catch (error) {
        console.error('Error updating expedition level:', error);
        res.status(500).json({ error: 'Failed to update expedition level' });
      }
    }
  },
  {
    method: 'GET',
    path: '/expedition-requirements/:expeditionLevel',
    handler: async (req, res) => {
      try {
        const { expeditionLevel } = req.params;
        
        const result = await pool.query(
          `SELECT * FROM expedition_requirements 
           WHERE expedition_level = $1 
           ORDER BY part_number, display_order`,
          [expeditionLevel]
        );
        
        res.json({ requirements: result.rows });
      } catch (error) {
        console.error('Error fetching expedition requirements:', error);
        res.status(500).json({ error: 'Failed to fetch expedition requirements' });
      }
    }
  },
  {
    method: 'GET',
    path: '/expedition-requirements-levels',
    handler: async (req, res) => {
      try {
        const result = await pool.query(
          'SELECT DISTINCT expedition_level FROM expedition_requirements ORDER BY expedition_level'
        );
        
        res.json({ levels: result.rows.map(r => r.expedition_level) });
      } catch (error) {
        console.error('Error fetching expedition levels:', error);
        res.status(500).json({ error: 'Failed to fetch expedition levels' });
      }
    }
  },
  {
    method: 'POST',
    path: '/expedition-requirements',
    handler: async (req, res) => {
      try {
        const { expedition_level, part_number, item_name, quantity, location, display_order } = req.body;
        
        if (!expedition_level || !part_number || !item_name || !quantity || !location) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const result = await pool.query(
          `INSERT INTO expedition_requirements 
           (expedition_level, part_number, item_name, quantity, location, display_order) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [expedition_level, part_number, item_name, quantity, location, display_order || 0]
        );
        
        res.json({ requirement: result.rows[0] });
      } catch (error) {
        console.error('Error creating expedition requirement:', error);
        if (error.code === '23505') { // Unique violation
          res.status(400).json({ error: 'This item already exists for this expedition and part' });
        } else {
          res.status(500).json({ error: 'Failed to create expedition requirement' });
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/expedition-requirements/:id',
    handler: async (req, res) => {
      try {
        const { id } = req.params;
        const { item_name, quantity, location, display_order } = req.body;
        
        const result = await pool.query(
          `UPDATE expedition_requirements 
           SET item_name = $1, quantity = $2, location = $3, display_order = $4, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $5 
           RETURNING *`,
          [item_name, quantity, location, display_order, id]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Requirement not found' });
        }
        
        res.json({ requirement: result.rows[0] });
      } catch (error) {
        console.error('Error updating expedition requirement:', error);
        res.status(500).json({ error: 'Failed to update expedition requirement' });
      }
    }
  },
  {
    method: 'DELETE',
    path: '/expedition-requirements/:id',
    handler: async (req, res) => {
      try {
        const { id } = req.params;
        
        const result = await pool.query(
          'DELETE FROM expedition_requirements WHERE id = $1 RETURNING *',
          [id]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Requirement not found' });
        }
        
        res.json({ message: 'Requirement deleted successfully' });
      } catch (error) {
        console.error('Error deleting expedition requirement:', error);
        res.status(500).json({ error: 'Failed to delete expedition requirement' });
      }
    }
  },
  {
    method: 'POST',
    path: '/expedition-requirements/copy',
    handler: async (req, res) => {
      try {
        const { from_level, to_level } = req.body;
        
        if (!from_level || !to_level) {
          return res.status(400).json({ error: 'Missing required fields: from_level and to_level' });
        }
        
        // First check if target level already has requirements
        const existing = await pool.query(
          'SELECT COUNT(*) FROM expedition_requirements WHERE expedition_level = $1',
          [to_level]
        );
        
        if (parseInt(existing.rows[0].count) > 0) {
          return res.status(400).json({ error: `Expedition ${to_level} already has requirements. Delete them first if you want to copy.` });
        }
        
        // Copy requirements
        const result = await pool.query(
          `INSERT INTO expedition_requirements (expedition_level, part_number, item_name, quantity, location, display_order)
           SELECT $1, part_number, item_name, quantity, location, display_order
           FROM expedition_requirements
           WHERE expedition_level = $2
           RETURNING *`,
          [to_level, from_level]
        );
        
        res.json({ message: `Copied ${result.rows.length} requirements to Expedition ${to_level}`, requirements: result.rows });
      } catch (error) {
        console.error('Error copying expedition requirements:', error);
        res.status(500).json({ error: 'Failed to copy expedition requirements' });
      }
    }
  }
];

// Apply middleware to all routes
const protectedRoutes = routes.map(route => {
  return {
    ...route,
    handler: (req, res, next) => {
      return authenticateToken(req, res, () => {
        return requireAdmin(req, res, () => route.handler(req, res));
      });
    }
  };
});

export default protectedRoutes;