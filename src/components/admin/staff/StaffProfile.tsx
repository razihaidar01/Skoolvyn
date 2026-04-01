import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  ChevronLeft, Pencil, UserCheck, Phone, Mail, MapPin,
  Calendar, Briefcase, GraduationCap, IndianRupee, FileText,
  Upload, Trash2, Download, Check, X, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function StaffProfile() {
  const { institutionId, role } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [staff, setStaff] = useState<any>(null);
  const [department, setDepartment] = useState<string>('');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const canSeeSalary = role === 'institution_admin' || role === 'hr_manager' || role === 'super_admin';

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    const [staffRes, attRes, leaveRes, docRes, payRes] = await Promise.all([
      (supabase as any).from('staff').select('*').eq('id', id).single(),
      (supabase as any).from('staff_attendance').select('*').eq('staff_id', id).order('date', { ascending: false }).limit(30),
      (supabase as any).from('leave_requests').select('*').eq('staff_id', id).order('created_at', { ascending: false }).limit(20),
      (supabase as any).from('staff_documents').select('*').eq('staff_id', id).order('created_at', { ascending: false }),
      canSeeSalary ? (supabase as any).from('payroll').select('*').eq('staff_id', id).order('created_at', { ascending: false }).limit(12) : Promise.resolve({ data: [] }),
    ]);

    setStaff(staffRes.data);
    setAttendance(attRes.data || []);
    setLeaveRequests(leaveRes.data || []);
    setDocuments(docRes.data || []);
    setPayroll(payRes.data || []);

    if (staffRes.data?.department_id) {
      const { data: dept } = await (supabase as any).from('departments').select('name').eq('id', staffRes.data.department_id).single();
      setDepartment((dept as any)?.name || '');
    }
    setLoading(false);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    try {
      const filePath = `${institutionId}/${id}/${docType}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadErr } = await supabase.storage.from('staff-documents').upload(filePath, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('staff-documents').getPublicUrl(filePath);
      await (supabase as any).from('staff_documents').insert({
        staff_id: id,
        institution_id: institutionId,
        document_type: docType,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_path: filePath,
      });
      toast({ title: 'Document uploaded!' });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const handleDocDelete = async (docId: string, filePath: string) => {
    await supabase.storage.from('staff-documents').remove([filePath]);
    await (supabase as any).from('staff_documents').delete().eq('id', docId);
    toast({ title: 'Document deleted' });
    fetchAll();
  };

  const handleLeaveAction = async (leaveId: string, status: 'approved' | 'rejected') => {
    await (supabase as any).from('leave_requests').update({ status }).eq('id', leaveId);
    toast({ title: `Leave ${status}` });
    fetchAll();
  };

  const handleDeactivate = async () => {
    if (!confirm('Deactivate this staff member?')) return;
    setDeactivating(true);
    await (supabase as any).from('staff').update({ status: staff.status === 'active' ? 'inactive' : 'active' }).eq('id', id);
    toast({ title: staff.status === 'active' ? 'Staff deactivated' : 'Staff activated' });
    fetchAll();
    setDeactivating(false);
  };

  const getInitials = (name: string) => {
    const parts = (name || '').split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  const thisMonthAtt = attendance.filter(a => {
    const d = new Date(a.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const presentDays = thisMonthAtt.filter(a => a.status === 'present').length;
  const attPct = thisMonthAtt.length > 0 ? Math.round((presentDays / thisMonthAtt.length) * 100) : 0;

  const DOC_TYPES = ['Aadhar Card', 'PAN Card', 'Degree Certificate', 'Experience Letter', 'Appointment Letter', 'Bank Passbook', 'Photo', 'Other'];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Staff member not found</p>
        <Button className="mt-4" onClick={() => navigate('/admin/staff')}>Back to Staff</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/staff')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            {staff.profile_photo_url ? (
              <img src={staff.profile_photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-emerald-700">{getInitials(staff.full_name)}</span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{staff.full_name}</h2>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant="outline">{staff.employee_id}</Badge>
              {staff.designation && (
                <Badge className="bg-primary/10 text-primary border-0">
                  {staff.designation.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </Badge>
              )}
              {department && <Badge variant="secondary">{department}</Badge>}
              {staff.staff_type && (
                <Badge variant="outline">{staff.staff_type === 'teaching' ? 'Teaching' : 'Non-Teaching'}</Badge>
              )}
              <Badge className={staff.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-muted text-muted-foreground border-0'}>
                {staff.status || 'active'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/staff/${id}/edit`)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeactivate} disabled={deactivating}>
              {deactivating ? <Loader2 className="w-4 h-4 animate-spin" /> :
                staff.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          {canSeeSalary && <TabsTrigger value="salary">Salary</TabsTrigger>}
          <TabsTrigger value="leave">Attendance & Leave</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Personal Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Date of Birth', staff.date_of_birth ? new Date(staff.date_of_birth).toLocaleDateString('en-IN') : null],
                  ['Gender', staff.gender],
                  ['Blood Group', staff.blood_group],
                  ['Category', staff.category],
                  ['Aadhar', staff.aadhaar_no],
                  ['PAN', staff.pan_no],
                  ['Nationality', staff.nationality],
                ].map(([label, value]) => value ? (
                  <div key={label} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ) : null)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Contact Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {staff.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{staff.phone}</span>
                  </div>
                )}
                {(staff.personal_email || staff.email) && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{staff.personal_email || staff.email}</span>
                  </div>
                )}
                {staff.official_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-sm">{staff.official_email} (Official)</span>
                  </div>
                )}
                {staff.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{staff.address}{staff.city ? `, ${staff.city}` : ''}{staff.state ? `, ${staff.state}` : ''}</span>
                  </div>
                )}
                {staff.emergency_contact_name && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Emergency Contact</p>
                    <p className="text-sm font-medium">{staff.emergency_contact_name} ({staff.emergency_contact_relation})</p>
                    <p className="text-sm text-muted-foreground">{staff.emergency_contact_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Professional Tab */}
        <TabsContent value="professional">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Employee ID', staff.employee_id],
                  ['Joining Date', staff.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-IN') : null],
                  ['Designation', staff.designation?.replace(/_/g, ' ')],
                  ['Department', department],
                  ['Staff Type', staff.staff_type === 'teaching' ? 'Teaching' : 'Non-Teaching'],
                  ['Employment Type', staff.employment_type],
                  ['Qualification', staff.qualification],
                  ['Specialization', staff.specialization],
                  ['Experience', staff.experience_years ? `${staff.experience_years} years` : null],
                  ['Previous Org', staff.prev_organization],
                ].map(([label, value]) => value ? (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium capitalize">{value}</p>
                  </div>
                ) : null)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Tab */}
        {canSeeSalary && (
          <TabsContent value="salary">
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Current Salary Structure</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      ['Basic', staff.basic_salary],
                      ['HRA', staff.hra],
                      ['DA', staff.da],
                      ['Allowances', staff.other_allowances],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-base font-bold">₹{(Number(value) || 0).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs text-amber-700">Total Deductions</p>
                      <p className="text-base font-bold text-amber-700">
                        ₹{((Number(staff.pf_deduction) || 0) + (Number(staff.professional_tax) || 0)).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PF: ₹{Number(staff.pf_deduction || 0).toLocaleString('en-IN')} | PT: ₹{Number(staff.professional_tax || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs text-emerald-700">Net Salary</p>
                      <p className="text-xl font-bold text-emerald-700">
                        ₹{((Number(staff.basic_salary) || 0) + (Number(staff.hra) || 0) + (Number(staff.da) || 0) + (Number(staff.other_allowances) || 0) - (Number(staff.pf_deduction) || 0) - (Number(staff.professional_tax) || 0)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  {staff.bank_name && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Bank Details</p>
                      <p className="text-sm"><span className="font-medium">{staff.bank_name}</span> | {staff.account_holder_name}</p>
                      <p className="text-sm text-muted-foreground">A/C: ••••{staff.account_number?.slice(-4)} | IFSC: {staff.ifsc_code}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              {payroll.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Payroll History</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Gross</TableHead>
                          <TableHead>Deductions</TableHead>
                          <TableHead>Net</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payroll.map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-sm">{p.month || '—'}</TableCell>
                            <TableCell className="text-sm">₹{Number(p.gross_salary || 0).toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-sm">₹{Number(p.total_deductions || 0).toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-sm font-medium">₹{Number(p.net_salary || 0).toLocaleString('en-IN')}</TableCell>
                            <TableCell>
                              <Badge className={p.status === 'paid' ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-amber-100 text-amber-700 border-0'}>
                                {p.status || 'pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}

        {/* Attendance & Leave Tab */}
        <TabsContent value="leave">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">{attPct}%</p>
                  <p className="text-xs text-muted-foreground mt-1">This Month Attendance</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{presentDays}</p>
                  <p className="text-xs text-muted-foreground mt-1">Days Present</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-red-500">{thisMonthAtt.length - presentDays}</p>
                  <p className="text-xs text-muted-foreground mt-1">Days Absent</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-sm">Leave Requests</CardTitle></CardHeader>
              <CardContent>
                {leaveRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No leave requests</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        {(role === 'institution_admin' || role === 'principal' || role === 'hr_manager') && (
                          <TableHead>Action</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveRequests.map((l: any) => {
                        const from = new Date(l.from_date);
                        const to = new Date(l.to_date);
                        const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        return (
                          <TableRow key={l.id}>
                            <TableCell className="text-sm capitalize">{l.leave_type?.replace(/_/g, ' ') || '—'}</TableCell>
                            <TableCell className="text-sm">{from.toLocaleDateString('en-IN')}</TableCell>
                            <TableCell className="text-sm">{to.toLocaleDateString('en-IN')}</TableCell>
                            <TableCell className="text-sm">{days}</TableCell>
                            <TableCell className="text-sm max-w-[150px] truncate">{l.reason || '—'}</TableCell>
                            <TableCell>
                              <Badge className={
                                l.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-0' :
                                l.status === 'rejected' ? 'bg-red-100 text-red-700 border-0' :
                                'bg-amber-100 text-amber-700 border-0'
                              }>
                                {l.status || 'pending'}
                              </Badge>
                            </TableCell>
                            {(role === 'institution_admin' || role === 'principal' || role === 'hr_manager') && (
                              <TableCell>
                                {l.status === 'pending' && (
                                  <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={() => handleLeaveAction(l.id, 'approved')}>
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleLeaveAction(l.id, 'rejected')}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader><CardTitle className="text-sm">Staff Documents</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DOC_TYPES.map(docType => {
                  const existing = documents.filter((d: any) => d.document_type === docType);
                  return (
                    <div key={docType} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">{docType}</p>
                        <label className="cursor-pointer">
                          <Button variant="outline" size="sm" className="h-7 text-xs pointer-events-none" disabled={uploading}>
                            <Upload className="w-3 h-3 mr-1" />
                            {uploading ? 'Uploading...' : 'Upload'}
                          </Button>
                          <input type="file" className="hidden" onChange={e => handleDocUpload(e, docType)} disabled={uploading} />
                        </label>
                      </div>
                      {existing.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No document uploaded</p>
                      ) : existing.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between bg-muted/50 rounded p-2 mt-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs truncate">{doc.file_name}</span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <a href={doc.file_url} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Download className="w-3 h-3" />
                              </Button>
                            </a>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                              onClick={() => handleDocDelete(doc.id, doc.file_path)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}