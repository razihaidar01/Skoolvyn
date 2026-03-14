import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard, ShieldCheck, GraduationCap, Building, Users, UserCheck,
  Calendar, ClipboardCheck, FileText, IndianRupee, BookOpen, Home, Bus,
  Bell, Settings, LogOut, Menu, X, UserPlus, LucideIcon
} from 'lucide-react';
import { ApprovalManagement } from '@/components/admin/ApprovalManagement';
import { StudentsList } from '@/components/admin/students/StudentsList';
import { StudentForm } from '@/components/admin/students/StudentForm';
import { StudentProfile } from '@/components/admin/students/StudentProfile';
import { formatDistanceToNow, format } from 'date-fns';

interface SidebarItem {
  title: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
}

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  todayAttendance: number;
  feeCollectionThisMonth: number;
  pendingApprovals: number;
  activePrograms: number;
}

const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { title: 'Approvals', icon: ShieldCheck, path: '/admin/approvals' },
  { title: 'Academic Setup', icon: GraduationCap, path: '/admin/academic' },
  { title: 'Departments', icon: Building, path: '/admin/departments' },
  { title: 'Students', icon: Users, path: '/admin/students' },
  { title: 'Staff', icon: UserCheck, path: '/admin/staff' },
  { title: 'Timetable', icon: Calendar, path: '/admin/timetable' },
  { title: 'Attendance', icon: ClipboardCheck, path: '/admin/attendance' },
  { title: 'Examinations', icon: FileText, path: '/admin/examinations' },
  { title: 'Fees', icon: IndianRupee, path: '/admin/fees' },
  { title: 'Library', icon: BookOpen, path: '/admin/library' },
  { title: 'Hostel', icon: Home, path: '/admin/hostel' },
  { title: 'Transport', icon: Bus, path: '/admin/transport' },
  { title: 'Announcements', icon: Bell, path: '/admin/announcements' },
  { title: 'Settings', icon: Settings, path: '/admin/settings' },
];

const comingSoonRoutes = [
  '/admin/academic', '/admin/departments', '/admin/staff',
  '/admin/timetable', '/admin/attendance', '/admin/examinations', '/admin/fees',
  '/admin/library', '/admin/hostel', '/admin/transport', '/admin/announcements',
  '/admin/settings', '/admin/events',
];

function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export default function InstitutionAdminDashboard() {
  const { profile, institutionId, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [institutionName, setInstitutionName] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [feeDefaulters, setFeeDefaulters] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  useEffect(() => {
    if (!institutionId) return;
    fetchAll();
  }, [institutionId]);

  const fetchAll = async () => {
    if (!institutionId) return;
    setLoadingStats(true);
    setLoadingContent(true);

    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    try {
      const [
        instRes, studRes, staffRes, attPresentRes, attTotalRes,
        feeRes, approvalRes, programRes, annRes, eventRes, defaulterRes
      ] = await Promise.all([
        supabase.from('institutions').select('name').eq('id', institutionId).single(),
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId),
        supabase.from('staff').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId),
        supabase.from('student_attendance').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId).eq('date', today).eq('status', 'present'),
        supabase.from('student_attendance').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId).eq('date', today),
        supabase.from('fee_payments').select('amount').eq('institution_id', institutionId).gte('payment_date', startOfMonth),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId).eq('approval_status', 'pending'),
        supabase.from('programs').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId),
        supabase.from('announcements').select('id, title, body, created_at').eq('institution_id', institutionId).order('created_at', { ascending: false }).limit(10),
        supabase.from('events').select('id, title, start_date, event_type').eq('institution_id', institutionId).gte('start_date', today).order('start_date', { ascending: true }).limit(5),
        supabase.from('student_fees').select('id, student_id, net_amount, due_date, status').eq('institution_id', institutionId).neq('status', 'paid').lt('due_date', today).limit(5),
      ]);

      setInstitutionName(instRes.data?.name || '');

      const totalAtt = attTotalRes.count || 0;
      const presentAtt = attPresentRes.count || 0;
      const attendancePct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 1000) / 10 : 0;
      const feeTotal = (feeRes.data || []).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);

      setStats({
        totalStudents: studRes.count || 0,
        totalStaff: staffRes.count || 0,
        todayAttendance: attendancePct,
        feeCollectionThisMonth: feeTotal,
        pendingApprovals: approvalRes.count || 0,
        activePrograms: programRes.count || 0,
      });
      setPendingApprovalCount(approvalRes.count || 0);
      setAnnouncements(annRes.data || []);
      setEvents(eventRes.data || []);
      setFeeDefaulters(defaulterRes.data || []);
    } catch {
      // silently fail
    }
    setLoadingStats(false);
    setLoadingContent(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!institutionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card><CardContent className="p-8 text-center">
          <Building className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground">Institution Not Configured</h3>
          <p className="text-sm text-muted-foreground mt-1">Your account is not linked to any institution.</p>
          <Button className="mt-4" variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </CardContent></Card>
      </div>
    );
  }

  const currentPath = location.pathname;
  const isApprovals = currentPath === '/admin/approvals';
  const isDashboard = currentPath === '/admin/dashboard';
  const isStudentsList = currentPath === '/admin/students';
  const isStudentNew = currentPath === '/admin/students/new';
  const isStudentEdit = currentPath.match(/^\/admin\/students\/[^/]+\/edit$/);
  const isStudentProfile = currentPath.match(/^\/admin\/students\/[^/]+$/) && !isStudentNew;
  const isStudentRoute = isStudentsList || isStudentNew || !!isStudentEdit || !!isStudentProfile;
  const isComingSoon = comingSoonRoutes.includes(currentPath) && !isStudentRoute;
  const comingSoonItem = sidebarItems.find(i => i.path === currentPath);

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents, icon: Users, color: 'text-primary' },
    { label: 'Total Staff', value: stats?.totalStaff, icon: UserCheck, color: 'text-emerald-600' },
    { label: "Today's Attendance", value: stats ? `${stats.todayAttendance}%` : undefined, icon: ClipboardCheck, color: 'text-amber-600' },
    { label: 'Fee Collection (Month)', value: stats ? formatINR(stats.feeCollectionThisMonth) : undefined, icon: IndianRupee, color: 'text-violet-600' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals, icon: ShieldCheck, color: (stats?.pendingApprovals || 0) > 0 ? 'text-destructive' : 'text-muted-foreground', onClick: () => navigate('/admin/approvals') },
    { label: 'Active Programs', value: stats?.activePrograms, icon: GraduationCap, color: 'text-indigo-600' },
  ];

  const quickActions = [
    { label: 'Add Student', icon: UserPlus, path: '/admin/students', color: 'text-primary bg-primary/10' },
    { label: 'Add Staff', icon: UserCheck, path: '/admin/staff', color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Mark Attendance', icon: ClipboardCheck, path: '/admin/attendance', color: 'text-amber-600 bg-amber-50' },
    { label: 'Collect Fee', icon: IndianRupee, path: '/admin/fees', color: 'text-violet-600 bg-violet-50' },
    { label: 'Post Announcement', icon: Bell, path: '/admin/announcements', color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Add Exam', icon: FileText, path: '/admin/examinations', color: 'text-destructive bg-red-50' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-64 bg-primary text-primary-foreground flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-3 px-6 h-16 border-b border-primary-foreground/10">
          <div className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <span className="text-sm font-bold">SK</span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-lg block">Skoolvyn</span>
            {institutionName && <span className="text-xs text-primary-foreground/60 truncate block">{institutionName}</span>}
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const active = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.title}
                {item.title === 'Approvals' && pendingApprovalCount > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">{pendingApprovalCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground hidden lg:block">
            {comingSoonItem?.title || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {profile?.first_name} {profile?.last_name}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">
                {profile?.first_name?.[0] || 'A'}{profile?.last_name?.[0] || ''}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 space-y-6">
          {isStudentRoute ? (
            isStudentNew || isStudentEdit ? <StudentForm /> :
            isStudentProfile ? <StudentProfile /> :
            <StudentsList />
          ) : isApprovals ? (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Staff Approvals</h2>
              <ApprovalManagement mode="institution_admin" onPendingCountChange={setPendingApprovalCount} />
            </div>
          ) : isComingSoon && !isDashboard ? (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
              <Card className="max-w-md w-full">
                <CardContent className="p-12 text-center">
                  {comingSoonItem && <comingSoonItem.icon className="w-16 h-16 text-primary mx-auto mb-4" />}
                  <h2 className="text-xl font-bold text-foreground mb-2">{comingSoonItem?.title || 'Module'}</h2>
                  <p className="text-muted-foreground">This module is coming in the next sprint.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((card) => (
                  <Card
                    key={card.label}
                    className={`shadow-sm ${card.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                    onClick={card.onClick}
                  >
                    <CardContent className="p-5">
                      {loadingStats ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{card.label}</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{card.value ?? 0}</p>
                          </div>
                          <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${card.color}`}>
                            <card.icon className="w-5 h-5" />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Row 2: Activity + Events */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">Recent Activity</h3>
                      <Button variant="link" size="sm" className="text-xs" onClick={() => navigate('/admin/announcements')}>View all</Button>
                    </div>
                    {loadingContent ? (
                      <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                    ) : announcements.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No announcements yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {announcements.map((a) => (
                          <div key={a.id} className="border-b last:border-0 pb-3 last:pb-0">
                            <p className="text-sm font-medium text-foreground">{a.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{a.body?.substring(0, 80)}{a.body?.length > 80 ? '...' : ''}</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">Upcoming Events</h3>
                      <Button variant="link" size="sm" className="text-xs" onClick={() => navigate('/admin/events')}>View all</Button>
                    </div>
                    {loadingContent ? (
                      <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                    ) : events.length === 0 ? (
                      <div className="py-8 text-center">
                        <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No upcoming events</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {events.map((e) => (
                          <div key={e.id} className="flex items-center gap-3 border-b last:border-0 pb-3 last:pb-0">
                            <div className="w-12 h-12 rounded-lg bg-accent flex flex-col items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-accent-foreground">{format(new Date(e.start_date), 'dd')}</span>
                              <span className="text-[10px] text-accent-foreground/70">{format(new Date(e.start_date), 'MMM')}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                              {e.event_type && <Badge variant="secondary" className="text-[10px] mt-1">{e.event_type}</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Fee Defaulters + Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fee Defaulters */}
                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">Fee Defaulters</h3>
                        {feeDefaulters.length > 0 && <Badge variant="destructive" className="text-[10px]">{feeDefaulters.length}</Badge>}
                      </div>
                      <Button variant="link" size="sm" className="text-xs" onClick={() => navigate('/admin/fees')}>View all</Button>
                    </div>
                    {loadingContent ? (
                      <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                    ) : feeDefaulters.length === 0 ? (
                      <div className="py-8 text-center">
                        <span className="text-3xl">🎉</span>
                        <p className="text-sm text-muted-foreground mt-2">No defaulters</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {feeDefaulters.map((d) => (
                          <div key={d.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                            <div>
                              <p className="text-sm font-medium text-foreground">Student #{d.student_id?.substring(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">Due: {d.due_date ? format(new Date(d.due_date), 'dd MMM yyyy') : 'N/A'}</p>
                            </div>
                            <span className="text-sm font-semibold text-destructive">{formatINR(d.net_amount || 0)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => navigate(action.path)}
                          className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] ${action.color}`}
                        >
                          <action.icon className="w-5 h-5 shrink-0" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
