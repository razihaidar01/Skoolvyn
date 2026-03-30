import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ChevronLeft, Download, Trophy, TrendingUp } from 'lucide-react';

interface StudentResult {
  studentId: string;
  full_name: string;
  roll_no: string | null;
  subjects: {
    name: string;
    maxMarks: number;
    obtained: number | null;
    isAbsent: boolean;
    grade: string;
    isPassed: boolean;
  }[];
  totalMax: number;
  totalObtained: number;
  percentage: number;
  overallGrade: string;
  isPassed: boolean;
  rank: number;
}

export function ResultsReport() {
  const { institutionId } = useAuth();
  const navigate = useNavigate();

  const [batches, setBatches] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [examsForBatch, setExamsForBatch] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (institutionId) fetchMeta();
  }, [institutionId]);

  useEffect(() => {
    if (selectedBatch && selectedExamType) fetchResults();
    else setResults([]);
  }, [selectedBatch, selectedExamType]);

  const fetchMeta = async () => {
    const [bRes, etRes] = await Promise.all([
      (supabase as any).from('batches').select('id, name').eq('institution_id', institutionId!).eq('is_active', true),
      (supabase as any).from('exam_types').select('id, name').eq('institution_id', institutionId!),
    ]);
    setBatches(bRes.data || []);
    setExamTypes(etRes.data || []);
  };

  const fetchResults = async () => {
    if (!institutionId || !selectedBatch || !selectedExamType) return;
    setLoading(true);
    try {
      // Get exams for this batch + exam type
      const { data: examsData } = await (supabase as any).from('exams')
        .select('id, subject_id, max_marks, pass_marks, subjects(name)')
        .eq('institution_id', institutionId!)
        .eq('batch_id', selectedBatch)
        .eq('exam_type_id', selectedExamType);

      setExamsForBatch(examsData || []);
      if (!examsData?.length) { setResults([]); setLoading(false); return; }

      // Get students
      const { data: students } = await (supabase as any).from('students')
        .select('id, full_name, roll_no, admission_no')
        .eq('institution_id', institutionId!)
        .eq('batch_id', selectedBatch)
        .eq('status', 'active')
        .order('roll_no');

      // Get all marks for these exams
      const examIds = examsData.map((e: any) => e.id);
      const { data: marksData } = await (supabase as any).from('marks')
        .select('student_id, exam_id, marks_obtained, is_absent, grade')
        .in('exam_id', examIds);

      // Build marks map
      const marksMap: Record<string, Record<string, any>> = {};
      (marksData || []).forEach((m: any) => {
        if (!marksMap[m.student_id]) marksMap[m.student_id] = {};
        marksMap[m.student_id][m.exam_id] = m;
      });

      // Build results
      const studentResults: StudentResult[] = (students || []).map((s: any) => {
        const subjectResults = examsData.map((e: any) => {
          const mark = marksMap[s.id]?.[e.id];
          const obtained = mark?.is_absent ? null : (mark?.marks_obtained ?? null);
          const isPassed = obtained !== null && obtained >= (e.pass_marks || 35);
          return {
            name: e.subjects?.name || '—',
            maxMarks: e.max_marks || 100,
            obtained,
            isAbsent: mark?.is_absent || false,
            grade: mark?.grade || '—',
            isPassed,
          };
        });

        const totalMax = subjectResults.reduce((s, r) => s + r.maxMarks, 0);
        const totalObtained = subjectResults.reduce((s, r) => s + (r.obtained || 0), 0);
        const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
        const allPassed = subjectResults.every(r => r.isAbsent || r.isPassed);

        let overallGrade = 'F';
        if (pct >= 90) overallGrade = 'A+';
        else if (pct >= 80) overallGrade = 'A';
        else if (pct >= 70) overallGrade = 'B+';
        else if (pct >= 60) overallGrade = 'B';
        else if (pct >= 50) overallGrade = 'C';
        else if (pct >= 40) overallGrade = 'D';

        return {
          studentId: s.id,
          full_name: s.full_name,
          roll_no: s.roll_no,
          subjects: subjectResults,
          totalMax,
          totalObtained,
          percentage: pct,
          overallGrade,
          isPassed: allPassed && pct >= 35,
          rank: 0,
        };
      });

      // Assign ranks
      const sorted = [...studentResults].sort((a, b) => b.percentage - a.percentage);
      sorted.forEach((r, idx) => { r.rank = idx + 1; });

      setResults(sorted);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const exportCSV = () => {
    const subjectHeaders = examsForBatch.map((e: any) => e.subjects?.name || '').join(',');
    const header = `Rank,Name,Roll No,${subjectHeaders},Total,Percentage,Grade,Result\n`;
    const csv = header + results.map(r => {
      const marks = r.subjects.map(s => s.isAbsent ? 'AB' : (s.obtained ?? '—')).join(',');
      return `${r.rank},"${r.full_name}","${r.roll_no || '—'}",${marks},${r.totalObtained}/${r.totalMax},${r.percentage}%,${r.overallGrade},${r.isPassed ? 'PASS' : 'FAIL'}`;
    }).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const gradeColor = (grade: string) => {
    if (['A+', 'A'].includes(grade)) return 'text-emerald-600';
    if (['B+', 'B'].includes(grade)) return 'text-blue-600';
    if (grade === 'C') return 'text-amber-600';
    return 'text-red-500';
  };

  const passCount = results.filter(r => r.isPassed).length;
  const avgPct = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0;
  const topStudent = results[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/examinations')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Results Report</h2>
          <p className="text-sm text-muted-foreground">View consolidated results by batch and exam type</p>
        </div>
        {results.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Batch" /></SelectTrigger>
          <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedExamType} onValueChange={setSelectedExamType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Exam Type" /></SelectTrigger>
          <SelectContent>{examTypes.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!selectedBatch || !selectedExamType ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium text-foreground">Select Batch and Exam Type</p>
            <p className="text-sm text-muted-foreground mt-1">Choose a batch and exam type to view results</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : results.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No results found. Enter marks for the exams first.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{avgPct}%</p>
                <p className="text-xs text-muted-foreground">Class Average</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{passCount}/{results.length}</p>
                <p className="text-xs text-muted-foreground">Pass / Total</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{Math.round((passCount / results.length) * 100)}%</p>
                <p className="text-xs text-muted-foreground">Pass Rate</p>
              </CardContent>
            </Card>
            {topStudent && (
              <Card className="shadow-sm bg-amber-50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold text-amber-700 truncate">🏆 {topStudent.full_name}</p>
                  <p className="text-lg font-bold text-amber-700">{topStudent.percentage}%</p>
                  <p className="text-xs text-muted-foreground">Top Student</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Table */}
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    {examsForBatch.map((e: any) => (
                      <TableHead key={e.id} className="text-center text-xs">
                        {e.subjects?.name}<br />
                        <span className="text-muted-foreground font-normal">/{e.max_marks}</span>
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">%</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map(r => (
                    <TableRow key={r.studentId} className={!r.isPassed ? 'bg-red-50/40' : ''}>
                      <TableCell className="font-bold text-sm">{r.rank}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{r.full_name}</p>
                        <p className="text-xs text-muted-foreground">{r.roll_no || '—'}</p>
                      </TableCell>
                      {r.subjects.map((s, i) => (
                        <TableCell key={i} className="text-center text-sm">
                          {s.isAbsent ? (
                            <span className="text-red-500 font-medium">AB</span>
                          ) : s.obtained !== null ? (
                            <span className={s.isPassed ? 'text-foreground' : 'text-red-500 font-medium'}>{s.obtained}</span>
                          ) : '—'}
                        </TableCell>
                      ))}
                      <TableCell className="text-center text-sm font-medium">
                        {r.totalObtained}/{r.totalMax}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm font-bold ${gradeColor(r.overallGrade)}`}>{r.percentage}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm font-bold ${gradeColor(r.overallGrade)}`}>{r.overallGrade}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={r.isPassed
                          ? 'bg-emerald-100 text-emerald-700 border-0'
                          : 'bg-red-100 text-red-700 border-0'}>
                          {r.isPassed ? 'PASS' : 'FAIL'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
