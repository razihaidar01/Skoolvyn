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
import { ChevronLeft, Download, TrendingUp, TrendingDown } from 'lucide-react';

interface StudentReport {
  id: string;
  full_name: string;
  roll_no: string | null;
  admission_no: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  pct: number;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export function AttendanceReport() {
  const { institutionId } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [report, setReport] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (institutionId) fetchBatches();
  }, [institutionId]);

  useEffect(() => {
    if (institutionId) fetchReport();
  }, [institutionId, selectedBatch, selectedMonth, selectedYear]);

  const fetchBatches = async () => {
    const { data } = await supabase.from('batches').select('id, name')
      .eq('institution_id', institutionId!).eq('is_active', true).order('name');
    setBatches(data || []);
  };

  const fetchReport = async () => {
    if (!institutionId) return;
    setLoading(true);
    try {
      const month = parseInt(selectedMonth) + 1;
      const year = parseInt(selectedYear);
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Fetch students
      let studQuery = (supabase as any).from('students')
        .select('id, full_name, roll_no, admission_no')
        .eq('institution_id', institutionId!)
        .eq('status', 'active')
        .order('roll_no');
      if (selectedBatch !== 'all') studQuery = studQuery.eq('batch_id', selectedBatch);
      const { data: students } = await studQuery;
      if (!students?.length) { setReport([]); setLoading(false); return; }

      // Fetch all attendance for the month
      let attQuery = (supabase as any).from('student_attendance')
        .select('student_id, status')
        .eq('institution_id', institutionId!)
        .gte('date', startDate)
        .lte('date', endDate);
      if (selectedBatch !== 'all') attQuery = attQuery.eq('batch_id', selectedBatch);
      const { data: attData } = await attQuery;

      // Build report
      const attMap: Record<string, { present: number; absent: number; late: number; leave: number }> = {};
      (attData || []).forEach((a: any) => {
        if (!attMap[a.student_id]) attMap[a.student_id] = { present: 0, absent: 0, late: 0, leave: 0 };
        if (a.status === 'present') attMap[a.student_id].present++;
        else if (a.status === 'absent') attMap[a.student_id].absent++;
        else if (a.status === 'late') attMap[a.student_id].late++;
        else if (a.status === 'leave') attMap[a.student_id].leave++;
      });

      const reportData: StudentReport[] = students.map((s: any) => {
        const att = attMap[s.id] || { present: 0, absent: 0, late: 0, leave: 0 };
        const totalDays = att.present + att.absent + att.late + att.leave;
        const pct = totalDays > 0 ? Math.round(((att.present + att.late) / totalDays) * 100) : 0;
        return { id: s.id, full_name: s.full_name, roll_no: s.roll_no, admission_no: s.admission_no, totalDays, ...att, pct };
      });

      setReport(reportData.sort((a, b) => (a.roll_no || a.admission_no).localeCompare(b.roll_no || b.admission_no)));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const exportCSV = () => {
    const header = 'Name,Roll No,Present,Absent,Late,Leave,Total Days,Attendance %\n';
    const csv = header + report.map(r =>
      `"${r.full_name}","${r.roll_no || r.admission_no}",${r.present},${r.absent},${r.late},${r.leave},${r.totalDays},${r.pct}%`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${MONTHS[parseInt(selectedMonth)]}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pctColor = (pct: number) =>
    pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500';

  const avgPct = report.length > 0
    ? Math.round(report.reduce((s, r) => s + r.pct, 0) / report.length)
    : 0;

  const lowAttendance = report.filter(r => r.pct < 75).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/attendance')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Attendance Report</h2>
          <p className="text-sm text-muted-foreground">Monthly attendance summary</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={report.length === 0}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Batches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[now.getFullYear(), now.getFullYear()-1, now.getFullYear()-2].map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {report.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{avgPct}%</p>
              <p className="text-xs text-muted-foreground">Average Attendance</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{report.filter(r => r.pct >= 75).length}</p>
              <p className="text-xs text-muted-foreground">Above 75%</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{lowAttendance}</p>
              <p className="text-xs text-muted-foreground">Below 75% ⚠️</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">
            {MONTHS[parseInt(selectedMonth)]} {selectedYear} — {report.length} Students
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : report.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No attendance data for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center text-emerald-600">Present</TableHead>
                    <TableHead className="text-center text-red-500">Absent</TableHead>
                    <TableHead className="text-center text-amber-600">Late</TableHead>
                    <TableHead className="text-center text-blue-600">Leave</TableHead>
                    <TableHead className="text-center">Total Days</TableHead>
                    <TableHead className="text-center">Attendance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.map((r, idx) => (
                    <TableRow key={r.id} className={r.pct < 75 ? 'bg-red-50/50' : ''}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{r.full_name}</p>
                        <p className="text-xs text-muted-foreground">{r.roll_no || r.admission_no}</p>
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium text-emerald-600">{r.present}</TableCell>
                      <TableCell className="text-center text-sm font-medium text-red-500">{r.absent}</TableCell>
                      <TableCell className="text-center text-sm font-medium text-amber-600">{r.late}</TableCell>
                      <TableCell className="text-center text-sm font-medium text-blue-600">{r.leave}</TableCell>
                      <TableCell className="text-center text-sm">{r.totalDays}</TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm font-bold ${pctColor(r.pct)}`}>{r.pct}%</span>
                        {r.pct < 75 && <span className="ml-1 text-xs text-red-500">⚠️</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}