import pool from './database.js';

const token = '370af491d4418b1781c1d01d4d1894c6778961236fe78a8970b8cae58278aedd';

async function testVerify() {
  try {
    console.log('Testing verification for token:', token);
    
    // Find user
    const result = await pool.query(
      `SELECT id, email, username, verification_token_expires, email_verified 
       FROM users 
       WHERE verification_token = $1 AND is_active = true`,
      [token]
    );

    console.log('\nUser found:', result.rows.length > 0 ? 'Yes' : 'No');
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('User:', user);
      console.log('\nChecks:');
      console.log('- Already verified?', user.email_verified);
      console.log('- Token expired?', new Date() > new Date(user.verification_token_expires));
      
      if (!user.email_verified && new Date() <= new Date(user.verification_token_expires)) {
        console.log('\n✅ User can be verified!');
        
        // Try to create raider profile
        console.log('\nAttempting to create raider profile...');
        try {
          await pool.query(
            `INSERT INTO raider_profiles (user_id, raider_name, expedition_level) 
             VALUES ($1, $2, 0)
             ON CONFLICT (user_id) DO NOTHING`,
            [user.id, user.username]
          );
          console.log('✅ Raider profile created/exists');
        } catch (err) {
          console.error('❌ Error creating raider profile:', err.message);
          console.error('Error details:', err);
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testVerify();
