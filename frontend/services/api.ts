/**
 * API Client for Backend Communication
 * Uses relative URLs - Vite proxy forwards to Express server
 */
import { Employee } from '../types';

const API_BASE_URL = '/api';

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    error?: string;
    [key: string]: any;
}

// ============ AUTHENTICATION ============

export async function signupUser(email: string, password: string): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        // Log detailed error for debugging
        if (!data.success) {
            console.error('❌ Signup failed:', data);
        }

        return data;
    } catch (error: any) {
        console.error('❌ Signup API Error:', error);
        return {
            success: false,
            message: error.message === 'Failed to fetch'
                ? 'Cannot connect to server. Make sure the backend is running on port 3001.'
                : `Network error: ${error.message}`,
            error: error.message
        };
    }
}

export async function loginUser(email: string, password: string): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        // Log detailed error for debugging
        if (!data.success) {
            console.error('❌ Login failed:', data);
        }

        return data;
    } catch (error: any) {
        console.error('❌ Login API Error:', error);
        return {
            success: false,
            message: error.message === 'Failed to fetch'
                ? 'Cannot connect to server. Make sure the backend is running on port 3001.'
                : `Network error: ${error.message}`,
            error: error.message
        };
    }
}

// ============ EMPLOYEES ============

export async function getEmployees(userId: string): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${API_BASE_URL}/employees?userId=${userId}`);
        return await response.json();
    } catch (error) {
        console.error('Get employees API error:', error);
        return { success: false, message: 'Failed to fetch employees', employees: [] };
    }
}

export async function addEmployee(userId: string, name: string, role: string, salary?: number, extraData?: Partial<Employee>): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${API_BASE_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                name,
                role,
                salary,
                ...extraData // Spread rich fields (status, location, skills, etc.)
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('Add employee API error:', error);
        return { success: false, message: 'Failed to add employee' };
    }
}

export async function bulkAddEmployees(userId: string, employees: Employee[]): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${API_BASE_URL}/employees/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                employees
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('Bulk add employees API error:', error);
        return { success: false, message: 'Failed to bulk add employees' };
    }
}

export async function deleteEmployee(employeeId: string, userId: string): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${API_BASE_URL}/employees/${employeeId}?userId=${userId}`, {
            method: 'DELETE',
        });
        return await response.json();
    } catch (error) {
        console.error('Delete employee API error:', error);
        return { success: false, message: 'Failed to delete employee' };
    }
}

// ============ ADMIN ============

export async function verifyAdmin(email: string, pin: string): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, pin }),
        });
        return await response.json();
    } catch (error) {
        console.error('Admin verify API error:', error);
        return { success: false, message: 'Failed to verify admin' };
    }
}

export async function getCustomers(): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/customers`);
        return await response.json();
    } catch (error) {
        console.error('Get customers API error:', error);
        return { success: false, message: 'Failed to fetch customers', customers: [] };
    }
}

export async function approveSubscription(email: string, amount: number): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, amount }),
        });
        return await response.json();
    } catch (error) {
        console.error('Approve subscription API error:', error);
        return { success: false, message: 'Failed to approve subscription' };
    }
}

export async function revokeSubscription(email: string): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/revoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return await response.json();
    } catch (error) {
        console.error('Revoke subscription API error:', error);
        return { success: false, message: 'Failed to revoke subscription' };
    }
}

export async function getRevenue(): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/revenue`);
        return await response.json();
    } catch (error) {
        console.error('Get revenue API error:', error);
        return { success: false, message: 'Failed to fetch revenue', totalRevenue: '0', transactions: [] };
    }
}

export async function getTransactions(): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/transactions`);
        return await response.json();
    } catch (error) {
        console.error('Get transactions API error:', error);
        return { success: false, message: 'Failed to fetch transactions', transactions: [] };
    }
}
