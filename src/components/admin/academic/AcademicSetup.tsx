import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GraduationCap, Plus, Pencil, Trash2, Loader2, Building2, BookOpen, Users, Calendar, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PROGRAM_TYPES = ['UG', 'PG', 'Diploma', 'Certificate', 'PhD', 'School', 'Other'];
const SUBJECT_TYPES = ['theory', 'practical', 'elective', 'lab', 'project'];

export function AcademicSetup() {
  const { institutionId } = useAuth();
  const location = useLocation();
  const defaultTab = location.pathname === '/admin/departments' ? 'departments' : 'years';
  const { toast } = useToast();

  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Dialog states
  const [deptDialog, setDeptDialog] = useState(false);
  const [programDialog, setProgramDialog] = useState(false);
  const [batchDialog, setBatchDialog] = useState(false);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [yearDialog, setYearDialog] = useState(false);

  // Forms
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', hod_id: '' });
  const [programForm, setProgramForm] = useState({ name: '', code: '', type: 'UG', department_id: '', duration_years: '4' });
  const [batchForm, setBatchForm] = useState({
    name: '', program_id: '', year_level: '1', section: '',
    semester: '', max_students: '60', room_no: '',
    academic_year_id: '', class_teacher_id: '',
  });
  const [subjectForm, setSubjectForm] = useState({
    name: '', code: '', type: 'theory', program_id: '',
    department_id: '', credits: '4', max_marks: '100', pass_marks: '35',
  });
  const [yearForm, setYearForm] = useState({ name: '', start_date: '', end_date: '', is_current: false });

  useEffect(() => {
    if (institutionId) fetchAll();
  }, [institutionId]);

  const fetchAll = async () => {
    setLoading(true);
    const [dRes, pRes, bRes, sRes, yRes, stRes] = await Promise.all([
      (supabase as any).from('departments').select('*').eq('institution_id', institutionId!).order('name'),
      (supabase as any).from('programs').select('*').eq('institution_id', institutionId!).order('name'),
      (supabase as any).from('batches').select('*').eq('institution_id', institutionId!).order('name'),
      (supabase as any).from('subjects').select('*').eq('institution_id', institutionId!).order('name'),
      (supabase as any).from('academic_years').select('*').eq('institution_id', institutionId!).order('start_date', { ascending: false }),
      (supabase as any).from('staff').select('id, user_id, full_name, designation').eq('institution_id', institutionId!).eq('status', 'active').order('full_name'),
    ]);
    setDepartments(dRes.data || []);
    setPrograms(pRes.data || []);
    setBatches(bRes.data || []);
    setSubjects(sRes.data || []);
    setAcademicYears(yRes.data || []);
    setStaff(stRes.data || []);
    setLoading(false);
  };

  // ── Helpers ──────────────────────────────────────────────
  const deptMap: Record<string, string> = {};
  departments.forEach(d => { deptMap[d.id] = d.name; });
  const programMap: Record<string, string> = {};
  programs.forEach(p => { programMap[p.id] = p.name; });
  const staffMap: Record<string, string> = {};
  staff.forEach(s => { staffMap[s.id] = s.full_name; });
  const yearMap: Record<string, string> = {};
  academicYears.forEach(y => { yearMap[y.id] = y.name; });

  const toggle = (val: boolean, id: string, table: string) => async () => {
    await (supabase as any).from(table).update({ is_active: !val }).eq('id', id);
    fetchAll();
    toast({ title: !val ? 'Activated' : 'Deactivated' });
  };

  const del = (id: string, table: string, name: string) => async () => {
    if (!confirm(`Delete "${name}"?`)) return;
    await (supabase as any).from(table).delete().eq('id', id);
    fetchAll();
    toast({ title: 'Deleted' });
  };

  // ── DEPARTMENTS ───────────────────────────────────────────
  const openDept = (d?: any) => {
    setEditId(d?.id || null);
    setDeptForm({ name: d?.name || '', code: d?.code || '', description: d?.description || '', hod_id: d?.hod_id || '' });
    setDeptDialog(true);
  };

  const saveDept = async () => {
    if (!deptForm.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
    const payload = {
      institution_id: institutionId,
      name: deptForm.name.trim(),
      code: deptForm.code || null,
      description: deptForm.description || null,
      hod_id: deptForm.hod_id ? 
        (staff.find((s:any) => s.id === deptForm.hod_id)?.user_id || null) : null,
      is_active: true,
    };
    if (editId) await (supabase as any).from('departments').update(payload).eq('id', editId);
    else await (supabase as any).from('departments').insert(payload);
    toast({ title: editId ? 'Department updated!' : 'Department added!' });
    setDeptDialog(false);
    fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Save failed', variant: 'destructive' });
    }
    setSaving(false);
  };

  // ── PROGRAMS ──────────────────────────────────────────────
  const openProgram = (p?: any) => {
    setEditId(p?.id || null);
    setProgramForm({ name: p?.name || '', code: p?.code || '', type: p?.type || 'UG', department_id: p?.department_id || '', duration_years: p?.duration_years?.toString() || '4' });
    setProgramDialog(true);
  };

  const saveProgram = async () => {
    if (!programForm.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
    const payload = {
      institution_id: institutionId,
      name: programForm.name.trim(),
      code: programForm.code || null,
      type: programForm.type,
      department_id: programForm.department_id || null,
      duration_years: programForm.duration_years ? parseInt(programForm.duration_years) : null,
      is_active: true,
    };
    if (editId) await (supabase as any).from('programs').update(payload).eq('id', editId);
    else await (supabase as any).from('programs').insert(payload);
    toast({ title: editId ? 'Program updated!' : 'Program added!' });
    setProgramDialog(false);
    fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Save failed', variant: 'destructive' });
    }
    setSaving(false);
  };

  // ── BATCHES ───────────────────────────────────────────────
  const openBatch = (b?: any) => {
    setEditId(b?.id || null);
    setBatchForm({
      name: b?.name || '', program_id: b?.program_id || '',
      year_level: b?.year_level?.toString() || '1', section: b?.section || '',
      semester: b?.semester?.toString() || '', max_students: b?.max_students?.toString() || '60',
      room_no: b?.room_no || '', academic_year_id: b?.academic_year_id || '',
      class_teacher_id: b?.class_teacher_id || '',
    });
    setBatchDialog(true);
  };

  const saveBatch = async () => {
    if (!batchForm.name.trim() || !batchForm.program_id) {
      toast({ title: 'Name and Program required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
    const payload = {
      institution_id: institutionId,
      name: batchForm.name.trim(),
      program_id: batchForm.program_id,
      year_level: batchForm.year_level ? parseInt(batchForm.year_level) : null,
      section: batchForm.section || null,
      semester: batchForm.semester ? parseInt(batchForm.semester) : null,
      max_students: batchForm.max_students ? parseInt(batchForm.max_students) : null,
      room_no: batchForm.room_no || null,
      academic_year_id: batchForm.academic_year_id || null,
      class_teacher_id: batchForm.class_teacher_id ?
        (staff.find((s:any) => s.id === batchForm.class_teacher_id)?.user_id || null) : null,
      is_active: true,
    };
    if (editId) await (supabase as any).from('batches').update(payload).eq('id', editId);
    else await (supabase as any).from('batches').insert(payload);
    toast({ title: editId ? 'Batch updated!' : 'Batch added!' });
    setBatchDialog(false);
    fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Save failed', variant: 'destructive' });
    }
    setSaving(false);
  };

  // ── SUBJECTS ──────────────────────────────────────────────
  const openSubject = (s?: any) => {
    setEditId(s?.id || null);
    setSubjectForm({
      name: s?.name || '', code: s?.code || '', type: s?.type || 'theory',
      program_id: s?.program_id || '', department_id: s?.department_id || '',
      credits: s?.credits?.toString() || '4',
      max_marks: s?.max_marks?.toString() || '100', pass_marks: s?.pass_marks?.toString() || '35',
    });
    setSubjectDialog(true);
  };

  const saveSubject = async () => {
    if (!subjectForm.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
    const payload = {
      institution_id: institutionId,
      name: subjectForm.name.trim(),
      code: subjectForm.code || null,
      type: subjectForm.type,
      program_id: subjectForm.program_id || null,
      department_id: subjectForm.department_id || null,
      credits: subjectForm.credits ? parseInt(subjectForm.credits) : null,
      max_marks: subjectForm.max_marks ? parseInt(subjectForm.max_marks) : null,
      pass_marks: subjectForm.pass_marks ? parseInt(subjectForm.pass_marks) : null,
      is_active: true,
    };
    if (editId) await (supabase as any).from('subjects').update(payload).eq('id', editId);
    else await (supabase as any).from('subjects').insert(payload);
    toast({ title: editId ? 'Subject updated!' : 'Subject added!' });
    setSubjectDialog(false);
    fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Save failed', variant: 'destructive' });
    }
    setSaving(false);
  };

  // ── ACADEMIC YEARS ────────────────────────────────────────
  const openYear = (y?: any) => {
    setEditId(y?.id || null);
    setYearForm({ name: y?.name || '', start_date: y?.start_date || '', end_date: y?.end_date || '', is_current: y?.is_current || false });
    setYearDialog(true);
  };

  const saveYear = async () => {
    if (!yearForm.name.trim() || !yearForm.start_date || !yearForm.end_date) {
      toast({ title: 'All fields required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      if (yearForm.is_current) {
        await (supabase as any).from('academic_years').update({ is_current: false }).eq('institution_id', institutionId!);
      }
      const payload = {
        institution_id: institutionId,
        name: yearForm.name.trim(),
        start_date: yearForm.start_date,
        end_date: yearForm.end_date,
        is_current: yearForm.is_current,
      };
      if (editId) await (supabase as any).from('academic_years').update(payload).eq('id', editId);
      else await (supabase as any).from('academic_years').insert(payload);
      toast({ title: editId ? 'Year updated!' : 'Year added!' });
      setYearDialog(false);
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── UI HELPERS ────────────────────────────────────────────
  const ActionRow = ({ item, table, onEdit }: { item: any; table: string; onEdit: () => void }) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={del(item.id, table, item.name)}><Trash2 className="w-3.5 h-3.5" /></Button>
    </div>
  );

  const ActiveBadge = ({ val, id, table }: { val: boolean; id: string; table: string }) => (
    <button onClick={toggle(val, id, table)}>
      <Badge className={`text-xs border-0 cursor-pointer ${val ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
        {val ? 'Active' : 'Inactive'}
      </Badge>
    </button>
  );

  const EmptyState = ({ icon: Icon, label, onAdd }: { icon: any; label: string; onAdd: () => void }) => (
    <div className="py-16 text-center">
      <Icon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="font-medium text-foreground">No {label} yet</p>
      <Button className="mt-4" size="sm" onClick={onAdd}><Plus className="w-4 h-4 mr-1" /> Add {label}</Button>
    </div>
  );

  // Wait for institutionId
  if (!institutionId) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-32 bg-muted rounded"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    );
  }

  return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Academic Setup</h2>
        <p className="text-sm text-muted-foreground">Configure departments, programs, batches and subjects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Academic Years', value: academicYears.length, icon: Calendar, color: 'text-primary' },
          { label: 'Departments', value: departments.length, icon: Building2, color: 'text-blue-600' },
          { label: 'Programs', value: programs.length, icon: GraduationCap, color: 'text-purple-600' },
          { label: 'Batches', value: batches.length, icon: Users, color: 'text-emerald-600' },
          { label: 'Subjects', value: subjects.length, icon: BookOpen, color: 'text-amber-600' },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-3 flex items-center gap-2">
              <s.icon className={`w-5 h-5 ${s.color} flex-shrink-0`} />
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="years">Academic Years ({academicYears.length})</TabsTrigger>
          <TabsTrigger value="departments">Departments ({departments.length})</TabsTrigger>
          <TabsTrigger value="programs">Programs ({programs.length})</TabsTrigger>
          <TabsTrigger value="batches">Batches ({batches.length})</TabsTrigger>
          <TabsTrigger value="subjects">Subjects ({subjects.length})</TabsTrigger>
        </TabsList>

        {/* ── ACADEMIC YEARS ── */}
        <TabsContent value="years" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openYear()}><Plus className="w-4 h-4 mr-1" /> Add Year</Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              {loading ? <div className="p-4 space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              : academicYears.length === 0 ? <EmptyState icon={Calendar} label="Academic Year" onAdd={() => openYear()} />
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicYears.map(y => (
                      <TableRow key={y.id}>
                        <TableCell className="font-medium text-sm">
                          <span className="flex items-center gap-2">
                            {y.name}
                            {y.is_current && <Badge className="bg-primary text-primary-foreground text-xs border-0">Current</Badge>}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(y.start_date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="text-sm">{new Date(y.end_date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>
                          {y.is_current
                            ? <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge>
                            : <Badge className="bg-muted text-muted-foreground border-0 text-xs">Past</Badge>}
                        </TableCell>
                        <TableCell><ActionRow item={y} table="academic_years" onEdit={() => openYear(y)} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DEPARTMENTS ── */}
        <TabsContent value="departments" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openDept()}><Plus className="w-4 h-4 mr-1" /> Add Department</Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              {loading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              : departments.length === 0 ? <EmptyState icon={Building2} label="Department" onAdd={() => openDept()} />
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>HOD</TableHead>
                      <TableHead>Programs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map(d => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{d.name}</p>
                          {d.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{d.description}</p>}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs font-mono">{d.code || '—'}</Badge></TableCell>
                        <TableCell className="text-sm">{d.hod_id ? staffMap[d.hod_id] || '—' : '—'}</TableCell>
                        <TableCell className="text-sm">{programs.filter(p => p.department_id === d.id).length}</TableCell>
                        <TableCell><ActiveBadge val={d.is_active} id={d.id} table="departments" /></TableCell>
                        <TableCell><ActionRow item={d} table="departments" onEdit={() => openDept(d)} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PROGRAMS ── */}
        <TabsContent value="programs" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openProgram()}><Plus className="w-4 h-4 mr-1" /> Add Program</Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              {loading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              : programs.length === 0 ? <EmptyState icon={GraduationCap} label="Program" onAdd={() => openProgram()} />
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Batches</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs font-mono">{p.code || '—'}</Badge></TableCell>
                        <TableCell><Badge className="text-xs bg-purple-100 text-purple-700 border-0">{p.type || '—'}</Badge></TableCell>
                        <TableCell className="text-sm">{p.department_id ? deptMap[p.department_id] || '—' : '—'}</TableCell>
                        <TableCell className="text-sm">{p.duration_years ? `${p.duration_years} yr` : '—'}</TableCell>
                        <TableCell className="text-sm">{batches.filter(b => b.program_id === p.id).length}</TableCell>
                        <TableCell><ActiveBadge val={p.is_active} id={p.id} table="programs" /></TableCell>
                        <TableCell><ActionRow item={p} table="programs" onEdit={() => openProgram(p)} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BATCHES ── */}
        <TabsContent value="batches" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openBatch()}><Plus className="w-4 h-4 mr-1" /> Add Batch</Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              {loading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              : batches.length === 0 ? <EmptyState icon={Users} label="Batch" onAdd={() => openBatch()} />
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Year/Sem</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Max Students</TableHead>
                      <TableHead>Class Teacher</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-sm">{b.name}</TableCell>
                        <TableCell className="text-sm">{b.program_id ? programMap[b.program_id] || '—' : '—'}</TableCell>
                        <TableCell className="text-sm">
                          {b.year_level ? `Year ${b.year_level}` : ''}
                          {b.semester ? ` · Sem ${b.semester}` : ''}
                          {!b.year_level && !b.semester ? '—' : ''}
                        </TableCell>
                        <TableCell className="text-sm">{b.section || '—'}</TableCell>
                        <TableCell className="text-sm">{b.room_no || '—'}</TableCell>
                        <TableCell className="text-sm">{b.max_students || '—'}</TableCell>
                        <TableCell className="text-sm">{b.class_teacher_id ? staffMap[b.class_teacher_id] || '—' : '—'}</TableCell>
                        <TableCell><ActiveBadge val={b.is_active} id={b.id} table="batches" /></TableCell>
                        <TableCell><ActionRow item={b} table="batches" onEdit={() => openBatch(b)} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SUBJECTS ── */}
        <TabsContent value="subjects" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openSubject()}><Plus className="w-4 h-4 mr-1" /> Add Subject</Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              {loading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              : subjects.length === 0 ? <EmptyState icon={BookOpen} label="Subject" onAdd={() => openSubject()} />
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Max/Pass</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-sm">{s.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs font-mono">{s.code || '—'}</Badge></TableCell>
                        <TableCell><Badge className="text-xs bg-amber-100 text-amber-700 border-0 capitalize">{s.type || '—'}</Badge></TableCell>
                        <TableCell className="text-sm">{s.program_id ? programMap[s.program_id] || '—' : '—'}</TableCell>
                        <TableCell className="text-sm">{s.department_id ? deptMap[s.department_id] || '—' : '—'}</TableCell>
                        <TableCell className="text-sm">{s.credits || '—'}</TableCell>
                        <TableCell className="text-sm">{s.max_marks || '—'} / {s.pass_marks || '—'}</TableCell>
                        <TableCell><ActiveBadge val={s.is_active} id={s.id} table="subjects" /></TableCell>
                        <TableCell><ActionRow item={s} table="subjects" onEdit={() => openSubject(s)} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── ACADEMIC YEAR DIALOG ── */}
      <Dialog open={yearDialog} onOpenChange={setYearDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Academic Year</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={yearForm.name} onChange={e => setYearForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 2024-2025" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start Date *</Label><Input type="date" value={yearForm.start_date} onChange={e => setYearForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>End Date *</Label><Input type="date" value={yearForm.end_date} onChange={e => setYearForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="current" checked={yearForm.is_current} onChange={e => setYearForm(f => ({ ...f, is_current: e.target.checked }))} className="rounded" />
              <Label htmlFor="current" className="cursor-pointer text-primary font-medium">Set as Current Academic Year</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setYearDialog(false)}>Cancel</Button>
            <Button onClick={saveYear} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editId ? 'Save' : 'Add Year'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DEPARTMENT DIALOG ── */}
      <Dialog open={deptDialog} onOpenChange={setDeptDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Department</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label>Name *</Label><Input value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer Science" /></div>
              <div className="space-y-1.5"><Label>Code</Label><Input value={deptForm.code} onChange={e => setDeptForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. CS" /></div>
              <div className="space-y-1.5">
                <Label>Head of Department</Label>
                <Select value={deptForm.hod_id} onValueChange={v => setDeptForm(f => ({ ...f, hod_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select HOD" /></SelectTrigger>
                  <SelectContent><SelectItem value="">None</SelectItem>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={deptForm.description} onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={2} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialog(false)}>Cancel</Button>
            <Button onClick={saveDept} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PROGRAM DIALOG ── */}
      <Dialog open={programDialog} onOpenChange={setProgramDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Program</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label>Program Name *</Label><Input value={programForm.name} onChange={e => setProgramForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Bachelor of Computer Science" /></div>
              <div className="space-y-1.5"><Label>Code</Label><Input value={programForm.code} onChange={e => setProgramForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. BCS" /></div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={programForm.type} onValueChange={v => setProgramForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROGRAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={programForm.department_id} onValueChange={v => setProgramForm(f => ({ ...f, department_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                  <SelectContent><SelectItem value="">None</SelectItem>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Duration (Years)</Label><Input type="number" min="1" max="10" value={programForm.duration_years} onChange={e => setProgramForm(f => ({ ...f, duration_years: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramDialog(false)}>Cancel</Button>
            <Button onClick={saveProgram} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── BATCH DIALOG ── */}
      <Dialog open={batchDialog} onOpenChange={setBatchDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Batch</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Batch Name *</Label><Input value={batchForm.name} onChange={e => setBatchForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. BCS 2024 - A" /></div>
            <div className="col-span-2 space-y-1.5">
              <Label>Program *</Label>
              <Select value={batchForm.program_id} onValueChange={v => setBatchForm(f => ({ ...f, program_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Year Level</Label><Input type="number" min="1" value={batchForm.year_level} onChange={e => setBatchForm(f => ({ ...f, year_level: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Semester</Label><Input type="number" min="1" value={batchForm.semester} onChange={e => setBatchForm(f => ({ ...f, semester: e.target.value }))} placeholder="Optional" /></div>
            <div className="space-y-1.5"><Label>Section</Label><Input value={batchForm.section} onChange={e => setBatchForm(f => ({ ...f, section: e.target.value }))} placeholder="A / B / C" /></div>
            <div className="space-y-1.5"><Label>Room No.</Label><Input value={batchForm.room_no} onChange={e => setBatchForm(f => ({ ...f, room_no: e.target.value }))} placeholder="e.g. 201" /></div>
            <div className="space-y-1.5"><Label>Max Students</Label><Input type="number" value={batchForm.max_students} onChange={e => setBatchForm(f => ({ ...f, max_students: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Academic Year</Label>
              <Select value={batchForm.academic_year_id} onValueChange={v => setBatchForm(f => ({ ...f, academic_year_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent><SelectItem value="">None</SelectItem>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}{y.is_current ? ' (Current)' : ''}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Class Teacher</Label>
              <Select value={batchForm.class_teacher_id} onValueChange={v => setBatchForm(f => ({ ...f, class_teacher_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent><SelectItem value="">None</SelectItem>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialog(false)}>Cancel</Button>
            <Button onClick={saveBatch} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SUBJECT DIALOG ── */}
      <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Subject</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Subject Name *</Label><Input value={subjectForm.name} onChange={e => setSubjectForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mathematics" /></div>
            <div className="space-y-1.5"><Label>Code</Label><Input value={subjectForm.code} onChange={e => setSubjectForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. MATH101" /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={subjectForm.type} onValueChange={v => setSubjectForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Program</Label>
              <Select value={subjectForm.program_id} onValueChange={v => setSubjectForm(f => ({ ...f, program_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent><SelectItem value="">None</SelectItem>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={subjectForm.department_id} onValueChange={v => setSubjectForm(f => ({ ...f, department_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                <SelectContent><SelectItem value="">None</SelectItem>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Credits</Label><Input type="number" value={subjectForm.credits} onChange={e => setSubjectForm(f => ({ ...f, credits: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Max Marks</Label><Input type="number" value={subjectForm.max_marks} onChange={e => setSubjectForm(f => ({ ...f, max_marks: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Pass Marks</Label><Input type="number" value={subjectForm.pass_marks} onChange={e => setSubjectForm(f => ({ ...f, pass_marks: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectDialog(false)}>Cancel</Button>
            <Button onClick={saveSubject} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}