import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard, Building2, CreditCard, Bell, Settings, LogOut,
  Plus, Menu, X, Users, IndianRupee, Eye, Pencil, Ban, ShieldCheck,
  TrendingUp, CheckCircle2, XCircle, Search, Download, RefreshCw,
  BarChart2, Globe, Mail, Phone, MapPin, Loader2, AlertCircle
} from 'lucide-react';
import { ApprovalManagement } from '@/components/admin/ApprovalManagement';
import { format, formatDistanceToNow } from 'date-fns';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PLANS = ['starter', 'growth', 'enterprise'];
const PLAN_PRICES: Record<string, number> = { starter: 3999, growth: 9999, enterprise: 24999 };

const sidebarItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/super-admin/dashboard' },
  { title: 'Approvals', icon: ShieldCheck, path: '/super-admin/approvals' },
  { title: 'Institutions', icon: Building2, path: '/super-admin/institutions' },
  { title: 'Subscriptions', icon: CreditCard, path: '/super-admin/subscriptions' },
  { title: 'Announcements', icon: Bell, path: '/super-admin/announcements' },
  { title: 'Settings', icon: Settings, path: '/super-admin/settings' },
];

export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedInst, setSelectedInst] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annDialog, setAnnDialog] = useState(false);
  const [annEditId, setAnnEditId] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0, active: 0, pending: 0, suspended: 0,
    totalStudents: 0, totalStaff: 0,
    monthlyRevenue: 0, annualRevenue: 0,
  });
  const [monthlyGrowth, setMonthlyGrowth] = useState<any[]>([]);
  const [planDist, setPlanDist] = useState<any[]>([]);

  // Forms
  const [instForm, setInstForm] = useState({ name: '', type: 'school', email: '', phone: '', city: '', state: '', plan: 'starter' });
  const [editInstId, setEditInstId] = useState<string | null>(null);
  const [annForm, setAnnForm] = useState({ title: '', body: '', priority: 'normal', audience: 'all' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [instRes, studRes, staffRes, annRes] = await Promise.all([
        (supabase as any).from('institutions').select('*').order('created_at', { ascending: false }),
        (supabase as any).from('students').select('institution_id'),
        (supabase as any).from('staff').select('institution_id'),
        (supabase as any).from('announcements').select('*').is('institution_id', null).order('created_at', { ascending: false }).limit(20),
      ]);

      const insts = instRes.data || [];
      const studs = studRes.data || [];
      const staffs = staffRes.data || [];

      // Student count per institution
      const studMap: Record<string, number> = {};
      studs.forEach((s: any) => { studMap[s.institution_id] = (studMap[s.institution_id] || 0) + 1; });
      const staffMap: Record<string, number> = {};
      staffs.forEach((s: any) => { staffMap[s.institution_id] = (staffMap[s.institution_id] || 0) + 1; });

      const enriched = insts.map((i: any) => ({
        ...i,
        student_count: studMap[i.id] || 0,
        staff_count: staffMap[i.id] || 0,
        monthly_fee: PLAN_PRICES[i.plan] || 0,
      }));
      setInstitutions(enriched);
      setAnnouncements(annRes.data || []);

      // Stats
      const active = enriched.filter((i: any) => i.is_active && i.approval_status === 'approved').length;
      const pending = enriched.filter((i: any) => i.approval_status === 'pending').length;
      const suspended = enriched.filter((i: any) => i.approval_status === 'suspended' || (!i.is_active && i.approval_status !== 'pending')).length;
      const monthlyRev = enriched.filter((i: any) => i.is_active).reduce((s: number, i: any) => s + (PLAN_PRICES[i.plan] || 0), 0);

      setStats({
        total: enriched.length,
        active, pending, suspended,
        totalStudents: studs.length,
        totalStaff: staffs.length,
        monthlyRevenue: monthlyRev,
        annualRevenue: monthlyRev * 12,
      });

      // Monthly growth (institutions created per month this year)
      const year = new Date().getFullYear();
      const monthCount: Record<number, number> = {};
      enriched.forEach((i: any) => {
        const d = new Date(i.created_at);
        if (d.getFullYear() === year) {
          monthCount[d.getMonth()] = (monthCount[d.getMonth()] || 0) + 1;
        }
      });
      setMonthlyGrowth(MONTHS.map((m, i) => ({ month: m, institutions: monthCount[i] || 0 })));

      // Plan distribution
      const planCount: Record<string, number> = {};
      enriched.filter((i: any) => i.is_active).forEach((i: any) => {
        planCount[i.plan || 'starter'] = (planCount[i.plan || 'starter'] || 0) + 1;
      });
      setPlanDist(Object.entries(planCount).map(([plan, count]) => ({ plan: plan.charAt(0).toUpperCase() + plan.slice(1), count })));

    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const saveInstitution = async () => {
    if (!instForm.name.trim() || !instForm.email.trim()) {
      toast({ title: 'Name and Email required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const payload = {
        name: instForm.name.trim(), type: instForm.type,
        email: instForm.email.trim(), phone: instForm.phone || null,
        city: instForm.city || null, state: instForm.state || null,
        plan: instForm.plan, is_active: true, approval_status: 'approved',
      };
      if (editInstId) {
        await (supabase as any).from('institutions').update(payload).eq('id', editInstId);
        toast({ title: '✅ Institution updated!' });
      } else {
        await (supabase as any).from('institutions').insert(payload);
        toast({ title: '✅ Institution added!' });
      }
      setSheetOpen(false);
      setEditInstId(null);
      setInstForm({ name: '', type: 'school', email: '', phone: '', city: '', state: '', plan: 'starter' });
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const toggleStatus = async (inst: any) => {
    const newActive = !inst.is_active;
    await (supabase as any).from('institutions').update({ is_active: newActive, approval_status: newActive ? 'approved' : 'suspended' }).eq('id', inst.id);
    toast({ title: newActive ? '✅ Institution activated' : '⚠️ Institution suspended' });
    fetchAll();
  };

  const updatePlan = async (instId: string, plan: string) => {
    await (supabase as any).from('institutions').update({ plan }).eq('id', instId);
    toast({ title: `Plan updated to ${plan}` });
    fetchAll();
  };

  const openEdit = (inst: any) => {
    setEditInstId(inst.id);
    setInstForm({ name: inst.name, type: inst.type || 'school', email: inst.email || '', phone: inst.phone || '', city: inst.city || '', state: inst.state || '', plan: inst.plan || 'starter' });
    setSheetOpen(true);
  };

  const exportCSV = () => {
    const rows = filteredInstitutions.map(i =>
      `"${i.name}","${i.type}","${i.plan}","${i.is_active ? 'Active' : 'Inactive'}",${i.student_count},${i.staff_count},"${i.city || ''}","${i.state || ''}","${i.email || ''}"`
    );
    const csv = 'Name,Type,Plan,Status,Students,Staff,City,State,Email\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'institutions.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // Announcements (platform-wide)
  const saveAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.body.trim()) {
      toast({ title: 'Title and body required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const payload = { title: annForm.title.trim(), body: annForm.body.trim(), priority: annForm.priority, is_published: true, institution_id: null };
      if (annEditId) await (supabase as any).from('announcements').update(payload).eq('id', annEditId);
      else await (supabase as any).from('announcements').insert(payload);
      toast({ title: '✅ Announcement sent!' });
      setAnnDialog(false); setAnnEditId(null);
      setAnnForm({ title: '', body: '', priority: 'normal', audience: 'all' });
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const filteredInstitutions = institutions.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.email?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = filterPlan === 'all' || i.plan === filterPlan;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && i.is_active && i.approval_status === 'approved') ||
      (filterStatus === 'pending' && i.approval_status === 'pending') ||
      (filterStatus === 'suspended' && (!i.is_active || i.approval_status === 'suspended'));
    return matchSearch && matchPlan && matchStatus;
  });

  const currentPath = location.pathname;
  const isDashboard = currentPath === '/super-admin/dashboard';
  const isApprovals = currentPath === '/super-admin/approvals';
  const isInstitutions = currentPath === '/super-admin/institutions';
  const isSubscriptions = currentPath === '/super-admin/subscriptions';
  const isAnnouncements = currentPath === '/super-admin/announcements';
  const isSettings = currentPath === '/super-admin/settings';

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-64 bg-primary text-primary-foreground flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-3 px-6 h-16 border-b border-primary-foreground/10">
          <div className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <span className="text-sm font-bold">SK</span>
          </div>
          <span className="font-bold text-lg">Skoolvyn</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <div className="px-3 py-2 border-b border-primary-foreground/10">
          <p className="text-xs text-primary-foreground/50 uppercase tracking-wide px-3 mb-1">Super Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map(item => {
            const active = currentPath === item.path;
            return (
              <button key={item.path} onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground'}`}>
                <item.icon className="w-5 h-5" />
                {item.title}
                {item.title === 'Approvals' && pendingApprovalCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">{pendingApprovalCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="px-3 pb-4 border-t border-primary-foreground/10 pt-3">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-primary-foreground/70">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-xs text-primary-foreground/50">Super Admin</p>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors">
            <LogOut className="w-5 h-5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
            <h1 className="text-base font-semibold text-foreground">
              {isDashboard ? 'Dashboard' : isApprovals ? 'Approvals' : isInstitutions ? 'Institutions' : isSubscriptions ? 'Subscriptions' : isAnnouncements ? 'Announcements' : 'Settings'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchAll}><RefreshCw className="w-4 h-4" /></Button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">{profile?.first_name?.[0] || 'A'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-auto">

          {/* ── DASHBOARD ── */}
          {isDashboard && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Institutions', value: stats.total, icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
                  { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Pending Approval', value: stats.pending, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Monthly Revenue', value: `₹${Math.round(stats.monthlyRevenue / 1000)}k`, icon: IndianRupee, color: 'text-violet-600', bg: 'bg-violet-50' },
                  { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Total Staff', value: stats.totalStaff, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Annual Revenue', value: `₹${Math.round(stats.annualRevenue / 100000)}L`, icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                  { label: 'Suspended', value: stats.suspended, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
                ].map(s => (
                  <Card key={s.label} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className={`text-2xl font-bold ${s.color} mt-0.5`}>
                            {loading ? <Skeleton className="h-7 w-16 inline-block" /> : s.value}
                          </p>
                        </div>
                        <div className={`w-9 h-9 rounded-full ${s.bg} flex items-center justify-center`}>
                          <s.icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Institution Growth — {new Date().getFullYear()}</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={monthlyGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="institutions" fill="#1a56db" radius={[4,4,0,0]} name="New Institutions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Plan Distribution</CardTitle></CardHeader>
                  <CardContent>
                    {planDist.length === 0 ? (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={planDist} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="plan" type="category" tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10b981" radius={[0,4,4,0]} name="Institutions" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Institutions */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Recent Institutions</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => navigate('/super-admin/institutions')}>View All</Button>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {institutions.slice(0, 5).map(i => (
                        <TableRow key={i.id}>
                          <TableCell>
                            <p className="font-medium text-sm">{i.name}</p>
                            <p className="text-xs text-muted-foreground">{i.city}{i.state ? `, ${i.state}` : ''}</p>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="capitalize text-xs">{i.plan}</Badge></TableCell>
                          <TableCell className="text-sm">{i.student_count}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs border-0 ${i.is_active && i.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : i.approval_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {i.approval_status === 'pending' ? 'Pending' : i.is_active ? 'Active' : 'Suspended'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(i.created_at), { addSuffix: true })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── APPROVALS ── */}
          {isApprovals && (
            <ApprovalManagement mode="super_admin" onPendingCountChange={setPendingApprovalCount} />
          )}

          {/* ── INSTITUTIONS ── */}
          {isInstitutions && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-3 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
                  </div>
                  <Select value={filterPlan} onValueChange={setFilterPlan}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Plan" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      {PLANS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Export</Button>
                  <Button size="sm" onClick={() => { setEditInstId(null); setInstForm({ name: '', type: 'school', email: '', phone: '', city: '', state: '', plan: 'starter' }); setSheetOpen(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>

              <Card className="shadow-sm">
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Institution</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-center">Students</TableHead>
                        <TableHead className="text-center">Staff</TableHead>
                        <TableHead>Monthly Fee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
                      ) : filteredInstitutions.length === 0 ? (
                        <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No institutions found</TableCell></TableRow>
                      ) : filteredInstitutions.map(inst => (
                        <TableRow key={inst.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{inst.name}</p>
                              <p className="text-xs text-muted-foreground">{inst.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm capitalize">{inst.type}</TableCell>
                          <TableCell>
                            <Select value={inst.plan || 'starter'} onValueChange={v => updatePlan(inst.id, v)}>
                              <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{PLANS.map(p => <SelectItem key={p} value={p} className="capitalize text-xs">{p}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-center text-sm">{inst.student_count}</TableCell>
                          <TableCell className="text-center text-sm">{inst.staff_count}</TableCell>
                          <TableCell className="text-sm">₹{(PLAN_PRICES[inst.plan] || 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs border-0 cursor-pointer ${inst.is_active && inst.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : inst.approval_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}
                              onClick={() => toggleStatus(inst)}>
                              {inst.approval_status === 'pending' ? 'Pending' : inst.is_active ? 'Active' : 'Suspended'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(inst.created_at), 'dd MMM yy')}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedInst(inst); setDetailDialog(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(inst)}><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className={`h-7 w-7 ${inst.is_active ? 'text-red-500' : 'text-emerald-600'}`} onClick={() => toggleStatus(inst)}>
                                {inst.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── SUBSCRIPTIONS ── */}
          {isSubscriptions && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PLANS.map(plan => {
                  const count = institutions.filter(i => i.plan === plan && i.is_active).length;
                  return (
                    <Card key={plan} className="shadow-sm">
                      <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide capitalize">{plan}</p>
                        <p className="text-3xl font-bold text-primary mt-1">{count}</p>
                        <p className="text-sm text-muted-foreground">institutions</p>
                        <p className="text-lg font-bold text-emerald-600 mt-2">₹{(count * PLAN_PRICES[plan]).toLocaleString('en-IN')}/mo</p>
                        <p className="text-xs text-muted-foreground">₹{PLAN_PRICES[plan].toLocaleString('en-IN')} per institution</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-sm">Revenue Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Monthly Revenue', value: `₹${stats.monthlyRevenue.toLocaleString('en-IN')}`, color: 'text-primary' },
                      { label: 'Annual Revenue', value: `₹${stats.annualRevenue.toLocaleString('en-IN')}`, color: 'text-emerald-600' },
                      { label: 'Active Subscriptions', value: stats.active, color: 'text-blue-600' },
                      { label: 'Avg Revenue/Inst', value: stats.active > 0 ? `₹${Math.round(stats.monthlyRevenue / stats.active).toLocaleString('en-IN')}` : '₹0', color: 'text-violet-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-muted/30 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color} mt-1`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-sm">All Subscriptions</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Institution</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Monthly Fee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Change Plan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {institutions.filter(i => i.is_active).map(inst => (
                        <TableRow key={inst.id}>
                          <TableCell className="font-medium text-sm">{inst.name}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize text-xs">{inst.plan}</Badge></TableCell>
                          <TableCell className="text-sm font-medium">₹{(PLAN_PRICES[inst.plan] || 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell><Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge></TableCell>
                          <TableCell>
                            <Select value={inst.plan || 'starter'} onValueChange={v => updatePlan(inst.id, v)}>
                              <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{PLANS.map(p => <SelectItem key={p} value={p} className="capitalize text-xs">{p} — ₹{PLAN_PRICES[p].toLocaleString('en-IN')}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── ANNOUNCEMENTS ── */}
          {isAnnouncements && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold">Platform Announcements</h2>
                  <p className="text-sm text-muted-foreground">Announcements sent to all institutions</p>
                </div>
                <Button size="sm" onClick={() => { setAnnEditId(null); setAnnForm({ title: '', body: '', priority: 'normal', audience: 'all' }); setAnnDialog(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> New Announcement
                </Button>
              </div>
              {announcements.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No platform announcements yet</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {announcements.map(a => (
                    <Card key={a.id} className={`shadow-sm border-l-4 ${a.priority === 'urgent' ? 'border-l-red-500' : a.priority === 'high' ? 'border-l-amber-500' : 'border-l-primary'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm">{a.title}</h3>
                              <Badge className={`text-xs border-0 capitalize ${a.priority === 'urgent' ? 'bg-red-100 text-red-700' : a.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{a.priority}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                            <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setAnnEditId(a.id); setAnnForm({ title: a.title, body: a.body, priority: a.priority || 'normal', audience: 'all' }); setAnnDialog(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { if (confirm('Delete?')) { await (supabase as any).from('announcements').delete().eq('id', a.id); fetchAll(); } }}><X className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {isSettings && (
            <div className="space-y-5">
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-sm">Platform Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Platform Name', value: 'Skoolvyn' },
                      { label: 'Version', value: '1.0.0' },
                      { label: 'Environment', value: 'Production' },
                      { label: 'Region', value: 'India (South Asia)' },
                    ].map(s => (
                      <div key={s.label} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-sm font-medium mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-sm">Pricing Plans</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {PLANS.map(plan => (
                      <div key={plan} className="border rounded-lg p-4 text-center">
                        <p className="font-semibold capitalize">{plan}</p>
                        <p className="text-2xl font-bold text-primary mt-1">₹{PLAN_PRICES[plan].toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground">per month</p>
                        <p className="text-sm text-emerald-600 mt-1">₹{(PLAN_PRICES[plan] * 12).toLocaleString('en-IN')}/year</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Institution Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editInstId ? 'Edit Institution' : 'Add Institution'}</SheetTitle>
            <SheetDescription>Fill in institution details</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1.5"><Label>Institution Name *</Label><Input value={instForm.name} onChange={e => setInstForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={instForm.type} onValueChange={v => setInstForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="school">School</SelectItem><SelectItem value="college">College</SelectItem><SelectItem value="university">University</SelectItem><SelectItem value="coaching">Coaching</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={instForm.email} onChange={e => setInstForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={instForm.phone} onChange={e => setInstForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>City</Label><Input value={instForm.city} onChange={e => setInstForm(f => ({ ...f, city: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>State</Label><Input value={instForm.state} onChange={e => setInstForm(f => ({ ...f, state: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={instForm.plan} onValueChange={v => setInstForm(f => ({ ...f, plan: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLANS.map(p => <SelectItem key={p} value={p} className="capitalize">{p} — ₹{PLAN_PRICES[p].toLocaleString('en-IN')}/mo</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={saveInstitution} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editInstId ? 'Save Changes' : 'Add Institution'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Institution Detail Dialog */}
      {selectedInst && (
        <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{selectedInst.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {[
                { icon: Building2, label: 'Type', value: selectedInst.type },
                { icon: Mail, label: 'Email', value: selectedInst.email },
                { icon: Phone, label: 'Phone', value: selectedInst.phone },
                { icon: MapPin, label: 'Location', value: [selectedInst.city, selectedInst.state].filter(Boolean).join(', ') },
                { icon: Globe, label: 'Website', value: selectedInst.website },
                { icon: Users, label: 'Students', value: selectedInst.student_count },
                { icon: CreditCard, label: 'Plan', value: selectedInst.plan },
                { icon: IndianRupee, label: 'Monthly Fee', value: `₹${(PLAN_PRICES[selectedInst.plan] || 0).toLocaleString('en-IN')}` },
              ].filter(r => r.value).map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <row.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="text-sm font-medium capitalize">{row.value}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={() => toggleStatus(selectedInst)} variant={selectedInst.is_active ? 'destructive' : 'default'}>
                  {selectedInst.is_active ? 'Suspend Institution' : 'Activate Institution'}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { setDetailDialog(false); openEdit(selectedInst); }}>Edit</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Announcement Dialog */}
      <Dialog open={annDialog} onOpenChange={setAnnDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{annEditId ? 'Edit' : 'New'} Platform Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Body *</Label><Textarea value={annForm.body} onChange={e => setAnnForm(f => ({ ...f, body: e.target.value }))} rows={4} /></div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={annForm.priority} onValueChange={v => setAnnForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnDialog(false)}>Cancel</Button>
            <Button onClick={saveAnnouncement} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{annEditId ? 'Save' : 'Publish'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
