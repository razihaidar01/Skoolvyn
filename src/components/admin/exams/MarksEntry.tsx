import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, Save, Loader2, Users, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudentMark {
  studentId: string;
  full_name: string;
  roll_no: string | null;
  admission_no: string;
  marksObtained: string;
  isAbsent: boolean;
  grade: string;
  markId: string | null;
}

const calcGrade = (obtained: number, max: number): string => {
  const pct = (obtained / max) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
};

export function MarksEntry() {
  const { institutionId, user } = useAuth();
  const navigate = useNavigate();
  const { examId } = useParams();
  const { toast } = useToast();

  const [exam, setExam] = useState<any>(null);
  const [students, setStudents] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (examId && institutionId) fetchAll();
  }, [examId, institutionId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Fetch exam details
      const { data: examData } = await (supabase as any).from('exams')
        .select('*, subjects(name), batches(name), exam_types(name)')
        .eq('id', examId).single();
      setExam(examData);

      if (!examData) { setLoading(false); return; }

      // Fetch students in this batch
      const { data: studData } = await (supabase as any).from('students')
        .select('id, full_name, roll_no, admission_no')
        .eq('institution_id', institutionId!)
        .eq('batch_id', examData.batch_id)
        .eq('status', 'active')
        .order('roll_no');

      // Fetch existing marks
      const { data: marksData } = await (supabase as any).from('marks')
        .select('id, student_id, marks_obtained, is_absent, grade')
        .eq('exam_id', examId);

      const marksMap: Record<string, any> = {};
      (marksData || []).forEach((m: any) => { marksMap[m.student_id] = m; });

      const rows: StudentMark[] = (studData || []).map((s: any) => ({
        studentId: s.id,
        full_name: s.full_name,
        roll_no: s.roll_no,
        admission_no: s.admission_no,
        marksObtained: marksMap[s.id]?.marks_obtained?.toString() || '',
        isAbsent: marksMap[s.id]?.is_absent || false,
        grade: marksMap[s.id]?.grade || '',
        markId: marksMap[s.id]?.id || null,
      }));

      setStudents(rows);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const updateMarks = (studentId: string, value: string) => {
    setStudents(prev => prev.map(s => {
      if (s.studentId !== studentId) return s;
      const num = parseFloat(value);
      const max = exam?.max_marks || 100;
      const grade = !isNaN(num) && num >= 0 ? calcGrade(Math.min(num, max), max) : '';
      return { ...s, marksObtained: value, grade, isAbsent: false };
    }));
  };

  const toggleAbsent = (studentId: string) => {
    setStudents(prev => prev.map(s =>
      s.studentId === studentId
        ? { ...s, isAbsent: !s.isAbsent, marksObtained: !s.isAbsent ? '' : s.marksObtained, grade: !s.isAbsent ? 'AB' : s.grade }
        : s
    ));
  };

  const handleSave = async () => {
    if (!examId || !institutionId) return;
    setSaving(true);
    try {
      const toInsert: any[] = [];
      const toUpdate: any[] = [];

      students.forEach(s => {
        const marksVal = s.isAbsent ? null : (s.marksObtained !== '' ? parseFloat(s.marksObtained) : null);
        const record = {
          institution_id: institutionId,
          exam_id: examId,
          student_id: s.studentId,
          marks_obtained: marksVal,
          is_absent: s.isAbsent,
          grade: s.isAbsent ? 'AB' : s.grade,
          entered_by: user?.id,
        };
        if (s.markId) toUpdate.push({ ...record, id: s.markId });
        else toInsert.push(record);
      });

      if (toInsert.length > 0) {
        await (supabase as any).from('marks').insert(toInsert);
      }
      if (toUpdate.length > 0) {
        await Promise.all(toUpdate.map(r =>
          (supabase as any).from('marks').update(r).eq('id', r.id)
        ));
      }

      toast({ title: '✅ Marks saved!', description: `${students.length} students updated` });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const presentCount = students.filter(s => !s.isAbsent && s.marksObtained !== '').length;
  const absentCount = students.filter(s => s.isAbsent).length;
  const passCount = students.filter(s => {
    const m = parseFloat(s.marksObtained);
    return !s.isAbsent && !isNaN(m) && m >= (exam?.pass_marks || 35);
  }).length;

  const gradeColor = (grade: string) => {
    if (['A+', 'A'].includes(grade)) return 'text-emerald-600';
    if (['B+', 'B'].includes(grade)) return 'text-blue-600';
    if (grade === 'C') return 'text-amber-600';
    if (grade === 'D') return 'text-orange-600';
    if (grade === 'F' || grade === 'AB') return 'text-red-500';
    return 'text-muted-foreground';
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );

  if (!exam) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Exam not found</p>
      <Button className="mt-4" onClick={() => navigate('/admin/examinations')}>Back</Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/examinations')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">
            {exam.subjects?.name} — Marks Entry
          </h2>
          <p className="text-sm text-muted-foreground">
            {exam.batches?.name}
            {exam.exam_types?.name && ` · ${exam.exam_types.name}`}
            {exam.exam_date && ` · ${new Date(exam.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </p>
        </div>
        <div className="text-right text-sm hidden sm:block">
          <p className="font-medium">Max: {exam.max_marks} | Pass: {exam.pass_marks}</p>
          <p className="text-muted-foreground">{exam.room_no ? `Room: ${exam.room_no}` : ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: students.length, color: 'text-foreground' },
          { label: 'Entered', value: presentCount, color: 'text-blue-600' },
          { label: 'Absent', value: absentCount, color: 'text-red-500' },
          { label: 'Pass', value: passCount, color: 'text-emerald-600' },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Marks Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" /> {students.length} Students
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No students in this batch</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Student</div>
                <div className="col-span-3">Marks / {exam.max_marks}</div>
                <div className="col-span-2">Grade</div>
                <div className="col-span-2">Absent</div>
              </div>

              {students.map((s, idx) => (
                <div key={s.studentId}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${s.isAbsent ? 'bg-red-50/50' : ''}`}>
                  <div className="col-span-1 text-xs text-muted-foreground">{idx + 1}</div>
                  <div className="col-span-4">
                    <p className="text-sm font-medium">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.roll_no || s.admission_no}</p>
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      max={exam.max_marks}
                      value={s.marksObtained}
                      onChange={e => updateMarks(s.studentId, e.target.value)}
                      disabled={s.isAbsent}
                      className="h-8 text-sm"
                      placeholder="—"
                    />
                  </div>
                  <div className="col-span-2">
                    {s.isAbsent ? (
                      <Badge className="bg-red-100 text-red-700 border-0 text-xs">AB</Badge>
                    ) : s.grade ? (
                      <span className={`text-sm font-bold ${gradeColor(s.grade)}`}>{s.grade}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Checkbox
                      checked={s.isAbsent}
                      onCheckedChange={() => toggleAbsent(s.studentId)}
                    />
                    <span className="text-xs text-muted-foreground">Absent</span>
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
            {presentCount} marks entered · {absentCount} absent · {passCount} passing
          </p>
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Marks
          </Button>
        </div>
      )}
    </div>
  );
}