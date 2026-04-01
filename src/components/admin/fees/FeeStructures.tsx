import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';

function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export function FeeStructures() {
  const { institutionId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [structures, setStructures] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('annual');
  const [dueDate, setDueDate] = useState('');

  // Batch assignment
  const [assignOpen, setAssignOpen] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStructures, setSelectedStructures] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!institutionId) return;
    fetchData();
  }, [institutionId]);

  const fetchData = async () => {
    if (!institutionId) return;
    setLoading(true);
    const [structRes, batchRes] = await Promise.all([
      (supabase as any).from('fee_structures').select('*').eq('institution_id', institutionId).order('created_at', { ascending: false }),
      (supabase as any).from('batches').select('id, name').eq('institution_id', institutionId).eq('is_active', true),
    ]);
    setStructures(structRes.data || []);
    setBatches(batchRes.data || []);
    setLoading(false);
  };

  const openDialog = (item?: any) => {
    if (item) {
      setEditing(item);
      setName(item.name);
      setAmount(String(item.amount));
      setFrequency(item.frequency || 'annual');
      setDueDate(item.due_date || '');
    } else {
      setEditing(null);
      setName('');
      setAmount('');
      setFrequency('annual');
      setDueDate('');
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !amount) { toast({ title: 'Name and amount are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (editing) {
        await (supabase as any).from('fee_structures').update({
          name, amount: Number(amount), frequency, due_date: dueDate || null
        }).eq('id', editing.id);
        toast({ title: 'Fee structure updated' });
      } else {
        await (supabase as any).from('fee_structures').insert({
          institution_id: institutionId, name, amount: Number(amount), frequency, due_date: dueDate || null
        });
        toast({ title: 'Fee structure created' });
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fee structure?')) return;
    await (supabase as any).from('fee_structures').delete().eq('id', id);
    toast({ title: 'Deleted' });
    fetchData();
  };

  const handleAssign = async () => {
    if (!selectedBatch || selectedStructures.length === 0) {
      toast({ title: 'Select a batch and at least one fee structure', variant: 'destructive' });
      return;
    }
    setAssigning(true);
    try {
      // Get students in batch
      const { data: students } = await (supabase as any)
        .from('students').select('id').eq('institution_id', institutionId).eq('batch_id', selectedBatch).eq('status', 'active');

      if (!students?.length) {
        toast({ title: 'No active students in this batch', variant: 'destructive' });
        setAssigning(false);
        return;
      }

      const records: any[] = [];
      for (const student of students) {
        for (const structId of selectedStructures) {
          const struct = structures.find(s => s.id === structId);
          if (!struct) continue;
          records.push({
            institution_id: institutionId,
            student_id: student.id,
            fee_structure_id: structId,
            total_amount: struct.amount,
            net_amount: struct.amount,
            due_date: struct.due_date || null,
            status: 'pending',
          });
        }
      }

      if (records.length > 0) {
        await (supabase as any).from('student_fees').insert(records);
      }

      toast({ title: `Fees assigned to ${students.length} students` });
      setAssignOpen(false);
      setSelectedBatch('');
      setSelectedStructures([]);
    } catch {
      toast({ title: 'Failed to assign fees', variant: 'destructive' });
    }
    setAssigning(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/fees')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-semibold text-foreground">Fee Structures</h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>Assign to Batch</Button>
          <Button size="sm" onClick={() => openDialog()}><Plus className="w-4 h-4 mr-1" /> Add Structure</Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-5">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : structures.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No fee structures created yet.</p>
              <Button className="mt-3" size="sm" onClick={() => openDialog()}><Plus className="w-4 h-4 mr-1" /> Create First</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-semibold">{formatINR(Number(s.amount) || 0)}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{s.frequency || 'N/A'}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.due_date || 'Not set'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Fee Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tuition Fee" /></div>
            <div><Label>Amount (₹)</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div>
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Due Date</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Fees to Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger><SelectValue placeholder="Choose batch" /></SelectTrigger>
                <SelectContent>
                  {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Fee Structures</Label>
              <div className="border rounded-lg max-h-48 overflow-y-auto divide-y mt-1">
                {structures.map(s => (
                  <label key={s.id} className="flex items-center gap-2 p-2.5 hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStructures.includes(s.id)}
                      onChange={() => setSelectedStructures(prev =>
                        prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                      )}
                      className="rounded"
                    />
                    <span className="text-sm">{s.name} — {formatINR(Number(s.amount) || 0)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assigning}>{assigning ? 'Assigning...' : 'Assign'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
