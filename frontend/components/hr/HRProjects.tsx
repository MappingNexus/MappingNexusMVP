import React, { useEffect, useMemo, useState } from 'react';
import { FolderKanban, Loader2, Plus } from 'lucide-react';
import * as api from '../../services/api';
import type { Project } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

type SkillInput = { skill_name: string; proficiency: string; count: string };

const emptyForm = {
    projectName: '',
    startDate: '',
    endDate: '',
    status: 'planned' as 'planned' | 'active' | 'completed',
    requiredSkills: [{ skill_name: '', proficiency: 'intermediate', count: '1' }] as SkillInput[],
};

const HRProjects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadProjects = async () => {
        setLoading(true);
        const res = await api.getProjects();
        if (res.success) setProjects(res.projects || []);
        setLoading(false);
    };

    useEffect(() => { loadProjects(); }, []);

    const activeProjects = useMemo(
        () => projects.filter(project => project.status !== 'completed').length,
        [projects]
    );

    const updateSkill = (index: number, field: keyof SkillInput, value: string) => {
        const nextSkills = [...form.requiredSkills];
        nextSkills[index] = { ...nextSkills[index], [field]: value };
        setForm({ ...form, requiredSkills: nextSkills });
    };

    const addSkillRow = () => {
        setForm({
            ...form,
            requiredSkills: [...form.requiredSkills, { skill_name: '', proficiency: 'intermediate', count: '1' }],
        });
    };

    const startEditing = (project?: Project) => {
        setError('');
        setSuccess('');
        if (!project) {
            setEditingId(null);
            setForm(emptyForm);
            return;
        }

        setEditingId(project.project_id);
        setForm({
            projectName: project.project_name,
            startDate: project.start_date || '',
            endDate: project.end_date || '',
            status: project.status,
            requiredSkills: (project.required_skills?.length ? project.required_skills : [{ skill_name: '', proficiency: 'intermediate', count: 1 }]).map(skill => ({
                skill_name: skill.skill_name,
                proficiency: skill.proficiency,
                count: String(skill.count),
            })),
        });
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        const payload = {
            projectName: form.projectName,
            startDate: form.startDate || undefined,
            endDate: form.endDate || undefined,
            status: form.status,
            requiredSkills: form.requiredSkills
                .filter(skill => skill.skill_name.trim())
                .map(skill => ({
                    skill_name: skill.skill_name.trim(),
                    proficiency: skill.proficiency,
                    count: Number(skill.count || 1),
                })),
        };

        const response = editingId
            ? await api.updateProject(editingId, payload)
            : await api.createProject(payload);

        setSaving(false);

        if (!response.success) {
            setError(response.message || 'Failed to save project.');
            return;
        }

        setSuccess(editingId ? 'Project updated.' : 'Project created.');
        setEditingId(null);
        setForm(emptyForm);
        await loadProjects();
    };

    const statusBadge = (s: string) => {
        if (s === 'active') return 'border-nexus-green/30 text-nexus-green bg-nexus-green/10';
        if (s === 'completed') return 'border-nexus-purple/30 text-nexus-purple bg-nexus-purple/10';
        return 'border-border text-muted-foreground';
    };

    if (loading) return <LoadingSpinner message="Loading projects..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Projects</h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">{projects.length} total • {activeProjects} active or planned</p>
                </div>
                <button onClick={() => startEditing()} className="bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs px-6 py-2.5 hover:opacity-90 transition-opacity flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Project
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-6">
                <div className="bg-card border border-border p-6">
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight mb-4">{editingId ? 'Edit Project' : 'Create Project'}</h2>
                    <form onSubmit={submit} className="space-y-4">
                        <input value={form.projectName} onChange={e => setForm({ ...form, projectName: e.target.value })} placeholder="Project name" className="w-full bg-transparent border border-border px-4 py-3 text-foreground outline-none focus:border-ring transition-colors placeholder:text-muted-foreground" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="bg-transparent border border-border px-4 py-3 text-foreground outline-none focus:border-ring transition-colors" />
                            <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="bg-transparent border border-border px-4 py-3 text-foreground outline-none focus:border-ring transition-colors" />
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Project['status'] })} className="bg-transparent border border-border px-4 py-3 text-foreground outline-none focus:border-ring transition-colors">
                                <option value="planned">Planned</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Required Skills</p>
                                <button type="button" onClick={addSkillRow} className="text-xs text-nexus-green hover:text-foreground font-mono">+ add skill</button>
                            </div>
                            {form.requiredSkills.map((skill, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input value={skill.skill_name} onChange={e => updateSkill(index, 'skill_name', e.target.value)} placeholder="Skill name" className="bg-transparent border border-border px-4 py-3 text-foreground outline-none focus:border-ring transition-colors placeholder:text-muted-foreground" />
                                    <select value={skill.proficiency} onChange={e => updateSkill(index, 'proficiency', e.target.value)} className="bg-transparent border border-border px-4 py-3 text-foreground outline-none focus:border-ring transition-colors">
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                    <input type="number" min="1" value={skill.count} onChange={e => updateSkill(index, 'count', e.target.value)} placeholder="Count" className="bg-transparent border border-border px-4 py-3 text-foreground outline-none focus:border-ring transition-colors placeholder:text-muted-foreground" />
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 p-4 bg-destructive/5 border-l-2 border-destructive text-destructive font-mono text-xs">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="flex items-start gap-3 p-4 bg-success/5 border-l-2 border-success text-success font-mono text-xs">
                                {success}
                            </div>
                        )}

                        <button type="submit" disabled={saving} className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs py-3 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editingId ? 'Update Project' : 'Create Project'}
                        </button>
                    </form>
                </div>

                <div className="space-y-4">
                    {projects.length === 0 ? (
                        <div className="border border-dashed border-border p-10 text-center">
                            <FolderKanban className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">➔ No projects created yet.</p>
                        </div>
                    ) : projects.map(project => (
                        <button key={project.project_id} onClick={() => startEditing(project)} className="w-full text-left bg-card border border-border p-5 hover:border-ring transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-foreground font-bold uppercase">{project.project_name}</h3>
                                    <p className="text-[10px] text-muted-foreground font-mono mt-1">{project.required_skills?.length || 0} skill requirements</p>
                                </div>
                                <span className={`border text-[10px] font-mono uppercase tracking-widest px-3 py-1 ${statusBadge(project.status)}`}>{project.status}</span>
                            </div>
                            <div className="mt-3 text-xs text-muted-foreground font-mono">
                                {project.start_date ? `Start ${new Date(project.start_date).toLocaleDateString()}` : 'Start TBD'}
                                {' • '}
                                {project.end_date ? `End ${new Date(project.end_date).toLocaleDateString()}` : 'No end date'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HRProjects;
