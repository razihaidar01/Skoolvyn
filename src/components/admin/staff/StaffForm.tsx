import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { INDIAN_STATES } from '@/lib/indian-states';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];
const GENDERS = ['Male', 'Female', 'Other'];
const QUALIFICATIONS = ['B.Ed', 'M.Ed', 'B.Tech', 'M.Tech', 'BA', 'MA', 'B.Com', 'M.Com', 'PhD', 'Diploma', 'Other'];
const DESIGNATIONS = [
  { value: 'principal', label: 'Principal' },
  { value: 'hod', label: 'Head of Department' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'hostel_warden', label: 'Hostel Warden' },
  { value: 'transport_manager', label: 'Transport Manager' },
  { value: 'non_teaching_staff', label: 'Non-Teaching Staff' },
];
const EMPLOYMENT_TYPES = ['Permanent', 'Contract', 'Part-time', 'Probation'];
const STEPS = ['Personal', 'Contact', 'Professional', 'Salary & Bank', 'Review'];

interface FormData {
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  category: string;
  religion: string;
  nationality: string;
  aadhaar_no: string;
  pan_no: string;
  personal_email: string;
  official_email: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  address: string;
  permanent_address: string;
  same_address: boolean;
  city: string;
  state: string;
  pincode: string;
  employee_id: string;
  joining_date: string;
  designation: string;
  staff_type: string;
  department_id: string;
  qualification: string;
  specialization: string;
  experience_years: string;
  prev_organization: string;
  employment_type: string;
  basic_salary: string;
  hra: string;
  da: string;
  other_allowances: string;
  pf_deduction: string;
  professional_tax: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  status: string;
}

const defaultForm: FormData = {
  full_name: '', date_of_birth: '', gender: '', blood_group: '', category: '',
  religion: '', nationality: 'Indian', aadhaar_no: '', pan_no: '',
  personal_email: '', official_email: '', phone: '',
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: 'Spouse',
  address: '', permanent_address: '', same_address: true, city: '', state: '', pincode: '',
  employee_id: '', joining_date: new Date().toISOString().split('T')[0],
  designation: '', staff_type: 'teaching', department_id: '', qualification: '',
  specialization: '', experience_years: '', prev_organization: '', employment_type: 'Permanent',
  basic_salary: '', hra: '', da: '', other_allowances: '', pf_deduction: '', professional_tax: '',
  bank_name: '', account_number: '', ifsc_code: '', account_holder_name: '', status: 'active',
};

export function StaffForm() {
  const { institutionId } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = !!id;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({ ...defaultForm });
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    if (!institutionId) return;
    fetchDepartments();
    if (isEdit) fetchStaff();
    else generateEmployeeId();
  }, [institutionId, id]);

  // Auto-calculate salary fields
  useEffect(() => {
    const basic = parseFloat(form.basic_salary) || 0;
    if (basic > 0 && !isEdit) {
      setForm(f => ({
        ...f,
        hra: Math.round(basic * 0.4).toString(),
        da: Math.round(basic * 0.2).toString(),
        pf_deduction: Math.round(basic * 0.12).toString(),
      }));
    }
  }, [form.basic_salary]);

  const fetchDepartments = async () => {
    const { data } = await (supabase as any)
      .from('departments')
      .select('id, name')
      .eq('institution_id', institutionId!);
    setDepartments(data || []);
  };

  const generateEmployeeId = async () => {
    const year = new Date().getFullYear();
    const { count } = await (supabase as any)
      .from('staff')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', institutionId!);
    const nextNum = (count || 0) + 1;
    setForm(f => ({ ...f, employee_id: `EMP-${year}-${String(nextNum).padStart(3, '0')}` }));
  };

  const fetchStaff = async () => {
    const { data } = await (supabase as any)
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();
    if (data) {
      setForm({
        full_name: data.full_name || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        blood_group: data.blood_group || '',
        category: data.category || '',
        religion: data.religion || '',
        nationality: data.nationality || 'Indian',
        aadhaar_no: data.aadhaar_no || '',
        pan_no: data.pan_no || '',
        personal_email: data.personal_email || data.email || '',
        official_email: data.official_email || '',
        phone: data.phone || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        emergency_contact_relation: data.emergency_contact_relation || 'Spouse',
        address: data.address || '',
        permanent_address: data.permanent_address || '',
        same_address: data.same_address ?? true,
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        employee_id: data.employee_id || '',
        joining_date: data.joining_date || '',
        designation: data.designation || '',
        staff_type: data.staff_type || 'teaching',
        department_id: data.department_id || '',
        qualification: data.qualification || '',
        specialization: data.specialization || '',
        experience_years: data.experience_years?.toString() || '',
        prev_organization: data.prev_organization || '',
        employment_type: data.employment_type || 'Permanent',
        basic_salary: data.basic_salary?.toString() || '',
        hra: data.hra?.toString() || '',
        da: data.da?.toString() || '',
        other_allowances: data.other_allowances?.toString() || '',
        pf_deduction: data.pf_deduction?.toString() || '',
        professional_tax: data.professional_tax?.toString() || '',
        bank_name: data.bank_name || '',
        account_number: data.account_number || '',
        ifsc_code: data.ifsc_code || '',
        account_holder_name: data.account_holder_name || '',
        status: data.status || 'active',
      });
    }
    setLoadingData(false);
  };

  const update = (field: keyof FormData, value: any) =>
    setForm(f => ({ ...f, [field]: value }));

  const calcGross = () => {
    return (parseFloat(form.basic_salary) || 0) +
      (parseFloat(form.hra) || 0) +
      (parseFloat(form.da) || 0) +
      (parseFloat(form.other_allowances) || 0);
  };

  const calcNet = () => {
    return calcGross() -
      (parseFloat(form.pf_deduction) || 0) -
      (parseFloat(form.professional_tax) || 0);
  };

  const validateStep = () => {
    if (step === 0 && !form.full_name.trim()) {
      toast({ title: 'Required', description: 'Full name is required', variant: 'destructive' }); return false;
    }
    if (step === 1 && !form.phone.trim()) {
      toast({ title: 'Required', description: 'Phone number is required', variant: 'destructive' }); return false;
    }
    if (step === 2) {
      if (!form.employee_id.trim()) {
        toast({ title: 'Required', description: 'Employee ID is required', variant: 'destructive' }); return false;
      }
      if (!form.designation) {
        toast({ title: 'Required', description: 'Designation is required', variant: 'destructive' }); return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!institutionId) return;
    setSaving(true);
    try {
      const payload = {
        institution_id: institutionId,
        full_name: form.full_name.trim(),
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        blood_group: form.blood_group || null,
        category: form.category || null,
        religion: form.religion || null,
        nationality: form.nationality,
        aadhaar_no: form.aadhaar_no || null,
        pan_no: form.pan_no || null,
        email: form.personal_email || null,
        personal_email: form.personal_email || null,
        official_email: form.official_email || null,
        phone: form.phone || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        emergency_contact_relation: form.emergency_contact_relation || null,
        address: form.address || null,
        permanent_address: form.same_address ? form.address : form.permanent_address,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
        employee_id: form.employee_id,
        joining_date: form.joining_date || null,
        designation: form.designation || null,
        staff_type: form.staff_type || null,
        department_id: form.department_id || null,
        qualification: form.qualification || null,
        specialization: form.specialization || null,
        experience_years: form.experience_years ? parseInt(form.experience_years) : null,
        prev_organization: form.prev_organization || null,
        employment_type: form.employment_type || null,
        basic_salary: form.basic_salary ? parseFloat(form.basic_salary) : null,
        hra: form.hra ? parseFloat(form.hra) : null,
        da: form.da ? parseFloat(form.da) : null,
        other_allowances: form.other_allowances ? parseFloat(form.other_allowances) : null,
        pf_deduction: form.pf_deduction ? parseFloat(form.pf_deduction) : null,
        professional_tax: form.professional_tax ? parseFloat(form.professional_tax) : null,
        bank_name: form.bank_name || null,
        account_number: form.account_number || null,
        ifsc_code: form.ifsc_code || null,
        account_holder_name: form.account_holder_name || null,
        status: form.status,
      };

      let staffId = id;
      if (isEdit) {
        await (supabase as any).from('staff').update(payload).eq('id', id);
      } else {
        const { data } = await (supabase as any).from('staff').insert(payload).select('id').single();
        staffId = data?.id;
      }

      toast({ title: isEdit ? 'Staff updated!' : 'Staff added!', description: form.full_name });
      navigate(`/admin/staff/${staffId}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loadingData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/staff')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Staff' : 'Add New Staff'}</h2>
          <p className="text-sm text-muted-foreground">{isEdit ? `Editing: ${form.full_name}` : 'Fill in staff details'}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <button
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0',
                i === step ? 'bg-primary text-primary-foreground' :
                i < step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}
              onClick={() => i < step && setStep(i)}
            >
              {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
            </button>
            <span className="text-xs hidden sm:block text-muted-foreground">{s}</span>
            {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5', i < step ? 'bg-primary/40' : 'bg-muted')} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader><CardTitle className="text-base">{STEPS[step]}</CardTitle></CardHeader>
        <CardContent className="space-y-4">

          {/* Step 0: Personal */}
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="e.g. Rajesh Kumar" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => update('gender', v)}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Blood Group</Label>
                  <Select value={form.blood_group} onValueChange={v => update('blood_group', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => update('category', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Aadhar Number</Label>
                  <Input value={form.aadhaar_no} onChange={e => update('aadhaar_no', e.target.value)} placeholder="12-digit Aadhar" maxLength={12} />
                </div>
                <div className="space-y-1.5">
                  <Label>PAN Number</Label>
                  <Input value={form.pan_no} onChange={e => update('pan_no', e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F" maxLength={10} />
                </div>
                <div className="space-y-1.5">
                  <Label>Religion</Label>
                  <Input value={form.religion} onChange={e => update('religion', e.target.value)} placeholder="Optional" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nationality</Label>
                  <Input value={form.nationality} onChange={e => update('nationality', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* Step 1: Contact */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Personal Email</Label>
                  <Input type="email" value={form.personal_email} onChange={e => update('personal_email', e.target.value)} placeholder="personal@email.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Official Email</Label>
                  <Input type="email" value={form.official_email} onChange={e => update('official_email', e.target.value)} placeholder="name@school.edu" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-1.5">
                  <Label>Emergency Contact Name *</Label>
                  <Input value={form.emergency_contact_name} onChange={e => update('emergency_contact_name', e.target.value)} placeholder="Contact name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Emergency Contact Phone</Label>
                  <Input value={form.emergency_contact_phone} onChange={e => update('emergency_contact_phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-1.5">
                  <Label>Relation</Label>
                  <Select value={form.emergency_contact_relation} onValueChange={v => update('emergency_contact_relation', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Spouse', 'Father', 'Mother', 'Sibling', 'Other'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Current Address *</Label>
                  <Textarea value={form.address} onChange={e => update('address', e.target.value)} placeholder="Full address" rows={3} />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox checked={form.same_address} onCheckedChange={v => update('same_address', v)} />
                  <Label className="cursor-pointer">Permanent address same as current</Label>
                </div>
                {!form.same_address && (
                  <div className="col-span-2 space-y-1.5">
                    <Label>Permanent Address</Label>
                    <Textarea value={form.permanent_address} onChange={e => update('permanent_address', e.target.value)} rows={3} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="City" />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Select value={form.state} onValueChange={v => update('state', v)}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>PIN Code</Label>
                  <Input value={form.pincode} onChange={e => update('pincode', e.target.value)} placeholder="6-digit PIN" maxLength={6} />
                </div>
              </div>
            </>
          )}

          {/* Step 2: Professional */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Employee ID *</Label>
                  <Input value={form.employee_id} onChange={e => update('employee_id', e.target.value)} placeholder="EMP-2025-001" />
                </div>
                <div className="space-y-1.5">
                  <Label>Joining Date *</Label>
                  <Input type="date" value={form.joining_date} onChange={e => update('joining_date', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Designation *</Label>
                  <Select value={form.designation} onValueChange={v => update('designation', v)}>
                    <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                    <SelectContent>{DESIGNATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Staff Type *</Label>
                  <Select value={form.staff_type} onValueChange={v => update('staff_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teaching">Teaching</SelectItem>
                      <SelectItem value="non_teaching">Non-Teaching</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={form.department_id} onValueChange={v => update('department_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Employment Type</Label>
                  <Select value={form.employment_type} onValueChange={v => update('employment_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EMPLOYMENT_TYPES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Qualification</Label>
                  <Select value={form.qualification} onValueChange={v => update('qualification', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{QUALIFICATIONS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {form.staff_type === 'teaching' && (
                  <div className="space-y-1.5">
                    <Label>Specialization / Subject</Label>
                    <Input value={form.specialization} onChange={e => update('specialization', e.target.value)} placeholder="e.g. Mathematics, Physics" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Experience (Years)</Label>
                  <Input type="number" value={form.experience_years} onChange={e => update('experience_years', e.target.value)} placeholder="0" min="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>Previous Organization</Label>
                  <Input value={form.prev_organization} onChange={e => update('prev_organization', e.target.value)} placeholder="Previous school/org name" />
                </div>
              </div>
            </>
          )}

          {/* Step 3: Salary & Bank */}
          {step === 3 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Salary Structure (₹)</h4>
                </div>
                <div className="space-y-1.5">
                  <Label>Basic Salary *</Label>
                  <Input type="number" value={form.basic_salary} onChange={e => update('basic_salary', e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>HRA (auto: 40% of basic)</Label>
                  <Input type="number" value={form.hra} onChange={e => update('hra', e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>DA (auto: 20% of basic)</Label>
                  <Input type="number" value={form.da} onChange={e => update('da', e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>Other Allowances</Label>
                  <Input type="number" value={form.other_allowances} onChange={e => update('other_allowances', e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>PF Deduction (auto: 12%)</Label>
                  <Input type="number" value={form.pf_deduction} onChange={e => update('pf_deduction', e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>Professional Tax</Label>
                  <Input type="number" value={form.professional_tax} onChange={e => update('professional_tax', e.target.value)} placeholder="0" />
                </div>
                {/* Calculated Summary */}
                <div className="col-span-2 bg-muted/50 rounded-lg p-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Gross Salary</p>
                    <p className="text-lg font-bold text-foreground">₹{calcGross().toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Net Salary</p>
                    <p className="text-lg font-bold text-primary">₹{calcNet().toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Bank Details</h4>
                </div>
                <div className="space-y-1.5">
                  <Label>Bank Name</Label>
                  <Input value={form.bank_name} onChange={e => update('bank_name', e.target.value)} placeholder="e.g. State Bank of India" />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Holder Name</Label>
                  <Input value={form.account_holder_name} onChange={e => update('account_holder_name', e.target.value)} placeholder="Name as per bank" />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Number</Label>
                  <Input value={form.account_number} onChange={e => update('account_number', e.target.value)} placeholder="Account number" />
                </div>
                <div className="space-y-1.5">
                  <Label>IFSC Code</Label>
                  <Input value={form.ifsc_code} onChange={e => update('ifsc_code', e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" maxLength={11} />
                </div>
              </div>
            </>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              {[
                {
                  title: 'Personal', fields: [
                    ['Full Name', form.full_name],
                    ['DOB', form.date_of_birth],
                    ['Gender', form.gender],
                    ['Category', form.category],
                    ['Aadhar', form.aadhaar_no],
                    ['PAN', form.pan_no],
                  ]
                },
                {
                  title: 'Contact', fields: [
                    ['Phone', form.phone],
                    ['Email', form.personal_email],
                    ['City', form.city],
                    ['State', form.state],
                  ]
                },
                {
                  title: 'Professional', fields: [
                    ['Employee ID', form.employee_id],
                    ['Designation', form.designation],
                    ['Staff Type', form.staff_type],
                    ['Joining Date', form.joining_date],
                    ['Qualification', form.qualification],
                    ['Experience', form.experience_years + ' years'],
                  ]
                },
                {
                  title: 'Salary', fields: [
                    ['Basic', '₹' + (parseFloat(form.basic_salary) || 0).toLocaleString('en-IN')],
                    ['Gross', '₹' + calcGross().toLocaleString('en-IN')],
                    ['Net', '₹' + calcNet().toLocaleString('en-IN')],
                    ['Bank', form.bank_name],
                  ]
                },
              ].map(section => (
                <div key={section.title} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">{section.title}</h4>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setStep(['Personal','Contact','Professional','Salary & Bank'].indexOf(section.title) >= 0 ? ['Personal','Contact','Professional','Salary & Bank'].indexOf(section.title) : 0)}>Edit</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {section.fields.map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => step === 0 ? navigate('/admin/staff') : setStep(s => s - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => { if (validateStep()) setStep(s => s + 1); }}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Staff'}
          </Button>
        )}
      </div>
    </div>
  );
}