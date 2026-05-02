import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Loader2, Phone, Mail, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG: Record<string, string> = {
  enquiry: 'bg-blue-100 text-blue-700',
  applied: 'bg-purple-100 text-purple-700',
  shortlisted: 'bg-amber-100 text-amber-700',
  admitted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  waitlist: 'bg-gray-100 text-gray-700',
};

export function AdmissionsModule() {
  const { institutionId } = useAuth();
  const { toast } = useToast();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [form, setForm] = useState({
    applicant_name: '', applicant_email: '', applicant_phone: '',
    guardian_name: '', guardian_phone: '', program_id: '',
    applying_for: '', source: 'walk-in', status: 'enquiry',
    enquiry_date: new Date().toISOString().split('T')[0],
    follow_up_date: '', remarks: '',
  });

  useEffect(() => { if (institutionId) fetchAll(); }, [institutionId]);

  const fetchAll = async () => {
    setLoading(true);
    const [aRes, pRes] = await Promise.all([
      (supabase as any).from('admissions').select('*').eq('institution_id', institutionId!).order('created_at', { ascending: false }),
      (supabase as any).from('programs').select('id, name').eq('institution_id', institutionId!).eq('is_active', true),
    ]);
    setAdmissions(aRes.data || []);
    setPrograms(pRes.data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ applicant_name: '', applicant_email: '', applicant_phone: '', guardian_name: '', guardian_phone: '', program_id: '', applying_for: '', source: 'walk-in', status: 'enquiry', enquiry_date: new Date().toISOString().split('T')[0], follow_up_date: '', remarks: '' });
    setDialog(true);
  };

  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({ applicant_name: a.applicant_name||'', applicant_email: a.applicant_email||'', applicant_phone: a.applicant_phone||'', guardian_name: a.guardian_name||'', guardian_phone: a.guardian_phone||'', program_id: a.program_id||'', applying_for: a.applying_for||'', source: a.source||'walk-in', status: a.status||'enquiry', enquiry_date: a.enquiry_date||'', follow_up_date: a.follow_up_date||'', remarks: a.remarks||'' });
    setDialog(true);
  };

  const save = async () => {
    if (!form.applicant_name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = { ...form, institution_id: institutionId, program_id: form.program_id || null, follow_up_date: form.follow_up_date || null };
      if (editId) await (supabase as any).from('admissions').update(payload).eq('id', editId);
      else await (supabase as any).from('admissions').insert(payload);
      toast({ title: editId ? '✅ Updated!' : '✅ Enquiry added!' });
      setDialog(false); fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await (supabase as any).from('admissions').update({ status }).eq('id', id);
    fetchAll();
  };

  const filtered = admissions.filter(a => {
    const m = !search || a.applicant_name?.toLowerCase().includes(search.toLowerCase()) || a.applicant_phone?.includes(search);
    const s = filterStatus === 'all' || a.status === filterStatus;
    return m && s;
  });

  const counts = { enquiry: 0, applied: 0, shortlisted: 0, admitted: 0, rejected: 0, waitlist: 0 };
  admissions.forEach(a => { if (counts[a.status as keyof typeof counts] !== undefined) counts[a.status as keyof typeof counts]++; });

  const programMap: Record<string, string> = {};
  programs.forEach(p => { programMap[p.id] = p.name; });

  // Guard: wait for institutionId
  if (!institutionId) {

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Admissions</h2><p className="text-sm text-muted-foreground">Manage enquiries and admissions pipeline</p></div>
        <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" />New Enquiry</Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {Object.entries(counts).map(([status, count]) => (
          <Card key={status} className={`shadow-sm cursor-pointer ${filterStatus === status ? 'border-primary' : ''}`} onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground capitalize">{status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name/phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.keys(counts).map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Enquiry Date</TableHead>
                <TableHead>Follow Up</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
              : filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No enquiries found</TableCell></TableRow>
              : filtered.map(a => (
                <TableRow key={a.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{a.applicant_name}</p>
                    <div className="flex gap-2 mt-0.5">
                      {a.applicant_phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{a.applicant_phone}</span>}
                      {a.applicant_email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{a.applicant_email}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{a.guardian_name || '—'}<br/><span className="text-xs text-muted-foreground">{a.guardian_phone}</span></TableCell>
                  <TableCell className="text-sm">{a.program_id ? programMap[a.program_id] : a.applying_for || '—'}</TableCell>
                  <TableCell className="text-sm capitalize">{a.source || '—'}</TableCell>
                  <TableCell className="text-sm">{a.enquiry_date ? new Date(a.enquiry_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                  <TableCell className="text-sm">{a.follow_up_date ? new Date(a.follow_up_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                  <TableCell>
                    <Select value={a.status} onValueChange={v => updateStatus(a.id, v)}>
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_CONFIG[a.status] || 'bg-muted text-muted-foreground'}`}>{a.status}</span>
                      </SelectTrigger>
                      <SelectContent>{Object.keys(counts).map(s => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Enquiry' : 'New Admission Enquiry'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="col-span-2 space-y-1.5"><Label>Applicant Name *</Label><Input value={form.applicant_name} onChange={e => setForm(f => ({ ...f, applicant_name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.applicant_phone} onChange={e => setForm(f => ({ ...f, applicant_phone: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.applicant_email} onChange={e => setForm(f => ({ ...f, applicant_email: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Guardian Name</Label><Input value={form.guardian_name} onChange={e => setForm(f => ({ ...f, guardian_name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Guardian Phone</Label><Input value={form.guardian_phone} onChange={e => setForm(f => ({ ...f, guardian_phone: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Program</Label>
              <Select value={form.program_id} onValueChange={v => setForm(f => ({ ...f, program_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="">None</SelectItem>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Applying For</Label><Input value={form.applying_for} onChange={e => setForm(f => ({ ...f, applying_for: e.target.value }))} placeholder="Class/Course" /></div>
            <div className="space-y-1.5"><Label>Source</Label>
              <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['walk-in','phone','website','referral','social-media','newspaper','other'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(counts).map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Enquiry Date</Label><Input type="date" value={form.enquiry_date} onChange={e => setForm(f => ({ ...f, enquiry_date: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Follow Up Date</Label><Input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Remarks</Label><Textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editId ? 'Save' : 'Add Enquiry'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}