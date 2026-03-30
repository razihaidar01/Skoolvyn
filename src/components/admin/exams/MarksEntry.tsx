import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  FileText, Plus, ClipboardList, ChevronRight,
  Calendar, BookOpen, Loader2, Pencil, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Exam {
  id: string;
  batch_id: string;
  subject_id: string;
  exam_type_id: string | null;
  exam_date: string | null;
  start_time: string | null;
  end_time: string | null;
  max_marks: number | null;
  pass_marks: number | null;
  room_no: string | null;
  is_published: boolean | null;
  batch_name?: string;
  subject_name?: string;
  exam_type_name?: string;
  marks_count?: number;
}

export function ExamsOverview() {
  const { institutionId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const [form, setForm] = useState({
    batch_id: '', subject_id: '', exam_type_id: '',
    exam_date: '', start_time: '', end_time: '',
    max_marks: '100', pass_marks: '35', room_no: '',
  });

  useEffect(() => {
    if (institutionId) { fetchMeta(); fetchExams(); }
  }, [institutionId]);

  useEffect(() => {
    if (institutionId) fetchExams();
  }, [filterBatch, filterType]);

  const fetchMeta = async () => {
    const [bRes, sRes, etRes] = await Promise.all([
      (supabase as any).from('batches').select('id, name').eq('institution_id', institutionId!).eq('is_active', true),
      (supabase as any).from('subjects').select('id, name, code').eq('institution_id', institutionId!).eq('is_active', true),
      (supabase as any).from('exam_types').select('id, name').eq('institution_id', institutionId!),
    ]);
    setBatches(bRes.data || []);
    setSubjects(sRes.data || []);
    setExamTypes(etRes.data || []);
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      let q = (supabase as any).from('exams')
        .select('*')
        .eq('institution_id', institutionId!)
        .order('exam_date', { ascending: false });
      if (filterBatch !== 'all') q = q.eq('batch_id', filterBatch);
      if (filterType !== 'all') q = q.eq('exam_type_id', filterType);
      const { data } = await q;

      const batchMap: Record<string, string> = {};
      batches.forEach(b => { batchMap[b.id] = b.name; });
      const subMap: Record<string, string> = {};
      subjects.forEach(s => { subMap[s.id] = s.name; });
      const etMap: Record<string, string> = {};
      examTypes.forEach(e => { etMap[e.id] = e.name; });

      // Get marks counts
      const examIds = (data || []).map((e: any) => e.id);
      let marksMap: Record<string, number> = {};
      if (examIds.length > 0) {
        const { data: marksData } = await (supabase as any).from('marks')
          .select('exam_id').in('exam_id', examIds);
        (marksData || []).forEach((m: any) => {
          marksMap[m.exam_id] = (marksMap[m.exam_id] || 0) + 1;
        });
      }

      setExams((data || []).map((e: any) => ({
        ...e,
        batch_name: batchMap[e.batch_id] || '—',
        subject_name: subMap[e.subject_id] || '—',
        exam_type_name: e.exam_type_id ? etMap[e.exam_type_id] : null,
        marks_count: marksMap[e.id] || 0,
      })));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ batch_id: '', subject_id: '', exam_type_id: '', exam_date: '', start_time: '', end_time: '', max_marks: '100', pass_marks: '35', room_no: '' });
    setShowDialog(true);
  };

  const openEdit = (exam: Exam) => {
    setEditId(exam.id);
    setForm({
      batch_id: exam.batch_id,
      subject_id: exam.subject_id,
      exam_type_id: exam.exam_type_id || '',
      exam_date: exam.exam_date || '',
      start_time: exam.start_time || '',
      end_time: exam.end_time || '',
      max_marks: exam.max_marks?.toString() || '100',
      pass_marks: exam.pass_marks?.toString() || '35',
      room_no: exam.room_no || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.batch_id || !form.subject_id) {
      toast({ title: 'Required', description: 'Batch and Subject are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const payload = {
        institution_id: institutionId,
        batch_id: form.batch_id,
        subject_id: form.subject_id,
        exam_type_id: form.exam_type_id || null,
        exam_date: form.exam_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        max_marks: form.max_marks ? parseFloat(form.max_marks) : null,
        pass_marks: form.pass_marks ? parseFloat(form.pass_marks) : null,
        room_no: form.room_no || null,
      };
      if (editId) {
        await (supabase as any).from('exams').update(payload).eq('id', editId);
        toast({ title: 'Exam updated!' });
      } else {
        await (supabase as any).from('exams').insert(payload);
        toast({ title: 'Exam created!' });
      }
      setShowDialog(false);
      fetchExams();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exam? All marks will also be deleted.')) return;
    await (supabase as any).from('marks').delete().eq('exam_id', id);
    await (supabase as any).from('exams').delete().eq('id', id);
    toast({ title: 'Exam deleted' });
    fetchExams();
  };

  const handlePublish = async (id: string, current: boolean) => {
    await (supabase as any).from('exams').update({ is_published: !current }).eq('id', id);
    await (supabase as any).from('marks').update({ is_published: !current }).eq('exam_id', id);
    toast({ title: !current ? 'Results published!' : 'Results unpublished' });
    fetchExams();
  };

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Examinations</h2>
          <p className="text-sm text-muted-foreground">Manage exams and enter marks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/examinations/report')}>
            <ClipboardList className="w-4 h-4 mr-1" /> Results Report
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add Exam
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterBatch} onValueChange={setFilterBatch}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Batches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {examTypes.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Exams List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : exams.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold">No exams yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first exam to get started!</p>
            <Button className="mt-4" size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add Exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exams.map(exam => (
            <Card key={exam.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{exam.subject_name}</h3>
                        {exam.exam_type_name && (
                          <Badge variant="secondary" className="text-xs">{exam.exam_type_name}</Badge>
                        )}
                        {exam.is_published ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Published</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Draft</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {exam.batch_name}
                        </span>
                        {exam.exam_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(exam.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {exam.start_time && <span>🕐 {exam.start_time} – {exam.end_time}</span>}
                        <span>Max: {exam.max_marks} | Pass: {exam.pass_marks}</span>
                        {exam.room_no && <span>Room: {exam.room_no}</span>}
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">
                          {exam.marks_count} marks entered
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => navigate(`/admin/examinations/${exam.id}/marks`)}>
                      Enter Marks <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button variant="outline" size="sm"
                      onClick={() => handlePublish(exam.id, exam.is_published || false)}>
                      {exam.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(exam)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(exam.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Exam' : 'Add New Exam'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Batch *</Label>
              <Select value={form.batch_id} onValueChange={v => update('batch_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Subject *</Label>
              <Select value={form.subject_id} onValueChange={v => update('subject_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Exam Type</Label>
              <Select value={form.exam_type_id} onValueChange={v => update('exam_type_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select type (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {examTypes.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Exam Date</Label>
              <Input type="date" value={form.exam_date} onChange={e => update('exam_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Room No.</Label>
              <Input value={form.room_no} onChange={e => update('room_no', e.target.value)} placeholder="e.g. Hall-A" />
            </div>
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input type="time" value={form.start_time} onChange={e => update('start_time', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input type="time" value={form.end_time} onChange={e => update('end_time', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Max Marks *</Label>
              <Input type="number" value={form.max_marks} onChange={e => update('max_marks', e.target.value)} placeholder="100" />
            </div>
            <div className="space-y-1.5">
              <Label>Pass Marks *</Label>
              <Input type="number" value={form.pass_marks} onChange={e => update('pass_marks', e.target.value)} placeholder="35" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editId ? 'Save Changes' : 'Create Exam'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
