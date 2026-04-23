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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MessageSquare, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-600',
};
const PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const CATEGORIES = ['academic', 'facility', 'staff', 'transport', 'fees', 'other', 'general'];

export function ComplaintsModule() {
  const { institutionId } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [resolveDialog, setResolveDialog] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [resolution, setResolution] = useState('');
  const [form, setForm] = useState({
    subject: '', description: '', category: 'general', priority: 'normal',
  });

  useEffect(() => { if (institutionId) fetch(); }, [institutionId]);

  const fetch = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('complaints').select('*')
      .eq('institution_id', institutionId!).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.subject.trim()) { toast({ title: 'Subject required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await (supabase as any).from('complaints').insert({
        institution_id: institutionId, ...form, status: 'open',
      });
      toast({ title: '✅ Complaint submitted!' });
      setDialog(false);
      setForm({ subject: '', description: '', category: 'general', priority: 'normal' });
      fetch();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string, res?: string) => {
    await (supabase as any).from('complaints').update({
      status, ...(res ? { resolution: res } : {}), updated_at: new Date().toISOString(),
    }).eq('id', id);
    toast({ title: `✅ Status updated to ${status}` });
    setResolveDialog(false);
    fetch();
  };

  const filtered = items.filter(i => {
    const s = filterStatus === 'all' || i.status === filterStatus;
    const p = filterPriority === 'all' || i.priority === filterPriority;
    return s && p;
  });

  const counts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  items.forEach(i => { if (counts[i.status as keyof typeof counts] !== undefined) counts[i.status as keyof typeof counts]++; });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Complaints & Feedback</h2><p className="text-sm text-muted-foreground">Track and resolve complaints</p></div>
        <Button size="sm" onClick={() => setDialog(true)}><Plus className="w-4 h-4 mr-1" />Add Complaint</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(counts).map(([status, count]) => (
          <Card key={status} className={`shadow-sm cursor-pointer ${filterStatus === status ? 'border-primary' : ''}`} onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground capitalize">{status.replace('_', ' ')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Status</SelectItem>{Object.keys(counts).map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="All Priority" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Priority</SelectItem>{['low','normal','high','urgent'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
              : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No complaints found</p></TableCell></TableRow>
              : filtered.map(item => (
                <TableRow key={item.id}>
                  <TableCell><p className="font-medium text-sm">{item.subject}</p>{item.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description}</p>}</TableCell>
                  <TableCell className="text-sm capitalize">{item.category}</TableCell>
                  <TableCell><Badge className={`text-xs border-0 capitalize ${PRIORITY_COLOR[item.priority]}`}>{item.priority}</Badge></TableCell>
                  <TableCell><Badge className={`text-xs border-0 capitalize ${STATUS_COLOR[item.status]}`}>{item.status?.replace('_', ' ')}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.status === 'open' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(item.id, 'in_progress')}>Start</Button>}
                      {['open','in_progress'].includes(item.status) && (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600" onClick={() => { setSelected(item); setResolution(''); setResolveDialog(true); }}>Resolve</Button>
                      )}
                      {item.status === 'resolved' && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateStatus(item.id, 'closed')}>Close</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Complaint Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Complaint</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Subject *</Label><Input value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} placeholder="Brief description" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({...f, priority: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['low','normal','high','urgent'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog} onOpenChange={setResolveDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve Complaint</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm font-medium">{selected?.subject}</p>
            <div className="space-y-1.5"><Label>Resolution Notes</Label><Textarea value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Describe how this was resolved..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => selected && updateStatus(selected.id, 'resolved', resolution)}>
              <CheckCircle className="w-4 h-4 mr-2" />Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}