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
import { LogOut, Users, ClipboardCheck, IndianRupee, FileText, Bell, TrendingUp } from 'lucide-react';

export default function ParentPortal() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchChildren();
  }, [user]);

  useEffect(() => {
    if (selectedChild) fetchChildData(selectedChild);
  }, [selectedChild]);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      // Get linked children via parent_student table
      const { data: links } = await (supabase as any)
        .from('parent_student')
        .select('student_id, relation, is_primary')
        .eq('parent_user_id', user!.id);

      if (links?.length) {
        const studentIds = links.map((l: any) => l.student_id);
        const { data: studData } = await (supabase as any)
          .from('students')
          .select('id, full_name, admission_no, batch_id, institution_id, profile_photo_url')
          .in('id', studentIds);
        const enriched = (studData || []).map((s: any) => ({
          ...s,
          relation: links.find((l: any) => l.student_id === s.id)?.relation || 'Parent',
        }));
        setChildren(enriched);
        if (enriched.length > 0) setSelectedChild(enriched[0]);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchChildData = async (child: any) => {
    try {
      const [attRes, feeRes, marksRes, annRes] = await Promise.all([
        (supabase as any).from('student_attendance').select('date, status').eq('student_id', child.id).order('date', { ascending: false }).limit(60),
        (supabase as any).from('student_fees').select('*, fee_categories(name)').eq('student_id', child.id),
        (supabase as any).from('marks').select('*, exams(exam_date, max_marks, pass_marks, subjects(name), exam_types(name))').eq('student_id', child.id).eq('is_published', true),
        (supabase as any).from('announcements').select('title, body, priority, created_at').eq('institution_id', child.institution_id).eq('is_published', true).order('created_at', { ascending: false }).limit(10),
      ]);
      setAttendance(attRes.data || []);
      setFees(feeRes.data || []);
      setMarks(marksRes.data || []);
      setAnnouncements(annRes.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const totalFees = fees.reduce((s, f) => s + (Number(f.net_amount) || 0), 0);
  const paidFees = fees.reduce((s, f) => s + (Number(f.amount_paid) || 0), 0);
  const pendingFees = totalFees - paidFees;
  const validMarks = marks.filter(m => !m.is_absent && m.marks_obtained !== null);
  const avgMarks = validMarks.length > 0
    ? Math.round(validMarks.reduce((s, m) => s + Number(m.marks_obtained || 0), 0) / validMarks.length)
    : 0;

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-3 w-full max-w-md p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );

  if (children.length === 0) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-sm w-full mx-4">
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="font-bold text-lg">No Children Linked</h2>
          <p className="text-sm text-muted-foreground mt-2">Contact your institution admin to link your account with your child's profile.</p>
          <Button variant="outline" className="mt-4" onClick={handleSignOut}><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
        </CardContent>
      </Card>
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
            <span className="font-bold hidden sm:block">Skoolvyn</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile?.first_name} {profile?.last_name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Child Selector */}
        {children.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {children.map(child => (
              <button key={child.id} onClick={() => setSelectedChild(child)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors flex-shrink-0 ${
                  selectedChild?.id === child.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-muted hover:border-primary/50'
                }`}>
                {child.full_name}
              </button>
            ))}
          </div>
        )}

        {/* Child Info Card */}
        {selectedChild && (
          <Card className="bg-primary text-primary-foreground shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-xs uppercase tracking-wide">{selectedChild.relation}</p>
                  <h2 className="text-xl font-bold mt-0.5">{selectedChild.full_name}</h2>
                  <Badge className="bg-white/20 text-white border-0 text-xs mt-2">{selectedChild.admission_no}</Badge>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xl font-bold">{selectedChild.full_name.charAt(0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${attPct >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>{attPct}%</p>
              <p className="text-xs text-muted-foreground">Attendance</p>
              {attPct < 75 && <p className="text-xs text-red-500">⚠️ Low</p>}
            </CardContent>
          </Card>
          <Card className={`shadow-sm ${pendingFees > 0 ? 'bg-amber-50' : ''}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${pendingFees > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {pendingFees > 0 ? `₹${Math.round(pendingFees / 1000)}k` : '✅'}
              </p>
              <p className="text-xs text-muted-foreground">{pendingFees > 0 ? 'Pending' : 'Fees Clear'}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{avgMarks > 0 ? `${avgMarks}%` : '—'}</p>
              <p className="text-xs text-muted-foreground">Avg Marks</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="attendance">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
            <TabsTrigger value="marks" className="text-xs">Results</TabsTrigger>
            <TabsTrigger value="fees" className="text-xs">Fees</TabsTrigger>
            <TabsTrigger value="notices" className="text-xs">Notices</TabsTrigger>
          </TabsList>

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
                    {attendance.slice(0, 20).map(a => (
                      <TableRow key={a.date}>
                        <TableCell className="text-sm">{new Date(a.date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="text-sm">{new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short' })}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs border-0 ${a.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{a.status}</Badge>
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
                  <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Exam</TableHead><TableHead className="text-center">Marks</TableHead><TableHead className="text-center">Result</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {marks.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No results published</TableCell></TableRow>
                    ) : marks.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium text-sm">{m.exams?.subjects?.name || '—'}</TableCell>
                        <TableCell className="text-sm">{m.exams?.exam_types?.name || 'Exam'}</TableCell>
                        <TableCell className="text-center text-sm">
                          {m.is_absent ? <Badge className="bg-red-100 text-red-700 border-0 text-xs">Absent</Badge>
                            : `${m.marks_obtained} / ${m.exams?.max_marks}`}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-xs border-0 ${!m.is_absent && m.marks_obtained >= (m.exams?.pass_marks || 35) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {m.grade || ((!m.is_absent && m.marks_obtained >= (m.exams?.pass_marks || 35)) ? 'Pass' : 'Fail')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEES */}
          <TabsContent value="fees" className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Card className="shadow-sm"><CardContent className="p-3 text-center"><p className="text-base font-bold text-primary">₹{Math.round(totalFees / 1000)}k</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
              <Card className="shadow-sm"><CardContent className="p-3 text-center"><p className="text-base font-bold text-emerald-600">₹{Math.round(paidFees / 1000)}k</p><p className="text-xs text-muted-foreground">Paid</p></CardContent></Card>
              <Card className={`shadow-sm ${pendingFees > 0 ? 'bg-amber-50' : ''}`}><CardContent className="p-3 text-center"><p className={`text-base font-bold ${pendingFees > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>₹{Math.round(pendingFees / 1000)}k</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
            </div>
            <Card className="shadow-sm">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Fee Type</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {fees.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="text-sm font-medium">{f.fee_categories?.name || 'Fee'}</TableCell>
                        <TableCell className="text-sm">₹{Number(f.net_amount || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-sm">{f.due_date ? new Date(f.due_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs border-0 ${f.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{f.status || 'pending'}</Badge>
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
              <Card key={a.id} className={`shadow-sm border-l-4 ${a.priority === 'urgent' ? 'border-l-red-500' : 'border-l-primary'}`}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString('en-IN')}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
