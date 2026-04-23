import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, Calendar, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PERIOD_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-red-100 text-red-800 border-red-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-teal-100 text-teal-800 border-teal-200',
];

interface TimetableEntry {
  id: string;
  batch_id: string;
  subject_id: string;
  faculty_id: string | null;
  day_of_week: number;
  period_no: number;
  start_time: string;
  end_time: string;
  room_no: string | null;
  is_active: boolean | null;
}

export function TimetableModule() {
  const { institutionId } = useAuth();
  const { toast } = useToast();

  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const [form, setForm] = useState({
    batch_id: '',
    subject_id: '',
    faculty_id: '',
    day_of_week: '1',
    period_no: '1',
    start_time: '09:00',
    end_time: '10:00',
    room_no: '',
    academic_year_id: '',
  });

  useEffect(() => {
    if (institutionId) fetchMeta();
  }, [institutionId]);

  useEffect(() => {
    if (institutionId && selectedBatch) fetchTimetable();
    else setTimetable([]);
  }, [institutionId, selectedBatch, selectedYear]);

  const fetchMeta = async () => {
    setLoading(true);
    try {
      const [bRes, sRes, stRes, yRes] = await Promise.all([
        (supabase as any).from('batches').select('id, name, program_id').eq('institution_id', institutionId!).eq('is_active', true).order('name'),
        (supabase as any).from('subjects').select('id, name, code').eq('institution_id', institutionId!).eq('is_active', true).order('name'),
        (supabase as any).from('staff').select('id, full_name, designation').eq('institution_id', institutionId!).eq('status', 'active').order('full_name'),
        (supabase as any).from('academic_years').select('id, name, is_current').eq('institution_id', institutionId!).order('start_date', { ascending: false }),
      ]);
      setBatches(bRes.data || []);
      setSubjects(sRes.data || []);
      setStaff(stRes.data || []);
      setAcademicYears(yRes.data || []);

      // Auto select current year
      const currentYear = (yRes.data || []).find((y: any) => y.is_current);
      if (currentYear) setSelectedYear(currentYear.id);

      // Auto select first batch if available
      if (bRes.data?.length) setSelectedBatch(bRes.data[0].id);
    } catch (err) {
      console.error('Timetable meta fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    let q = (supabase as any).from('timetable')
      .select('*')
      .eq('institution_id', institutionId!)
      .eq('batch_id', selectedBatch)
      .eq('is_active', true)
      .order('day_of_week')
      .order('period_no');
    if (selectedYear) q = q.eq('academic_year_id', selectedYear);
    const { data } = await q;
    setTimetable(data || []);
    setLoading(false);
  };

  const subjectMap: Record<string, any> = {};
  subjects.forEach(s => { subjectMap[s.id] = s; });
  const staffMap: Record<string, string> = {};
  staff.forEach(s => { staffMap[s.id] = s.full_name; });

  // Get unique periods across all days
  const allPeriods = Array.from(new Set(timetable.map(t => t.period_no))).sort((a, b) => a - b);
  const maxPeriod = Math.max(...allPeriods, 8);
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  // Build grid: day -> period -> entry
  const grid: Record<number, Record<number, TimetableEntry>> = {};
  DAYS.forEach((_, di) => {
    grid[di + 1] = {};
    timetable.filter(t => t.day_of_week === di + 1).forEach(t => {
      grid[di + 1][t.period_no] = t;
    });
  });

  const openAdd = (day?: number, period?: number) => {
    setEditId(null);
    setForm({
      batch_id: selectedBatch,
      subject_id: '',
      faculty_id: '',
      day_of_week: day?.toString() || '1',
      period_no: period?.toString() || '1',
      start_time: '09:00',
      end_time: '10:00',
      room_no: '',
      academic_year_id: selectedYear,
    });
    setShowDialog(true);
  };

  const openEdit = (entry: TimetableEntry) => {
    setEditId(entry.id);
    setForm({
      batch_id: entry.batch_id,
      subject_id: entry.subject_id,
      faculty_id: entry.faculty_id || '',
      day_of_week: entry.day_of_week.toString(),
      period_no: entry.period_no.toString(),
      start_time: entry.start_time,
      end_time: entry.end_time,
      room_no: entry.room_no || '',
      academic_year_id: selectedYear,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.batch_id || !form.subject_id) {
      toast({ title: 'Batch and Subject required', variant: 'destructive' }); return;
    }
    // Check for conflict
    const conflict = timetable.find(t =>
      t.day_of_week === parseInt(form.day_of_week) &&
      t.period_no === parseInt(form.period_no) &&
      t.id !== editId
    );
    if (conflict) {
      toast({ title: 'Time conflict!', description: `Period ${form.period_no} on ${DAYS[parseInt(form.day_of_week) - 1]} is already taken`, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        institution_id: institutionId,
        batch_id: form.batch_id,
        subject_id: form.subject_id,
        faculty_id: form.faculty_id || null,
        day_of_week: parseInt(form.day_of_week),
        period_no: parseInt(form.period_no),
        start_time: form.start_time,
        end_time: form.end_time,
        room_no: form.room_no || null,
        academic_year_id: form.academic_year_id || null,
        is_active: true,
      };
      if (editId) {
        await (supabase as any).from('timetable').update(payload).eq('id', editId);
        toast({ title: '✅ Period updated!' });
      } else {
        await (supabase as any).from('timetable').insert(payload);
        toast({ title: '✅ Period added!' });
      }
      setShowDialog(false);
      fetchTimetable();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this period?')) return;
    await (supabase as any).from('timetable').update({ is_active: false }).eq('id', id);
    toast({ title: 'Period removed' });
    fetchTimetable();
  };

  const exportCSV = () => {
    const rows = timetable.map(t => {
      const sub = subjectMap[t.subject_id];
      return `"${DAYS[t.day_of_week - 1]}","${t.period_no}","${t.start_time}","${t.end_time}","${sub?.name || '—'}","${t.faculty_id ? staffMap[t.faculty_id] : '—'}","${t.room_no || '—'}"`;
    });
    const csv = 'Day,Period,Start Time,End Time,Subject,Teacher,Room\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'timetable.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  const selectedBatchName = batches.find(b => b.id === selectedBatch)?.name || '';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Timetable</h2>
          <p className="text-sm text-muted-foreground">Manage class schedules for each batch</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={timetable.length === 0}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => openAdd()} disabled={!selectedBatch}>
            <Plus className="w-4 h-4 mr-1" /> Add Period
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Batch" /></SelectTrigger>
          <SelectContent>
            {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Academic Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Years</SelectItem>
            {academicYears.map(y => (
              <SelectItem key={y.id} value={y.id}>{y.name}{y.is_current ? ' (Current)' : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      {selectedBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Periods', value: timetable.length },
            { label: 'Days Scheduled', value: new Set(timetable.map(t => t.day_of_week)).size },
            { label: 'Subjects', value: new Set(timetable.map(t => t.subject_id)).size },
            { label: 'Teachers', value: new Set(timetable.filter(t => t.faculty_id).map(t => t.faculty_id)).size },
          ].map(s => (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Timetable Grid */}
      {!selectedBatch ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            {batches.length === 0 ? (
              <>
                <p className="font-medium text-foreground">No batches found</p>
                <p className="text-sm text-muted-foreground mt-1">Create batches in Academic Setup first, then come back to manage timetable.</p>
              </>
            ) : (
              <p className="font-medium">Select a batch to view timetable</p>
            )}
          </CardContent>
        </Card>
      ) : loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="py-3 px-4 bg-muted/30">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {selectedBatchName} — Weekly Timetable
              <Badge variant="outline" className="text-xs ml-auto">{timetable.length} periods</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-3 text-left font-medium text-muted-foreground border-b w-20">Day</th>
                  {periods.map(p => (
                    <th key={p} className="p-3 text-center font-medium text-muted-foreground border-b min-w-[120px]">
                      Period {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, di) => (
                  <tr key={day} className="border-b hover:bg-muted/10">
                    <td className="p-3 font-medium text-foreground bg-muted/20 border-r">
                      <span className="hidden sm:block">{day}</span>
                      <span className="sm:hidden">{DAY_SHORT[di]}</span>
                    </td>
                    {periods.map(p => {
                      const entry = grid[di + 1]?.[p];
                      const sub = entry ? subjectMap[entry.subject_id] : null;
                      const colorClass = sub ? PERIOD_COLORS[subjects.findIndex(s => s.id === entry?.subject_id) % PERIOD_COLORS.length] : '';
                      return (
                        <td key={p} className="p-1.5 border-r align-top">
                          {entry && sub ? (
                            <div className={`rounded-lg border p-2 ${colorClass} relative group`}>
                              <p className="font-semibold text-xs leading-tight">{sub.name}</p>
                              {sub.code && <p className="text-xs opacity-70">{sub.code}</p>}
                              {entry.faculty_id && (
                                <p className="text-xs opacity-80 mt-0.5 truncate">
                                  {staffMap[entry.faculty_id]}
                                </p>
                              )}
                              <p className="text-xs opacity-60">{entry.start_time}–{entry.end_time}</p>
                              {entry.room_no && <p className="text-xs opacity-60">Room {entry.room_no}</p>}
                              {/* Hover actions */}
                              <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                                <button onClick={() => openEdit(entry)}
                                  className="w-5 h-5 rounded bg-white/70 hover:bg-white flex items-center justify-center">
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDelete(entry.id)}
                                  className="w-5 h-5 rounded bg-white/70 hover:bg-red-100 flex items-center justify-center text-red-500">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAdd(di + 1, p)}
                              className="w-full h-full min-h-[60px] rounded-lg border-2 border-dashed border-muted hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center justify-center group">
                              <Plus className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Subject Legend */}
      {timetable.length > 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">Subject Legend</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(timetable.map(t => t.subject_id))).map((sid, i) => {
                const sub = subjectMap[sid];
                return sub ? (
                  <Badge key={sid} className={`text-xs border ${PERIOD_COLORS[i % PERIOD_COLORS.length]}`}>
                    {sub.code ? `${sub.code} — ` : ''}{sub.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Period' : 'Add Period'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Batch</Label>
              <Select value={form.batch_id} onValueChange={v => setForm(f => ({ ...f, batch_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Day *</Label>
              <Select value={form.day_of_week} onValueChange={v => setForm(f => ({ ...f, day_of_week: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Period No. *</Label>
              <Select value={form.period_no} onValueChange={v => setForm(f => ({ ...f, period_no: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(p => (
                    <SelectItem key={p} value={p.toString()}>Period {p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Start Time *</Label>
              <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time *</Label>
              <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Subject *</Label>
              <Select value={form.subject_id} onValueChange={v => setForm(f => ({ ...f, subject_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Teacher</Label>
              <Select value={form.faculty_id} onValueChange={v => setForm(f => ({ ...f, faculty_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select teacher (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific teacher</SelectItem>
                  {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Room No.</Label>
              <Input value={form.room_no} onChange={e => setForm(f => ({ ...f, room_no: e.target.value }))} placeholder="e.g. 201" />
            </div>
            <div className="space-y-1.5">
              <Label>Academic Year</Label>
              <Select value={form.academic_year_id} onValueChange={v => setForm(f => ({ ...f, academic_year_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {academicYears.map(y => (
                    <SelectItem key={y.id} value={y.id}>{y.name}{y.is_current ? ' ✓' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editId ? 'Save Changes' : 'Add Period'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}