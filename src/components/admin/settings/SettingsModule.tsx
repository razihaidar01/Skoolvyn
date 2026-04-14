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
import { Building2, User, Shield, Loader2, CheckCircle2, Copy, Eye, EyeOff, Phone, Mail, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const INSTITUTION_TYPES = ['school', 'college', 'university', 'coaching', 'other'];
const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge', 'University', 'Other'];
const MEDIUMS = ['English', 'Hindi', 'Both', 'Other'];
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh',
];

export function SettingsModule() {
  const { institutionId, user, profile } = useAuth();
  const { toast } = useToast();

  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [instForm, setInstForm] = useState({
    name: '', type: '', email: '', phone: '', website: '',
    address: '', city: '', state: '', pincode: '', country: 'India',
    board: '', medium: '', affiliation_no: '', timezone: 'Asia/Kolkata',
    academic_year_start: '', academic_year_end: '', currency: 'INR', logo_url: '',
  });
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [pwForm, setPwForm] = useState({ new_pw: '', confirm: '' });

  useEffect(() => { if (institutionId) fetchAll(); }, [institutionId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [instRes, profRes] = await Promise.all([
        (supabase as any).from('institutions').select('*').eq('id', institutionId!).single(),
        (supabase as any).from('profiles').select('*').eq('id', user!.id).single(),
      ]);
      const inst = instRes.data;
      setInstitution(inst);
      if (inst) setInstForm({
        name: inst.name || '', type: inst.type || '', email: inst.email || '',
        phone: inst.phone || '', website: inst.website || '', address: inst.address || '',
        city: inst.city || '', state: inst.state || '', pincode: inst.pincode || '',
        country: inst.country || 'India', board: inst.board || '', medium: inst.medium || '',
        affiliation_no: inst.affiliation_no || '', timezone: inst.timezone || 'Asia/Kolkata',
        academic_year_start: inst.academic_year_start || '', academic_year_end: inst.academic_year_end || '',
        currency: inst.currency || 'INR', logo_url: inst.logo_url || '',
      });
      const prof = profRes.data;
      if (prof) setProfileForm({ first_name: prof.first_name || '', last_name: prof.last_name || '', phone: prof.phone || '' });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const saveInstitution = async () => {
    if (!instForm.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await (supabase as any).from('institutions').update({
        name: instForm.name.trim(), type: instForm.type || null, email: instForm.email || null,
        phone: instForm.phone || null, website: instForm.website || null, address: instForm.address || null,
        city: instForm.city || null, state: instForm.state || null, pincode: instForm.pincode || null,
        country: instForm.country || 'India', board: instForm.board || null, medium: instForm.medium || null,
        affiliation_no: instForm.affiliation_no || null, timezone: instForm.timezone || 'Asia/Kolkata',
        academic_year_start: instForm.academic_year_start || null, academic_year_end: instForm.academic_year_end || null,
        currency: instForm.currency || 'INR', logo_url: instForm.logo_url || null,
        updated_at: new Date().toISOString(),
      }).eq('id', institutionId!);
      toast({ title: '✅ Institution settings saved!' });
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const saveProfile = async () => {
    if (!profileForm.first_name.trim()) { toast({ title: 'First name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await (supabase as any).from('profiles').update({
        first_name: profileForm.first_name.trim(), last_name: profileForm.last_name || null,
        phone: profileForm.phone || null, updated_at: new Date().toISOString(),
      }).eq('id', user!.id);
      toast({ title: '✅ Profile updated!' });
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (pwForm.new_pw.length < 8) { toast({ title: 'Min 8 characters', variant: 'destructive' }); return; }
    if (pwForm.new_pw !== pwForm.confirm) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.new_pw });
      if (error) throw error;
      toast({ title: '✅ Password changed!' });
      setPwForm({ new_pw: '', confirm: '' });
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const up = (k: string, v: string) => setInstForm(f => ({ ...f, [k]: v }));

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage institution profile and account settings</p>
      </div>

      <Tabs defaultValue="institution">
        <TabsList>
          <TabsTrigger value="institution"><Building2 className="w-4 h-4 mr-1.5" />Institution</TabsTrigger>
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-1.5" />My Profile</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1.5" />Security</TabsTrigger>
        </TabsList>

        {/* INSTITUTION */}
        <TabsContent value="institution" className="space-y-4">
          {institution?.institution_code && (
            <Card className="bg-primary/5 border-primary/20 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Institution Code</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Share with staff to register</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-2xl font-bold text-primary tracking-widest">{showCode ? institution.institution_code : '••••••••'}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCode(!showCode)}>{showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(institution.institution_code); toast({ title: 'Copied!' }); }}><Copy className="w-4 h-4 mr-1" />Copy</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Basic Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5"><Label>Institution Name *</Label><Input value={instForm.name} onChange={e => up('name', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={instForm.type} onValueChange={v => up('type', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{INSTITUTION_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Board</Label>
                <Select value={instForm.board} onValueChange={v => up('board', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Medium</Label>
                <Select value={instForm.medium} onValueChange={v => up('medium', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{MEDIUMS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Affiliation No.</Label><Input value={instForm.affiliation_no} onChange={e => up('affiliation_no', e.target.value)} placeholder="e.g. CBSE/123456" /></div>
              <div className="space-y-1.5"><Label>Website</Label><Input value={instForm.website} onChange={e => up('website', e.target.value)} placeholder="https://..." /></div>
              <div className="space-y-1.5"><Label>Logo URL</Label><Input value={instForm.logo_url} onChange={e => up('logo_url', e.target.value)} placeholder="https://..." /></div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Contact & Location</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={instForm.email} onChange={e => up('email', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={instForm.phone} onChange={e => up('phone', e.target.value)} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Address</Label><Textarea value={instForm.address} onChange={e => up('address', e.target.value)} rows={2} /></div>
              <div className="space-y-1.5"><Label>City</Label><Input value={instForm.city} onChange={e => up('city', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>State</Label>
                <Select value={instForm.state} onValueChange={v => up('state', v)}><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger><SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>PIN Code</Label><Input value={instForm.pincode} onChange={e => up('pincode', e.target.value)} maxLength={6} /></div>
              <div className="space-y-1.5"><Label>Country</Label><Input value={instForm.country} onChange={e => up('country', e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Academic Settings</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Academic Year Start</Label><Input type="date" value={instForm.academic_year_start} onChange={e => up('academic_year_start', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Academic Year End</Label><Input type="date" value={instForm.academic_year_end} onChange={e => up('academic_year_end', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Timezone</Label>
                <Select value={instForm.timezone} onValueChange={v => up('timezone', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Currency</Label>
                <Select value={instForm.currency} onValueChange={v => up('currency', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INR">INR (₹)</SelectItem><SelectItem value="USD">USD ($)</SelectItem></SelectContent></Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveInstitution} disabled={saving} size="lg">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Institution Settings
            </Button>
          </div>
        </TabsContent>

        {/* PROFILE */}
        <TabsContent value="profile">
          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{(profileForm.first_name || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold">{profileForm.first_name} {profileForm.last_name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline" className="text-xs mt-1">Admin</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>First Name *</Label><Input value={profileForm.first_name} onChange={e => setProfileForm(f => ({ ...f, first_name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Last Name</Label><Input value={profileForm.last_name} onChange={e => setProfileForm(f => ({ ...f, last_name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input value={user?.email || ''} disabled className="bg-muted" /><p className="text-xs text-muted-foreground">Cannot be changed here</p></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Profile</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-sm">
              <div className="space-y-1.5"><Label>New Password</Label>
                <div className="relative">
                  <Input type={showPw ? 'text' : 'password'} value={pwForm.new_pw} onChange={e => setPwForm(f => ({ ...f, new_pw: e.target.value }))} placeholder="Min 8 characters" className="pr-10" />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Confirm Password</Label><Input type={showPw ? 'text' : 'password'} value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} /></div>
              {pwForm.new_pw && pwForm.confirm && (
                <p className={`text-sm flex items-center gap-1.5 ${pwForm.new_pw === pwForm.confirm ? 'text-emerald-600' : 'text-red-500'}`}>
                  <CheckCircle2 className="w-4 h-4" />{pwForm.new_pw === pwForm.confirm ? 'Passwords match' : 'Do not match'}
                </p>
              )}
              <Button onClick={changePassword} disabled={saving || !pwForm.new_pw || pwForm.new_pw !== pwForm.confirm}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Change Password
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Account Info</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: Hash, label: 'User ID', value: user?.id?.slice(0, 8) + '...' },
                { icon: Mail, label: 'Email', value: user?.email },
                { icon: Building2, label: 'Institution ID', value: institutionId?.slice(0, 8) + '...' },
                { icon: CheckCircle2, label: 'Status', value: '✅ Active & Approved' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <r.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div><p className="text-xs text-muted-foreground">{r.label}</p><p className="text-sm font-medium">{r.value || '—'}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
