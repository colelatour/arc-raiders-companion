import pool from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Running email verification migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-email-verification.sql'),
      'utf8'
    );

    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('Email verification fields added to users table.');
    
    // Optionally, verify existing users
    const choice = process.argv[2];
    if (choice === '--verify-existing') {
      await pool.query('UPDATE users SET email_verified = true WHERE created_at < NOW()');
      console.log('✅ Existing users marked as verified.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
