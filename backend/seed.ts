import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedDatabase() {
    console.log('🌱 Starting database seed...\n');

    try {
        // 1. Seed Admin record
        console.log('📋 Seeding Admin table...');
        const existingAdmin = await prisma.admin.findUnique({
            where: { email: 'tdhairyakumar@gmail.com' },
        });

        if (!existingAdmin) {
            await prisma.admin.create({
                data: {
                    email: 'tdhairyakumar@gmail.com',
                    pin: '041078',
                },
            });
            console.log('✅ Admin record created');
        } else {
            console.log('ℹ️  Admin record already exists');
        }

        // 2. Seed VIP User account (THIS IS CRITICAL FOR ADMIN LOGIN)
        console.log('\n📋 Seeding VIP User account...');
        const existingUser = await prisma.user.findUnique({
            where: { email: 'tdhairyakumar@gmail.com' },
        });

        if (!existingUser) {
            // Hash the admin password
            const passwordHash = await bcrypt.hash('Dktwr@123', 10);

            await prisma.user.create({
                data: {
                    email: 'tdhairyakumar@gmail.com',
                    passwordHash,
                    subscriptionStatus: 'Active',
                    accessLevel: 'VIP',
                    monthlySpend: 0,
                    isRevenueCounted: false, // Admin revenue is not counted
                },
            });
            console.log('✅ VIP User account created');
            console.log('   📧 Email: tdhairyakumar@gmail.com');
            console.log('   🔑 Password: Dktwr@123');
        } else {
            // Update existing user to VIP if not already
            if (existingUser.accessLevel !== 'VIP') {
                await prisma.user.update({
                    where: { email: 'tdhairyakumar@gmail.com' },
                    data: {
                        accessLevel: 'VIP',
                        subscriptionStatus: 'Active',
                        isRevenueCounted: false,
                    },
                });
                console.log('✅ Upgraded existing user to VIP');
            } else {
                console.log('ℹ️  VIP User already exists');
            }
        }

        console.log('\n✅ Database seed completed successfully!');
        console.log('\n🎉 You can now login as admin with:');
        console.log('   📧 Email: tdhairyakumar@gmail.com');
        console.log('   🔑 Password: Dktwr@123');

    } catch (error) {
        console.error('\n❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed
seedDatabase()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    });
