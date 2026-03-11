import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard, Building2, CreditCard, Bell, Settings, LogOut, Plus, Menu, X,
  Users, IndianRupee, Eye, Pencil, Ban
} from 'lucide-react';
import { format } from 'date-fns';

interface Institution {
  id: string;
  name: string;
  type: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  student_count?: number;
}

interface Stats {
  totalInstitutions: number;
  activeInstitutions: number;
  totalStudents: number;
  revenueThisMonth: number;
}

const sidebarItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/super-admin/dashboard' },
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

  const [stats, setStats] = useState<Stats | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', type: 'school', email: '', phone: '', city: '', state: '', plan: 'starter',
  });

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [instRes, activeRes, studRes, subRes] = await Promise.all([
        supabase.from('institutions').select('id', { count: 'exact', head: true }),
        supabase.from('institutions').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        (() => {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          return (supabase as any).from('subscriptions').select('amount').eq('status', 'active').gte('created_at', startOfMonth);
        })(),
      ]);

      const revenue = (subRes.data || []).reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

      setStats({
        totalInstitutions: instRes.count || 0,
        activeInstitutions: activeRes.count || 0,
        totalStudents: studRes.count || 0,
        revenueThisMonth: revenue,
      });
    } catch {
      // silently fail
    }
    setLoadingStats(false);
  };

  const fetchInstitutions = async () => {
    setLoadingInstitutions(true);
    try {
      const { data: insts } = await supabase
        .from('institutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (insts && insts.length > 0) {
        // Get student counts per institution
        const { data: studentCounts } = await supabase
          .from('students')
          .select('institution_id');

        const countMap: Record<string, number> = {};
        (studentCounts || []).forEach((s: any) => {
          countMap[s.institution_id] = (countMap[s.institution_id] || 0) + 1;
        });

        setInstitutions(insts.map((inst: any) => ({
          ...inst,
          student_count: countMap[inst.id] || 0,
        })));
      } else {
        setInstitutions([]);
      }
    } catch {
      setInstitutions([]);
    }
    setLoadingInstitutions(false);
  };

  useEffect(() => {
    fetchStats();
    fetchInstitutions();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleAddInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: 'Validation Error', description: 'Name and Email are required.', variant: 'destructive' });
      return;
    }
    setFormLoading(true);
    const { error } = await supabase.from('institutions').insert([{
      name: form.name.trim(),
      type: form.type,
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      plan: form.plan,
      is_active: true,
    }]);
    setFormLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Institution added successfully.' });
      setSheetOpen(false);
      setForm({ name: '', type: 'school', email: '', phone: '', city: '', state: '', plan: 'starter' });
      fetchStats();
      fetchInstitutions();
    }
  };

  const statCards = [
    { label: 'Total Institutions', value: stats?.totalInstitutions, icon: Building2, color: 'text-primary' },
    { label: 'Active Institutions', value: stats?.activeInstitutions, icon: Building2, color: 'text-emerald-600' },
    { label: 'Total Students', value: stats?.totalStudents, icon: Users, color: 'text-violet-600' },
    { label: 'Revenue This Month', value: stats ? `₹${stats.revenueThisMonth.toLocaleString('en-IN')}` : undefined, icon: IndianRupee, color: 'text-amber-600' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-64 bg-primary text-primary-foreground flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-3 px-6 h-16 border-b border-primary-foreground/10">
          <div className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <span className="text-sm font-bold">SK</span>
          </div>
          <span className="font-bold text-lg">Skoolvyn</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground hidden lg:block">Dashboard</h1>
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

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <Card key={card.label} className="shadow-sm">
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

          {/* Institutions Table */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="flex items-center justify-between p-4 lg:p-5 border-b">
              <h2 className="text-lg font-semibold text-foreground">Institutions</h2>
              <Button size="sm" onClick={() => setSheetOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Institution
              </Button>
            </div>

            {loadingInstitutions ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : institutions.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">No institutions yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Get started by adding your first institution.</p>
                <Button className="mt-4" size="sm" onClick={() => setSheetOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Institution
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {institutions.map((inst) => (
                      <TableRow key={inst.id}>
                        <TableCell className="font-medium">{inst.name}</TableCell>
                        <TableCell className="capitalize">{inst.type}</TableCell>
                        <TableCell className="capitalize">{inst.plan}</TableCell>
                        <TableCell>
                          <Badge
                            variant={inst.is_active ? 'default' : 'destructive'}
                            className={inst.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0' : 'bg-red-100 text-red-700 hover:bg-red-100 border-0'}
                          >
                            {inst.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{inst.student_count}</TableCell>
                        <TableCell>{format(new Date(inst.created_at), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Suspend">
                              <Ban className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Institution Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Institution</SheetTitle>
            <SheetDescription>Fill in the details to register a new institution.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleAddInstitution} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="inst-name">Institution Name *</Label>
              <Input id="inst-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Delhi Public School" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inst-type">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inst-email">Email *</Label>
              <Input id="inst-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@school.edu" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inst-phone">Phone</Label>
              <Input id="inst-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inst-city">City</Label>
                <Input id="inst-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="New Delhi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inst-state">State</Label>
                <Input id="inst-state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Delhi" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inst-plan">Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={formLoading}>
              {formLoading ? 'Adding...' : 'Add Institution'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
