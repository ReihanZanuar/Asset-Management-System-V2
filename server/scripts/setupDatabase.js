const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const setupDatabase = async () => {
    console.log('🔧 Setting up AMS-SMK Database...\n');

    // Connect to PostgreSQL (without database specified)
    const adminPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: 'postgres' // Connect to default database
    });

    try {
        // Check if database exists
        const dbCheck = await adminPool.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [process.env.DB_NAME || 'ams_smk_db']
        );

        if (dbCheck.rows.length === 0) {
            // Create database
            console.log(`📦 Creating database: ${process.env.DB_NAME}...`);
            await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log('✅ Database created successfully\n');
        } else {
            console.log(`✅ Database ${process.env.DB_NAME} already exists\n`);
        }

        await adminPool.end();

        // Connect to the new database
        const dbPool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'ams_smk_db',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD
        });

        // Run schema file
        console.log('📋 Creating tables...');
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await dbPool.query(schema);
        console.log('✅ Tables created successfully\n');

        // Run seed file
        console.log('🌱 Seeding data...');
        const seedPath = path.join(__dirname, '../database/seed.sql');
        const seed = fs.readFileSync(seedPath, 'utf8');
        await dbPool.query(seed);
        console.log('✅ Data seeded successfully\n');

        await dbPool.end();

        console.log('🎉 Database setup completed!\n');
        console.log('📝 Default credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
};

setupDatabase();
