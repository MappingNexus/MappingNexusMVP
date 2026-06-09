import React, { useEffect, useMemo, useState } from 'react';
import { FolderKanban, Loader2, Plus, UserRound } from 'lucide-react';
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

 useEffect(() => {
 void loadProjects();
 }, []);

 const activeProjects = useMemo(() => projects.filter((project) => project.status !== 'completed').length, [projects]);
 const requiredPeople = useMemo(() => projects.reduce((sum, project) => sum + (project.requiredEmployees ?? 0), 0), [projects]);
 const assignedPeople = useMemo(() => projects.reduce((sum, project) => sum + (project.assignedEmployees ?? 0), 0), [projects]);

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
 requiredSkills: (project.required_skills?.length ? project.required_skills : [{ skill_name: '', proficiency: 'intermediate', count: 1 }]).map((skill) => ({
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
 .filter((skill) => skill.skill_name.trim())
 .map((skill) => ({
 skill_name: skill.skill_name.trim(),
 proficiency: skill.proficiency,
 count: Number(skill.count || 1),
 })),
 };

 const response = editingId ? await api.updateProject(editingId, payload) : await api.createProject(payload);
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

 if (loading) return <LoadingSpinner message="Loading projects..." />;

 return (
 <div className="cb-page">
 <div className="cb-page-header">
 <div>
 <h1 className="cb-h1">Projects</h1>
 <p className="cb-subtitle mt-3">
 <span className="font-mono">{projects.length}</span> total | <span className="font-mono">{activeProjects}</span> active or planned | <span className="font-mono">{assignedPeople}/{requiredPeople}</span> people assigned
 </p>
 </div>
 <button onClick={() => startEditing()} className="cb-btn-primary">
 <Plus className="w-4 h-4" />
 New project
 </button>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
 <div className="cb-card p-8">
 <div className="mb-6">
 <p className="cb-caption mb-2">{editingId ? 'Edit project' : 'Create project'}</p>
 <h2 className="cb-h2">Details</h2>
 </div>

 <form onSubmit={submit} className="space-y-6">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-2">Project name</label>
 <input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} className="cb-input" placeholder="Project Alpha" />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-2">Status</label>
 <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="cb-input">
 <option value="planned">Planned</option>
 <option value="active">Active</option>
 <option value="completed">Completed</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-2">Start date</label>
 <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="cb-input" />
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-2">End date</label>
 <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="cb-input" />
 </div>
 </div>

 <div className="space-y-3">
 <div className="flex items-center justify-between gap-4">
 <div>
 <label className="block text-sm font-semibold text-foreground">Required skills</label>
 <p className="cb-body text-sm mt-1">Define minimum skills needed for this project.</p>
 </div>
 <button type="button" onClick={addSkillRow} className="cb-btn-secondary h-11 px-4">
 Add skill
 </button>
 </div>
 {form.requiredSkills.map((skill, index) => (
 <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <input value={skill.skill_name} onChange={(e) => updateSkill(index, 'skill_name', e.target.value)} placeholder="Skill name" className="cb-input" />
 <select value={skill.proficiency} onChange={(e) => updateSkill(index, 'proficiency', e.target.value)} className="cb-input">
 <option value="beginner">Beginner</option>
 <option value="intermediate">Intermediate</option>
 <option value="expert">Expert</option>
 </select>
 <input type="number" min="1" value={skill.count} onChange={(e) => updateSkill(index, 'count', e.target.value)} placeholder="Count" className="cb-input" />
 </div>
 ))}
 </div>

 {error && <div className="border border-destructive/30 bg-destructive/10 rounded-2xl p-4 text-sm text-destructive">{error}</div>}
 {success && <div className="border border-success/30 bg-success/10 rounded-2xl p-4 text-sm text-success">{success}</div>}

 <button type="submit" disabled={saving} className="cb-btn-primary w-full">
 {saving ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" /> Saving...
 </>
 ) : editingId ? (
 'Update project'
 ) : (
 'Create project'
 )}
 </button>
 </form>
 </div>

 <div className="space-y-4">
 <div className="cb-card p-8">
 <div className="mb-6">
 <p className="cb-caption mb-2">Library</p>
 <h2 className="cb-h2">All projects</h2>
 </div>

 {projects.length === 0 ? (
 <div className="border border-dashed border-border rounded-2xl p-10 text-center">
 <FolderKanban className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
 <p className="cb-body">No projects created yet.</p>
 </div>
 ) : (
 <div className="space-y-3">
 {projects.map((project) => (
 <button
 key={project.project_id}
 onClick={() => startEditing(project)}
 className="w-full text-left border border-border rounded-lg p-5 hover:bg-muted transition-colors"
 >
 <div className="flex items-start justify-between gap-4">
 <div>
 <h3 className="text-foreground font-semibold">{project.project_name}</h3>
 <p className="cb-body text-sm mt-1 flex items-center gap-2">
 <UserRound className="w-4 h-4" />
 {project.manager || 'Unassigned'}
 </p>
 </div>
 <span className={`cb-pill ${project.progressStatus === 'At Risk' ? 'border-destructive/30 text-destructive bg-destructive/10' : ''}`}>
 {project.progressStatus || project.status}
 </span>
 </div>

 <div className="mt-4 grid grid-cols-2 gap-3 text-sm cb-body">
 <div>
 <span className="block text-xs uppercase tracking-widest text-muted-foreground">Required</span>
 <span className="font-mono text-foreground">{project.requiredEmployees ?? 0}</span>
 </div>
 <div>
 <span className="block text-xs uppercase tracking-widest text-muted-foreground">Assigned</span>
 <span className="font-mono text-foreground">{project.assignedEmployees ?? 0}</span>
 </div>
 </div>

 <div className="mt-4">
 <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-2">
 <span>Completion</span>
 <span>{project.completionPercentage ?? 0}%</span>
 </div>
 <div className="h-2 bg-muted rounded-full overflow-hidden">
 <div
 className={`h-full ${project.progressStatus === 'At Risk' ? 'bg-destructive' : 'bg-primary'}`}
 style={{ width: `${Math.min(100, Math.max(0, project.completionPercentage ?? 0))}%` }}
 />
 </div>
 </div>

 <div className="mt-4 text-sm cb-body">
 {project.start_date ? `Start ${new Date(project.start_date).toLocaleDateString()}` : 'Start TBD'} |{' '}
 {project.end_date ? `End ${new Date(project.end_date).toLocaleDateString()}` : 'No end date'} |{' '}
 <span className="font-mono">{project.required_skills?.length || 0}</span> skill requirements
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
};

export default HRProjects;
