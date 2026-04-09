import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LogOut, UserCheck, Calendar, ClipboardCheck, BookOpen,
  FileText, Plus, Pencil, Trash2, Loader2, Check, X,
  Bell, Clock, Users, Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function FacultyPortal() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [staff, setStaff] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Today's attendance
  const [todayBatches, setTodayBatches] = useState<any[]>([]);

  // Dialogs
  const [assignDialog, setAssignDialog] = useState(false);
  const [materialDialog, setMaterialDialog] = useState(false);
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [editAssignId, setEditAssignId] = useState<string | null>(null);

  const [assignForm, setAssignForm] = useState({ title: '', description: '', subject_id: '', batch_id: '', due_date: '', max_marks: '10', is_published: true });
  const [materialForm, setMaterialForm] = useState({ title: '', description: '', subject_id: '', batch_id: '', file_url: '', file_type: 'document', is_published: true });
  const [leaveForm, setLeaveForm] = useState({ leave_type_id: '', from_date: '', to_date: '', reason: '' });

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Get staff record
      let staffRecord: any = null;
      if (profile?.email) {
        const { data } = await (supabase as any).from('staff').select('*').eq('email', profile.email).single();
        staffRecord = data;
      }
      if (!staffRecord && user?.email) {
        const { data } = await (supabase as any).from('staff')
          .select('*').or(`email.eq.${user.email},official_email.eq.${user.email},personal_email.eq.${user.email}`).single();
        staffRecord = data;
      }
      setStaff(staffRecord);

      const instId = staffRecord?.institution_id || user?.user_metadata?.institution_id;
      const staffId = staffRecord?.id;
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();

      const [ttRes, assignRes, matRes, leaveRes, ltRes, subRes, batchRes, annRes] = await Promise.all([
        staffId ? (supabase as any).from('timetable').select('*, subjects(name, code), batches(name)').eq('faculty_id', staffId).eq('is_active', true).order('day_of_week').order('period_no') : Promise.resolve({ data: [] }),
        staffId ? (supabase as any).from('assignments').select('*, subjects(name), batches(name)').eq('faculty_id', staffId).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
        staffId ? (supabase as any).from('study_materials').select('*, subjects(name), batches(name)').eq('faculty_id', staffId).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
        staffId ? (supabase as any).from('leave_requests').select('*, leave_types(name)').eq('staff_id', staffId).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
        instId ? (supabase as any).from('leave_types').select('*').eq('institution_id', instId) : Promise.resolve({ data: [] }),
        instId ? (supabase as any).from('subjects').select('id, name, code').eq('institution_id', instId).eq('is_active', true) : Promise.resolve({ data: [] }),
        instId ? (supabase as any).from('batches').select('id, name').eq('institution_id', instId).eq('is_active', true) : Promise.resolve({ data: [] }),
        instId ? (supabase as any).from('announcements').select('title, body, priority, created_at').eq('institution_id', instId).eq('is_published', true).order('created_at', { ascending: false }).limit(8) : Promise.resolve({ data: [] }),
      ]);

      setTimetable(ttRes.data || []);
      setAssignments(assignRes.data || []);
      setMaterials(matRes.data || []);
      setLeaveRequests(leaveRes.data || []);
      setLeaveTypes(ltRes.data || []);
      setSubjects(subRes.data || []);
      setBatches(batchRes.data || []);
      setAnnouncements(annRes.data || []);

      // Today's classes
      const todayClasses = (ttRes.data || []).filter((t: any) => t.day_of_week === dayOfWeek);
      setTodayBatches(todayClasses);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  // ── ASSIGNMENTS ──
  const openAssign = (a?: any) => {
    setEditAssignId(a?.id || null);
    setAssignForm({
      title: a?.title || '', description: a?.description || '',
      subject_id: a?.subject_id || '', batch_id: a?.batch_id || '',
      due_date: a?.due_date || '', max_marks: a?.max_marks?.toString() || '10',
      is_published: a?.is_published ?? true,
    });
    setAssignDialog(true);
  };

  const saveAssignment = async () => {
    if (!assignForm.title.trim() || !assignForm.subject_id || !assignForm.batch_id) {
      toast({ title: 'Title, Subject and Batch required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const payload = {
        institution_id: staff?.institution_id || user?.user_metadata?.institution_id,
        faculty_id: staff?.id,
        title: assignForm.title.trim(),
        description: assignForm.description || null,
        subject_id: assignForm.subject_id,
        batch_id: assignForm.batch_id,
        due_date: assignForm.due_date || null,
        max_marks: assignForm.max_marks ? parseInt(assignForm.max_marks) : null,
        is_published: assignForm.is_published,
      };
      if (editAssignId) {
        await (supabase as any).from('assignments').update(payload).eq('id', editAssignId);
        toast({ title: '✅ Assignment updated!' });
      } else {
        await (supabase as any).from('assignments').insert(payload);
        toast({ title: '✅ Assignment created!' });
      }
      setAssignDialog(false);
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm('Delete assignment?')) return;
    await (supabase as any).from('assignments').delete().eq('id', id);
    toast({ title: 'Deleted' });
    fetchAll();
  };

  // ── STUDY MATERIALS ──
  const saveMaterial = async () => {
    if (!materialForm.title.trim() || !materialForm.subject_id) {
      toast({ title: 'Title and Subject required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      await (supabase as any).from('study_materials').insert({
        institution_id: staff?.institution_id || user?.user_metadata?.institution_id,
        faculty_id: staff?.id,
        title: materialForm.title.trim(),
        description: materialForm.description || null,
        subject_id: materialForm.subject_id,
        batch_id: materialForm.batch_id || null,
        file_url: materialForm.file_url || null,
        file_type: materialForm.file_type,
        is_published: materialForm.is_published,
      });
      toast({ title: '✅ Material shared!' });
      setMaterialDialog(false);
      setMaterialForm({ title: '', description: '', subject_id: '', batch_id: '', file_url: '', file_type: 'document', is_published: true });
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  // ── LEAVE ──
  const applyLeave = async () => {
    if (!leaveForm.from_date || !leaveForm.to_date || !leaveForm.reason.trim()) {
      toast({ title: 'All fields required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      await (supabase as any).from('leave_requests').insert({
        institution_id: staff?.institution_id || user?.user_metadata?.institution_id,
        staff_id: staff?.id,
        leave_type_id: leaveForm.leave_type_id || null,
        from_date: leaveForm.from_date,
        to_date: leaveForm.to_date,
        reason: leaveForm.reason.trim(),
        status: 'pending',
      });
      toast({ title: '✅ Leave applied!' });
      setLeaveDialog(false);
      setLeaveForm({ leave_type_id: '', from_date: '', to_date: '', reason: '' });
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const totalClasses = timetable.length;
  const uniqueBatches = new Set(timetable.map(t => t.batch_id)).size;
  const pendingLeave = leaveRequests.filter(l => l.status === 'pending').length;

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-3 w-full max-w-md p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">SK</span>
            </div>
            <span className="font-bold hidden sm:block">Skoolvyn</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{staff?.full_name || profile?.first_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{staff?.designation?.replace(/_/g, ' ') || 'Faculty'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-700">
                {(staff?.full_name || profile?.first_name || 'F').charAt(0)}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Welcome */}
        <Card className="bg-emerald-600 text-white shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-sm">Welcome,</p>
                <h1 className="text-xl font-bold mt-0.5">{staff?.full_name || profile?.first_name || 'Faculty'}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {staff?.employee_id && <Badge className="bg-white/20 text-white border-0 text-xs">{staff.employee_id}</Badge>}
                  {staff?.designation && <Badge className="bg-white/20 text-white border-0 text-xs capitalize">{staff.designation.replace(/_/g, ' ')}</Badge>}
                </div>
              </div>
              <UserCheck className="w-12 h-12 text-white/30" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Today's Classes", value: todayBatches.length, icon: Calendar, color: 'text-primary' },
            { label: 'Weekly Periods', value: totalClasses, icon: Clock, color: 'text-blue-600' },
            { label: 'Batches', value: uniqueBatches, icon: Users, color: 'text-emerald-600' },
            { label: 'Leave Pending', value: pendingLeave, icon: FileText, color: pendingLeave > 0 ? 'text-amber-600' : 'text-muted-foreground' },
          ].map(s => (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-4">
                <s.icon className={`w-5 h-5 ${s.color} mb-1`} />
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's Schedule */}
        {todayBatches.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Today's Schedule — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {todayBatches.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-emerald-700">P{t.period_no}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{t.subjects?.name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{t.batches?.name} · {t.start_time}–{t.end_time}</p>
                      {t.room_no && <p className="text-xs text-muted-foreground">Room {t.room_no}</p>}
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0 ml-auto"
                      onClick={() => navigate(`/admin/attendance/${t.batch_id}`)}>
                      Mark
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="timetable">
          <TabsList className="flex-wrap">
            <TabsTrigger value="timetable" className="text-xs">Timetable</TabsTrigger>
            <TabsTrigger value="assignments" className="text-xs">Assignments ({assignments.length})</TabsTrigger>
            <TabsTrigger value="materials" className="text-xs">Materials ({materials.length})</TabsTrigger>
            <TabsTrigger value="leave" className="text-xs">Leave</TabsTrigger>
            <TabsTrigger value="notices" className="text-xs">Notices</TabsTrigger>
          </TabsList>

          {/* TIMETABLE */}
          <TabsContent value="timetable">
            {timetable.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No timetable assigned yet</CardContent></Card>
            ) : (
              <Card className="shadow-sm overflow-x-auto">
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-3 text-left font-medium text-muted-foreground">Day</th>
                        <th className="p-3 text-center font-medium text-muted-foreground">Period</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Subject</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Batch</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Time</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Room</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {timetable.map(t => (
                        <tr key={t.id} className="hover:bg-muted/20">
                          <td className="p-3 font-medium text-sm">{DAYS[t.day_of_week]}</td>
                          <td className="p-3 text-center"><Badge variant="outline" className="text-xs">P{t.period_no}</Badge></td>
                          <td className="p-3 text-sm">{t.subjects?.name || '—'}</td>
                          <td className="p-3 text-sm">{t.batches?.name || '—'}</td>
                          <td className="p-3 text-sm text-muted-foreground">{t.start_time}–{t.end_time}</td>
                          <td className="p-3 text-sm">{t.room_no || '—'}</td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => navigate(`/admin/attendance/${t.batch_id}`)}>
                              <ClipboardCheck className="w-3 h-3 mr-1" /> Attendance
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ASSIGNMENTS */}
          <TabsContent value="assignments" className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openAssign()}>
                <Plus className="w-4 h-4 mr-1" /> New Assignment
              </Button>
            </div>
            {assignments.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No assignments created yet</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {assignments.map(a => (
                  <Card key={a.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm">{a.title}</h3>
                            <Badge className={`text-xs border-0 ${a.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                              {a.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                          {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{a.subjects?.name}</span>
                            <span>{a.batches?.name}</span>
                            {a.due_date && <span>Due: {new Date(a.due_date).toLocaleDateString('en-IN')}</span>}
                            {a.max_marks && <span>Marks: {a.max_marks}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAssign(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAssignment(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* STUDY MATERIALS */}
          <TabsContent value="materials" className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setMaterialDialog(true)}>
                <Plus className="w-4 h-4 mr-1" /> Share Material
              </Button>
            </div>
            {materials.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No materials shared yet</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {materials.map(m => (
                  <Card key={m.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{m.title}</h3>
                            {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{m.subjects?.name}</span>
                              {m.batches?.name && <span>{m.batches.name}</span>}
                              <Badge variant="outline" className="text-xs capitalize">{m.file_type}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {m.file_url && (
                            <a href={m.file_url} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="h-7 text-xs"><Eye className="w-3 h-3 mr-1" />View</Button>
                            </a>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            onClick={async () => { if (confirm('Delete?')) { await (supabase as any).from('study_materials').delete().eq('id', m.id); fetchAll(); } }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* LEAVE */}
          <TabsContent value="leave" className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setLeaveDialog(true)}>
                <Plus className="w-4 h-4 mr-1" /> Apply Leave
              </Button>
            </div>
            <Card className="shadow-sm">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No leave requests</TableCell></TableRow>
                    ) : leaveRequests.map(l => {
                      const days = Math.ceil((new Date(l.to_date).getTime() - new Date(l.from_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="text-sm">{l.leave_types?.name || 'Leave'}</TableCell>
                          <TableCell className="text-sm">{new Date(l.from_date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell className="text-sm">{new Date(l.to_date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell className="text-sm">{days}</TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">{l.reason}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs border-0 ${l.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : l.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {l.status || 'pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTICES */}
          <TabsContent value="notices" className="space-y-3">
            {announcements.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No announcements</CardContent></Card>
            ) : announcements.map(a => (
              <Card key={a.id} className={`shadow-sm border-l-4 ${a.priority === 'urgent' ? 'border-l-red-500' : a.priority === 'high' ? 'border-l-amber-500' : 'border-l-primary'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    {(a.priority === 'urgent' || a.priority === 'high') && (
                      <Badge className={`text-xs border-0 flex-shrink-0 ${a.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{a.priority}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>

      {/* Assignment Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editAssignId ? 'Edit' : 'New'} Assignment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={assignForm.title} onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))} placeholder="Assignment title" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={assignForm.description} onChange={e => setAssignForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Instructions..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Select value={assignForm.subject_id} onValueChange={v => setAssignForm(f => ({ ...f, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Batch *</Label>
                <Select value={assignForm.batch_id} onValueChange={v => setAssignForm(f => ({ ...f, batch_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={assignForm.due_date} onChange={e => setAssignForm(f => ({ ...f, due_date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Max Marks</Label><Input type="number" value={assignForm.max_marks} onChange={e => setAssignForm(f => ({ ...f, max_marks: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="published" checked={assignForm.is_published} onChange={e => setAssignForm(f => ({ ...f, is_published: e.target.checked }))} className="rounded" />
              <Label htmlFor="published" className="cursor-pointer">Publish to students</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>Cancel</Button>
            <Button onClick={saveAssignment} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editAssignId ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Study Material Dialog */}
      <Dialog open={materialDialog} onOpenChange={setMaterialDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Share Study Material</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={materialForm.title} onChange={e => setMaterialForm(f => ({ ...f, title: e.target.value }))} placeholder="Material title" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={materialForm.description} onChange={e => setMaterialForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Select value={materialForm.subject_id} onValueChange={v => setMaterialForm(f => ({ ...f, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Batch</Label>
                <Select value={materialForm.batch_id} onValueChange={v => setMaterialForm(f => ({ ...f, batch_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="All batches" /></SelectTrigger>
                  <SelectContent><SelectItem value="">All Batches</SelectItem>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>File Type</Label>
                <Select value={materialForm.file_type} onValueChange={v => setMaterialForm(f => ({ ...f, file_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['document','pdf','video','audio','link','image','other'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>File URL / Link</Label><Input value={materialForm.file_url} onChange={e => setMaterialForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialog(false)}>Cancel</Button>
            <Button onClick={saveMaterial} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Share</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Dialog */}
      <Dialog open={leaveDialog} onOpenChange={setLeaveDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {leaveTypes.length > 0 && (
              <div className="space-y-1.5">
                <Label>Leave Type</Label>
                <Select value={leaveForm.leave_type_id} onValueChange={v => setLeaveForm(f => ({ ...f, leave_type_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{leaveTypes.map(lt => <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>From Date *</Label><Input type="date" value={leaveForm.from_date} onChange={e => setLeaveForm(f => ({ ...f, from_date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>To Date *</Label><Input type="date" value={leaveForm.to_date} onChange={e => setLeaveForm(f => ({ ...f, to_date: e.target.value }))} min={leaveForm.from_date} /></div>
            </div>
            <div className="space-y-1.5"><Label>Reason *</Label><Textarea value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} rows={3} placeholder="Reason for leave..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialog(false)}>Cancel</Button>
            <Button onClick={applyLeave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
