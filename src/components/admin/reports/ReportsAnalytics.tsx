import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, UserCheck, IndianRupee,
  Download, ClipboardCheck, FileText, GraduationCap,
  BookOpen, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#1a56db', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function ReportsAnalytics() {
  const { institutionId } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Overview stats
  const [stats, setStats] = useState({
    totalStudents: 0, totalStaff: 0, totalRevenue: 0,
    avgAttendance: 0, totalBooks: 0, pendingFees: 0,
  });

  // Chart data
  const [monthlyFees, setMonthlyFees] = useState<any[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [studentsByProgram, setStudentsByProgram] = useState<any[]>([]);
  const [staffByDept, setStaffByDept] = useState<any[]>([]);
  const [feeCollectionByMonth, setFeeCollectionByMonth] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<any[]>([]);

  // Report tables
  const [feeDefaulters, setFeeDefaulters] = useState<any[]>([]);
  const [lowAttendance, setLowAttendance] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);

  useEffect(() => {
    if (institutionId) fetchAll();
  }, [institutionId, selectedYear]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;

      const [
        studRes, staffRes, feePayRes, attRes, bookRes,
        pendingFeeRes, programRes, deptRes, marksRes,
        defaulterRes, batchRes
      ] = await Promise.all([
        (supabase as any).from('students').select('id, batch_id, status').eq('institution_id', institutionId!),
        (supabase as any).from('staff').select('id, department_id, status').eq('institution_id', institutionId!),
        (supabase as any).from('fee_payments').select('amount_paid, payment_date').eq('institution_id', institutionId!).gte('payment_date', yearStart).lte('payment_date', yearEnd),
        (supabase as any).from('student_attendance').select('date, status, batch_id').eq('institution_id', institutionId!).gte('date', yearStart).lte('date', yearEnd),
        (supabase as any).from('library_books').select('id, total_copies, available_copies').eq('institution_id', institutionId!),
        (supabase as any).from('student_fees').select('net_amount, amount_paid, status').eq('institution_id', institutionId!).neq('status', 'paid'),
        (supabase as any).from('programs').select('id, name').eq('institution_id', institutionId!).eq('is_active', true),
        (supabase as any).from('departments').select('id, name').eq('institution_id', institutionId!).eq('is_active', true),
        (supabase as any).from('marks').select('student_id, marks_obtained, exam_id, is_absent').eq('institution_id', institutionId!),
        (supabase as any).from('student_fees').select('student_id, net_amount, amount_paid, due_date').eq('institution_id', institutionId!).neq('status', 'paid').lt('due_date', today).limit(10),
        (supabase as any).from('batches').select('id, name, program_id').eq('institution_id', institutionId!),
      ]);

      const allStudents = studRes.data || [];
      const allStaff = staffRes.data || [];
      const allPayments = feePayRes.data || [];
      const allAtt = attRes.data || [];
      const allBooks = bookRes.data || [];
      const pendingFees = pendingFeeRes.data || [];
      const allPrograms = programRes.data || [];
      const allDepts = deptRes.data || [];
      const allMarks = marksRes.data || [];
      const allBatches = batchRes.data || [];

      // Overview stats
      const totalRevenue = allPayments.reduce((s: number, p: any) => s + (Number(p.amount_paid) || 0), 0);
      const presentAtt = allAtt.filter((a: any) => a.status === 'present').length;
      const avgAtt = allAtt.length > 0 ? Math.round((presentAtt / allAtt.length) * 100) : 0;
      const totalPending = pendingFees.reduce((s: number, f: any) => s + Math.max(0, (Number(f.net_amount) || 0) - (Number(f.amount_paid) || 0)), 0);

      setStats({
        totalStudents: allStudents.filter((s: any) => s.status === 'active').length,
        totalStaff: allStaff.filter((s: any) => s.status === 'active').length,
        totalRevenue,
        avgAttendance: avgAtt,
        totalBooks: allBooks.reduce((s: number, b: any) => s + (b.total_copies || 0), 0),
        pendingFees: totalPending,
      });

      // Monthly fee collection
      const monthlyMap: Record<number, number> = {};
      allPayments.forEach((p: any) => {
        const m = new Date(p.payment_date).getMonth();
        monthlyMap[m] = (monthlyMap[m] || 0) + Number(p.amount_paid || 0);
      });
      setMonthlyFees(MONTHS.map((m, i) => ({ month: m, amount: Math.round(monthlyMap[i] || 0) })));

      // Monthly attendance trend
      const attByMonth: Record<number, { present: number; total: number }> = {};
      allAtt.forEach((a: any) => {
        const m = new Date(a.date).getMonth();
        if (!attByMonth[m]) attByMonth[m] = { present: 0, total: 0 };
        attByMonth[m].total++;
        if (a.status === 'present') attByMonth[m].present++;
      });
      setAttendanceTrend(MONTHS.map((m, i) => ({
        month: m,
        attendance: attByMonth[i] ? Math.round((attByMonth[i].present / attByMonth[i].total) * 100) : 0,
      })));

      // Students by program
      const batchProgramMap: Record<string, string> = {};
      allBatches.forEach((b: any) => { batchProgramMap[b.id] = b.program_id; });
      const programStudentCount: Record<string, number> = {};
      allStudents.filter((s: any) => s.status === 'active').forEach((s: any) => {
        const programId = batchProgramMap[s.batch_id];
        if (programId) programStudentCount[programId] = (programStudentCount[programId] || 0) + 1;
      });
      setStudentsByProgram(allPrograms.map((p: any) => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        students: programStudentCount[p.id] || 0,
      })).filter((p: any) => p.students > 0));

      // Staff by department
      const deptStaffCount: Record<string, number> = {};
      allStaff.filter((s: any) => s.status === 'active').forEach((s: any) => {
        if (s.department_id) deptStaffCount[s.department_id] = (deptStaffCount[s.department_id] || 0) + 1;
      });
      setStaffByDept(allDepts.map((d: any) => ({
        name: d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name,
        staff: deptStaffCount[d.id] || 0,
      })).filter((d: any) => d.staff > 0));

      // Fee defaulters with student info
      if (defaulterRes.data?.length) {
        const studentIds = defaulterRes.data.map((d: any) => d.student_id);
        const { data: studData } = await (supabase as any).from('students')
          .select('id, full_name, admission_no, batch_id').in('id', studentIds);
        const studMap: Record<string, any> = {};
        (studData || []).forEach((s: any) => { studMap[s.id] = s; });
        setFeeDefaulters(defaulterRes.data.map((d: any) => ({
          ...d,
          student: studMap[d.student_id],
          pending: Math.max(0, (Number(d.net_amount) || 0) - (Number(d.amount_paid) || 0)),
          daysOverdue: Math.ceil((new Date().getTime() - new Date(d.due_date).getTime()) / (1000 * 60 * 60 * 24)),
        })));
      }

      // Exam marks - top students
      const studentMarkTotals: Record<string, { total: number; count: number }> = {};
      allMarks.filter((m: any) => !m.is_absent && m.marks_obtained !== null).forEach((m: any) => {
        if (!studentMarkTotals[m.student_id]) studentMarkTotals[m.student_id] = { total: 0, count: 0 };
        studentMarkTotals[m.student_id].total += Number(m.marks_obtained || 0);
        studentMarkTotals[m.student_id].count++;
      });
      const topIds = Object.entries(studentMarkTotals)
        .map(([id, v]) => ({ id, avg: v.count > 0 ? Math.round(v.total / v.count) : 0 }))
        .sort((a, b) => b.avg - a.avg).slice(0, 10);
      if (topIds.length > 0) {
        const { data: topStudData } = await (supabase as any).from('students')
          .select('id, full_name, admission_no').in('id', topIds.map(t => t.id));
        const topStudMap: Record<string, any> = {};
        (topStudData || []).forEach((s: any) => { topStudMap[s.id] = s; });
        setTopStudents(topIds.map((t, i) => ({ rank: i + 1, ...topStudMap[t.id], avg: t.avg })));
      }

    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const formatINR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

  const exportCSV = (data: any[], filename: string, headers: string[], row: (d: any) => string) => {
    const csv = headers.join(',') + '\n' + data.map(row).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  const StatCard = ({ label, value, icon: Icon, color, sub }: any) => (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${color} mt-0.5`}>{loading ? '—' : value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-full bg-opacity-10 flex items-center justify-center ${color.replace('text-', 'bg-')}/10`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Institution-wide insights and reports</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[0,1,2].map(i => {
              const y = (new Date().getFullYear() - i).toString();
              return <SelectItem key={y} value={y}>{y}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Students" value={stats.totalStudents} icon={Users} color="text-primary" />
        <StatCard label="Total Staff" value={stats.totalStaff} icon={UserCheck} color="text-emerald-600" />
        <StatCard label={`Revenue ${selectedYear}`} value={formatINR(stats.totalRevenue)} icon={IndianRupee} color="text-violet-600" />
        <StatCard label="Avg Attendance" value={`${stats.avgAttendance}%`} icon={ClipboardCheck} color="text-amber-600" />
        <StatCard label="Library Books" value={stats.totalBooks} icon={BookOpen} color="text-blue-600" />
        <StatCard label="Pending Fees" value={formatINR(stats.pendingFees)} icon={AlertCircle} color="text-red-500" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview Charts</TabsTrigger>
          <TabsTrigger value="fees">Fee Report</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Report</TabsTrigger>
          <TabsTrigger value="academic">Academic Report</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW CHARTS ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Fee Collection */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Fee Collection — {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-48 w-full" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyFees} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : v} />
                      <Tooltip formatter={(v: any) => formatINR(v)} />
                      <Bar dataKey="amount" fill="#1a56db" radius={[4, 4, 0, 0]} name="Collected" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Attendance Trend */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Attendance % — {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-48 w-full" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={attendanceTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={(v: any) => `${v}%`} />
                      <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Attendance %" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Students by Program */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Students by Program</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-48 w-full" /> : studentsByProgram.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={studentsByProgram} dataKey="students" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {studentsByProgram.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Staff by Department */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Staff by Department</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-48 w-full" /> : staffByDept.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={staffByDept} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="staff" fill="#10b981" radius={[0, 4, 4, 0]} name="Staff" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── FEE REPORT ── */}
        <TabsContent value="fees" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Fee Defaulters</h3>
            <Button variant="outline" size="sm" onClick={() => exportCSV(
              feeDefaulters,
              'fee-defaulters.csv',
              ['Name', 'Admission No', 'Pending (₹)', 'Due Date', 'Days Overdue'],
              d => `"${d.student?.full_name || '—'}","${d.student?.admission_no || '—'}",${d.pending},"${d.due_date}",${d.daysOverdue}`
            )}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Pending Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ) : feeDefaulters.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-emerald-600 font-medium">🎉 No fee defaulters!</TableCell></TableRow>
                  ) : feeDefaulters.map((d, i) => (
                    <TableRow key={i} className="bg-red-50/30">
                      <TableCell className="font-medium text-sm">{d.student?.full_name || '—'}</TableCell>
                      <TableCell className="text-sm">{d.student?.admission_no || '—'}</TableCell>
                      <TableCell className="text-sm font-bold text-red-500">{formatINR(d.pending)}</TableCell>
                      <TableCell className="text-sm">{new Date(d.due_date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell><Badge className="bg-red-100 text-red-700 border-0 text-xs">{d.daysOverdue} days</Badge></TableCell>
                      <TableCell><Badge className="bg-red-100 text-red-700 border-0 text-xs">Overdue</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Monthly collection chart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Month-wise Collection — {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyFees}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v/1000)}k` : v} />
                  <Tooltip formatter={(v: any) => formatINR(v)} />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Collected (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ATTENDANCE REPORT ── */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">{stats.avgAttendance}%</p>
                <p className="text-xs text-muted-foreground mt-1">Overall Average</p>
              </CardContent>
            </Card>
            <Card className={`shadow-sm ${stats.avgAttendance >= 75 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${stats.avgAttendance >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {stats.avgAttendance >= 75 ? '✅' : '⚠️'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stats.avgAttendance >= 75 ? 'Above 75% target' : 'Below 75% target'}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-foreground">{selectedYear}</p>
                <p className="text-xs text-muted-foreground mt-1">Academic Year</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Attendance Trend — {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#1a56db" strokeWidth={2.5} dot={{ r: 4 }} name="Monthly Attendance %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ACADEMIC REPORT ── */}
        <TabsContent value="academic" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Top Performing Students</h3>
            <Button variant="outline" size="sm" onClick={() => exportCSV(
              topStudents,
              'top-students.csv',
              ['Rank', 'Name', 'Admission No', 'Average Marks'],
              d => `${d.rank},"${d.full_name || '—'}","${d.admission_no || '—'}",${d.avg}`
            )}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Average Marks</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                  ) : topStudents.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No exam data available</TableCell></TableRow>
                  ) : topStudents.map(s => {
                    const grade = s.avg >= 90 ? 'A+' : s.avg >= 80 ? 'A' : s.avg >= 70 ? 'B+' : s.avg >= 60 ? 'B' : s.avg >= 50 ? 'C' : 'D';
                    const gradeColor = ['A+','A'].includes(grade) ? 'text-emerald-600' : ['B+','B'].includes(grade) ? 'text-blue-600' : 'text-amber-600';
                    return (
                      <TableRow key={s.rank} className={s.rank <= 3 ? 'bg-amber-50/50' : ''}>
                        <TableCell>
                          <span className={`text-lg font-bold ${s.rank === 1 ? 'text-amber-500' : s.rank === 2 ? 'text-slate-400' : s.rank === 3 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                            {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : `#${s.rank}`}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{s.full_name || '—'}</TableCell>
                        <TableCell className="text-sm">{s.admission_no || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${s.avg}%` }} />
                            </div>
                            <span className="text-sm font-bold">{s.avg}%</span>
                          </div>
                        </TableCell>
                        <TableCell><span className={`text-sm font-bold ${gradeColor}`}>{grade}</span></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Active Programs', value: studentsByProgram.length, icon: GraduationCap, color: 'text-purple-600' },
              { label: 'Active Students', value: stats.totalStudents, icon: Users, color: 'text-primary' },
              { label: 'Active Staff', value: stats.totalStaff, icon: UserCheck, color: 'text-emerald-600' },
              { label: 'Library Books', value: stats.totalBooks, icon: BookOpen, color: 'text-blue-600' },
            ].map(s => (
              <Card key={s.label} className="shadow-sm">
                <CardContent className="p-4">
                  <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                  <p className={`text-2xl font-bold ${s.color}`}>{loading ? '—' : s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}