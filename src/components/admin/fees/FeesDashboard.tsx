import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { IndianRupee, AlertTriangle, CreditCard, TrendingUp, Users } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export function FeesDashboard() {
  const { institutionId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ expected: 0, collected: 0, pending: 0, overdueCount: 0 });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);

  useEffect(() => {
    if (!institutionId) return;
    fetchData();
  }, [institutionId]);

  const fetchData = async () => {
    if (!institutionId) return;
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      const [feesRes, paymentsRes, recentRes, defaulterRes] = await Promise.all([
        (supabase as any).from('student_fees').select('net_amount, paid_amount, status, due_date').eq('institution_id', institutionId),
        (supabase as any).from('fee_payments').select('amount').eq('institution_id', institutionId),
        (supabase as any).from('fee_payments').select('id, amount, payment_date, payment_mode, receipt_no, student_id').eq('institution_id', institutionId).order('payment_date', { ascending: false }).limit(10),
        (supabase as any).from('student_fees').select('id, student_id, net_amount, paid_amount, due_date, status').eq('institution_id', institutionId).neq('status', 'paid').lt('due_date', today).limit(5),
      ]);

      const fees = feesRes.data || [];
      const expected = fees.reduce((s: number, f: any) => s + (Number(f.net_amount) || 0), 0);
      const collected = (paymentsRes.data || []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
      const overdueCount = fees.filter((f: any) => f.due_date && f.due_date < today && f.status !== 'paid').length;

      setStats({ expected, collected, pending: expected - collected, overdueCount });
      setRecentPayments(recentRes.data || []);

      // Fetch student names for defaulters
      const defs = defaulterRes.data || [];
      if (defs.length > 0) {
        const studentIds = [...new Set(defs.map((d: any) => d.student_id))];
        const { data: students } = await (supabase as any).from('students').select('id, full_name, admission_no, batch_id').in('id', studentIds);
        const studentMap = Object.fromEntries((students || []).map((s: any) => [s.id, s]));
        setDefaulters(defs.map((d: any) => ({ ...d, student: studentMap[d.student_id] })));
      } else {
        setDefaulters([]);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Expected', value: formatINR(stats.expected), icon: TrendingUp, color: 'text-primary' },
    { label: 'Total Collected', value: formatINR(stats.collected), icon: CreditCard, color: 'text-emerald-600' },
    { label: 'Pending Amount', value: formatINR(stats.pending), icon: IndianRupee, color: 'text-amber-600' },
    { label: 'Overdue Fees', value: stats.overdueCount, icon: AlertTriangle, color: stats.overdueCount > 0 ? 'text-destructive' : 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-foreground">Fees Management</h2>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => navigate('/admin/fees/collect')}>
            <IndianRupee className="w-4 h-4 mr-1" /> Collect Fee
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/fees/structures')}>
            Fee Structures
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/fees/defaulters')}>
            View Defaulters
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="shadow-sm">
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent Payments</h3>
            </div>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : recentPayments.length === 0 ? (
              <div className="py-8 text-center">
                <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No payments recorded yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.receipt_no}</TableCell>
                      <TableCell className="font-semibold">{formatINR(Number(p.amount) || 0)}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{p.payment_mode || 'N/A'}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.payment_date ? format(new Date(p.payment_date), 'dd MMM yyyy') : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Defaulters */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Fee Defaulters</h3>
                {defaulters.length > 0 && <Badge variant="destructive" className="text-xs">{defaulters.length}</Badge>}
              </div>
              <Button variant="link" size="sm" className="text-xs" onClick={() => navigate('/admin/fees/defaulters')}>View all</Button>
            </div>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : defaulters.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-3xl">🎉</span>
                <p className="text-sm text-muted-foreground mt-2">No defaulters!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {defaulters.map((d) => {
                  const daysOverdue = d.due_date ? differenceInDays(new Date(), new Date(d.due_date)) : 0;
                  const balance = (Number(d.net_amount) || 0) - (Number(d.paid_amount) || 0);
                  return (
                    <div key={d.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.student?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{daysOverdue} days overdue</p>
                      </div>
                      <span className="text-sm font-semibold text-destructive">{formatINR(balance)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}