import { supabaseAdmin } from '../config/supabase.js';
/**
 * Analytics Routes — Phase 8
 *
 * GET /api/analytics/overview  — Workforce overview (Nexus Map data)
 * GET /api/analytics/burnout   — Burnout Radar (5 signal types, per spec)
 * GET /api/analytics/skills    — Skill Pulse (top/dormant/trending/gaps)
 * GET /api/analytics/risk      — Risk Assessment
 *
 * All endpoints are company-scoped. HR sees all, Manager sees team.
 */
import { Router, Request, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { decrypt, decryptFields, hashForDisplay } from '../services/encryption.service.js';
import { getCompanySecret } from '../utils/company-secret.js';

const router = Router();
const MS_PER_DAY = 86400000;
const RECENT_PROJECT_DAYS = 45;
const BURNOUT_LOAD_PER_PROJECT = 18;
const BURNOUT_CAPACITY_RISK_MAX = 28;

function getEmptyBurnoutData() {
    return {
        globalFatigueIndex: 0,
        fatigueChange: null,
        departmentFatigue: [],
        highRiskEmployees: [],
        costPreventionROI: '₹0L',
    };
}

/**
 * Get employee IDs visible to the current user (for scoped analytics).
 */
async function getVisibleEmployeeIds(
    db: any,
    user: AuthenticatedRequest['user']
): Promise<string[]> {
    if (user.role === 'hr') {
        const { data } = await db
            .from('employees')
            .select('employee_id')
            .eq('company_id', user.companyId)
            .eq('is_archived', false);
        return (data || []).map(e => e.employee_id);
    }

    if (user.role === 'manager') {
        const { data: memberships } = await db
            .from('team_memberships')
            .select('employee_id, teams!inner(manager_id)')
            .eq('company_id', user.companyId)
            .eq('status', 'approved')
            .eq('teams.manager_id', user.userId);
        return (memberships || []).map((m: any) => m.employee_id);
    }

    return [];
}

/**
 * GET /api/analytics/overview
 * Workforce overview — powering the Nexus Map.
 */
router.get('/overview', requireAuth, requireRole('hr', 'manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const companySecret = getCompanySecret(req);
        const visibleIds = await getVisibleEmployeeIds(db, user);

        if (visibleIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    totalEmployees: 0, activeCount: 0, benchCount: 0,
                    burnoutRiskCount: 0, skillGapCount: 0, healthScore: 0,
                    mobilityRate: 0, departmentBreakdown: [], utilizationHeatmap: [],
                },
            });
        }

        const { data: employees } = await db
            .from('employees')
            .select('*')
            .eq('company_id', user.companyId)
            .eq('is_archived', false)
            .in('employee_id', visibleIds);

        const emps = employees || [];
        const total = emps.length;

        // Status counts
        const activeCount = emps.filter(e => e.current_project_load > 0).length;
        const benchCount = emps.filter(e => e.current_project_load === 0).length;

        // Burnout risk: high load + no recent leave
        const now = Date.now();
        const burnoutRiskCount = emps.filter(e => {
            const daysSinceAssignment = e.last_assignment_date
                ? Math.floor((now - new Date(e.last_assignment_date).getTime()) / MS_PER_DAY) : 999;
            return e.current_project_load >= 3 || (daysSinceAssignment < 30 && e.current_project_load >= 2);
        }).length;

        // Skills analysis
        const { data: allSkills } = await db
            .from('skills')
            .select('skill_name, proficiency, last_used_date, employee_id')
            .eq('company_id', user.companyId)
            .in('employee_id', visibleIds);

        const dormantSkillCount = new Set(
            (allSkills || [])
                .filter(s => {
                    if (!s.last_used_date) return false;
                    return Math.floor((now - new Date(s.last_used_date).getTime()) / MS_PER_DAY) > 90;
                })
                .map(s => s.employee_id)
        ).size;

        // Travel mobility
        const travelReady = emps.filter(e => e.travel_eligible).length;
        const mobilityRate = Math.round((travelReady / total) * 100);

        // Health score
        const avgLoad = emps.reduce((s, e) => s + e.current_project_load, 0) / total;
        const healthScore = Math.round(
            Math.max(0, 100 - (burnoutRiskCount / total) * 40 - avgLoad * 8)
        );

        // Department breakdown
        const deptMap: Record<string, any[]> = {};
        emps.forEach(e => {
            if (!deptMap[e.department]) deptMap[e.department] = [];
            deptMap[e.department].push(e);
        });

        const departmentBreakdown = Object.entries(deptMap).map(([name, deptEmps]) => ({
            name,
            count: deptEmps.length,
            avgLoad: +(deptEmps.reduce((s, e) => s + e.current_project_load, 0) / deptEmps.length).toFixed(1),
            burnoutRisk: deptEmps.filter(e => e.current_project_load >= 3).length,
        }));

        // Utilization heatmap
        const utilizationHeatmap = await Promise.all(
            emps
                .sort((a, b) => b.capacity_committed_pct - a.capacity_committed_pct)
                .slice(0, 25)
                .map(async e => {
                    let name = `Employee ${hashForDisplay(e.employee_id)}`;
                    try {
                        if (e.name_encrypted) {
                            const decrypted = await decrypt(e.name_encrypted, user.companyId, companySecret);
                            if (decrypted) name = decrypted;
                        }
                    } catch (decErr: any) {
                        console.error('Decrypt name failed for employee', e.employee_id, decErr.message);
                    }

                    const util = Math.min(100, e.capacity_committed_pct || e.current_project_load * 25);
                    return {
                        employeeId: e.employee_id,
                        name,
                        department: e.department,
                        utilization: util,
                        projectLoad: e.current_project_load,
                        tier: util > 85 ? 'red' : util > 60 ? 'yellow' : 'green',
                    };
                })
        );

        res.json({
            success: true,
            data: {
                totalEmployees: total,
                activeCount,
                benchCount,
                burnoutRiskCount,
                skillGapCount: dormantSkillCount,
                healthScore,
                mobilityRate,
                departmentBreakdown,
                utilizationHeatmap,
            },
        });
    } catch (err: any) {
        console.error('Analytics overview error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/analytics/burnout
 * Burnout Radar with 5 signal types per spec.
 */
router.get('/burnout', requireAuth, requireRole('hr', 'manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const companySecret = getCompanySecret(req);
        const visibleIds = await getVisibleEmployeeIds(db, user);

        if (visibleIds.length === 0) {
            return res.json({ success: true, data: getEmptyBurnoutData() });
        }

        const { data: employees } = await db
            .from('employees')
            .select('*')
            .eq('company_id', user.companyId)
            .eq('is_archived', false)
            .in('employee_id', visibleIds);

        const ninetyDaysAgo = new Date(Date.now() - 90 * MS_PER_DAY).toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * MS_PER_DAY).toISOString().split('T')[0];
        const { data: recentAssignments } = await db
            .from('assignments')
            .select('employee_id, start_date')
            .in('employee_id', visibleIds)
            .gte('start_date', ninetyDaysAgo);
        const velocityMap = (recentAssignments || []).reduce((acc, assignment) => {
            if (!acc[assignment.employee_id]) acc[assignment.employee_id] = { last30: 0, last90: 0 };
            acc[assignment.employee_id].last90 += 1;
            if (assignment.start_date >= thirtyDaysAgo) acc[assignment.employee_id].last30 += 1;
            return acc;
        }, {});

        const empList = employees || [];

        // Decrypt names in parallel batches of 50 to avoid saturating the event loop
        const decryptedNames: string[] = [];
        const BATCH = 50;
        for (let i = 0; i < empList.length; i += BATCH) {
            const chunk = empList.slice(i, i + BATCH);
            const names = await Promise.all(chunk.map(async e => {
                try {
                    if (e.name_encrypted) {
                        const d = await decrypt(e.name_encrypted, user.companyId, companySecret);
                        if (d) return d;
                    }
                } catch (decErr: any) {
                    console.error('Decrypt name failed for employee', e.employee_id, decErr.message);
                }
                return `Employee ${hashForDisplay(e.employee_id)}`;
            }));
            decryptedNames.push(...names);
        }

        const scored = empList.map((e, idx) => {
            const name = decryptedNames[idx];
            const velocity = velocityMap[e.employee_id] || { last30: 0, last90: 0 };
            const capacityRisk = Math.min(BURNOUT_CAPACITY_RISK_MAX, (Number(e.capacity_committed_pct || 0) / 100) * BURNOUT_CAPACITY_RISK_MAX);
            const loadScore = Math.min(100, e.current_project_load * BURNOUT_LOAD_PER_PROJECT + capacityRisk);
            const tenureRiskScore = e.tenure_years < 0.5 ? 100 : e.tenure_years < 1 ? 70 : e.tenure_years < 2 ? 40 : 10;
            const velocityScore = Math.min(100, velocity.last90 * 18 + velocity.last30 * 14);
            let riskScore = Math.round(loadScore * 0.45 + tenureRiskScore * 0.2 + velocityScore * 0.35);
            riskScore = Math.min(100, riskScore);
            const signals: string[] = [];
            if (loadScore >= 65) signals.push(`Project load pressure: ${e.current_project_load} active projects at ${Math.round(Number(e.capacity_committed_pct || 0))}% capacity`);
            if (velocityScore >= 55) signals.push(`Recent velocity spike: ${velocity.last30} starts in 30d / ${velocity.last90} in 90d`);
            if (tenureRiskScore >= 60) signals.push(`Low-tenure ramp risk: ${Number(e.tenure_years).toFixed(1)} years`);
            const riskTier = riskScore >= 70 ? 'Critical' : riskScore >= 40 ? 'Warning' : 'Low';
            const recommendation = riskScore >= 70
                ? 'Immediate workload reduction or leave recommended'
                : riskScore >= 40 ? 'Monitor closely, consider redistribution' : 'Current workload looks sustainable';
            return { id: e.employee_id, name, department: e.department, riskScore, riskTier, signals, recommendation };
        });

        // Persist high-risk signals to burnout_signals table (deduplicated per day)
        const highRiskSignals = scored
            .filter(s => s.riskTier === 'Critical' || s.riskTier === 'Warning')
            .map(s => ({
                employee_id: s.id,
                company_id: user.companyId,
                signal_type: 'task_velocity' as const,
                risk_tier: s.riskScore >= 70 ? 'high' as const : 'medium' as const,
                details: { riskScore: s.riskScore, signals: s.signals },
            }));

        if (highRiskSignals.length > 0) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const { data: existingSignals } = await db
                .from('burnout_signals')
                .select('employee_id')
                .eq('company_id', user.companyId)
                .gte('detected_at', todayStart.toISOString());
            const alreadySignaled = new Set(existingSignals?.map(s => s.employee_id) || []);
            const newSignals = highRiskSignals.filter(s => !alreadySignaled.has(s.employee_id));
            if (newSignals.length > 0) {
                await db.from('burnout_signals').insert(newSignals).throwOnError();
            }
        }

        // Department fatigue
        const deptMap: Record<string, number[]> = {};
        scored.forEach(s => {
            if (!deptMap[s.department]) deptMap[s.department] = [];
            deptMap[s.department].push(s.riskScore);
        });
        const departmentFatigue = Object.entries(deptMap).map(([name, scores]) => {
            const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            return { name, value: avg, tier: avg >= 60 ? 'critical' : avg >= 35 ? 'warning' : 'stable' };
        }).sort((a, b) => b.value - a.value);

        const globalFatigue = Math.round(scored.reduce((s, e) => s + e.riskScore, 0) / scored.length);

        // Compute fatigueChange: compare current global fatigue to signals from 7 days ago
        let fatigueChange: number | null = null;
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY);
            const { data: oldSignals } = await db
                .from('burnout_signals')
                .select('risk_tier')
                .eq('company_id', user.companyId)
                .lt('detected_at', sevenDaysAgo.toISOString());
            if (oldSignals && oldSignals.length > 0) {
                const oldHighCount = oldSignals.filter(s => s.risk_tier === 'high').length;
                const oldMedCount = oldSignals.filter(s => s.risk_tier === 'medium').length;
                const oldApproxFatigue = Math.round(
                    (oldHighCount * 80 + oldMedCount * 50) / oldSignals.length
                );
                fatigueChange = globalFatigue - oldApproxFatigue;
            }
        } catch {
            // fatigueChange remains null if history unavailable — no crash
        }

        const highRisk = scored.filter(s => s.riskTier !== 'Low')
            .sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);
        const costSaved = highRisk.filter(h => h.riskTier === 'Critical').length * 1500000;

        res.json({
            success: true,
            data: {
                globalFatigueIndex: globalFatigue,
                fatigueChange,
                departmentFatigue,
                highRiskEmployees: highRisk,
                costPreventionROI: `₹${(costSaved / 100000).toFixed(0)}L`,
            },
        });
    } catch (err: any) {
        console.error('Burnout analytics error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/analytics/skills
 * Skill Pulse — top, dormant, trending, gaps.
 */
router.get('/skills', requireAuth, requireRole('hr', 'manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const visibleIds = await getVisibleEmployeeIds(db, user);

        const [{ data: projects }, { data: workforceSkills }] = await Promise.all([
            db.from('projects').select('required_skills, status, start_date').eq('company_id', user.companyId),
            db.from('skills').select('skill_name, employee_id').eq('company_id', user.companyId).in('employee_id', visibleIds),
        ]);

        const demandMap: Record<string, { demand: number; active: number; planned: number; recent: number }> = {};
        (projects || []).forEach(project => {
            (project.required_skills || []).forEach((skill: any) => {
                const name = String(skill.skill_name || skill.name || '').trim().toLowerCase();
                if (!name) return;
                if (!demandMap[name]) demandMap[name] = { demand: 0, active: 0, planned: 0, recent: 0 };
                const count = Math.max(1, Number(skill.count || 1));
                demandMap[name].demand += count;
                if (project.status === 'active') demandMap[name].active += count;
                if (project.status === 'planned') demandMap[name].planned += count;
                if (project.start_date && new Date(project.start_date).getTime() >= Date.now() - RECENT_PROJECT_DAYS * MS_PER_DAY) {
                    demandMap[name].recent += count;
                }
            });
        });

        const workforceMap = (workforceSkills || []).reduce((acc, skill) => {
            if (!acc[skill.skill_name]) acc[skill.skill_name] = new Set<string>();
            acc[skill.skill_name].add(skill.employee_id);
            return acc;
        }, {});

        const allSkillEntries = Object.entries(demandMap);

        const topSkills = allSkillEntries
            .sort((a, b) => b[1].demand - a[1].demand)
            .slice(0, 10)
            .map(([name, data]) => ({
                name,
                employeeCount: data.demand,
                demandScore: Math.min(100, data.active * 15 + data.planned * 10),
            }));

        const dormantSkills = allSkillEntries
            .filter(([, data]) => data.active === 0 && data.planned > 0)
            .sort((a, b) => b[1].planned - a[1].planned)
            .slice(0, 10)
            .map(([name, data]) => ({
                name,
                employeeCount: data.planned,
                avgDaysSinceUsed: 0, // calculated per-skill below if needed
            }));

        // Enrich dormantSkills with real avgDaysSinceUsed from the skills table
        const { data: dormantSkillRows } = await db
            .from('skills')
            .select('skill_name, last_used_date')
            .eq('company_id', user.companyId)
            .in('employee_id', visibleIds)
            .not('last_used_date', 'is', null);

        const now2 = Date.now();
        const daysSinceBySkill: Record<string, number[]> = {};
        (dormantSkillRows || []).forEach(s => {
            if (!daysSinceBySkill[s.skill_name]) daysSinceBySkill[s.skill_name] = [];
            daysSinceBySkill[s.skill_name].push(
                Math.floor((now2 - new Date(s.last_used_date).getTime()) / MS_PER_DAY)
            );
        });
        dormantSkills.forEach(skill => {
            const days = daysSinceBySkill[skill.name];
            if (days && days.length > 0) {
                skill.avgDaysSinceUsed = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
            }
        });

        const trendingSkills = allSkillEntries
            .filter(([, data]) => data.recent > 0)
            .sort((a, b) => (b[1].recent + b[1].active) - (a[1].recent + a[1].active))
            .slice(0, 5)
            .map(([name, data]) => {
                const growthScore = Math.max(5, Math.min(45, data.recent * 8 + data.active * 4));
                return {
                    name,
                    growthPercent: `+${growthScore}%`,
                };
            });

        const skillGaps = allSkillEntries
            .map(([name, data]) => {
                const available = workforceMap[name]?.size || 0;
                return { name, total: data.demand, available, gap: Math.max(0, data.demand - available) };
            })
            .filter(g => g.gap > 0)
            .sort((a, b) => b.gap - a.gap)
            .slice(0, 8);

        res.json({
            success: true,
            data: { topSkills, dormantSkills, trendingSkills, skillGaps },
        });
    } catch (err: any) {
        console.error('Skills analytics error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/analytics/risk
 * Risk assessment overview.
 */
router.get('/risk', requireAuth, requireRole('hr', 'manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const visibleIds = await getVisibleEmployeeIds(db, user);

        const { data: employees } = await db
            .from('employees')
            .select('*')
            .eq('company_id', user.companyId)
            .eq('is_archived', false)
            .in('employee_id', visibleIds);

        const emps = employees || [];

        const scored = emps.map(e => {
            let riskScore = 0;
            if (e.current_project_load >= 4) riskScore += 25;
            else if (e.current_project_load >= 3) riskScore += 15;
            if (e.capacity_committed_pct > 85) riskScore += 30;
            if (e.tenure_years < 1 && e.current_project_load >= 2) riskScore += 10;
            return { ...e, riskScore: Math.min(100, riskScore) };
        });

        const avgRisk = scored.length > 0
            ? Math.round(scored.reduce((s, e) => s + e.riskScore, 0) / scored.length) : 0;
        const criticalCount = scored.filter(s => s.riskScore >= 70).length;
        const attrition = scored.length > 0
            ? Math.round((scored.filter(s => s.riskScore >= 50).length / scored.length) * 100) : 0;

        const riskFactors = [
            { label: 'High Workload', value: Math.round((scored.filter(e => e.current_project_load >= 3).length / Math.max(1, scored.length)) * 100), color: 'bg-red-500' },
            { label: 'Over-Committed', value: Math.round((scored.filter(e => e.capacity_committed_pct > 85).length / Math.max(1, scored.length)) * 100), color: 'bg-yellow-500' },
            { label: 'New + Loaded', value: Math.round((scored.filter(e => e.tenure_years < 1 && e.current_project_load >= 2).length / Math.max(1, scored.length)) * 100), color: 'bg-purple-500' },
        ];

        res.json({
            success: true,
            data: {
                overallRiskScore: avgRisk,
                riskLevel: avgRisk >= 60 ? 'HIGH' : avgRisk >= 35 ? 'MODERATE' : 'LOW',
                projectedAttrition: attrition,
                criticalRoles: criticalCount,
                riskFactors,
            },
        });
    } catch (err: any) {
        console.error('Risk analytics error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
