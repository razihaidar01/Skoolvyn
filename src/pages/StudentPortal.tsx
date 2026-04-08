import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  LogOut, GraduationCap, ClipboardCheck, IndianRupee,
  FileText, Bell, Calendar, BookOpen, User, TrendingUp
} from 'lucide-react';

export default function StudentPortal() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Get student record linked to this user
      const { data: studData } = await (supabase as any)
        .from('students')
        .select('*, batches(name, program_id), programs:batches(programs(name))')
        .eq('user_id', user!.id)
        .single();

      // Try by email if user_id not found
      let studentRecord = studData;
      if (!studentRecord && profile?.email) {
        const { data: byEmail } = await (supabase as any)
          .from('students')
          .select('*')
          .eq('email', profile.email)
          .single();
        studentRecord = byEmail;
      }

      if (!studentRecord) { setLoading(false); return; }
      setStudent(studentRecord);

      const instId = studentRecord.institution_id;
      const studId = studentRecord.id;
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const [attRes, feeRes, marksRes, annRes, eventRes, ttRes] = await Promise.all([
        (supabase as any).from('student_attendance').select('date, status, remarks').eq('student_id', studId).order('date', { ascending: false }).limit(60),
        (supabase as any).from('student_fees').select('*, fee_categories(name)').eq('student_id', studId),
        (supabase as any).from('marks').select('*, exams(exam_date, max_marks, pass_marks, subjects(name), exam_types(name))').eq('student_id', studId).eq('is_published', true),
        (supabase as any).from('announcements').select('title, body, priority, created_at').eq('institution_id', instId).eq('is_published', true).order('created_at', { ascending: false }).limit(10),
        (supabase as any).from('events').select('title, start_date, event_type, venue').eq('institution_id', instId).gte('start_date', today).order('start_date').limit(5),
        studentRecord.batch_id ? (supabase as any).from('timetable').select('*, subjects(name, code), staff(full_name)').eq('batch_id', studentRecord.batch_id).eq('is_active', true).order('day_of_week').order('period_no') : Promise.resolve({ data: [] }),
      ]);

      setAttendance(attRes.data || []);
      setFees(feeRes.data || []);
      setMarks(marksRes.data || []);
      setAnnouncements(annRes.data || []);
      setEvents(eventRes.data || []);
      setTimetable(ttRes.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  // Attendance stats
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Fee stats
  const totalFees = fees.reduce((s, f) => s + (Number(f.net_amount) || 0), 0);
  const paidFees = fees.reduce((s, f) => s + (Number(f.amount_paid) || 0), 0);
  const pendingFees = totalFees - paidFees;

  // Marks stats
  const validMarks = marks.filter(m => !m.is_absent && m.marks_obtained !== null);
  const avgMarks = validMarks.length > 0
    ? Math.round(validMarks.reduce((s, m) => s + Number(m.marks_obtained || 0), 0) / validMarks.length)
    : 0;

  const DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        <div className="max-w-4xl mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">SK</span>
            </div>
            <span className="font-bold text-foreground hidden sm:block">Skoolvyn</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{student?.full_name || profile?.first_name}</p>
              <p className="text-xs text-muted-foreground">{student?.admission_no}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {(student?.full_name || profile?.first_name || 'S').charAt(0)}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Card */}
        <Card className="bg-primary text-primary-foreground shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm">Welcome back,</p>
                <h1 className="text-xl font-bold mt-0.5">{student?.full_name || profile?.first_name || 'Student'}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {student?.admission_no && <Badge className="bg-white/20 text-white border-0 text-xs">{student.admission_no}</Badge>}
                  {student?.batch_id && <Badge className="bg-white/20 text-white border-0 text-xs">Class Student</Badge>}
                </div>
              </div>
              <GraduationCap className="w-12 h-12 text-primary-foreground/30" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <ClipboardCheck className={`w-6 h-6 mx-auto mb-1 ${attPct >= 75 ? 'text-emerald-500' : 'text-red-500'}`} />
              <p className={`text-2xl font-bold ${attPct >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>{attPct}%</p>
              <p className="text-xs text-muted-foreground">Attendance</p>
              {attPct < 75 && <p className="text-xs text-red-500 mt-0.5">⚠️ Below 75%</p>}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <IndianRupee className="w-6 h-6 mx-auto mb-1 text-amber-500" />
              <p className={`text-2xl font-bold ${pendingFees > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {pendingFees > 0 ? `₹${Math.round(pendingFees / 1000)}k` : '✅'}
              </p>
              <p className="text-xs text-muted-foreground">{pendingFees > 0 ? 'Fee Pending' : 'Fees Clear'}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-primary">{avgMarks > 0 ? `${avgMarks}%` : '—'}</p>
              <p className="text-xs text-muted-foreground">Avg Marks</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="timetable">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="timetable" className="text-xs"><Calendar className="w-3 h-3 mr-1 hidden sm:inline" />Schedule</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs"><ClipboardCheck className="w-3 h-3 mr-1 hidden sm:inline" />Attendance</TabsTrigger>
            <TabsTrigger value="marks" className="text-xs"><FileText className="w-3 h-3 mr-1 hidden sm:inline" />Results</TabsTrigger>
            <TabsTrigger value="fees" className="text-xs"><IndianRupee className="w-3 h-3 mr-1 hidden sm:inline" />Fees</TabsTrigger>
            <TabsTrigger value="notices" className="text-xs"><Bell className="w-3 h-3 mr-1 hidden sm:inline" />Notices</TabsTrigger>
          </TabsList>

          {/* TIMETABLE */}
          <TabsContent value="timetable" className="space-y-3">
            {timetable.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No timetable available</CardContent></Card>
            ) : (
              <Card className="shadow-sm overflow-x-auto">
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 text-left">Day</th>
                        {Array.from(new Set(timetable.map(t => t.period_no))).sort().map(p => (
                          <th key={p} className="p-2 text-center">P{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1,2,3,4,5,6].map(day => {
                        const dayEntries = timetable.filter(t => t.day_of_week === day);
                        if (dayEntries.length === 0 && day === 6) return null;
                        const periods = Array.from(new Set(timetable.map(t => t.period_no))).sort();
                        return (
                          <tr key={day} className="border-t">
                            <td className="p-2 font-medium bg-muted/20">{DAYS[day]}</td>
                            {periods.map(p => {
                              const entry = dayEntries.find(t => t.period_no === p);
                              return (
                                <td key={p} className="p-1 text-center">
                                  {entry ? (
                                    <div className="bg-primary/10 rounded p-1">
                                      <p className="font-medium text-primary">{entry.subjects?.code || entry.subjects?.name?.substring(0, 6)}</p>
                                      <p className="text-muted-foreground">{entry.start_time?.substring(0, 5)}</p>
                                    </div>
                                  ) : <span className="text-muted-foreground/30">—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Events */}
            {events.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Upcoming Events</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {events.map(e => (
                    <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                        <p className="text-xs text-muted-foreground">{new Date(e.start_date).toLocaleDateString('en-IN', { month: 'short' })}</p>
                        <p className="text-sm font-bold text-primary">{new Date(e.start_date).getDate()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{e.title}</p>
                        {e.venue && <p className="text-xs text-muted-foreground">{e.venue}</p>}
                      </div>
                      <Badge className="ml-auto text-xs capitalize bg-primary/10 text-primary border-0">{e.event_type}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ATTENDANCE */}
          <TabsContent value="attendance" className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Card className="shadow-sm"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-emerald-600">{presentDays}</p><p className="text-xs text-muted-foreground">Present</p></CardContent></Card>
              <Card className="shadow-sm"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-red-500">{attendance.filter(a => a.status === 'absent').length}</p><p className="text-xs text-muted-foreground">Absent</p></CardContent></Card>
              <Card className="shadow-sm"><CardContent className="p-3 text-center"><p className={`text-xl font-bold ${attPct >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>{attPct}%</p><p className="text-xs text-muted-foreground">Overall</p></CardContent></Card>
            </div>
            <Card className="shadow-sm">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Day</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {attendance.slice(0, 30).map(a => (
                      <TableRow key={a.date}>
                        <TableCell className="text-sm">{new Date(a.date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="text-sm">{new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short' })}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs border-0 ${a.status === 'present' ? 'bg-emerald-100 text-emerald-700' : a.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {a.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MARKS */}
          <TabsContent value="marks">
            <Card className="shadow-sm">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Exam</TableHead><TableHead>Date</TableHead><TableHead className="text-center">Marks</TableHead><TableHead className="text-center">Grade</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {marks.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No results published yet</TableCell></TableRow>
                    ) : marks.map(m => {
                      const pct = m.exams?.max_marks ? Math.round((m.marks_obtained / m.exams.max_marks) * 100) : 0;
                      const passed = !m.is_absent && m.marks_obtained >= (m.exams?.pass_marks || 35);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium text-sm">{m.exams?.subjects?.name || '—'}</TableCell>
                          <TableCell className="text-sm">{m.exams?.exam_types?.name || 'Exam'}</TableCell>
                          <TableCell className="text-sm">{m.exams?.exam_date ? new Date(m.exams.exam_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                          <TableCell className="text-center">
                            {m.is_absent ? <Badge className="bg-red-100 text-red-700 border-0 text-xs">Absent</Badge>
                              : <span className="text-sm font-medium">{m.marks_obtained} / {m.exams?.max_marks}</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`text-xs border-0 ${passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {m.grade || (passed ? 'Pass' : 'Fail')}
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

          {/* FEES */}
          <TabsContent value="fees" className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Card className="shadow-sm"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-primary">₹{Math.round(totalFees / 1000)}k</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
              <Card className="shadow-sm"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-600">₹{Math.round(paidFees / 1000)}k</p><p className="text-xs text-muted-foreground">Paid</p></CardContent></Card>
              <Card className={`shadow-sm ${pendingFees > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}><CardContent className="p-3 text-center"><p className={`text-lg font-bold ${pendingFees > 0 ? 'text-red-500' : 'text-emerald-600'}`}>₹{Math.round(pendingFees / 1000)}k</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
            </div>
            <Card className="shadow-sm">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Fee Type</TableHead><TableHead>Amount</TableHead><TableHead>Paid</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {fees.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No fee records</TableCell></TableRow>
                    ) : fees.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium text-sm">{f.fee_categories?.name || 'Fee'}</TableCell>
                        <TableCell className="text-sm">₹{Number(f.net_amount || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-sm">₹{Number(f.amount_paid || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-sm">{f.due_date ? new Date(f.due_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs border-0 ${f.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : f.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {f.status || 'pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    {a.priority === 'urgent' && <Badge className="bg-red-100 text-red-700 border-0 text-xs flex-shrink-0">Urgent</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
