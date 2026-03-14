import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  ChevronLeft, Pencil, Printer, UserX, Upload, Download, Trash2,
  Calendar, FileText, GraduationCap, IndianRupee, ClipboardCheck, Clock
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export function StudentProfile() {
  const { institutionId } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [student, setStudent] = useState<any>(null);
  const [batch, setBatch] = useState<any>(null);
  const [program, setProgram] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id || !institutionId) return;
    fetchAll();
  }, [id, institutionId]);

  const fetchAll = async () => {
    if (!id || !institutionId) return;
    setLoading(true);

    const [studentRes, feeRes, paymentRes, attendanceRes, marksRes, docsRes] = await Promise.all([
      supabase.from('students').select('*').eq('id', id).eq('institution_id', institutionId).single(),
      supabase.from('student_fees').select('*').eq('student_id', id).eq('institution_id', institutionId),
      supabase.from('fee_payments').select('*').eq('student_id', id).eq('institution_id', institutionId).order('payment_date', { ascending: false }),
      supabase.from('student_attendance').select('*').eq('student_id', id).eq('institution_id', institutionId).order('date', { ascending: false }).limit(100),
      supabase.from('marks').select('*, exams(exam_date, max_marks, pass_marks, subjects(name), exam_types(name))').eq('student_id', id).eq('institution_id', institutionId),
      (supabase as any).from('student_documents').select('*').eq('student_id', id).eq('institution_id', institutionId).order('created_at', { ascending: false }),
    ]);

    const s = studentRes.data;
    setStudent(s);
    setFees(feeRes.data || []);
    setPayments(paymentRes.data || []);
    setAttendance(attendanceRes.data || []);
    setMarks(marksRes.data || []);
    setDocuments(docsRes.data || []);

    if (s?.batch_id) {
      const batchRes = await supabase.from('batches').select('name, program_id').eq('id', s.batch_id).single();
      setBatch(batchRes.data);
      if (batchRes.data?.program_id) {
        const progRes = await supabase.from('programs').select('name').eq('id', batchRes.data.program_id).single();
        setProgram(progRes.data);
      }
    }

    setLoading(false);
  };

  const handleDeactivate = async () => {
    if (!id || !institutionId) return;
    await supabase.from('students').update({ status: 'inactive' }).eq('id', id).eq('institution_id', institutionId);
    toast({ title: 'Student Deactivated' });
    fetchAll();
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file || !id || !institutionId) return;
    setUploading(true);

    const filePath = `${institutionId}/${id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('student-documents').upload(filePath, file);
    if (uploadErr) {
      toast({ title: 'Upload Failed', description: uploadErr.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('student-documents').getPublicUrl(filePath);

    await (supabase as any).from('student_documents').insert({
      student_id: id,
      institution_id: institutionId,
      document_type: docType,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
    });

    toast({ title: 'Document Uploaded' });
    setUploading(false);
    fetchAll();
  };

  const handleDeleteDoc = async (docId: string) => {
    await (supabase as any).from('student_documents').delete().eq('id', docId);
    toast({ title: 'Document Deleted' });
    fetchAll();
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  if (!student) {
    return (
      <div className="text-center py-16">
        <h3 className="font-semibold text-foreground">Student not found</h3>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/students')}>Back to List</Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    const p = name.split(' ');
    return (p[0]?.[0] || '') + (p[1]?.[0] || '');
  };

  // Fee summary
  const totalFee = fees.reduce((s, f) => s + (f.net_amount || 0), 0);
  const paidFee = fees.reduce((s, f) => s + (f.paid_amount || 0), 0);
  const pendingFee = totalFee - paidFee;

  // Attendance summary
  const totalAtt = attendance.length;
  const presentAtt = attendance.filter(a => a.status === 'present').length;
  const attPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

  const DOC_TYPES = ['Aadhaar Card', 'Birth Certificate', 'Transfer Certificate', 'Mark Sheet', 'Photo', 'Other'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/students')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {student.profile_photo_url ? (
              <img src={student.profile_photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-primary">{getInitials(student.full_name)}</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground">{student.full_name}</h2>
            <div className="flex flex-wrap gap-2 mt-1">
              {student.roll_no && <Badge variant="secondary">{student.roll_no}</Badge>}
              {batch && <Badge variant="outline">{batch.name}</Badge>}
              {program && <Badge variant="outline">{program.name}</Badge>}
              <Badge className={student.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}>{student.status || 'active'}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/students/${id}/edit`)}>
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
                <UserX className="w-4 h-4 mr-1" /> Deactivate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Student?</AlertDialogTitle>
                <AlertDialogDescription>This will mark {student.full_name} as inactive. You can reactivate later.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate}>Deactivate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow label="Date of Birth" value={student.date_of_birth ? format(new Date(student.date_of_birth), 'dd/MM/yyyy') : '—'} />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="Blood Group" value={student.blood_group} />
                <InfoRow label="Category" value={student.category} />
                <InfoRow label="Aadhaar" value={student.aadhaar_no} />
                <InfoRow label="Religion" value={student.religion} />
                <InfoRow label="Nationality" value={student.nationality} />
                <InfoRow label="Phone" value={student.phone} />
                <InfoRow label="Email" value={student.email} />
                <InfoRow label="Address" value={[student.address, student.city, student.state, student.pincode].filter(Boolean).join(', ')} />
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Parent / Guardian</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow label="Guardian 1" value={student.guardian1_name} />
                <InfoRow label="Relation" value={student.guardian1_relation} />
                <InfoRow label="Phone" value={student.guardian1_phone} />
                <InfoRow label="Occupation" value={student.guardian1_occupation} />
                <InfoRow label="Email" value={student.guardian1_email} />
                <InfoRow label="Guardian 2" value={student.guardian2_name} />
                <InfoRow label="Phone" value={student.guardian2_phone} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ACADEMIC */}
        <TabsContent value="academic">
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Current Enrollment</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <InfoRow label="Admission No" value={student.admission_no} />
                <InfoRow label="Admission Date" value={student.admission_date ? format(new Date(student.admission_date), 'dd/MM/yyyy') : '—'} />
                <InfoRow label="Program" value={program?.name} />
                <InfoRow label="Batch" value={batch?.name} />
                <InfoRow label="Roll No" value={student.roll_no} />
                <InfoRow label="Previous School" value={student.prev_school} />
                <InfoRow label="Previous Board" value={student.prev_board} />
                <InfoRow label="Previous %" value={student.prev_percentage?.toString()} />
              </CardContent>
            </Card>

            {marks.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-base">Exam Results</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Max</TableHead>
                        <TableHead>Obtained</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marks.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-sm">{m.exams?.exam_types?.name || '—'}</TableCell>
                          <TableCell className="text-sm">{m.exams?.subjects?.name || '—'}</TableCell>
                          <TableCell className="text-sm">{m.exams?.max_marks || '—'}</TableCell>
                          <TableCell className="text-sm font-medium">{m.marks_obtained ?? '—'}</TableCell>
                          <TableCell className="text-sm">{m.grade || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* FEES */}
        <TabsContent value="fees">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm"><CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Fee</p>
                <p className="text-xl font-bold text-foreground">{formatINR(totalFee)}</p>
              </CardContent></Card>
              <Card className="shadow-sm"><CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-xl font-bold text-emerald-600">{formatINR(paidFee)}</p>
              </CardContent></Card>
              <Card className="shadow-sm"><CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-destructive">{formatINR(pendingFee)}</p>
              </CardContent></Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No payments recorded</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm">{p.payment_date ? format(new Date(p.payment_date), 'dd/MM/yyyy') : '—'}</TableCell>
                          <TableCell className="text-sm">{p.receipt_no}</TableCell>
                          <TableCell className="text-sm font-medium">{formatINR(p.amount)}</TableCell>
                          <TableCell className="text-sm">{p.payment_mode || '—'}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{p.status || 'success'}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ATTENDANCE */}
        <TabsContent value="attendance">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm"><CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Days</p>
                <p className="text-xl font-bold text-foreground">{totalAtt}</p>
              </CardContent></Card>
              <Card className="shadow-sm"><CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-xl font-bold text-emerald-600">{presentAtt}</p>
              </CardContent></Card>
              <Card className="shadow-sm"><CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Attendance %</p>
                <p className="text-xl font-bold text-foreground">{attPct}%</p>
                <Progress value={attPct} className="mt-2 h-2" />
              </CardContent></Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Recent Attendance</CardTitle></CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No attendance records</p>
                ) : (
                  <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                    {attendance.slice(0, 30).map((a: any) => (
                      <div key={a.id} className={`w-full aspect-square rounded flex flex-col items-center justify-center text-[10px] font-medium ${
                        a.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                        a.status === 'absent' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        <span>{format(new Date(a.date), 'dd')}</span>
                        <span>{format(new Date(a.date), 'MMM')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Documents</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DOC_TYPES.map(docType => {
                  const doc = documents.find((d: any) => d.document_type === docType);
                  return (
                    <div key={docType} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{docType}</span>
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      {doc ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                              <a href={doc.file_url} target="_blank" rel="noreferrer"><Download className="w-3 h-3 mr-1" /> View</a>
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs h-7 text-destructive" onClick={() => handleDeleteDoc(doc.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <div className="border-2 border-dashed rounded-lg p-3 text-center hover:bg-muted/50 transition-colors">
                            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                            <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Upload'}</span>
                          </div>
                          <input type="file" className="hidden" onChange={e => handleDocUpload(e, docType)} disabled={uploading} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIMELINE */}
        <TabsContent value="timeline">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {student.created_at && (
                  <TimelineItem icon={<GraduationCap className="w-4 h-4" />} title="Student Registered" date={student.created_at} />
                )}
                {student.admission_date && (
                  <TimelineItem icon={<Calendar className="w-4 h-4" />} title={`Admitted (${student.admission_no})`} date={student.admission_date} />
                )}
                {payments.slice(0, 5).map((p: any) => (
                  <TimelineItem key={p.id} icon={<IndianRupee className="w-4 h-4" />} title={`Fee Payment: ${formatINR(p.amount)}`} date={p.payment_date || p.created_at} />
                ))}
                {marks.slice(0, 5).map((m: any) => (
                  <TimelineItem key={m.id} icon={<ClipboardCheck className="w-4 h-4" />} title={`Exam: ${m.exams?.subjects?.name || 'Exam'} — ${m.marks_obtained || 0} marks`} date={m.created_at} />
                ))}
              </div>
              {payments.length === 0 && marks.length === 0 && !student.created_at && (
                <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-1 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium text-right">{value || '—'}</span>
    </div>
  );
}

function TimelineItem({ icon, title, date }: { icon: React.ReactNode; title: string; date: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(date), { addSuffix: true })}</p>
      </div>
    </div>
  );
}
