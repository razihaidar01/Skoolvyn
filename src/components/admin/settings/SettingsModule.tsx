import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Building2, User, Shield, Bell, Loader2,
  CheckCircle2, Copy, Eye, EyeOff, Globe, Phone,
  Mail, MapPin, Calendar, Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { INDIAN_STATES } from '@/lib/indian-states';

const INSTITUTION_TYPES = ['school', 'college', 'university', 'coaching', 'other'];
const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge', 'University', 'Other'];
const MEDIUMS = ['English', 'Hindi', 'Both', 'Other'];
const TIMEZONES = ['Asia/Kolkata', 'Asia/Mumbai'];

export function SettingsModule() {
  const { institutionId, user, profile } = useAuth();
  const { toast } = useToast();

  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Institution form
  const [instForm, setInstForm] = useState({
    name: '', type: '', email: '', phone: '', website: '',
    address: '', city: '', state: '', pincode: '', country: 'India',
    board: '', medium: '', affiliation_no: '', timezone: 'Asia/Kolkata',
    academic_year_start: '', academic_year_end: '', currency: 'INR',
    logo_url: '',
  });

  // Profile form
  const [profileForm, setProfileForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
  });

  // Password form
  const [pwForm, setPwForm] = useState({
    current: '', new_pw: '', confirm: '',
  });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (institutionId) fetchAll();
  }, [institutionId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [instRes, profRes] = await Promise.all([
        (supabase as any).from('institutions').select('*').eq('id', institutionId!).single(),
        (supabase as any).from('profiles').select('*').eq('id', user!.id).single(),
      ]);

      const inst = instRes.data;
      setInstitution(inst);
      if (inst) {
        setInstForm({
          name: inst.name || '',
          type: inst.type || '',
          email: inst.email || '',
          phone: inst.phone || '',
          website: inst.website || '',
          address: inst.address || '',
          city: inst.city || '',
          state: inst.state || '',
          pincode: inst.pincode || '',
          country: inst.country || 'India',
          board: inst.board || '',
          medium: inst.medium || '',
          affiliation_no: inst.affiliation_no || '',
          timezone: inst.timezone || 'Asia/Kolkata',
          academic_year_start: inst.academic_year_start || '',
          academic_year_end: inst.academic_year_end || '',
          currency: inst.currency || 'INR',
          logo_url: inst.logo_url || '',
        });
      }

      const prof = profRes.data;
      if (prof) {
        setProfileForm({
          first_name: prof.first_name || '',
          last_name: prof.last_name || '',
          email: prof.email || user?.email || '',
          phone: prof.phone || '',
        });
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const saveInstitution = async () => {
    if (!instForm.name.trim()) {
      toast({ title: 'Institution name required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      await (supabase as any).from('institutions').update({
        name: instForm.name.trim(),
        type: instForm.type || null,
        email: instForm.email || null,
        phone: instForm.phone || null,
        website: instForm.website || null,
        address: instForm.address || null,
        city: instForm.city || null,
        state: instForm.state || null,
        pincode: instForm.pincode || null,
        country: instForm.country || 'India',
        board: instForm.board || null,
        medium: instForm.medium || null,
        affiliation_no: instForm.affiliation_no || null,
        timezone: instForm.timezone || 'Asia/Kolkata',
        academic_year_start: instForm.academic_year_start || null,
        academic_year_end: instForm.academic_year_end || null,
        currency: instForm.currency || 'INR',
        logo_url: instForm.logo_url || null,
        updated_at: new Date().toISOString(),
      }).eq('id', institutionId!);
      toast({ title: '✅ Institution profile updated!' });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const saveProfile = async () => {
    if (!profileForm.first_name.trim()) {
      toast({ title: 'First name required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      await (supabase as any).from('profiles').update({
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim() || null,
        phone: profileForm.phone || null,
        updated_at: new Date().toISOString(),
      }).eq('id', user!.id);
      toast({ title: '✅ Profile updated!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!pwForm.new_pw || pwForm.new_pw.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' }); return;
    }
    if (pwForm.new_pw !== pwForm.confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.new_pw });
      if (error) throw error;
      toast({ title: '✅ Password changed successfully!' });
      setPwForm({ current: '', new_pw: '', confirm: '' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(institution?.institution_code || '');
    toast({ title: 'Institution code copied!' });
  };

  const upInst = (k: string, v: string) => setInstForm(f => ({ ...f, [k]: v }));

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage institution and account settings</p>
      </div>

      <Tabs defaultValue="institution">
        <TabsList>
          <TabsTrigger value="institution"><Building2 className="w-4 h-4 mr-1.5" />Institution</TabsTrigger>
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-1.5" />My Profile</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1.5" />Security</TabsTrigger>
        </TabsList>

        {/* ── INSTITUTION ── */}
        <TabsContent value="institution" className="space-y-5">

          {/* Institution Code Card */}
          {institution?.institution_code && (
            <Card className="shadow-sm bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Institution Code</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Share this code with staff members to register</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <code className="text-2xl font-bold text-primary tracking-widest">
                        {showCode ? institution.institution_code : '••••••••'}
                      </code>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCode(!showCode)}>
                        {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyCode}>
                      <Copy className="w-4 h-4 mr-1" /> Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Status */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Subscription Plan</p>
                  <p className="text-lg font-bold capitalize mt-0.5">{institution?.plan || 'Starter'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`${institution?.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} border-0`}>
                    {institution?.is_active ? '✅ Active' : '❌ Inactive'}
                  </Badge>
                  {institution?.subscription_ends_at && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(institution.subscription_ends_at).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Institution Name *</Label>
                  <Input value={instForm.name} onChange={e => upInst('name', e.target.value)} placeholder="Full institution name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={instForm.type} onValueChange={v => upInst('type', v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{INSTITUTION_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Board / Affiliation</Label>
                  <Select value={instForm.board} onValueChange={v => upInst('board', v)}>
                    <SelectTrigger><SelectValue placeholder="Select board" /></SelectTrigger>
                    <SelectContent>{BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Medium of Instruction</Label>
                  <Select value={instForm.medium} onValueChange={v => upInst('medium', v)}>
                    <SelectTrigger><SelectValue placeholder="Select medium" /></SelectTrigger>
                    <SelectContent>{MEDIUMS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Affiliation / Reg. Number</Label>
                  <Input value={instForm.affiliation_no} onChange={e => upInst('affiliation_no', e.target.value)} placeholder="e.g. CBSE/123456" />
                </div>
                <div className="space-y-1.5">
                  <Label>Logo URL</Label>
                  <Input value={instForm.logo_url} onChange={e => upInst('logo_url', e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input value={instForm.website} onChange={e => upInst('website', e.target.value)} placeholder="https://school.edu" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" /> Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Official Email</Label>
                  <Input type="email" value={instForm.email} onChange={e => upInst('email', e.target.value)} placeholder="school@email.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input value={instForm.phone} onChange={e => upInst('phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Address</Label>
                  <Textarea value={instForm.address} onChange={e => upInst('address', e.target.value)} rows={2} placeholder="Full address" />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input value={instForm.city} onChange={e => upInst('city', e.target.value)} placeholder="City" />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Select value={instForm.state} onValueChange={v => upInst('state', v)}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>PIN Code</Label>
                  <Input value={instForm.pincode} onChange={e => upInst('pincode', e.target.value)} placeholder="6-digit PIN" maxLength={6} />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input value={instForm.country} onChange={e => upInst('country', e.target.value)} placeholder="India" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Settings */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Academic Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Academic Year Start</Label>
                  <Input type="date" value={instForm.academic_year_start} onChange={e => upInst('academic_year_start', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Academic Year End</Label>
                  <Input type="date" value={instForm.academic_year_end} onChange={e => upInst('academic_year_end', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Select value={instForm.timezone} onValueChange={v => upInst('timezone', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={instForm.currency} onValueChange={v => upInst('currency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveInstitution} disabled={saving} size="lg">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Institution Settings
            </Button>
          </div>
        </TabsContent>

        {/* ── MY PROFILE ── */}
        <TabsContent value="profile" className="space-y-5">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary">
                    {(profileForm.first_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{profileForm.first_name} {profileForm.last_name}</p>
                  <p className="text-sm text-muted-foreground">{profileForm.email || user?.email}</p>
                  <Badge variant="outline" className="text-xs mt-1">Institution Admin</Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name *</Label>
                  <Input value={profileForm.first_name} onChange={e => setProfileForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input value={profileForm.last_name} onChange={e => setProfileForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={profileForm.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SECURITY ── */}
        <TabsContent value="security" className="space-y-5">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={pwForm.new_pw}
                    onChange={e => setPwForm(f => ({ ...f, new_pw: e.target.value }))}
                    placeholder="Min 8 characters"
                    className="pr-10"
                  />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat new password"
                />
              </div>
              {pwForm.new_pw && pwForm.confirm && (
                <div className={`flex items-center gap-2 text-sm ${pwForm.new_pw === pwForm.confirm ? 'text-emerald-600' : 'text-red-500'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {pwForm.new_pw === pwForm.confirm ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}
              <Button onClick={changePassword} disabled={saving || !pwForm.new_pw || pwForm.new_pw !== pwForm.confirm}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'User ID', value: user?.id?.slice(0, 8) + '...', icon: Hash },
                { label: 'Email', value: user?.email, icon: Mail },
                { label: 'Institution ID', value: institutionId?.slice(0, 8) + '...', icon: Building2 },
                { label: 'Account Status', value: '✅ Active & Approved', icon: CheckCircle2 },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <item.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium">{item.value || '—'}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}