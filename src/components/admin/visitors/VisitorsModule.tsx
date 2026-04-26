import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, LogOut, Download, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function VisitorsModule() {
  const { institutionId } = useAuth();
  const { toast } = useToast();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({
    visitor_name: '', phone: '', purpose: '', person_to_meet: '',
    department: '', id_proof_type: '', id_proof_no: '', remarks: '',
  });

  useEffect(() => { if (institutionId) fetch(); }, [institutionId, filterDate]);

  const fetch = async () => {
    setLoading(true);
    const start = `${filterDate}T00:00:00`;
    const end = `${filterDate}T23:59:59`;
    const { data } = await (supabase as any).from('visitors').select('*')
      .eq('institution_id', institutionId!)
      .gte('check_in', start).lte('check_in', end)
      .order('check_in', { ascending: false });
    setVisitors(data || []);
    setLoading(false);
  };

  const checkin = async () => {
    if (!form.visitor_name.trim()) { toast({ title: 'Visitor name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await (supabase as any).from('visitors').insert({
        institution_id: institutionId, ...form, check_in: new Date().toISOString(),
      });
      toast({ title: '✅ Visitor checked in!' });
      setDialog(false);
      setForm({ visitor_name:'', phone:'', purpose:'', person_to_meet:'', department:'', id_proof_type:'', id_proof_no:'', remarks:'' });
      fetch();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const checkout = async (id: string) => {
    await (supabase as any).from('visitors').update({ check_out: new Date().toISOString() }).eq('id', id);
    toast({ title: '✅ Visitor checked out!' });
    fetch();
  };

  const exportCSV = () => {
    const csv = 'Name,Phone,Purpose,Person To Meet,Check In,Check Out\n' +
      visitors.map(v => `"${v.visitor_name}","${v.phone||''}","${v.purpose||''}","${v.person_to_meet||''}","${v.check_in ? format(new Date(v.check_in),'dd/MM/yyyy HH:mm') : ''}","${v.check_out ? format(new Date(v.check_out),'dd/MM/yyyy HH:mm') : 'Not checked out'}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`visitors-${filterDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = visitors.filter(v =>
    !search || v.visitor_name?.toLowerCase().includes(search.toLowerCase()) || v.phone?.includes(search)
  );
  const inside = visitors.filter(v => !v.check_out).length;

  // Guard: wait for institutionId
  if (!institutionId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Visitor Book</h2><p className="text-sm text-muted-foreground">Track visitors and front desk</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />Export</Button>
          <Button size="sm" onClick={() => setDialog(true)}><Plus className="w-4 h-4 mr-1" />Check In</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm bg-blue-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{visitors.length}</p><p className="text-xs text-muted-foreground">Total Today</p></CardContent></Card>
        <Card className="shadow-sm bg-emerald-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{inside}</p><p className="text-xs text-muted-foreground">Currently Inside</p></CardContent></Card>
        <Card className="shadow-sm bg-gray-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-600">{visitors.length - inside}</p><p className="text-xs text-muted-foreground">Checked Out</p></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-auto" />
        <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search visitor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Visitor</TableHead><TableHead>Purpose</TableHead><TableHead>Person to Meet</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
              : filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground"><Users className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No visitors today</p></TableCell></TableRow>
              : filtered.map((v, idx) => (
                <TableRow key={v.id}>
                  <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell><p className="font-medium text-sm">{v.visitor_name}</p>{v.phone && <p className="text-xs text-muted-foreground">{v.phone}</p>}</TableCell>
                  <TableCell className="text-sm">{v.purpose || '—'}</TableCell>
                  <TableCell className="text-sm">{v.person_to_meet || '—'}</TableCell>
                  <TableCell className="text-sm">{v.check_in ? format(new Date(v.check_in), 'HH:mm') : '—'}</TableCell>
                  <TableCell className="text-sm">{v.check_out ? format(new Date(v.check_out), 'HH:mm') : '—'}</TableCell>
                  <TableCell>
                    {v.check_out
                      ? <Badge className="text-xs border-0 bg-gray-100 text-gray-600">Out</Badge>
                      : <Badge className="text-xs border-0 bg-emerald-100 text-emerald-700">Inside</Badge>}
                  </TableCell>
                  <TableCell>
                    {!v.check_out && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => checkout(v.id)}>
                        <LogOut className="w-3 h-3 mr-1" />Check Out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Visitor Check In</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Visitor Name *</Label><Input value={form.visitor_name} onChange={e => setForm(f=>({...f,visitor_name:e.target.value}))} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} /></div>
            <div className="space-y-1.5"><Label>Purpose</Label><Input value={form.purpose} onChange={e => setForm(f=>({...f,purpose:e.target.value}))} placeholder="Meeting, Enquiry..." /></div>
            <div className="space-y-1.5"><Label>Person to Meet</Label><Input value={form.person_to_meet} onChange={e => setForm(f=>({...f,person_to_meet:e.target.value}))} /></div>
            <div className="space-y-1.5"><Label>Department</Label><Input value={form.department} onChange={e => setForm(f=>({...f,department:e.target.value}))} /></div>
            <div className="space-y-1.5"><Label>ID Proof Type</Label>
              <Select value={form.id_proof_type} onValueChange={v => setForm(f=>({...f,id_proof_type:v}))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{['Aadhaar','PAN','Voter ID','Passport','Driving License','Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>ID Proof No.</Label><Input value={form.id_proof_no} onChange={e => setForm(f=>({...f,id_proof_no:e.target.value}))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Remarks</Label><Input value={form.remarks} onChange={e => setForm(f=>({...f,remarks:e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={checkin} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Check In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}