/**
 * Mapping Nexus — App.tsx (v2)
 *
 * Role-based routing:
 *   role === 'hr'       → /hr/*
 *   role === 'manager'  → /manager/*
 *   role === 'employee' → /employee/*
 *
 * No RoleSelection screen. Role is embedded in JWT at account creation.
 */
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import * as api from './services/api';
import type { UserProfile } from './types';

// Auth
import LoginPage from './components/auth/LoginPage';
import ChangePasswordPage from './components/auth/ChangePasswordPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import OnboardingPage from './components/auth/OnboardingPage';
import LandingPage from './components/public/LandingPage';

// HR pages
import HRLayout from './components/hr/HRLayout';
import NexusMap from './components/hr/NexusMap';
import EmployeeManagement from './components/hr/EmployeeManagement';
import TeamRequests from './components/hr/TeamRequests';
import HRBurnoutRadar from './components/hr/HRBurnoutRadar';
import HRSkillPulse from './components/hr/HRSkillPulse';
import AuditLog from './components/hr/AuditLog';
import HRProjects from './components/hr/HRProjects';

// Manager pages
import ManagerLayout from './components/manager/ManagerLayout';
import TeamDashboard from './components/manager/TeamDashboard';
import MatchingEngine from './components/manager/MatchingEngine';
import TeamManage from './components/manager/TeamManage';

// Employee pages
import EmployeeLayout from './components/employee/EmployeeLayout';
import MyProfile from './components/employee/MyProfile';

// Shared
import LoadingSpinner from './components/shared/LoadingSpinner';

/**
 * ProtectedRoute — Redirects to /login if not authenticated.
 * Optionally restricts by role.
 */
function ProtectedRoute({
    children,
    allowedRoles,
    user,
}: {
    children: React.ReactNode;
    allowedRoles?: string[];
    user: UserProfile | null;
}) {
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their correct dashboard
        const defaultPath = user.role === 'hr' ? '/hr/dashboard' :
            user.role === 'manager' ? '/manager/dashboard' : '/employee/profile';
        return <Navigate to={defaultPath} replace />;
    }
    return <>{children}</>;
}

/**
 * RoleRedirect — After login, sends user to their role's dashboard.
 */
function RoleRedirect({ user }: { user: UserProfile | null }) {
    if (!user) return <Navigate to="/login" replace />;
    switch (user.role) {
        case 'hr': return <Navigate to="/hr/dashboard" replace />;
        case 'manager': return <Navigate to="/manager/dashboard" replace />;
        case 'employee': return <Navigate to="/employee/profile" replace />;
        default: return <Navigate to="/login" replace />;
    }
}

function App() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        const stored = api.getUser();
        const token = api.getToken();

        if (!stored || !token) {
            if (stored || token) api.clearSession();
            setLoading(false);
            return;
        }

        try {
            const response = await api.getMe();
            if (response.success && response.user) {
                setUser(response.user);
                // Update stored user in case role changed
                localStorage.setItem('nexus_user', JSON.stringify(response.user));
            } else {
                api.clearSession();
            }
        } catch {
            api.clearSession();
        }

        setLoading(false);
    };

    const handleLogin = async (email: string, password: string) => {
        const result = await api.login(email, password);
        if (result.success && result.user) {
            setUser(result.user);
        }
        return result;
    };

    const handleGoogleLogin = async (idToken: string) => {
        const result = await api.loginWithGoogle(idToken);
        if (result.success && result.user) {
            setUser(result.user);
        }
        return result;
    };

    const handleLogout = () => {
        void api.logout().finally(() => setUser(null));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0c] flex items-center justify-center transition-colors duration-500">
                <LoadingSpinner message="Initializing Mapping Nexus..." />
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                    user ? <RoleRedirect user={user} /> : <LoginPage onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} />
                } />
                <Route path="/change-password" element={<ChangePasswordPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/onboard" element={<OnboardingPage />} />

                {/* Root layout/landing */}
                <Route path="/" element={
                    user ? <RoleRedirect user={user} /> : <LandingPage />
                } />

                {/* HR routes */}
                <Route path="/hr" element={
                    <ProtectedRoute user={user} allowedRoles={['hr']}>
                        <HRLayout user={user!} onLogout={handleLogout} />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<NexusMap />} />
                    <Route path="employees" element={<EmployeeManagement />} />
                    <Route path="team-requests" element={<TeamRequests />} />
                    <Route path="burnout" element={<HRBurnoutRadar />} />
                    <Route path="skills" element={<HRSkillPulse />} />
                    <Route path="projects" element={<HRProjects />} />
                    <Route path="audit" element={<AuditLog />} />
                </Route>

                {/* Manager routes */}
                <Route path="/manager" element={
                    <ProtectedRoute user={user} allowedRoles={['manager']}>
                        <ManagerLayout user={user!} onLogout={handleLogout} />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<TeamDashboard />} />
                    <Route path="match" element={<MatchingEngine />} />
                    <Route path="team" element={<TeamManage />} />
                    <Route path="burnout" element={<HRBurnoutRadar />} />
                    <Route path="skills" element={<HRSkillPulse />} />
                </Route>

                {/* Employee routes */}
                <Route path="/employee" element={
                    <ProtectedRoute user={user} allowedRoles={['employee']}>
                        <EmployeeLayout user={user!} onLogout={handleLogout} />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<MyProfile />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
