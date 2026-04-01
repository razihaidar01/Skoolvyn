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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudentMark {
  student_id: string;
  full_name: string;
  roll_no: string | null;
  marks_obtained: string;
  is_absent: boolean;
  grade: string;
  markId: string | null;
}

export function MarksEntry() {
  const { institutionId, user } = useAuth();
  const navigate = useNavigate();
  const { examId } = useParams();
  const { toast } = useToast();

  const [exam, setExam] = useState<any>(null);
  const [students, setStudents] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [batchName, setBatchName] = useState('');

  useEffect(() => {
    if (examId && institutionId) fetchAll();
  }, [examId, institutionId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Fetch exam
      const { data: examData } = await (supabase as any).from('exams')
        .select('*').eq('id', examId).single();
      setExam(examData);

      if (!examData) { setLoading(false); return; }

      // Fetch subject + batch names
      const [subRes, batchRes] = await Promise.all([
        (supabase as any).from('subjects').select('name').eq('id', examData.subject_id).single(),
        (supabase as any).from('batches').select('name').eq('id', examData.batch_id).single(),
      ]);
      setSubjectName(subRes.data?.name || '—');
      setBatchName(batchRes.data?.name || '—');

      // Fetch students in batch
      const { data: studData } = await (supabase as any).from('students')
        .select('id, full_name, roll_no')
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

      setStudents((studData || []).map((s: any) => {
        const m = marksMap[s.id];
        return {
          student_id: s.id,
          full_name: s.full_name,
          roll_no: s.roll_no,
          marks_obtained: m ? (m.marks_obtained?.toString() || '') : '',
          is_absent: m?.is_absent || false,
          grade: m?.grade || '',
          markId: m?.id || null,
        };
      }));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const calcGrade = (marks: number, max: number): string => {
    const pct = (marks / max) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 35) return 'D';
    return 'F';
  };

  const updateMark = (studentId: string, field: string, value: any) => {
    setStudents(prev => prev.map(s => {
      if (s.student_id !== studentId) return s;
      const updated = { ...s, [field]: value };
      if (field === 'marks_obtained' && value !== '' && exam) {
        updated.grade = calcGrade(parseFloat(value) || 0, exam.max_marks || 100);
      }
      if (field === 'is_absent' && value) {
        updated.marks_obtained = '';
        updated.grade = '';
      }
      return updated;
    }));
  };

  const handleSave = async () => {
    if (!examId || !institutionId) return;
    setSaving(true);
    try {
      const toInsert: any[] = [];
      const toUpdate: any[] = [];

      students.forEach(s => {
        const record = {
          institution_id: institutionId,
          exam_id: examId,
          student_id: s.student_id,
          marks_obtained: s.is_absent ? null : (s.marks_obtained ? parseFloat(s.marks_obtained) : null),
          is_absent: s.is_absent,
          grade: s.grade || null,
          entered_by: user?.id || null,
        };
        if (s.markId) toUpdate.push({ ...record, id: s.markId });
        else if (s.marks_obtained || s.is_absent) toInsert.push(record);
      });

      if (toInsert.length > 0) {
        await (supabase as any).from('marks').insert(toInsert);
      }
      if (toUpdate.length > 0) {
        await Promise.all(toUpdate.map(r =>
          (supabase as any).from('marks').update(r).eq('id', r.id)
        ));
      }

      toast({ title: '✅ Marks saved!', description: `${toInsert.length + toUpdate.length} records saved` });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const filledCount = students.filter(s => s.marks_obtained || s.is_absent).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Exam not found</p>
        <Button className="mt-4" onClick={() => navigate('/admin/examinations')}>Back to Exams</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/examinations')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Enter Marks — {subjectName}</h2>
          <div className="flex gap-2 mt-1">
            <Badge variant="secondary">{batchName}</Badge>
            <Badge variant="outline">Max: {exam.max_marks} | Pass: {exam.pass_marks}</Badge>
            {exam.exam_date && (
              <Badge variant="outline">
                {new Date(exam.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="text-sm text-muted-foreground">
        {filledCount} of {students.length} students marked
      </div>

      {/* Marks Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          {students.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No students in this batch
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="w-28 text-center">Marks (/{exam.max_marks})</TableHead>
                  <TableHead className="w-20 text-center">Absent</TableHead>
                  <TableHead className="w-20 text-center">Grade</TableHead>
                  <TableHead className="w-20 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s, idx) => {
                  const marks = parseFloat(s.marks_obtained) || 0;
                  const isPassed = !s.is_absent && marks >= (exam.pass_marks || 35);
                  return (
                    <TableRow key={s.student_id} className={s.is_absent ? 'bg-red-50/50' : ''}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground">{s.roll_no || '—'}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          className="w-20 text-center mx-auto h-8"
                          value={s.marks_obtained}
                          onChange={e => updateMark(s.student_id, 'marks_obtained', e.target.value)}
                          disabled={s.is_absent}
                          max={exam.max_marks}
                          min={0}
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={s.is_absent}
                          onCheckedChange={v => updateMark(s.student_id, 'is_absent', v)}
                        />
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">
                        {s.is_absent ? <span className="text-red-500">AB</span> : s.grade || '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.marks_obtained || s.is_absent ? (
                          <Badge className={s.is_absent ? 'bg-red-100 text-red-700 border-0' :
                            isPassed ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-red-100 text-red-700 border-0'}>
                            {s.is_absent ? 'AB' : isPassed ? 'Pass' : 'Fail'}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      {students.length > 0 && (
        <div className="flex items-center justify-between sticky bottom-0 bg-background border-t pt-4 pb-2">
          <p className="text-sm text-muted-foreground">{filledCount} of {students.length} marked</p>
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Marks
          </Button>
        </div>
      )}
    </div>
  );
}
