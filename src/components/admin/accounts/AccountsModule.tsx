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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, TrendingUp, TrendingDown, Download, Loader2, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const INCOME_CATS = ['Fee Collection', 'Donation', 'Grant', 'Transport Fee', 'Library Fine', 'Other Income'];
const EXPENSE_CATS = ['Salary', 'Utilities', 'Maintenance', 'Stationery', 'Furniture', 'Equipment', 'Transport', 'Library', 'Events', 'Other Expense'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function AccountsModule() {
  const { institutionId } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [type, setType] = useState<'income'|'expense'>('income');
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [year] = useState(new Date().getFullYear());

  const [form, setForm] = useState({ type: 'income', category: '', amount: '', description: '', transaction_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', reference_no: '' });

  useEffect(() => { if (institutionId) fetch(); }, [institutionId]);

  const fetch = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('accounts').select('*').eq('institution_id', institutionId!).order('transaction_date', { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.category || !form.amount) { toast({ title: 'Category and amount required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await (supabase as any).from('accounts').insert({ ...form, institution_id: institutionId, amount: parseFloat(form.amount), type });
      toast({ title: `✅ ${type === 'income' ? 'Income' : 'Expense'} added!` });
      setDialog(false);
      setForm({ type: 'income', category: '', amount: '', description: '', transaction_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', reference_no: '' });
      fetch();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const filtered = transactions.filter(t => {
    const mt = filterType === 'all' || t.type === filterType;
    const mm = filterMonth === 'all' || new Date(t.transaction_date).getMonth() === parseInt(filterMonth);
    return mt && mm;
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s,t) => s + (t.amount||0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s,t) => s + (t.amount||0), 0);
  const balance = totalIncome - totalExpense;

  // Monthly chart data
  const monthlyData = MONTHS.map((m, i) => {
    const income = transactions.filter(t => t.type === 'income' && new Date(t.transaction_date).getMonth() === i).reduce((s,t) => s + (t.amount||0), 0);
    const expense = transactions.filter(t => t.type === 'expense' && new Date(t.transaction_date).getMonth() === i).reduce((s,t) => s + (t.amount||0), 0);
    return { month: m, income: Math.round(income), expense: Math.round(expense) };
  });

  const exportCSV = () => {
    const csv = 'Date,Type,Category,Amount,Mode,Description\n' +
      filtered.map(t => `"${t.transaction_date}","${t.type}","${t.category}",${t.amount},"${t.payment_mode}","${t.description||''}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'accounts.csv'; a.click();
    URL.revokeObjectURL(url);
  };

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
        <div><h2 className="text-lg font-semibold">Account Management</h2><p className="text-sm text-muted-foreground">Track income and expenses</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />Export</Button>
          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => { setType('expense'); setForm(f => ({...f, type: 'expense', category: ''})); setDialog(true); }}><Plus className="w-4 h-4 mr-1" />Expense</Button>
          <Button size="sm" onClick={() => { setType('income'); setForm(f => ({...f, type: 'income', category: ''})); setDialog(true); }}><Plus className="w-4 h-4 mr-1" />Income</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
            <div><p className="text-xs text-muted-foreground">Total Income</p><p className="text-xl font-bold text-emerald-600">₹{Math.round(totalIncome/1000)}k</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-red-500" />
            <div><p className="text-xs text-muted-foreground">Total Expense</p><p className="text-xl font-bold text-red-500">₹{Math.round(totalExpense/1000)}k</p></div>
          </CardContent>
        </Card>
        <Card className={`shadow-sm ${balance >= 0 ? 'bg-blue-50' : 'bg-amber-50'}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <IndianRupee className={`w-8 h-8 ${balance >= 0 ? 'text-blue-500' : 'text-amber-500'}`} />
            <div><p className="text-xs text-muted-foreground">Balance</p><p className={`text-xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>₹{Math.round(Math.abs(balance)/1000)}k</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="chart">Monthly Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-3">
          <div className="flex gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Months</SelectItem>{MONTHS.map((m,i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                  : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No transactions</TableCell></TableRow>
                  : filtered.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{new Date(t.transaction_date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell><Badge className={`text-xs border-0 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{t.type}</Badge></TableCell>
                      <TableCell className="text-sm">{t.category}</TableCell>
                      <TableCell className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type === 'income' ? '+' : '-'}₹{(t.amount||0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-sm capitalize">{t.payment_mode}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.description || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-sm">Monthly Income vs Expense — {year}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : v} />
                  <Tooltip formatter={(v: any) => `₹${v.toLocaleString('en-IN')}`} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" radius={[4,4,0,0]} name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add {type === 'income' ? 'Income' : 'Expense'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{(type === 'income' ? INCOME_CATS : EXPENSE_CATS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Amount ₹ *</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="0" /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.transaction_date} onChange={e => setForm(f => ({...f, transaction_date: e.target.value}))} /></div>
              <div className="space-y-1.5"><Label>Payment Mode</Label>
                <Select value={form.payment_mode} onValueChange={v => setForm(f => ({...f, payment_mode: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['cash','bank','upi','cheque','online'].map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Reference No.</Label><Input value={form.reference_no} onChange={e => setForm(f => ({...f, reference_no: e.target.value}))} placeholder="Optional" /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className={type === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add {type === 'income' ? 'Income' : 'Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}