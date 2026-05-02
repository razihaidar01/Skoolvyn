import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IndianRupee, Plus, Download, Loader2, Printer, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function PayrollModule() {
  const { institutionId } = useAuth();
  const { toast } = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const [form, setForm] = useState({
    basic_salary: '', hra: '', da: '', other_allowance: '',
    other_deduction: '', pf_deduction: '', tds_deduction: '',
  });

  useEffect(() => { if (institutionId) fetchAll(); }, [institutionId, selectedMonth, selectedYear]);

  const fetchAll = async () => {
    setLoading(true);
    const [sRes, pRes] = await Promise.all([
      (supabase as any).from('staff').select('id, full_name, designation, department_id, salary, employee_id').eq('institution_id', institutionId!).eq('status', 'active').order('full_name'),
      (supabase as any).from('payroll').select('*').eq('institution_id', institutionId!).eq('month', selectedMonth).eq('year', selectedYear),
    ]);
    setStaff(sRes.data || []);
    setPayroll(pRes.data || []);
    setLoading(false);
  };

  const openGenerate = (s: any) => {
    setSelectedStaff(s);
    const basic = s.salary || 0;
    setForm({
      basic_salary: basic.toString(),
      hra: Math.round(basic * 0.2).toString(),
      da: Math.round(basic * 0.1).toString(),
      other_allowance: '0',
      other_deduction: '0',
      pf_deduction: Math.round(basic * 0.12).toString(),
      tds_deduction: '0',
    });
    setShowDialog(true);
  };

  const savePayroll = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    try {
      const basic = Number(form.basic_salary) || 0;
      const hra = Number(form.hra) || 0;
      const da = Number(form.da) || 0;
      const other_allow = Number(form.other_allowance) || 0;
      const pf = Number(form.pf_deduction) || 0;
      const tds = Number(form.tds_deduction) || 0;
      const other_ded = Number(form.other_deduction) || 0;
      const gross = basic + hra + da + other_allow;
      const total_ded = pf + tds + other_ded;
      const net = gross - total_ded;

      const payload = {
        institution_id: institutionId,
        staff_id: selectedStaff.id,
        month: selectedMonth,
        year: selectedYear,
        basic_salary: basic,
        hra, da,
        other_allowance: other_allow,
        gross_salary: gross,
        pf_deduction: pf,
        tds_deduction: tds,
        other_deduction: other_ded,
        net_salary: net,
        status: 'generated',
      };

      // Check if exists
      const existing = payroll.find(p => p.staff_id === selectedStaff.id);
      if (existing) {
        await (supabase as any).from('payroll').update(payload).eq('id', existing.id);
      } else {
        await (supabase as any).from('payroll').insert(payload);
      }
      toast({ title: '✅ Payslip generated!' });
      setShowDialog(false);
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const markPaid = async (id: string) => {
    await (supabase as any).from('payroll').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
    toast({ title: '✅ Marked as paid!' });
    fetchAll();
  };

  const printPayslip = (p: any, s: any) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><style>
        body{font-family:Arial;padding:30px;max-width:800px;margin:0 auto}
        h2{text-align:center;border-bottom:2px solid #000;padding-bottom:10px}
        .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee}
        .section{margin:15px 0;background:#f9f9f9;padding:10px;border-radius:6px}
        .total{font-weight:bold;font-size:1.1em;border-top:2px solid #000;padding-top:8px}
        @media print{@page{margin:1cm}}
      </style></head><body>
      <h2>PAYSLIP — ${MONTHS[selectedMonth-1]} ${selectedYear}</h2>
      <div class="row"><span><b>Employee:</b> ${s?.full_name}</span><span><b>ID:</b> ${s?.employee_id}</span></div>
      <div class="row"><span><b>Designation:</b> ${s?.designation || '—'}</span><span><b>Month:</b> ${MONTHS[selectedMonth-1]} ${selectedYear}</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:15px">
        <div class="section">
          <b>EARNINGS</b>
          <div class="row"><span>Basic Salary</span><span>₹${p.basic_salary?.toLocaleString('en-IN')}</span></div>
          <div class="row"><span>HRA</span><span>₹${p.hra?.toLocaleString('en-IN')}</span></div>
          <div class="row"><span>DA</span><span>₹${p.da?.toLocaleString('en-IN')}</span></div>
          ${p.other_allowance ? `<div class="row"><span>Other Allowance</span><span>₹${p.other_allowance?.toLocaleString('en-IN')}</span></div>` : ''}
          <div class="row total"><span>Gross</span><span>₹${p.gross_salary?.toLocaleString('en-IN')}</span></div>
        </div>
        <div class="section">
          <b>DEDUCTIONS</b>
          <div class="row"><span>PF</span><span>₹${p.pf_deduction?.toLocaleString('en-IN')}</span></div>
          <div class="row"><span>TDS</span><span>₹${p.tds_deduction?.toLocaleString('en-IN')}</span></div>
          ${p.other_deduction ? `<div class="row"><span>Other</span><span>₹${p.other_deduction?.toLocaleString('en-IN')}</span></div>` : ''}
          <div class="row total"><span>Total Deductions</span><span>₹${((p.pf_deduction||0)+(p.tds_deduction||0)+(p.other_deduction||0))?.toLocaleString('en-IN')}</span></div>
        </div>
      </div>
      <div class="total row" style="font-size:1.3em;margin-top:15px;padding:10px;background:#e8f5e9;border-radius:6px">
        <span>NET SALARY</span><span>₹${p.net_salary?.toLocaleString('en-IN')}</span>
      </div>
      <div style="margin-top:50px;display:flex;justify-content:space-between">
        <div>Employee Signature: ___________</div>
        <div>HR/Accounts Signature: ___________</div>
      </div>
      </body></html>`);
    w.document.close(); w.print();
  };

  const payrollMap: Record<string, any> = {};
  payroll.forEach(p => { payrollMap[p.staff_id] = p; });
  const totalPayroll = payroll.reduce((s, p) => s + (p.net_salary || 0), 0);
  const paidCount = payroll.filter(p => p.status === 'paid').length;

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
        <div><h2 className="text-lg font-semibold">Payroll</h2><p className="text-sm text-muted-foreground">Manage staff salaries and payslips</p></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{staff.length}</p><p className="text-xs text-muted-foreground">Total Staff</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{paidCount}</p><p className="text-xs text-muted-foreground">Paid</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{payroll.length - paidCount}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 text-center"><p className="text-xl font-bold text-violet-600">₹{Math.round(totalPayroll / 1000)}k</p><p className="text-xs text-muted-foreground">Total Payout</p></CardContent></Card>
      </div>

      {/* Month/Year selector */}
      <div className="flex gap-3">
        <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(parseInt(v))}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>{MONTHS.map((m,i) => <SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>{[0,1,2].map(i => { const y = new Date().getFullYear()-i; return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>; })}</SelectContent>
        </Select>
      </div>

      {/* Staff Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
              : staff.map(s => {
                const p = payrollMap[s.id];
                return (
                  <TableRow key={s.id}>
                    <TableCell><p className="font-medium text-sm">{s.full_name}</p><p className="text-xs text-muted-foreground">{s.employee_id}</p></TableCell>
                    <TableCell className="text-sm">{s.designation || '—'}</TableCell>
                    <TableCell className="text-sm">₹{(s.salary || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-sm">{p ? `₹${(p.gross_salary||0).toLocaleString('en-IN')}` : '—'}</TableCell>
                    <TableCell className="text-sm font-medium">{p ? `₹${(p.net_salary||0).toLocaleString('en-IN')}` : '—'}</TableCell>
                    <TableCell>
                      {p ? <Badge className={`text-xs border-0 ${p.status==='paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</Badge>
                          : <Badge className="text-xs border-0 bg-muted text-muted-foreground">Not Generated</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openGenerate(s)}>
                          {p ? 'Edit' : 'Generate'}
                        </Button>
                        {p && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => printPayslip(p, s)}>
                          <Printer className="w-3 h-3" />
                        </Button>}
                        {p && p.status !== 'paid' && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600" onClick={() => markPaid(p.id)}>Paid</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Generate Payslip — {selectedStaff?.full_name}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Basic Salary ₹</Label><Input type="number" value={form.basic_salary} onChange={e => setForm(f => ({ ...f, basic_salary: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>HRA ₹</Label><Input type="number" value={form.hra} onChange={e => setForm(f => ({ ...f, hra: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>DA ₹</Label><Input type="number" value={form.da} onChange={e => setForm(f => ({ ...f, da: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Other Allowance ₹</Label><Input type="number" value={form.other_allowance} onChange={e => setForm(f => ({ ...f, other_allowance: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>PF Deduction ₹</Label><Input type="number" value={form.pf_deduction} onChange={e => setForm(f => ({ ...f, pf_deduction: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>TDS ₹</Label><Input type="number" value={form.tds_deduction} onChange={e => setForm(f => ({ ...f, tds_deduction: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Other Deduction ₹</Label><Input type="number" value={form.other_deduction} onChange={e => setForm(f => ({ ...f, other_deduction: e.target.value }))} /></div>
            <div className="space-y-1.5 bg-emerald-50 rounded-lg p-2">
              <Label className="text-emerald-700">Net Salary</Label>
              <p className="text-xl font-bold text-emerald-700">
                ₹{Math.max(0,
                  (Number(form.basic_salary)||0)+(Number(form.hra)||0)+(Number(form.da)||0)+(Number(form.other_allowance)||0)
                  -(Number(form.pf_deduction)||0)-(Number(form.tds_deduction)||0)-(Number(form.other_deduction)||0)
                ).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={savePayroll} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}