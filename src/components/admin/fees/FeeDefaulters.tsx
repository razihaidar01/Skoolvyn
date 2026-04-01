import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ArrowLeft, Download, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export function FeeDefaulters() {
  const { institutionId } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterDays, setFilterDays] = useState('all');

  useEffect(() => {
    if (!institutionId) return;
    fetchData();
  }, [institutionId]);

  const fetchData = async () => {
    if (!institutionId) return;
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [feesRes, batchRes] = await Promise.all([
      (supabase as any).from('student_fees')
        .select('id, student_id, net_amount, paid_amount, due_date, status')
        .eq('institution_id', institutionId)
        .neq('status', 'paid')
        .lt('due_date', today)
        .order('due_date', { ascending: true }),
      (supabase as any).from('batches').select('id, name').eq('institution_id', institutionId).eq('is_active', true),
    ]);

    setBatches(batchRes.data || []);
    const fees = feesRes.data || [];

    if (fees.length > 0) {
      const studentIds = [...new Set(fees.map((f: any) => f.student_id))];
      const { data: students } = await (supabase as any)
        .from('students')
        .select('id, full_name, admission_no, batch_id')
        .in('id', studentIds);
      const studentMap = Object.fromEntries((students || []).map((s: any) => [s.id, s]));

      // Get batch names
      const batchMap = Object.fromEntries((batchRes.data || []).map((b: any) => [b.id, b.name]));

      setDefaulters(fees.map((f: any) => {
        const student = studentMap[f.student_id];
        return {
          ...f,
          student_name: student?.full_name || 'Unknown',
          admission_no: student?.admission_no || '',
          batch_id: student?.batch_id,
          batch_name: student?.batch_id ? batchMap[student.batch_id] || '' : '',
          balance: (Number(f.net_amount) || 0) - (Number(f.paid_amount) || 0),
          days_overdue: f.due_date ? differenceInDays(new Date(), new Date(f.due_date)) : 0,
        };
      }));
    } else {
      setDefaulters([]);
    }
    setLoading(false);
  };

  const filtered = defaulters.filter(d => {
    if (filterBatch !== 'all' && d.batch_id !== filterBatch) return false;
    if (filterDays === '30' && d.days_overdue < 30) return false;
    if (filterDays === '60' && d.days_overdue < 60) return false;
    if (filterDays === '90' && d.days_overdue < 90) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = ['Student Name', 'Admission No', 'Class', 'Amount Due', 'Due Date', 'Days Overdue'];
    const rows = filtered.map(d => [d.student_name, d.admission_no, d.batch_name, d.balance, d.due_date || '', d.days_overdue]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fee-defaulters-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/fees')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-semibold text-foreground">Fee Defaulters</h2>
          <Badge variant="destructive">{filtered.length}</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterBatch} onValueChange={setFilterBatch}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Batches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDays} onValueChange={setFilterDays}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Overdue" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Overdue</SelectItem>
            <SelectItem value="30">30+ days</SelectItem>
            <SelectItem value="60">60+ days</SelectItem>
            <SelectItem value="90">90+ days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-5">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-4xl">🎉</span>
              <p className="text-muted-foreground mt-3">No fee defaulters found!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(d => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">{d.student_name}</p>
                          <p className="text-xs text-muted-foreground">{d.admission_no}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{d.batch_name || '-'}</TableCell>
                      <TableCell className="font-semibold text-destructive">{formatINR(d.balance)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.due_date ? format(new Date(d.due_date), 'dd MMM yyyy') : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={d.days_overdue >= 60 ? 'destructive' : 'secondary'} className="text-xs">
                          {d.days_overdue} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.status === 'partial' ? 'outline' : 'destructive'} className="text-xs">{d.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => navigate('/admin/fees/collect')}>Collect</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
