import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  try {
    console.log('🔄 Running migration to add admin roles...');
    
    // Add role column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='users' AND column_name='role') THEN
              ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
          END IF;
      END $$;
    `);
    console.log('✅ Role column added');
    
    // Create index
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    console.log('✅ Index created');
    
    // Update existing users
    await pool.query(`UPDATE users SET role = 'user' WHERE role IS NULL OR role = ''`);
    console.log('✅ Existing users updated to "user" role');
    
    // Make test user admin
    const result = await pool.query(`UPDATE users SET role = 'admin' WHERE email = 'raider@test.com' RETURNING email, username, role`);
    if (result.rows.length > 0) {
      console.log(`✅ ${result.rows[0].email} (${result.rows[0].username}) is now an admin`);
    }
    
    // Show all users
    const users = await pool.query(`SELECT id, email, username, role FROM users ORDER BY id`);
    console.log('\n📋 Current users:');
    console.table(users.rows);
    
    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
