import { supabaseAdmin } from '../config/supabase.js';
/**
 * AI Matching Engine Routes — Phase 6 + Semantic Search + ROI
 *
 * RAG Pipeline: pgvector semantic similarity → company-scoped retrieval → rule-based scoring → OpenRouter LLM ranking
 *
 * SECURITY:
 *   - pgvector queries ALWAYS include WHERE company_id = ?
 *   - Employee names are NEVER passed to the LLM
 *   - Company isolation assertion before every LLM call
 *   - Confidence scoring: skill 40%, availability 25%, cost 20%, seniority 15%
 *
 * SEMANTIC SEARCH:
 *   - Embeddings generated locally via all-MiniLM-L6-v2 (384-dim)
 *   - "Python ML" will find "Data Scientist" via vector cosine similarity
 *   - Falls back to keyword matching if embeddings are not yet populated
 *
 * ROI ESTIMATE:
 *   - Calculates company average cost per day from all employees
 *   - Shows per-match savings: "This assignment costs ₹X less than your average"
 *
 * POST /api/match — Run matching query against company's workforce
 */
import { Router, Request, Response } from 'express';
import { ChatOpenAI } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { matchingLimiter } from '../middleware/rateLimiter.js';
import { decrypt, hashForDisplay } from '../services/encryption.service.js';
import { logAction, AuditActions } from '../services/audit.service.js';
import { env } from '../config/env.js';
import { generateQueryEmbedding } from '../services/embedding.service.js';
import { getCompanySecret } from '../utils/company-secret.js';
import { validate } from '../utils/validation.js';

const router = Router();
const AI_ENHANCEMENT_TIMEOUT_MS = 8000;

function normalizeSkillName(skillName: string): string {
    return skillName.trim().replace(/\s+/g, ' ').toLowerCase();
}

function escapeIlikeValue(value: string): string {
    // PostgREST parses `.or(a,b)` expressions with commas and parentheses as control characters,
    // so strip them from user-provided skill names after escaping SQL wildcard characters.
    return value.replace(/\\/g, '\\\\').replace(/[_%]/g, '\\$&').replace(/[(),]/g, '');
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    try {
        return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
                timeoutHandle = setTimeout(() => reject(new Error(message)), timeoutMs);
            }),
        ]);
    } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
    }
}

const ragModel = new ChatOpenAI({
    model: 'google/gemini-2.5-flash-preview:free',
    apiKey: env.OPENROUTER_API_KEY,
    configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
            'HTTP-Referer': 'https://mappingnexus.com',
            'X-OpenRouter-Title': 'Mapping Nexus',
        },
    },
});

const matchSchema = z.object({
    brief: z.string().max(2000).optional(),
    requirements: z.object({
        skills: z.array(z.object({
            name: z.string().trim().min(1).max(80),
            priority: z.enum(['Essential', 'Preferred']),
        })).min(1).max(12),
        seniorityLevel: z.enum(['junior', 'mid', 'senior', 'lead', 'principal']).optional(),
        budgetCeiling: z.coerce.number().min(0).max(1000000).optional(),
        travelRequired: z.boolean().optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }),
});

// Hallucination prevention system prompt (from spec)
const SYSTEM_PROMPT = `You are a workforce intelligence matching assistant for Mapping Nexus.
You analyze employee profiles and rank them against job requirements.

STRICT RULES:
1. You will receive anonymized employee profiles identified ONLY by employee_id (a UUID hash). NEVER invent or hallucinate employee names.
2. Base your analysis ONLY on the data provided. If a field is missing, say "data not available" — do NOT guess.
3. Output ONLY valid JSON matching the required schema. No markdown, no commentary outside JSON.
4. Every recommendation must include a clear explanation citing specific data points.
5. If no employees match the requirements, return an empty matches array — do NOT fabricate matches.
6. Never reference data from other companies or outside the provided context.
7. Confidence scores must be calculated from the weighted formula: skill_match × 0.40 + availability × 0.25 + cost_fit × 0.20 + seniority_match × 0.15.
8. If the retrieved evidence is insufficient for a confident recommendation, explicitly say: "Insufficient retrieved data to recommend."`;

async function runRetrievalQA(
    brief: string | undefined,
    reqSkills: { name: string; priority: string }[],
    candidates: any[],
    companyId: string
) {
    if (candidates.length === 0) return [];

    // Trim each candidate to essential fields only — reduces token usage and LLM latency
    const documents = candidates.map(candidate => new Document({
        pageContent: JSON.stringify({
            id: candidate.employee.employeeId.substring(0, 8),
            dept: candidate.employee.department,
            lvl: candidate.employee.seniorityLevel,
            load: candidate.employee.currentProjectLoad,
            travel: candidate.employee.travelEligible,
            calendar: (candidate.employee.availabilityWindows || [])
                .slice(0, 3)
                .map((w: any) => `${w.window_type} (${w.start_date} to ${w.end_date})`),
            skills: (candidate.employee.skills || [])
                .slice(0, 6)
                .map((s: any) => `${s.skill_name}:${s.proficiency}`),
            scores: {
                overall: candidate.confidenceScore,
                skill: candidate.skillMatchScore,
                avail: candidate.availabilityScore,
                cost: candidate.costFitScore,
                senior: candidate.seniorityMatchScore,
            },
        }),
        metadata: { company_id: companyId, employee_id: candidate.employee.employeeId },
    }));

    const context = documents
        .filter(document => document.metadata.company_id === companyId)
        .map(document => document.pageContent)
        .join('\n---\n');

    const skillsStr = reqSkills.map(s => `${s.name}(${s.priority})`).join(', ');
    const briefStr = brief ? brief.substring(0, 400) : 'None';

    const response = await ragModel.invoke([
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(`Skills needed: ${skillsStr}\nBrief: ${briefStr}\n\nCandidates:\n${context}\n\nReturn ONLY a JSON array: [{"id":"8-char-prefix","explanation":"1-2 sentences","flags":[],"action":"deploy|monitor|skip"}]`),
    ]);

    const content = typeof response.content === 'string'
        ? response.content
        : response.content.map((part: any) => typeof part === 'string' ? part : part.text || '').join('');
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
}

/**
 * Calculate rule-based confidence score for an employee against requirements.
 */
function calculateConfidence(
    emp: any,
    empSkills: any[],
    reqSkills: { name: string; priority: string }[],
    requirements: any
): {
    confidenceScore: number;
    skillMatchScore: number;
    availabilityScore: number;
    costFitScore: number;
    seniorityMatchScore: number;
} {
    const now = Date.now();

    // 1. SKILL MATCH (40%)
    let skillPoints = 0;
    let maxSkillPoints = 0;

    reqSkills.forEach(req => {
        const weight = req.priority === 'Essential' ? 2 : 1;
        maxSkillPoints += weight * 100;

        const match = empSkills.find(s =>
            (s.skill_name || '').toLowerCase() === (req.name || '').toLowerCase()
        );

        if (match) {
            let base = 60;
            if (match.proficiency === 'expert') base = 100;
            else if (match.proficiency === 'intermediate') base = 75;

            // Recency bonus/penalty
            if (match.last_used_date) {
                const daysSince = Math.floor(
                    (now - new Date(match.last_used_date).getTime()) / 86400000
                );
                if (daysSince > 90) base *= 0.7;
                else if (daysSince < 30) base *= 1.1;
            }

            skillPoints += weight * Math.min(100, base);
        }
    });

    const skillMatchScore = maxSkillPoints > 0
        ? Math.round((skillPoints / maxSkillPoints) * 100) : 0;

    // 2. AVAILABILITY (25%)
    let availabilityScore = 50;
    if (emp.current_project_load <= 1) availabilityScore = 100;
    else if (emp.current_project_load <= 2) availabilityScore = 80;
    else if (emp.current_project_load <= 3) availabilityScore = 50;
    else availabilityScore = 20;

    // Calendar check (penalize if blocked by holiday/projects in near future)
    const windows = emp.availabilityWindows || [];
    let conflictPenalty = 0;
    const thirtyDaysFromNow = now + 30 * 86400000;
    const projectStart = requirements.startDate ? new Date(requirements.startDate).getTime() : now;
    const projectEnd = requirements.endDate
        ? new Date(requirements.endDate).getTime()
        : (requirements.startDate ? projectStart + 30 * 86400000 : thirtyDaysFromNow);
    const hasProjectDates = Boolean(requirements.startDate || requirements.endDate);
    const conflictStart = hasProjectDates && Number.isFinite(projectStart) ? projectStart : now;
    const conflictEnd = hasProjectDates && Number.isFinite(projectEnd) ? projectEnd : thirtyDaysFromNow;
    
    windows.forEach((w: any) => {
        const start = new Date(w.start_date).getTime();
        const end = new Date(w.end_date).getTime() + 86400000 - 1;
        if (start <= conflictEnd && end >= conflictStart) {
            conflictPenalty += (w.window_type === 'holiday' ? 30 : 15);
        }
    });

    if (emp.availability_from && new Date(emp.availability_from).getTime() > thirtyDaysFromNow) {
        conflictPenalty += 40; // fully unavailable until a distinct future date
    }

    availabilityScore = Math.max(0, availabilityScore - conflictPenalty);

    if (requirements.travelRequired && !emp.travel_eligible) {
        availabilityScore *= 0.3;
    }

    // 3. COST FIT (20%)
    let costFitScore = 100;
    if (requirements.budgetCeiling && emp.cost_per_day_value) {
        const cost = emp.cost_per_day_value;
        if (cost > requirements.budgetCeiling) {
            const overBudget = ((cost - requirements.budgetCeiling) / requirements.budgetCeiling) * 100;
            costFitScore = Math.max(0, 100 - overBudget * 2);
        }
    }

    // 4. SENIORITY MATCH (15%)
    let seniorityMatchScore = 50;
    if (requirements.seniorityLevel) {
        const levels = ['junior', 'mid', 'senior', 'lead', 'principal'];
        const reqIdx = levels.indexOf(requirements.seniorityLevel.toLowerCase());
        const empIdx = levels.indexOf(emp.seniority_level);
        if (reqIdx >= 0 && empIdx >= 0) {
            const diff = Math.abs(reqIdx - empIdx);
            seniorityMatchScore = diff === 0 ? 100 : diff === 1 ? 75 : diff === 2 ? 50 : 25;
        }
    }

    const confidenceScore = Math.round(
        skillMatchScore * 0.40 +
        availabilityScore * 0.25 +
        costFitScore * 0.20 +
        seniorityMatchScore * 0.15
    );

    return {
        confidenceScore,
        skillMatchScore,
        availabilityScore: Math.round(availabilityScore),
        costFitScore: Math.round(costFitScore),
        seniorityMatchScore,
    };
}

/**
 * POST /api/match
 * Run AI matching engine against company's workforce.
 */
router.post('/', matchingLimiter, requireAuth, requireRole('hr', 'manager'), validate(matchSchema), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const companySecret = getCompanySecret(req);
        const { requirements, brief } = req.body;

        if (!requirements?.skills || requirements.skills.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one skill requirement is needed.',
            });
        }

        if (
            requirements.startDate &&
            requirements.endDate &&
            new Date(requirements.startDate) > new Date(requirements.endDate)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Project start date must be before project end date.',
            });
        }

        const reqSkills: { name: string; priority: string }[] = requirements.skills;

        // ============================================================
        // STEP 1: SEMANTIC VECTOR SEARCH (company-scoped ALWAYS)
        // ============================================================
        // Generate a query embedding from the brief + required skills
        // Then search pgvector for semantically similar skills in this company
        const skillNames = reqSkills.filter(s => s.name).map(s => normalizeSkillName(s.name));

        let matchingSkills: any[] | null = null;
        let searchMethod: 'semantic' | 'keyword' = 'keyword';

        try {
            const queryEmbedding = await generateQueryEmbedding(reqSkills, brief);

            // pgvector cosine similarity search — company-scoped, returns top 50 most similar skills
            const { data: vectorResults, error: vecError } = await db
                .rpc('match_skills_by_embedding', {
                    query_embedding: JSON.stringify(queryEmbedding),
                    match_company_id: user.companyId,
                    match_threshold: 0.3,   // cosine similarity threshold
                    match_count: 50,
                });

            if (!vecError && vectorResults && vectorResults.length > 0) {
                matchingSkills = vectorResults;
                searchMethod = 'semantic';
            }
        } catch (embErr: any) {
            console.warn('Semantic search failed, falling back to keyword:', embErr.message);
        }

        // Fallback: keyword matching if semantic search failed or returned nothing
        if (!matchingSkills || matchingSkills.length === 0) {
            const skillFilter = skillNames
                .map(skillName => `skill_name.ilike.${escapeIlikeValue(skillName)}`)
                .join(',');
            const { data: keywordResults, error: skillError } = await db
                .from('skills')
                .select('employee_id, skill_name, proficiency, last_used_date')
                .eq('company_id', user.companyId)
                .or(skillFilter);

            if (skillError) {
                return res.status(500).json({ success: false, message: (skillError as any).message });
            }
            const requestedSkillSet = new Set(skillNames);
            matchingSkills = (keywordResults || []).filter(skill => requestedSkillSet.has(normalizeSkillName(skill.skill_name || '')));
            searchMethod = 'keyword';
        }

        // Get unique employee IDs that have at least one matching skill
        const empIds = [...new Set((matchingSkills || []).map(s => s.employee_id))];

        if (empIds.length === 0) {
            return res.json({
                success: true,
                matches: [],
                totalCandidatesScanned: 0,
                filtersApplied: [`${reqSkills.length} skill(s) — no matches found`],
            });
        }

        // Fetch those employees (company-scoped)
        let empQuery = db
            .from('employees')
            .select('*')
            .eq('company_id', user.companyId) // HARD TENANT ISOLATION
            .eq('is_archived', false)
            .in('employee_id', empIds);

        // Manager: only match within approved team
        if (user.role === 'manager') {
            const { data: memberships } = await db
                .from('team_memberships')
                .select('employee_id, teams!inner(manager_id)')
                .eq('company_id', user.companyId)
                .eq('status', 'approved')
                .eq('teams.manager_id', user.userId);

            const teamEmpIds = memberships?.map((m: any) => m.employee_id) || [];
            const intersection = empIds.filter(id => teamEmpIds.includes(id));

            if (intersection.length === 0) {
                return res.json({
                    success: true,
                    matches: [],
                    totalCandidatesScanned: 0,
                    filtersApplied: ['No matching employees in your team'],
                });
            }

            empQuery = empQuery.in('employee_id', intersection);
        }

        const { data: employees, error: empError } = await empQuery;

        if (empError || !employees) {
            return res.status(500).json({ success: false, message: empError?.message || 'Query failed' });
        }

        // ============================================================
        // STEP 2: COMPANY ISOLATION ASSERTION
        // ============================================================
        const isolationBreach = employees.some(e => e.company_id !== user.companyId);
        if (isolationBreach) {
            console.error('🚨 CRITICAL: Company isolation breach in matching engine!');
            await logAction({
                actorId: user.userId,
                actorRole: user.role,
                action: 'CRITICAL_isolation_breach',
                companyId: user.companyId,
                metadata: { endpoint: '/api/match', severity: 'CRITICAL' },
            });
            return res.status(500).json({ success: false, message: 'Internal security error.' });
        }

        // ============================================================
        // STEP 3: Calculate confidence scores, decrypt PII, & compute ROI
        // ============================================================

        // Calculate company average cost for ROI estimation — parallel decrypt
        let companyAvgCost: number | null = null;
        {
            const { data: allEmps } = await db
                .from('employees')
                .select('cost_per_day_encrypted')
                .eq('company_id', user.companyId)
                .eq('is_archived', false)
                .not('cost_per_day_encrypted', 'is', null);

            if (allEmps && allEmps.length > 0) {
                // Decrypt all costs in parallel instead of serial await-in-loop
                const costs = await Promise.all(
                    allEmps.map(async e => {
                        try {
                            const val = parseFloat(await decrypt(e.cost_per_day_encrypted, user.companyId, companySecret));
                            return (!isNaN(val) && val > 0) ? val : null;
                        } catch { return null; }
                    })
                );
                const validCosts = costs.filter((c): c is number => c !== null);
                companyAvgCost = validCosts.length > 0 ? validCosts.reduce((a, b) => a + b, 0) / validCosts.length : null;
            }
        }

        // ── BATCH: fetch all skills for all matching employees in ONE query ──
        const allEmployeeIds = employees.map(e => e.employee_id);
        const { data: allSkillsRaw } = await db
            .from('skills')
            .select('employee_id, skill_name, proficiency, last_used_date')
            .in('employee_id', allEmployeeIds)
            .eq('company_id', user.companyId);

        // Group skills by employee_id for O(1) lookup
        const skillsByEmployee = (allSkillsRaw || []).reduce((acc: Record<string, any[]>, s) => {
            if (!acc[s.employee_id]) acc[s.employee_id] = [];
            acc[s.employee_id].push(s);
            return acc;
        }, {});

        // ── BATCH: fetch all availability windows ──
        const { data: allWindowsRaw } = await db
            .from('availability_window')
            .select('employee_id, window_type, start_date, end_date')
            .in('employee_id', allEmployeeIds)
            .eq('company_id', user.companyId);

        const windowsByEmployee = (allWindowsRaw || []).reduce((acc: Record<string, any[]>, w) => {
            if (!acc[w.employee_id]) acc[w.employee_id] = [];
            acc[w.employee_id].push(w);
            return acc;
        }, {});

        // ── PARALLEL: decrypt all costs and names at once ──
        const [decryptedCosts, decryptedNames] = await Promise.all([
            Promise.all(employees.map(async emp => {
                if (!emp.cost_per_day_encrypted) return null;
                try { return parseFloat(await decrypt(emp.cost_per_day_encrypted, user.companyId, companySecret)); }
                catch { return null; }
            })),
            Promise.all(employees.map(async emp => {
                try {
                    const d = await decrypt(emp.name_encrypted, user.companyId, companySecret);
                    return d || `Employee ${hashForDisplay(emp.employee_id)}`;
                } catch { return `Employee ${hashForDisplay(emp.employee_id)}`; }
            })),
        ]);

        const candidateProfiles: any[] = [];

        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            const costValue = decryptedCosts[i];
            const name = decryptedNames[i];

            const empAllSkills = skillsByEmployee[emp.employee_id] || [];
            const empWindows = windowsByEmployee[emp.employee_id] || [];
            
            // Skills that matched the query (for scoring)
            const matchingEmpSkills = (matchingSkills || []).filter(s => s.employee_id === emp.employee_id);

            const empWithCost = { ...emp, cost_per_day_value: costValue, availabilityWindows: empWindows };
            const scores = calculateConfidence(empWithCost, matchingEmpSkills, reqSkills, requirements);

            candidateProfiles.push({
                employee: {
                    employeeId: emp.employee_id,
                    name,
                    department: emp.department,
                    seniorityLevel: emp.seniority_level,
                    location: emp.location,
                    travelEligible: emp.travel_eligible,
                    currentProjectLoad: emp.current_project_load,
                    tenureYears: emp.tenure_years,
                    availabilityWindows: empWindows,
                    skills: empAllSkills,
                    costPerDay: user.role === 'hr' ? costValue : undefined,
                },
                ...scores,
                roiEstimate: (costValue != null && companyAvgCost != null) ? {
                    candidateCostPerDay: costValue,
                    companyAvgCostPerDay: Math.round(companyAvgCost),
                    savingsPerDay: Math.round(companyAvgCost - costValue),
                    savingsPercent: Math.round(((companyAvgCost - costValue) / companyAvgCost) * 100),
                    projected90DaySavings: Math.round((companyAvgCost - costValue) * 90),
                } : null,
                semanticScore: (searchMethod === 'semantic')
                    ? (matchingSkills || []).find((ms: any) => ms.employee_id === emp.employee_id)?.similarity
                    : undefined,
            });
        }

        // Sort by confidence
        candidateProfiles.sort((a, b) => b.confidenceScore - a.confidenceScore);
        const topCandidates = candidateProfiles.slice(0, 10);

        // ============================================================
        // STEP 4: LangChain Retrieval QA for AI explanations
        // ============================================================
        let aiEnhanced = false;
        try {
            const aiResults = await withTimeout(
                runRetrievalQA(brief, reqSkills, topCandidates, user.companyId),
                AI_ENHANCEMENT_TIMEOUT_MS,
                'AI enhancement timed out.'
            );
            for (const aiResult of aiResults) {
                const candidate = topCandidates.find(
                    c => c.employee.employeeId.substring(0, 8) === aiResult.id
                );
                if (candidate) {
                    candidate.aiExplanation = aiResult.explanation;
                    candidate.aiFlags = aiResult.flags || [];
                    candidate.aiAction = aiResult.action;
                }
            }
            if (aiResults.length > 0) {
                aiEnhanced = true;
            }
        } catch (aiErr: any) {
            console.warn('AI enhancement skipped:', aiErr.message);
            // Continue without AI — rule-based scores are still valid
        }

        // Add rank labels
        topCandidates.forEach((c, i) => {
            c.rank = i + 1;
            if (!c.aiExplanation) {
                // Fallback explanation from rule-based scoring
                const matchedSkills = c.employee.skills
                    .filter((s: any) => s.skill_name && reqSkills.some(r => r.name && r.name.toLowerCase() === s.skill_name.toLowerCase()))
                    .map((s: any) => `${s.skill_name} (${s.proficiency})`)
                    .join(', ');
                c.aiExplanation = `Ranked #${i + 1} with ${c.confidenceScore}% confidence. Matching skills: ${matchedSkills || 'none'}. ${c.employee.currentProjectLoad} active projects, ${c.employee.seniorityLevel} level.`;
            }
        });

        // Audit log
        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.MATCH_QUERY_EXECUTED,
            companyId: user.companyId,
            metadata: {
                skillsRequested: reqSkills.length,
                candidatesScanned: employees.length,
                topMatchScore: topCandidates[0]?.confidenceScore || 0,
                aiEnhanced,
            }
        });

        res.json({
            success: true,
            matches: topCandidates,
            totalCandidatesScanned: employees.length,
            aiEnhanced,
            searchMethod,
            companyAvgCostPerDay: companyAvgCost ? Math.round(companyAvgCost) : null,
            filtersApplied: [
                `${reqSkills.length} skill(s) required`,
                searchMethod === 'semantic' ? 'Semantic vector search' : 'Keyword matching',
                requirements.seniorityLevel ? `Seniority: ${requirements.seniorityLevel}` : null,
                requirements.budgetCeiling ? `Budget: ≤₹${requirements.budgetCeiling}/day` : null,
                requirements.travelRequired ? 'Travel required' : null,
                requirements.startDate ? `Project start: ${requirements.startDate}` : null,
                requirements.endDate ? `Project end: ${requirements.endDate}` : null,
            ].filter(Boolean),
        });
    } catch (err: any) {
        console.error('Matching engine error:', err.message);
        res.status(500).json({ success: false, message: 'Matching engine failed.' });
    }
});

export default router;
