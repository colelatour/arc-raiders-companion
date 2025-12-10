import pool from './database.js';

async function checkUsers() {
  try {
    console.log('📊 Checking recent users...\n');
    
    const result = await pool.query(`
      SELECT 
        id, 
        email, 
        username, 
        email_verified, 
        verification_token IS NOT NULL as has_token,
        verification_token_expires
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('Recent users:');
    console.table(result.rows);

    // Check if any user has a valid token
    const unverifiedUsers = result.rows.filter(u => !u.email_verified && u.has_token);
    
    if (unverifiedUsers.length > 0) {
      console.log('\n🔍 Found unverified users with tokens:');
      for (const user of unverifiedUsers) {
        const tokenResult = await pool.query(
          'SELECT verification_token FROM users WHERE id = $1',
          [user.id]
        );
        console.log(`\nUser: ${user.email}`);
        console.log(`Token: ${tokenResult.rows[0].verification_token}`);
        console.log(`Expires: ${user.verification_token_expires}`);
        console.log(`Verification URL: http://localhost:3002/verify-email?token=${tokenResult.rows[0].verification_token}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
