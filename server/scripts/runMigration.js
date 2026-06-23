const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, '../../database/migration_add_images.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Running migration: Add images column to inventory...');
        await client.query(migrationSQL);
        console.log('✅ Migration completed successfully!');

        // Verify the column was added
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'inventory' AND column_name = 'images'
        `);

        if (result.rows.length > 0) {
            console.log('✅ Verified: images column exists');
            console.log(`   Type: ${result.rows[0].data_type}`);
        } else {
            console.log('⚠️  Warning: Could not verify images column');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

runMigration();
