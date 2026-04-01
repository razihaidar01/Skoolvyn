import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, ArrowLeft, CheckCircle, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export function CollectFee() {
  const { institutionId, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [pendingFees, setPendingFees] = useState<any[]>([]);
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  const searchStudents = async () => {
    if (!institutionId || !search.trim()) return;
    setSearchLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('students')
        .select('id, full_name, admission_no, roll_no, batch_id, status')
        .eq('institution_id', institutionId)
        .or(`full_name.ilike.%${search}%,admission_no.ilike.%${search}%,roll_no.ilike.%${search}%`)
        .eq('status', 'active')
        .limit(20);
      setStudents(data || []);
    } catch { /* silent */ }
    setSearchLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => { if (search.trim().length >= 2) searchStudents(); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const selectStudent = async (student: any) => {
    setSelectedStudent(student);
    // Fetch pending fees
    const { data } = await (supabase as any)
      .from('student_fees')
      .select('id, net_amount, paid_amount, due_date, status, fee_structure_id, balance_amount')
      .eq('institution_id', institutionId)
      .eq('student_id', student.id)
      .neq('status', 'paid')
      .order('due_date', { ascending: true });
    setPendingFees(data || []);
    setSelectedFees([]);
    setStep(2);
  };

  const totalSelected = pendingFees
    .filter(f => selectedFees.includes(f.id))
    .reduce((s, f) => s + ((Number(f.net_amount) || 0) - (Number(f.paid_amount) || 0)), 0);

  const toggleFee = (id: string) => {
    setSelectedFees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const generateReceipt = async (): Promise<string> => {
    const { data } = await (supabase as any)
      .from('fee_payments')
      .select('receipt_no')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false })
      .limit(1);
    const last = data?.[0]?.receipt_no;
    const year = new Date().getFullYear();
    if (last) {
      const parts = last.split('-');
      const num = parseInt(parts[2] || '0', 10) + 1;
      return `RCP-${year}-${String(num).padStart(3, '0')}`;
    }
    return `RCP-${year}-001`;
  };

  const handleSubmit = async () => {
    if (!institutionId || !selectedStudent || selectedFees.length === 0) return;
    const amount = customAmount ? Number(customAmount) : totalSelected;
    if (amount <= 0) { toast({ title: 'Invalid amount', variant: 'destructive' }); return; }

    setSubmitting(true);
    try {
      const receiptNo = await generateReceipt();

      // Insert payment for each selected fee
      for (const feeId of selectedFees) {
        const fee = pendingFees.find(f => f.id === feeId);
        if (!fee) continue;
        const balance = (Number(fee.net_amount) || 0) - (Number(fee.paid_amount) || 0);
        const payAmount = Math.min(balance, amount / selectedFees.length);

        await (supabase as any).from('fee_payments').insert({
          institution_id: institutionId,
          student_id: selectedStudent.id,
          student_fee_id: feeId,
          amount: payAmount,
          payment_date: paymentDate,
          payment_mode: paymentMode,
          transaction_id: transactionId || null,
          receipt_no: receiptNo,
          remarks: remarks || null,
          collected_by: session?.user?.id || null,
          status: 'success',
        });

        // Update student_fees
        const newPaid = (Number(fee.paid_amount) || 0) + payAmount;
        const newBalance = (Number(fee.net_amount) || 0) - newPaid;
        const newStatus = newBalance <= 0 ? 'paid' : 'partial';
        await (supabase as any).from('student_fees').update({
          paid_amount: newPaid,
          balance_amount: newBalance,
          status: newStatus,
        }).eq('id', feeId);
      }

      setReceipt({ receiptNo, amount, student: selectedStudent.full_name, date: paymentDate, mode: paymentMode });
      setStep(4);
      toast({ title: 'Payment recorded successfully!' });
    } catch {
      toast({ title: 'Failed to record payment', variant: 'destructive' });
    }
    setSubmitting(false);
  };

  if (step === 4 && receipt) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/fees')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Fees
        </Button>
        <Card className="max-w-md mx-auto shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Payment Successful!</h2>
            <div className="text-left space-y-2 bg-muted rounded-lg p-4">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Receipt No</span><span className="font-mono font-semibold">{receipt.receiptNo}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Student</span><span className="font-medium">{receipt.student}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold text-primary">{formatINR(receipt.amount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Mode</span><span>{receipt.mode}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date</span><span>{format(new Date(receipt.date), 'dd MMM yyyy')}</span></div>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => { setStep(1); setSelectedStudent(null); setReceipt(null); setSearch(''); }}>Collect Another</Button>
              <Button onClick={() => navigate('/admin/fees')}>Done</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => step === 1 ? navigate('/admin/fees') : setStep(step - 1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> {step === 1 ? 'Back' : 'Previous'}
        </Button>
        <h2 className="text-lg font-semibold text-foreground">Collect Fee</h2>
        <Badge variant="secondary">Step {step} of 3</Badge>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      {step === 1 && (
        <Card className="shadow-sm">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Find Student</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search by name, admission number, or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchLoading && <p className="text-sm text-muted-foreground">Searching...</p>}
            {students.length > 0 && (
              <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
                {students.map(s => (
                  <button
                    key={s.id}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => selectStudent(s)}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">Adm: {s.admission_no} {s.roll_no ? `| Roll: ${s.roll_no}` : ''}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{s.status}</Badge>
                  </button>
                ))}
              </div>
            )}
            {search.trim().length >= 2 && !searchLoading && students.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && selectedStudent && (
        <Card className="shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{selectedStudent.full_name}</h3>
                <p className="text-xs text-muted-foreground">Admission: {selectedStudent.admission_no}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setStep(1); setSelectedStudent(null); }}>Change</Button>
            </div>

            {pendingFees.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending fees for this student!</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingFees.map(fee => {
                      const balance = (Number(fee.net_amount) || 0) - (Number(fee.paid_amount) || 0);
                      return (
                        <TableRow key={fee.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedFees.includes(fee.id)}
                              onCheckedChange={() => toggleFee(fee.id)}
                            />
                          </TableCell>
                          <TableCell className="text-sm font-medium">Fee #{fee.id.substring(0, 6)}</TableCell>
                          <TableCell>{formatINR(Number(fee.net_amount) || 0)}</TableCell>
                          <TableCell>{formatINR(Number(fee.paid_amount) || 0)}</TableCell>
                          <TableCell className="font-semibold text-destructive">{formatINR(balance)}</TableCell>
                          <TableCell className="text-xs">{fee.due_date ? format(new Date(fee.due_date), 'dd MMM yyyy') : 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={fee.status === 'overdue' ? 'destructive' : 'secondary'} className="text-xs">
                              {fee.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {selectedFees.length > 0 && (
                  <div className="flex items-center justify-between bg-muted rounded-lg p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{selectedFees.length} fee(s) selected</p>
                      <p className="text-lg font-bold text-foreground">{formatINR(totalSelected)}</p>
                    </div>
                    <Button onClick={() => { setCustomAmount(String(totalSelected)); setStep(3); }}>
                      Proceed to Payment <IndianRupee className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="shadow-sm">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Payment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} />
              </div>
              <div>
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="dd">Demand Draft</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {['online', 'upi', 'cheque'].includes(paymentMode) && (
                <div>
                  <Label>{paymentMode === 'cheque' ? 'Cheque Number' : 'Transaction ID'}</Label>
                  <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
                </div>
              )}
              <div>
                <Label>Payment Date</Label>
                <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Remarks (optional)</Label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Paying for {selectedStudent?.full_name}</p>
                <p className="text-xl font-bold text-primary">{formatINR(Number(customAmount) || 0)}</p>
              </div>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
