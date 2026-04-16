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
import { Loader2, Building2, UserPlus, AlertCircle } from 'lucide-react';
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
  'principal', 'hod', 'hr_manager', 'faculty',
  'accountant', 'librarian', 'hostel_warden', 'transport_manager',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState('institution');

  const [instForm, setInstForm] = useState({
    institutionName: '', institutionType: 'school', adminName: '', adminEmail: '',
    adminPassword: '', phone: '', city: '', state: '', address: '', website: '',
  });
  const [instLoading, setInstLoading] = useState(false);
  const [instError, setInstError] = useState('');

  const [staffForm, setStaffForm] = useState({
    fullName: '', email: '', password: '', phone: '', institutionCode: '', role: '',
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  // KEY CHANGE: Send everything to edge function including password
  // Edge function uses admin API to create user — NO client-side auth.signUp timeout!
  const handleInstitutionRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setInstError('');
    const v = institutionSchema.safeParse(instForm);
    if (!v.success) { setInstError(v.error.errors[0].message); return; }

    setInstLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-institution', {
        body: {
          institutionName: instForm.institutionName,
          institutionType: instForm.institutionType,
          adminName: instForm.adminName,
          email: instForm.adminEmail,
          password: instForm.adminPassword,
          phone: instForm.phone,
          city: instForm.city,
          state: instForm.state,
          address: instForm.address || null,
          website: instForm.website || null,
        },
      });

      if (error) {
        const msg = error.message || String(error);
        throw new Error(msg.includes('{}') || msg.includes('fetch') ? 'Server connection issue. Please try again.' : msg);
      }
      if (data?.error) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));

      // Auto sign in after registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: instForm.adminEmail,
        password: instForm.adminPassword,
      });

      if (signInError) {
        // Even if sign-in fails, registration succeeded
        toast({ title: '✅ Registration successful!', description: 'Your institution is pending approval. Please sign in.' });
        navigate('/login');
      } else {
        toast({ title: '✅ Registered! Pending approval.', description: 'We will review and approve your institution shortly.' });
        navigate('/pending-approval');
      }

    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('{}') || msg.includes('fetch') || msg.includes('504') || msg.includes('timeout')) {
        setInstError('Connection error. Please try again in a moment.');
      } else if (msg.includes('already') || msg.includes('exists')) {
        setInstError('This email is already registered. Please sign in instead.');
      } else {
        setInstError(msg || 'Registration failed. Please try again.');
      }
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
      const { data, error } = await supabase.functions.invoke('register-staff', {
        body: {
          fullName: staffForm.fullName,
          email: staffForm.email,
          password: staffForm.password,
          phone: staffForm.phone,
          institutionCode: staffForm.institutionCode.toUpperCase(),
          roleName: staffForm.role,
        },
      });

      if (error) throw new Error(error.message || 'Registration failed');
      if (data?.error) throw new Error(data.error);

      // Auto sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: staffForm.email,
        password: staffForm.password,
      });

      if (signInError) {
        toast({ title: '✅ Registration successful!', description: 'Pending approval. Please sign in.' });
        navigate('/login');
      } else {
        toast({ title: '✅ Registered! Pending approval.' });
        navigate('/pending-approval');
      }

    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('{}') || msg.includes('fetch') || msg.includes('504')) {
        setStaffError('Connection error. Please try again.');
      } else {
        setStaffError(msg || 'Registration failed. Please try again.');
      }
    }
    setStaffLoading(false);
  };

  const up = (k: string, v: string) => setInstForm(f => ({ ...f, [k]: v }));
  const sp = (k: string, v: string) => setStaffForm(f => ({ ...f, [k]: v }));

  return (
    <AuthLayout title="Create your account" subtitle="Register your institution or join as staff">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="institution" className="gap-2"><Building2 className="w-4 h-4" />Institution</TabsTrigger>
          <TabsTrigger value="staff" className="gap-2"><UserPlus className="w-4 h-4" />Staff / Faculty</TabsTrigger>
        </TabsList>

        {/* INSTITUTION */}
        <TabsContent value="institution">
          <form onSubmit={handleInstitutionRegister} className="space-y-3">
            <div className="space-y-1.5"><Label>Institution Name *</Label>
              <Input value={instForm.institutionName} onChange={e => up('institutionName', e.target.value)} placeholder="e.g. Delhi Public School" />
            </div>
            <div className="space-y-1.5"><Label>Institution Type *</Label>
              <Select value={instForm.institutionType} onValueChange={v => up('institutionType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Admin Full Name *</Label>
              <Input value={instForm.adminName} onChange={e => up('adminName', e.target.value)} placeholder="Your full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Admin Email *</Label>
                <Input type="email" value={instForm.adminEmail} onChange={e => up('adminEmail', e.target.value)} placeholder="admin@school.edu" />
              </div>
              <div className="space-y-1.5"><Label>Password *</Label>
                <Input type="password" value={instForm.adminPassword} onChange={e => up('adminPassword', e.target.value)} placeholder="Min 8 characters" />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Phone *</Label>
              <Input value={instForm.phone} onChange={e => up('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>City *</Label>
                <Input value={instForm.city} onChange={e => up('city', e.target.value)} placeholder="New Delhi" />
              </div>
              <div className="space-y-1.5"><Label>State *</Label>
                <Select value={instForm.state} onValueChange={v => up('state', v)}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Address</Label>
              <Input value={instForm.address} onChange={e => up('address', e.target.value)} placeholder="Full address" />
            </div>
            <div className="space-y-1.5"><Label>Website (optional)</Label>
              <Input value={instForm.website} onChange={e => up('website', e.target.value)} placeholder="https://school.edu" />
            </div>

            {instLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-700 font-medium">Registering your institution...</p>
                  <p className="text-xs text-blue-500">This may take 15-30 seconds. Please wait.</p>
                </div>
              </div>
            )}

            {instError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{instError}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={instLoading}>
              {instLoading ? <><Loader2 className="animate-spin mr-2 w-4 h-4" />Registering...</> : 'Register Institution'}
            </Button>
          </form>
        </TabsContent>

        {/* STAFF */}
        <TabsContent value="staff">
          <form onSubmit={handleStaffRegister} className="space-y-3">
            <div className="space-y-1.5"><Label>Full Name *</Label>
              <Input value={staffForm.fullName} onChange={e => sp('fullName', e.target.value)} placeholder="Your full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Email *</Label>
                <Input type="email" value={staffForm.email} onChange={e => sp('email', e.target.value)} placeholder="you@email.com" />
              </div>
              <div className="space-y-1.5"><Label>Password *</Label>
                <Input type="password" value={staffForm.password} onChange={e => sp('password', e.target.value)} placeholder="Min 8 characters" />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Phone *</Label>
              <Input value={staffForm.phone} onChange={e => sp('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5"><Label>Institution Code *</Label>
              <Input value={staffForm.institutionCode} onChange={e => sp('institutionCode', e.target.value)}
                placeholder="Get this from your institution admin" className="uppercase" />
            </div>
            <div className="space-y-1.5"><Label>Role *</Label>
              <Select value={staffForm.role} onValueChange={v => sp('role', v)}>
                <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map(r => (
                    <SelectItem key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {staffLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-700">Registering... Please wait.</p>
              </div>
            )}

            {staffError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{staffError}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={staffLoading}>
              {staffLoading ? <><Loader2 className="animate-spin mr-2 w-4 h-4" />Registering...</> : 'Submit Registration'}
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