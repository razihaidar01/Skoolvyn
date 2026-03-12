import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { INDIAN_STATES } from '@/lib/indian-states';

const institutionSchema = z.object({
  institutionName: z.string().trim().min(2, 'Institution name is required'),
  institutionType: z.string().min(1, 'Select institution type'),
  adminName: z.string().trim().min(2, 'Full name is required'),
  adminEmail: z.string().trim().email('Valid email required'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().trim().min(10, 'Valid phone number required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  address: z.string().optional(),
  website: z.string().optional(),
});

const staffSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().trim().min(10, 'Valid phone number required'),
  institutionCode: z.string().trim().min(1, 'Institution code is required'),
  role: z.string().min(1, 'Select a role'),
});

const STAFF_ROLES = [
  'hod',
  'hr_manager',
  'principal', 'faculty', 'accountant', 'librarian',
  'hostel_warden', 'transport_manager',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState('institution');

  // Institution form
  const [instForm, setInstForm] = useState({
    institutionName: '', institutionType: 'school', adminName: '', adminEmail: '',
    adminPassword: '', phone: '', city: '', state: '', address: '', website: '',
  });
  const [instLoading, setInstLoading] = useState(false);
  const [instError, setInstError] = useState('');

  // Staff form
  const [staffForm, setStaffForm] = useState({
    fullName: '', email: '', password: '', phone: '', institutionCode: '', role: '',
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  const handleInstitutionRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setInstError('');
    const v = institutionSchema.safeParse(instForm);
    if (!v.success) { setInstError(v.error.errors[0].message); return; }

    setInstLoading(true);
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: instForm.adminEmail,
        password: instForm.adminPassword,
        options: { data: { first_name: instForm.adminName.split(' ')[0], last_name: instForm.adminName.split(' ').slice(1).join(' ') } },
      });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create account');

      const userId = authData.user.id;

      // 2. Insert institution (using service role via edge function)
      const { data: regData, error: regError } = await supabase.functions.invoke('register-institution', {
        body: {
          userId,
          institutionName: instForm.institutionName,
          institutionType: instForm.institutionType,
          adminName: instForm.adminName,
          email: instForm.adminEmail,
          phone: instForm.phone,
          city: instForm.city,
          state: instForm.state,
          address: instForm.address || null,
          website: instForm.website || null,
        },
      });

      if (regError) throw new Error(regError.message);
      if (regData?.error) throw new Error(regData.error);

      toast({ title: 'Registration successful!', description: 'Your institution is under review.' });
      navigate('/pending-approval');
    } catch (err: any) {
      setInstError(err.message || 'Registration failed');
    }
    setInstLoading(false);
  };

  const handleStaffRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    const v = staffSchema.safeParse(staffForm);
    if (!v.success) { setStaffError(v.error.errors[0].message); return; }

    setStaffLoading(true);
    try {
      // 1. Verify institution code
      const { data: inst } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('institution_code', staffForm.institutionCode.toUpperCase())
        .single();

      if (!inst) throw new Error('Invalid institution code. Please check with your admin.');

      // 2. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: staffForm.email,
        password: staffForm.password,
        options: { data: { first_name: staffForm.fullName.split(' ')[0], last_name: staffForm.fullName.split(' ').slice(1).join(' ') } },
      });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create account');

      const userId = authData.user.id;

      // 3. Register staff via edge function
      const { data: regData, error: regError } = await supabase.functions.invoke('register-staff', {
        body: {
          userId,
          fullName: staffForm.fullName,
          email: staffForm.email,
          phone: staffForm.phone,
          institutionId: inst.id,
          roleName: staffForm.role,
        },
      });

      if (regError) throw new Error(regError.message);
      if (regData?.error) throw new Error(regData.error);

      toast({ title: 'Registration successful!', description: 'Your account is pending approval.' });
      navigate('/pending-approval');
    } catch (err: any) {
      setStaffError(err.message || 'Registration failed');
    }
    setStaffLoading(false);
  };

  return (
    <AuthLayout title="Create your account" subtitle="Register your institution or join as staff">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="institution" className="gap-2">
            <Building2 className="w-4 h-4" />
            Institution
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Staff / Faculty
          </TabsTrigger>
        </TabsList>

        <TabsContent value="institution">
          <form onSubmit={handleInstitutionRegister} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Institution Name *</Label>
              <Input value={instForm.institutionName} onChange={e => setInstForm({ ...instForm, institutionName: e.target.value })} placeholder="e.g. Delhi Public School" />
            </div>
            <div className="space-y-1.5">
              <Label>Institution Type *</Label>
              <Select value={instForm.institutionType} onValueChange={v => setInstForm({ ...instForm, institutionType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Admin Full Name *</Label>
              <Input value={instForm.adminName} onChange={e => setInstForm({ ...instForm, adminName: e.target.value })} placeholder="Your full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Admin Email *</Label>
                <Input type="email" value={instForm.adminEmail} onChange={e => setInstForm({ ...instForm, adminEmail: e.target.value })} placeholder="admin@school.edu" />
              </div>
              <div className="space-y-1.5">
                <Label>Password *</Label>
                <Input type="password" value={instForm.adminPassword} onChange={e => setInstForm({ ...instForm, adminPassword: e.target.value })} placeholder="Min 8 characters" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input value={instForm.phone} onChange={e => setInstForm({ ...instForm, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City *</Label>
                <Input value={instForm.city} onChange={e => setInstForm({ ...instForm, city: e.target.value })} placeholder="New Delhi" />
              </div>
              <div className="space-y-1.5">
                <Label>State *</Label>
                <Select value={instForm.state} onValueChange={v => setInstForm({ ...instForm, state: v })}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={instForm.address} onChange={e => setInstForm({ ...instForm, address: e.target.value })} placeholder="Full address" />
            </div>
            <div className="space-y-1.5">
              <Label>Website (optional)</Label>
              <Input value={instForm.website} onChange={e => setInstForm({ ...instForm, website: e.target.value })} placeholder="https://school.edu" />
            </div>

            {instError && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 border border-destructive/20">{instError}</div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={instLoading}>
              {instLoading && <Loader2 className="animate-spin mr-2" />}
              Register Institution
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="staff">
          <form onSubmit={handleStaffRegister} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={staffForm.fullName} onChange={e => setStaffForm({ ...staffForm, fullName: e.target.value })} placeholder="Your full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} placeholder="you@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Password *</Label>
                <Input type="password" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} placeholder="Min 8 characters" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5">
              <Label>Institution Code *</Label>
              <Input value={staffForm.institutionCode} onChange={e => setStaffForm({ ...staffForm, institutionCode: e.target.value })} placeholder="Get this from your institution admin" className="uppercase" />
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={staffForm.role} onValueChange={v => setStaffForm({ ...staffForm, role: v })}>
                <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map(r => (
                    <SelectItem key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {staffError && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 border border-destructive/20">{staffError}</div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={staffLoading}>
              {staffLoading && <Loader2 className="animate-spin mr-2" />}
              Submit Registration
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  );
}