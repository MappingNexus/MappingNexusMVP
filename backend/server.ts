/**
 * Main Backend API Server - PostgreSQL Integration
 * Handles authentication, employees, admin functions, and revenue tracking
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { AccessLevel, createAuthToken, verifyAuthToken } from './auth.js';

dotenv.config();

// ============ DATABASE_URL VALIDATION ============
if (!process.env.DATABASE_URL) {
    console.error('\n❌ CRITICAL ERROR: DATABASE_URL is not set!');
    console.error('⚠️  Please add DATABASE_URL to your .env file');
    console.error('📝 Example: DATABASE_URL=postgresql://username:password@localhost:5432/mappingnexus\n');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware
app.use(cors({ origin: true, credentials: true })); // Allow all origins for debugging
app.use(express.json());

const SALT_ROUNDS = 10;
const ADMIN_EMAILS = ['tdhairyakumar@gmail.com', 'sharvesheve@gmail.com'];

type AuthenticatedRequest = Request & {
    auth?: {
        userId: string;
        email: string;
        accessLevel: AccessLevel;
    };
};

const ACCESS_RANK: Record<AccessLevel, number> = {
    Standard: 1,
    VIP: 2,
    Admin: 3,
};

// ============ DATABASE CONNECTION CHECK WITH TIMEOUT ============
let isDatabaseConnected = false;
let connectionError: string | null = null;

/**
 * Check database connection with 5-second timeout
 */
async function checkDatabaseConnection() {
    try {
        console.log('🔌 Attempting to connect to PostgreSQL...');
        console.log(`📍 Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);

        // Create a promise that rejects after 5 seconds
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000);
        });

        // Race between connection and timeout
        await Promise.race([
            prisma.$connect(),
            timeoutPromise
        ]);

        // Test the connection with a simple query
        await prisma.$queryRaw`SELECT 1`;

        isDatabaseConnected = true;
        connectionError = null;
        console.log('✅ PostgreSQL database connected successfully');

    } catch (error: any) {
        isDatabaseConnected = false;

        // Detailed error logging
        console.error('\n❌ Database connection failed!');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (error.message.includes('timeout')) {
            connectionError = 'Database connection timed out. Please check your DATABASE_URL.';
            console.error('⏱️  Connection timed out after 5 seconds');
            console.error('\n💡 Troubleshooting:');
            console.error('   1. Verify PostgreSQL is running');
            console.error('   2. Check DATABASE_URL in .env file');
            console.error('   3. Verify network connectivity');
            console.error('   4. Check firewall settings');
        } else if (error.code === 'P1001') {
            connectionError = 'Cannot reach database server. Check host and port.';
            console.error('🔌 Cannot reach database server');
            console.error(`   Code: ${error.code}`);
            console.error(`   Message: ${error.message}`);
        } else if (error.code === 'P1002') {
            connectionError = 'Database server timeout. Server is not responding.';
            console.error('⏱️  Database server timeout');
        } else if (error.code === 'P1003') {
            connectionError = 'Database does not exist. Create the database first.';
            console.error('🗄️  Database does not exist');
            console.error('\n💡 Run: CREATE DATABASE mappingnexus;');
        } else if (error.code === 'P1008') {
            connectionError = 'Operations timed out. Database is too slow.';
            console.error('⏱️  Operations timed out');
        } else if (error.code === 'P1017') {
            connectionError = 'Server has closed the connection.';
            console.error('🔌 Server closed the connection');
        } else {
            connectionError = `Database error: ${error.message}`;
            console.error('❌ Error details:');
            console.error(`   Code: ${error.code || 'N/A'}`);
            console.error(`   Message: ${error.message}`);
            console.error(`   Stack: ${error.stack?.split('\n')[0]}`);
        }

        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
}

// Check connection on startup (non-blocking)
checkDatabaseConnection();

// Middleware to ensure DB is connected with detailed error
const requireDb = (req: Request, res: Response, next: Function) => {
    if (!isDatabaseConnected) {
        return res.status(503).json({
            success: false,
            message: connectionError || 'Database is currently unavailable. Please try again later.',
            error: connectionError,
            hint: 'Check server logs for detailed error information'
        });
    }
    next();
};

function buildUserResponse(user: {
    id: string;
    email: string;
    accessLevel: string;
    subscriptionStatus: string;
    expiryDate: Date | null;
}) {
    const normalizedAccessLevel = (user.accessLevel === 'Admin' || user.accessLevel === 'VIP')
        ? user.accessLevel as AccessLevel
        : 'Standard';

    let isSubscribed = user.subscriptionStatus === 'Active';
    if (normalizedAccessLevel === 'VIP' || normalizedAccessLevel === 'Admin') {
        isSubscribed = true;
    }

    const token = createAuthToken({
        sub: String(user.id),
        email: String(user.email),
        accessLevel: normalizedAccessLevel,
    });

    return {
        id: String(user.id),
        email: String(user.email),
        isSubscribed,
        isVIP: normalizedAccessLevel === 'VIP' || normalizedAccessLevel === 'Admin',
        isAdmin: normalizedAccessLevel === 'Admin',
        accessLevel: normalizedAccessLevel,
        expiryDate: user.expiryDate ? String(user.expiryDate.toISOString()) : null,
        token,
    };
}

function getBearerToken(req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.slice('Bearer '.length).trim();
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: Function) => {
    const token = getBearerToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
    }

    try {
        const payload = verifyAuthToken(token);
        req.auth = {
            userId: payload.sub,
            email: payload.email,
            accessLevel: payload.accessLevel,
        };
        next();
    } catch (error: any) {
        return res.status(401).json({
            success: false,
            message: error.message || 'Invalid auth token',
        });
    }
};

const requireRole = (minimumRole: AccessLevel) => {
    return (req: AuthenticatedRequest, res: Response, next: Function) => {
        if (!req.auth) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        if (ACCESS_RANK[req.auth.accessLevel] < ACCESS_RANK[minimumRole]) {
            return res.status(403).json({
                success: false,
                message: `Requires ${minimumRole} access`,
            });
        }

        next();
    };
};

const requireWorkspaceAccess = async (req: AuthenticatedRequest, res: Response, next: Function) => {
    if (!req.auth) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.auth.userId },
        });

        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        if (currentUser.accessLevel === 'Standard' && currentUser.subscriptionStatus !== 'Active') {
            return res.status(403).json({
                success: false,
                message: 'Active subscription required',
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to verify access',
        });
    }
};

// ============ AUTHENTICATION ENDPOINTS ============

/**
 * POST /api/auth/signup
 * Create a new user with hashed password
 */
app.post('/api/auth/signup', requireDb, async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Account already exists',
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                subscriptionStatus: 'Expired',
                accessLevel: ADMIN_EMAILS.includes(email.toLowerCase()) ? 'Admin' : 'Standard',
                monthlySpend: 0,
                isRevenueCounted: !ADMIN_EMAILS.includes(email.toLowerCase()),
            },
        });

        res.json({
            success: true,
            message: 'Account created successfully',
            user: buildUserResponse(user),
        });
    } catch (error: any) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create account',
            error: error.message,
            details: error.code || 'Unknown error'
        });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user and return user data
 */
app.post('/api/auth/login', requireDb, async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                type: 'account_not_found',
                message: 'Account not found. Please sign up first.',
            });
        }

        // Verify password
        if (!user.passwordHash) {
            return res.status(401).json({
                success: false,
                type: 'invalid_credentials',
                message: 'This account uses Google Sign-In. Please use that instead.',
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                type: 'invalid_credentials',
                message: 'Invalid credentials. Please try again.',
            });
        }

        // Check expiry for standard users
        if (user.accessLevel === 'Standard' && user.expiryDate) {
            const now = new Date();
            if (now > user.expiryDate) {
                // Update status in DB
                const updatedUser = await prisma.user.update({
                    where: { id: user.id },
                    data: { subscriptionStatus: 'Expired' },
                });

                res.json({
                    success: true,
                    message: 'Login successful',
                    user: buildUserResponse(updatedUser),
                });
                return;
            }
        }

        res.json({
            success: true,
            message: 'Login successful',
            user: buildUserResponse(user),
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message,
            details: error.code || 'Unknown error'


        });
    }
});

/**
 * POST /api/auth/google
 * Authenticate with Google (Verify ID Token)
 */
app.post('/api/auth/google', requireDb, async (req: Request, res: Response) => {
    try {
        console.log('[Backend] Received request at /api/auth/google');
        const { token } = req.body;

        if (!token) {
            console.warn('[Backend] /api/auth/google called without token');
            return res.status(400).json({
                success: false,
                message: 'Google token is required',
            });
        }

        console.log(`[Backend] Verifying Google Token: ${token.substring(0, 15)}...`);

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: GOOGLE_CLIENT_ID not set',
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return res.status(400).json({
                success: false,
                message: 'Invalid token payload',
            });
        }

        const email = payload.email.toLowerCase();

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Create user for Google Sign In
            user = await prisma.user.create({
                data: {
                    email,
                    passwordHash: null,
                    subscriptionStatus: 'Expired',
                    accessLevel: ADMIN_EMAILS.includes(email) ? 'Admin' : 'Standard',
                    monthlySpend: 0,
                    isRevenueCounted: !ADMIN_EMAILS.includes(email),
                },
            });
        }

        // Check expiry for standard users
        if (user.accessLevel === 'Standard' && user.expiryDate) {
            const now = new Date();
            if (now > user.expiryDate) {
                // Update status in DB
                const updatedUser = await prisma.user.update({
                    where: { id: user.id },
                    data: { subscriptionStatus: 'Expired' },
                });

                res.json({
                    success: true,
                    message: 'Google login successful',
                    user: buildUserResponse(updatedUser),
                });
                return;
            }
        }

        res.json({
            success: true,
            message: 'Google login successful',
            user: buildUserResponse(user),
        });

    } catch (error: any) {
        console.error('Google login error:', error);
        res.status(500).json({
            success: false,
            message: 'Google login failed',
            error: error.message,
        });
    }
});

// ============ EMPLOYEE/NODE ENDPOINTS ============

/**
 * GET /api/employees
 * Get all employees for a specific user
 */
app.get('/api/employees', requireDb, requireAuth, requireWorkspaceAccess, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const queryUserId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
        const userId = req.auth?.accessLevel === 'Admin' && queryUserId ? queryUserId : req.auth!.userId;

        const employees = await prisma.employee.findMany({
            where: { userId: String(userId) },
            include: { tasks: true },
            orderBy: { createdAt: 'asc' },
        });

        // Convert all fields to strings to prevent React Error #31
        const sanitizedEmployees = employees.map((emp: any) => ({
            id: String(emp.id),
            name: String(emp.name),
            role: String(emp.role),
            salary: emp.salary, // Keep as number, frontend can format
            userId: String(emp.userId),

            // New Rich Fields
            status: emp.status,
            efficiency: emp.efficiency,
            location: emp.location,
            skills: emp.skills,
            travelReady: emp.travelReady,
            pastMissions: emp.pastMissions || '',
            education: emp.education || '',

            tasks: emp.tasks.map((task) => ({
                id: String(task.id),
                name: String(task.name),
                completionDate: String(task.completionDate.toISOString()),
                employeeId: String(task.employeeId),
            })),
        }));

        res.json({
            success: true,
            employees: sanitizedEmployees,
        });
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employees',
        });
    }
});

/**
 * POST /api/employees
 * Add a new employee for a user
 */
app.post('/api/employees', requireDb, requireAuth, requireWorkspaceAccess, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            name,
            role,
            salary,
            // New Fields
            status,
            efficiency,
            location,
            skills,
            travelReady,
            pastMissions,
            education
        } = req.body;

        if (!name || !role) {
            return res.status(400).json({
                success: false,
                message: 'Name and role are required',
            });
        }

        const userId = req.auth!.userId;

        const employee = await prisma.employee.create({
            data: {
                userId: String(userId),
                name: String(name),
                role: String(role),
                salary: salary ? parseFloat(salary) : null,

                // Save new fields
                status: status || 'Active',
                efficiency: efficiency || 100,
                location: location || 'Remote',
                skills: Array.isArray(skills) ? skills : [],
                travelReady: travelReady !== undefined ? travelReady : true,
                pastMissions: pastMissions || '',
                education: education || ''
            } as any,
        });

        res.json({
            success: true,
            message: 'Employee added successfully',
            employee: {
                ...employee,
                id: String(employee.id),
                userId: String(employee.userId),
            },
        });
    } catch (error) {
        console.error('Add employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add employee',
        });
    }
});

/**
 * POST /api/employees/bulk
 * Add multiple employees at once (For Data Ingestion)
 */
app.post('/api/employees/bulk', requireDb, requireAuth, requireWorkspaceAccess, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { employees } = req.body;

        if (!employees || !Array.isArray(employees)) {
            return res.status(400).json({
                success: false,
                message: 'Employees array is required',
            });
        }

        const userId = req.auth!.userId;

        // Prepare data for Prisma createMany (or loop if needed for relations, but createMany is faster)
        // Note: createMany is supported in recent Prisma versions for Postgres

        const employeesData = employees.map((emp: any) => ({
            userId: String(userId),
            name: String(emp.name),
            role: String(emp.role),
            salary: emp.salary ? parseFloat(emp.salary) : null,
            status: emp.status || 'Active',
            efficiency: emp.efficiency || 100,
            location: emp.location || 'Remote',
            skills: Array.isArray(emp.skills) ? emp.skills : [],
            travelReady: emp.travelReady !== undefined ? emp.travelReady : true,
            pastMissions: emp.pastMissions || '',
            education: emp.education || ''
        }));

        // Using transaction to ensure all or nothing
        const result = await prisma.employee.createMany({
            data: employeesData,
        });

        res.json({
            success: true,
            message: `${result.count} employees added successfully`,
            count: result.count
        });

    } catch (error: any) {
        console.error('Bulk add employees error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk add employees',
            error: error.message
        });
    }
});


/**
 * DELETE /api/employees/:id
 * Delete an employee (with data isolation check)
 */
app.delete('/api/employees/:id', requireDb, requireAuth, requireWorkspaceAccess, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Verify employee belongs to user (data isolation)
        const employee = await prisma.employee.findUnique({
            where: { id: String(id) },
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        if (req.auth!.accessLevel !== 'Admin' && employee.userId !== req.auth!.userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this employee',
            });
        }

        // Delete employee (cascades to tasks)
        await prisma.employee.delete({
            where: { id: String(id) },
        });

        res.json({
            success: true,
            message: 'Employee deleted successfully',
        });
    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete employee',
        });
    }
});

// ============ ADMIN ENDPOINTS ============

/**
 * POST /api/admin/verify
 * Verify admin access with email and PIN
 */
app.post('/api/admin/verify', requireDb, requireAuth, requireRole('Admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { pin } = req.body;

        const admin = await prisma.admin.findUnique({
            where: { email: req.auth!.email.toLowerCase() },
        });

        if (!admin || admin.pin !== pin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials',
            });
        }

        res.json({
            success: true,
            message: 'Admin verified',
            isAdmin: true,
        });
    } catch (error) {
        console.error('Admin verify error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed',
        });
    }
});

/**
 * GET /api/admin/customers
 * Get all customers for admin dashboard
 */
app.get('/api/admin/customers', requireDb, requireAuth, requireRole('Admin'), async (_req: AuthenticatedRequest, res: Response) => {
    try {
        const customers = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });

        const sanitizedCustomers = customers.map((user) => ({
            email: String(user.email),
            monthlySpend: String(user.monthlySpend),
            status: String(user.subscriptionStatus),
            isSubscribed: user.subscriptionStatus === 'Active' || user.accessLevel === 'VIP' || user.accessLevel === 'Admin',
            isRevenueCounted: user.isRevenueCounted,
            accessLevel: String(user.accessLevel),
            lastPaymentDate: user.lastPaymentDate ? String(user.lastPaymentDate.toISOString()) : null,
            accessExpiry: user.expiryDate ? String(user.expiryDate.toISOString()) : null,
        }));

        res.json({
            success: true,
            customers: sanitizedCustomers,
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customers',
        });
    }
});

/**
 * POST /api/admin/approve
 * Approve subscription and log transaction
 */
app.post('/api/admin/approve', requireDb, requireAuth, requireRole('Admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { email, amount } = req.body;

        if (!email || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Email and amount are required',
            });
        }

        const now = new Date();
        const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        // Update user subscription
        const user = await prisma.user.update({
            where: { email: email.toLowerCase() },
            data: {
                subscriptionStatus: 'Active',
                lastPaymentDate: now,
                expiryDate: expiryDate,
            },
        });

        // Log revenue transaction
        await prisma.revenue.create({
            data: {
                amount: parseFloat(amount),
                date: now,
                payerEmail: email.toLowerCase(),
                approvedBy: req.auth!.email.toLowerCase(),
                status: 'Completed',
            },
        });

        res.json({
            success: true,
            message: 'Subscription approved and transaction logged',
            user: {
                email: String(user.email),
                status: String(user.subscriptionStatus),
                expiryDate: String(expiryDate.toISOString()),
            },
        });
    } catch (error) {
        console.error('Approve subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve subscription',
        });
    }
});

/**
 * POST /api/admin/revoke
 * Revoke user subscription
 */
app.post('/api/admin/revoke', requireDb, requireAuth, requireRole('Admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        const user = await prisma.user.update({
            where: { email: email.toLowerCase() },
            data: {
                subscriptionStatus: 'Expired',
                expiryDate: new Date(),
            },
        });

        res.json({
            success: true,
            message: 'Subscription revoked',
            user: {
                email: String(user.email),
                status: String(user.subscriptionStatus),
            },
        });
    } catch (error) {
        console.error('Revoke subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke subscription',
        });
    }
});

/**
 * GET /api/admin/revenue
 * Calculate total revenue (ZERO REVENUE RULE applied)
 */
app.get('/api/admin/revenue', requireDb, requireAuth, requireRole('Admin'), async (_req: AuthenticatedRequest, res: Response) => {
    try {
        // Zero Revenue Rule: Exclude tdhairyakumar@gmail.com
        const revenues = await prisma.revenue.findMany({
            where: {
                payerEmail: {
                    notIn: ADMIN_EMAILS,
                },
                status: 'Completed',
            },
        });

        const totalRevenue = revenues.reduce((sum, rev) => sum + rev.amount, 0);

        const sanitizedRevenues = revenues.map((rev) => ({
            id: String(rev.id),
            amount: String(rev.amount),
            date: String(rev.date.toISOString()),
            payerEmail: String(rev.payerEmail),
            approvedBy: rev.approvedBy ? String(rev.approvedBy) : null,
            status: String(rev.status),
        }));

        res.json({
            success: true,
            totalRevenue: String(totalRevenue),
            transactions: sanitizedRevenues,
        });
    } catch (error) {
        console.error('Get revenue error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue',
        });
    }
});

/**
 * GET /api/admin/transactions
 * Get all transactions for admin dashboard
 */
app.get('/api/admin/transactions', requireDb, requireAuth, requireRole('Admin'), async (_req: AuthenticatedRequest, res: Response) => {
    try {
        const transactions = await prisma.revenue.findMany({
            orderBy: { date: 'desc' },
        });

        const sanitizedTransactions = transactions.map((txn) => ({
            id: String(txn.id),
            email: String(txn.payerEmail),
            amount: String(txn.amount),
            transactionDate: String(txn.date.toISOString()),
            approvedBy: txn.approvedBy ? String(txn.approvedBy) : null,
            status: String(txn.status),
        }));

        res.json({
            success: true,
            transactions: sanitizedTransactions,
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions',
        });
    }
});

// ============ HEALTH CHECK ============

app.get('/api/health', async (_req: Request, res: Response) => {
    let dbStatus = 'disconnected';

    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (error) {
        console.error('Health check DB error:', error);
    }

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus,
    });
});

// ============ SEED ADMIN (Run once) ============

async function seedAdmin() {
    try {
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
            console.log('✓ Admin account seeded');
        }
    } catch (error) {
        console.error('Admin seed error:', error);
    }
}

async function seedAdditionalAdmins() {
    try {
        const additionalAdminEmails = ['sharvesheve@gmail.com'];

        for (const email of additionalAdminEmails) {
            const existingAdmin = await prisma.admin.findUnique({
                where: { email },
            });

            if (!existingAdmin) {
                await prisma.admin.create({
                    data: {
                        email,
                        pin: '041078',
                    },
                });
                console.log(`Admin account seeded for ${email}`);
            }
        }
    } catch (error) {
        console.error('Additional admin seed error:', error);
    }
}

async function ensureBootstrapAdminUsers() {
    try {
        const bootstrapAdmins = [
            { email: 'tdhairyakumar@gmail.com', password: 'Dktwr@123' },
            { email: 'sharvesheve@gmail.com', password: 'Sharvesh@123' },
        ];

        for (const adminAccount of bootstrapAdmins) {
            const existingUser = await prisma.user.findUnique({
                where: { email: adminAccount.email },
            });

            if (!existingUser) {
                const passwordHash = await bcrypt.hash(adminAccount.password, SALT_ROUNDS);
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
            } else if (existingUser.accessLevel !== 'Admin' || existingUser.subscriptionStatus !== 'Active') {
                await prisma.user.update({
                    where: { email: adminAccount.email },
                    data: {
                        accessLevel: 'Admin',
                        subscriptionStatus: 'Active',
                        isRevenueCounted: false,
                    },
                });
            }
        }
    } catch (error) {
        console.error('Bootstrap admin user seed error:', error);
    }
}

// ============ SERVER START ============

// Only start listening if not in serverless environment (Vercel)
// Only start listening if not in serverless environment (Vercel)
if (!process.env.VERCEL) {
    const HOST = '0.0.0.0'; // Required for Render
    app.listen(Number(PORT), HOST, async () => {
        console.log(`\n🚀 Backend API Server running on http://${HOST}:${PORT}`);
        console.log(`\n⚙️  Configuration:`);
        console.log(`   - Database: ${isDatabaseConnected ? '✓ Connected' : '✗ NOT CONNECTED'}`);
        // ... rest of logging ...
        if (isDatabaseConnected) {
            await seedAdmin();
            await seedAdditionalAdmins();
            await ensureBootstrapAdminUsers();
        }
    });
}


export default app;
