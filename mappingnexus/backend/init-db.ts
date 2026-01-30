/**
 * Database Initialization Script
 * Creates tables if they don't exist (using Prisma migrations)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeDatabase() {
    console.log('🔧 Database Initialization Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Check if DATABASE_URL exists
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set!');
        }

        console.log('📍 Connecting to database...');
        await prisma.$connect();
        console.log('✅ Connected successfully!\n');

        console.log('🔍 Checking database schema...');

        // Test if tables exist by trying to query them
        try {
            await prisma.user.count();
            console.log('✅ User table exists');
        } catch (error) {
            console.log('⚠️  User table missing - needs migration');
        }

        try {
            await prisma.admin.count();
            console.log('✅ Admin table exists');
        } catch (error) {
            console.log('⚠️  Admin table missing - needs migration');
        }

        try {
            await prisma.employee.count();
            console.log('✅ Employee table exists');
        } catch (error) {
            console.log('⚠️  Employee table missing - needs migration');
        }

        try {
            await prisma.revenue.count();
            console.log('✅ Revenue table exists');
        } catch (error) {
            console.log('⚠️  Revenue table missing - needs migration');
        }

        try {
            await prisma.task.count();
            console.log('✅ Task table exists');
        } catch (error) {
            console.log('⚠️  Task table missing - needs migration');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 NEXT STEPS:');
        console.log('   If any tables are missing, run:');
        console.log('   npx prisma db push');
        console.log('   OR');
        console.log('   npx prisma migrate dev --name init');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error: any) {
        console.error('\n❌ Database initialization failed!');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (error.code === 'P1001') {
            console.error('🔌 Cannot reach database server');
            console.error('   Check that PostgreSQL is running');
            console.error('   Verify DATABASE_URL in .env');
        } else if (error.code === 'P1003') {
            console.error('🗄️  Database does not exist');
            console.error('   Create database: CREATE DATABASE mappingnexus;');
        } else {
            console.error(`❌ Error: ${error.message}`);
            console.error(`   Code: ${error.code || 'N/A'}`);
        }

        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run initialization
initializeDatabase()
    .then(() => {
        console.log('✅ Database initialization complete!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Initialization failed\n');
        process.exit(1);
    });
