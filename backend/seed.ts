import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const ADMIN_PIN = '041078';

const adminAccounts = [
    {
        email: 'tdhairyakumar@gmail.com',
        password: 'Dktwr@123',
    },
    {
        email: 'sharvesheve@gmail.com',
        password: 'Sharvesh@123',
    },
];

const sampleUsers = [
    {
        email: 'aarti.ops@mappingnexus.com',
        password: 'Aarti@123',
        subscriptionStatus: 'Active',
        accessLevel: 'Standard',
        monthlySpend: 49,
        isRevenueCounted: true,
    },
    {
        email: 'rohan.pm@mappingnexus.com',
        password: 'Rohan@123',
        subscriptionStatus: 'Expired',
        accessLevel: 'Standard',
        monthlySpend: 29,
        isRevenueCounted: true,
    },
    {
        email: 'neha.hr@mappingnexus.com',
        password: 'Neha@123',
        subscriptionStatus: 'Active',
        accessLevel: 'Standard',
        monthlySpend: 79,
        isRevenueCounted: true,
    },
    {
        email: 'vikram.sales@mappingnexus.com',
        password: 'Vikram@123',
        subscriptionStatus: 'Active',
        accessLevel: 'VIP',
        monthlySpend: 149,
        isRevenueCounted: true,
    },
    {
        email: 'sana.finance@mappingnexus.com',
        password: 'Sana@123',
        subscriptionStatus: 'Active',
        accessLevel: 'Standard',
        monthlySpend: 99,
        isRevenueCounted: true,
    },
    {
        email: 'arjun.tech@mappingnexus.com',
        password: 'Arjun@123',
        subscriptionStatus: 'Expired',
        accessLevel: 'Standard',
        monthlySpend: 39,
        isRevenueCounted: true,
    },
];

async function seedDatabase() {
    console.log('Starting database seed...\n');

    try {
        console.log('Seeding Admin table...');
        for (const adminAccount of adminAccounts) {
            const existingAdmin = await prisma.admin.findUnique({
                where: { email: adminAccount.email },
            });

            if (!existingAdmin) {
                await prisma.admin.create({
                    data: {
                        email: adminAccount.email,
                        pin: ADMIN_PIN,
                    },
                });
                console.log(`Created admin record for ${adminAccount.email}`);
            } else {
                console.log(`Admin record already exists for ${adminAccount.email}`);
            }
        }

        console.log('\nSeeding admin-capable user accounts...');
        for (const adminAccount of adminAccounts) {
            const existingUser = await prisma.user.findUnique({
                where: { email: adminAccount.email },
            });

            if (!existingUser) {
                const passwordHash = await bcrypt.hash(adminAccount.password, 10);

                await prisma.user.create({
                    data: {
                        email: adminAccount.email,
                        passwordHash,
                        subscriptionStatus: 'Active',
                        accessLevel: 'Admin',
                        monthlySpend: 0,
                        isRevenueCounted: false,
                    },
                });
                console.log(`Created admin-capable user for ${adminAccount.email}`);
            } else {
                await prisma.user.update({
                    where: { email: adminAccount.email },
                    data: {
                        accessLevel: 'Admin',
                        subscriptionStatus: 'Active',
                        isRevenueCounted: false,
                    },
                });
                console.log(`Ensured VIP access for ${adminAccount.email}`);
            }
        }

        console.log('\nSeeding sample users...');
        for (const sampleUser of sampleUsers) {
            const existingUser = await prisma.user.findUnique({
                where: { email: sampleUser.email },
            });

            if (!existingUser) {
                const passwordHash = await bcrypt.hash(sampleUser.password, 10);
                await prisma.user.create({
                    data: {
                        email: sampleUser.email,
                        passwordHash,
                        subscriptionStatus: sampleUser.subscriptionStatus,
                        accessLevel: sampleUser.accessLevel,
                        monthlySpend: sampleUser.monthlySpend,
                        isRevenueCounted: sampleUser.isRevenueCounted,
                    },
                });
                console.log(`Created sample user ${sampleUser.email}`);
            } else {
                console.log(`Sample user already exists for ${sampleUser.email}`);
            }
        }

        console.log('\nDatabase seed completed successfully.');
        console.log('\nAdmin-capable accounts:');
        for (const adminAccount of adminAccounts) {
            console.log(`Email: ${adminAccount.email}`);
            console.log(`Password: ${adminAccount.password}`);
            console.log(`PIN: ${ADMIN_PIN}`);
        }
    } catch (error) {
        console.error('\nError seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedDatabase().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
});
