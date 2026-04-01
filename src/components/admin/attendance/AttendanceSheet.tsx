import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Check, X, Clock, Save, Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AttStatus = 'present' | 'absent' | 'late' | 'leave';

interface StudentRow {
  id: string;
  full_name: string;
  roll_no: string | null;
  admission_no: string;
  profile_photo_url: string | null;
  status: AttStatus;
  remarks: string;
  attendanceId: string | null;
}

const STATUS_CONFIG: Record<AttStatus, { label: string; color: string; bg: string }> = {
  present: { label: 'P', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' },
  absent:  { label: 'A', color: 'text-red-700',     bg: 'bg-red-100 border-red-300' },
  late:    { label: 'L', color: 'text-amber-700',   bg: 'bg-amber-100 border-amber-300' },
  leave:   { label: 'LE', color: 'text-blue-700',   bg: 'bg-blue-100 border-blue-300' },
};

export function AttendanceSheet() {
  const { institutionId, user } = useAuth();
  const navigate = useNavigate();
  const { batchId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(dateParam);
  const [batchName, setBatchName] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [markAll, setMarkAll] = useState<AttStatus | null>(null);

  useEffect(() => {
    if (batchId && institutionId) {
      fetchBatch();
      fetchStudentsAndAttendance();
    }
  }, [batchId, institutionId, selectedDate]);

  const fetchBatch = async () => {
    const { data } = await (supabase as any).from('batches').select('name').eq('id', batchId!).single();
    setBatchName((data as any)?.name || 'Batch');
  };

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      const [studRes, attRes] = await Promise.all([
        (supabase as any).from('students')
          .select('id, full_name, roll_no, admission_no, profile_photo_url')
          .eq('institution_id', institutionId!)
          .eq('batch_id', batchId!)
          .eq('status', 'active')
          .order('roll_no', { ascending: true }),
        (supabase as any).from('student_attendance')
          .select('id, student_id, status, remarks')
          .eq('institution_id', institutionId!)
          .eq('batch_id', batchId!)
          .eq('date', selectedDate),
      ]);

      const attMap: Record<string, any> = {};
      (attRes.data || []).forEach((a: any) => { attMap[a.student_id] = a; });

      const rows: StudentRow[] = (studRes.data || []).map((s: any) => ({
        id: s.id,
        full_name: s.full_name,
        roll_no: s.roll_no,
        admission_no: s.admission_no,
        profile_photo_url: s.profile_photo_url,
        status: (attMap[s.id]?.status as AttStatus) || 'present',
        remarks: attMap[s.id]?.remarks || '',
        attendanceId: attMap[s.id]?.id || null,
      }));

      setStudents(rows);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const updateStatus = (studentId: string, status: AttStatus) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const updateRemarks = (studentId: string, remarks: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, remarks } : s));
  };

  const handleMarkAll = (status: AttStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
    setMarkAll(status);
    setTimeout(() => setMarkAll(null), 1000);
  };

  const handleSave = async () => {
    if (!batchId || !institutionId) return;
    setSaving(true);
    try {
      const toInsert: any[] = [];
      const toUpdate: any[] = [];

      students.forEach(s => {
        const record = {
          institution_id: institutionId,
          batch_id: batchId,
          student_id: s.id,
          date: selectedDate,
          status: s.status,
          remarks: s.remarks || null,
          marked_by: user?.id || null,
        };
        if (s.attendanceId) toUpdate.push({ ...record, id: s.attendanceId });
        else toInsert.push(record);
      });

      if (toInsert.length > 0) {
        await (supabase as any).from('student_attendance').insert(toInsert);
      }
      if (toUpdate.length > 0) {
        await Promise.all(toUpdate.map(r =>
          (supabase as any).from('student_attendance').update(r).eq('id', r.id)
        ));
      }

      toast({
        title: '✅ Attendance saved!',
        description: `${students.length} students for ${new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      });
      fetchStudentsAndAttendance();
    } catch (err: any) {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const lateCount = students.filter(s => s.status === 'late').length;
  const leaveCount = students.filter(s => s.status === 'leave').length;

  const getInitials = (name: string) => {
    const p = name.split(' ');
    return (p[0]?.[0] || '') + (p[1]?.[0] || '');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/attendance')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{batchName} — Attendance</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Present', count: presentCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Absent', count: absentCount, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Late', count: lateCount, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Leave', count: leaveCount, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(s => (
          <Card key={s.label} className={`shadow-sm ${s.bg}`}>
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mark All Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Mark all as:</span>
        {(['present', 'absent', 'late', 'leave'] as AttStatus[]).map(status => (
          <Button
            key={status}
            variant="outline"
            size="sm"
            className={`capitalize ${markAll === status ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleMarkAll(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Attendance Sheet */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium">No students in this batch</p>
              <p className="text-sm text-muted-foreground mt-1">Add students to this batch first</p>
            </div>
          ) : (
            <div className="divide-y">
              {students.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-3 p-3 hover:bg-muted/20">
                  {/* Index */}
                  <span className="text-xs text-muted-foreground w-6 text-right flex-shrink-0">{idx + 1}</span>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {student.profile_photo_url ? (
                      <img src={student.profile_photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">{getInitials(student.full_name)}</span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground">{student.roll_no ? `Roll: ${student.roll_no}` : student.admission_no}</p>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(['present', 'absent', 'late', 'leave'] as AttStatus[]).map(status => (
                      <button
                        key={status}
                        onClick={() => updateStatus(student.id, status)}
                        className={`w-9 h-9 rounded-lg border-2 text-xs font-bold transition-all ${
                          student.status === status
                            ? STATUS_CONFIG[status].bg + ' ' + STATUS_CONFIG[status].color + ' border-current'
                            : 'border-muted text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        {STATUS_CONFIG[status].label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      {students.length > 0 && (
        <div className="flex items-center justify-between sticky bottom-0 bg-background border-t pt-4 pb-2">
          <p className="text-sm text-muted-foreground">
            {presentCount} present, {absentCount} absent of {students.length} students
          </p>
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Attendance
          </Button>
        </div>
      )}
    </div>
  );
}