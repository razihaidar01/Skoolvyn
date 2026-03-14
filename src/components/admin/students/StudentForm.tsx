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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { INDIAN_STATES } from '@/lib/indian-states';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];
const GENDERS = ['Male', 'Female', 'Other'];
const INCOME_RANGES = ['Below ₹1 Lakh', '₹1-3 Lakh', '₹3-5 Lakh', '₹5-10 Lakh', '₹10-25 Lakh', 'Above ₹25 Lakh'];

const STEPS = ['Personal', 'Contact', 'Academic', 'Parent/Guardian', 'Review'];

interface FormData {
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  category: string;
  religion: string;
  nationality: string;
  aadhaar_no: string;
  mother_tongue: string;
  email: string;
  phone: string;
  guardian1_name: string;
  guardian1_phone: string;
  guardian1_relation: string;
  address: string;
  permanent_address: string;
  same_address: boolean;
  city: string;
  state: string;
  pincode: string;
  admission_no: string;
  admission_date: string;
  batch_id: string;
  roll_no: string;
  prev_school: string;
  prev_board: string;
  prev_percentage: string;
  guardian1_occupation: string;
  guardian1_email: string;
  guardian2_name: string;
  guardian2_phone: string;
  guardian2_relation: string;
  annual_income: string;
  status: string;
}

const defaultFormData: FormData = {
  full_name: '', date_of_birth: '', gender: '', blood_group: '', category: '',
  religion: '', nationality: 'Indian', aadhaar_no: '', mother_tongue: '',
  email: '', phone: '', guardian1_name: '', guardian1_phone: '', guardian1_relation: 'Father',
  address: '', permanent_address: '', same_address: true, city: '', state: '', pincode: '',
  admission_no: '', admission_date: new Date().toISOString().split('T')[0],
  batch_id: '', roll_no: '', prev_school: '', prev_board: '', prev_percentage: '',
  guardian1_occupation: '', guardian1_email: '',
  guardian2_name: '', guardian2_phone: '', guardian2_relation: '',
  annual_income: '', status: 'active',
};

export function StudentForm() {
  const { institutionId } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = !!id;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({ ...defaultFormData });
  const [batches, setBatches] = useState<{ id: string; name: string; program_id: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    if (!institutionId) return;
    fetchOptions();
    if (isEdit) fetchStudent();
    else generateAdmissionNo();
  }, [institutionId, id]);

  const fetchOptions = async () => {
    if (!institutionId) return;
    const [batchRes, programRes] = await Promise.all([
      supabase.from('batches').select('id, name, program_id').eq('institution_id', institutionId).eq('is_active', true),
      supabase.from('programs').select('id, name').eq('institution_id', institutionId).eq('is_active', true),
    ]);
    setBatches(batchRes.data || []);
    setPrograms(programRes.data || []);
  };

  const generateAdmissionNo = async () => {
    if (!institutionId) return;
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', institutionId);
    const nextNum = (count || 0) + 1;
    setForm(f => ({ ...f, admission_no: `ADM-${year}-${String(nextNum).padStart(3, '0')}` }));
  };

  const fetchStudent = async () => {
    if (!id || !institutionId) return;
    setLoadingData(true);
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('institution_id', institutionId)
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
        mother_tongue: data.mother_tongue || '',
        email: data.email || '',
        phone: data.phone || '',
        guardian1_name: data.guardian1_name || '',
        guardian1_phone: data.guardian1_phone || '',
        guardian1_relation: data.guardian1_relation || 'Father',
        address: data.address || '',
        permanent_address: '',
        same_address: true,
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        admission_no: data.admission_no || '',
        admission_date: data.admission_date || '',
        batch_id: data.batch_id || '',
        roll_no: data.roll_no || '',
        prev_school: data.prev_school || '',
        prev_board: data.prev_board || '',
        prev_percentage: data.prev_percentage?.toString() || '',
        guardian1_occupation: data.guardian1_occupation || '',
        guardian1_email: data.guardian1_email || '',
        guardian2_name: data.guardian2_name || '',
        guardian2_phone: data.guardian2_phone || '',
        guardian2_relation: data.guardian2_relation || '',
        annual_income: '',
        status: data.status || 'active',
      });
      if (data.batch_id) {
        const batch = batches.find(b => b.id === data.batch_id);
        if (batch) setSelectedProgram(batch.program_id);
      }
    }
    setLoadingData(false);
  };

  const update = (field: keyof FormData, value: string | boolean) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!institutionId) return;
    if (!form.full_name.trim()) {
      toast({ title: 'Validation Error', description: 'Full name is required.', variant: 'destructive' });
      setStep(0);
      return;
    }
    if (!form.admission_no.trim()) {
      toast({ title: 'Validation Error', description: 'Admission number is required.', variant: 'destructive' });
      setStep(2);
      return;
    }

    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      blood_group: form.blood_group || null,
      category: form.category || null,
      religion: form.religion || null,
      nationality: form.nationality || null,
      aadhaar_no: form.aadhaar_no || null,
      mother_tongue: form.mother_tongue || null,
      email: form.email || null,
      phone: form.phone || null,
      guardian1_name: form.guardian1_name || null,
      guardian1_phone: form.guardian1_phone || null,
      guardian1_relation: form.guardian1_relation || null,
      guardian1_occupation: form.guardian1_occupation || null,
      guardian1_email: form.guardian1_email || null,
      guardian2_name: form.guardian2_name || null,
      guardian2_phone: form.guardian2_phone || null,
      guardian2_relation: form.guardian2_relation || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      pincode: form.pincode || null,
      admission_no: form.admission_no,
      admission_date: form.admission_date || null,
      batch_id: form.batch_id || null,
      roll_no: form.roll_no || null,
      prev_school: form.prev_school || null,
      prev_board: form.prev_board || null,
      prev_percentage: form.prev_percentage ? parseFloat(form.prev_percentage) : null,
      status: form.status || 'active',
      institution_id: institutionId,
    };

    let result;
    if (isEdit && id) {
      result = await supabase.from('students').update(payload).eq('id', id).eq('institution_id', institutionId).select().single();
    } else {
      result = await supabase.from('students').insert(payload).select().single();
    }

    setSaving(false);

    if (result.error) {
      toast({ title: 'Error', description: result.error.message, variant: 'destructive' });
      return;
    }

    toast({ title: isEdit ? 'Student Updated' : 'Student Added', description: `${form.full_name} has been ${isEdit ? 'updated' : 'added'} successfully.` });
    navigate(`/admin/students/${result.data.id}`);
  };

  const filteredBatches = selectedProgram
    ? batches.filter(b => b.program_id === selectedProgram)
    : batches;

  if (loadingData) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/students')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">{isEdit ? 'Edit Student' : 'Add New Student'}</h2>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <button
              onClick={() => setStep(i)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors',
                i === step ? 'bg-primary text-primary-foreground' :
                i < step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              {i < step ? <Check className="w-3 h-3" /> : <span className="w-4 text-center">{i + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5', i < step ? 'bg-primary/40' : 'bg-muted')} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">{STEPS[step]}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Enter full name" /></div>
                <div>
                  <Label>Date of Birth *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !form.date_of_birth && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.date_of_birth ? format(new Date(form.date_of_birth), 'dd/MM/yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.date_of_birth ? new Date(form.date_of_birth) : undefined}
                        onSelect={d => d && update('date_of_birth', d.toISOString().split('T')[0])}
                        disabled={d => d > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Gender *</Label>
                  <Select value={form.gender} onValueChange={v => update('gender', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Blood Group</Label>
                  <Select value={form.blood_group} onValueChange={v => update('blood_group', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{BLOOD_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => update('category', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><Label>Religion</Label><Input value={form.religion} onChange={e => update('religion', e.target.value)} placeholder="e.g. Hindu" /></div>
                <div><Label>Nationality</Label><Input value={form.nationality} onChange={e => update('nationality', e.target.value)} /></div>
                <div><Label>Aadhaar Number</Label><Input value={form.aadhaar_no} onChange={e => update('aadhaar_no', e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12-digit number" maxLength={12} /></div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="student@email.com" /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 9876543210" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><Label>Emergency Contact *</Label><Input value={form.guardian1_name} onChange={e => update('guardian1_name', e.target.value)} placeholder="Contact name" /></div>
                <div><Label>Emergency Phone *</Label><Input value={form.guardian1_phone} onChange={e => update('guardian1_phone', e.target.value)} placeholder="+91 9876543210" /></div>
                <div>
                  <Label>Relation</Label>
                  <Select value={form.guardian1_relation} onValueChange={v => update('guardian1_relation', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Current Address *</Label><Textarea value={form.address} onChange={e => update('address', e.target.value)} placeholder="Full address" rows={2} /></div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.same_address} onCheckedChange={v => update('same_address', !!v)} id="sameAddr" />
                <Label htmlFor="sameAddr" className="text-sm font-normal">Permanent address same as current</Label>
              </div>
              {!form.same_address && (
                <div><Label>Permanent Address</Label><Textarea value={form.permanent_address} onChange={e => update('permanent_address', e.target.value)} rows={2} /></div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><Label>City</Label><Input value={form.city} onChange={e => update('city', e.target.value)} /></div>
                <div>
                  <Label>State</Label>
                  <Select value={form.state} onValueChange={v => update('state', v)}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>PIN Code</Label><Input value={form.pincode} onChange={e => update('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} /></div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Admission Number *</Label><Input value={form.admission_no} onChange={e => update('admission_no', e.target.value)} /></div>
                <div>
                  <Label>Admission Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !form.admission_date && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.admission_date ? format(new Date(form.admission_date), 'dd/MM/yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={form.admission_date ? new Date(form.admission_date) : undefined} onSelect={d => d && update('admission_date', d.toISOString().split('T')[0])} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Program</Label>
                  <Select value={selectedProgram} onValueChange={v => { setSelectedProgram(v); update('batch_id', ''); }}>
                    <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Batch/Class *</Label>
                  <Select value={form.batch_id} onValueChange={v => update('batch_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                    <SelectContent>{filteredBatches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Roll Number</Label><Input value={form.roll_no} onChange={e => update('roll_no', e.target.value)} placeholder="Auto-assigned if blank" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><Label>Previous School</Label><Input value={form.prev_school} onChange={e => update('prev_school', e.target.value)} /></div>
                <div><Label>Previous Board</Label><Input value={form.prev_board} onChange={e => update('prev_board', e.target.value)} placeholder="e.g. CBSE" /></div>
                <div><Label>Previous %/Grade</Label><Input value={form.prev_percentage} onChange={e => update('prev_percentage', e.target.value)} placeholder="e.g. 85" /></div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h4 className="text-sm font-medium text-muted-foreground">Father / Primary Guardian</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Name</Label><Input value={form.guardian1_name} onChange={e => update('guardian1_name', e.target.value)} /></div>
                <div><Label>Phone</Label><Input value={form.guardian1_phone} onChange={e => update('guardian1_phone', e.target.value)} /></div>
                <div><Label>Occupation</Label><Input value={form.guardian1_occupation} onChange={e => update('guardian1_occupation', e.target.value)} /></div>
                <div><Label>Email</Label><Input type="email" value={form.guardian1_email} onChange={e => update('guardian1_email', e.target.value)} /></div>
              </div>
              <h4 className="text-sm font-medium text-muted-foreground mt-4">Mother / Secondary Guardian</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Name</Label><Input value={form.guardian2_name} onChange={e => update('guardian2_name', e.target.value)} /></div>
                <div><Label>Phone</Label><Input value={form.guardian2_phone} onChange={e => update('guardian2_phone', e.target.value)} /></div>
                <div><Label>Relation</Label><Input value={form.guardian2_relation} onChange={e => update('guardian2_relation', e.target.value)} placeholder="e.g. Mother" /></div>
              </div>
              <div className="mt-4">
                <Label>Annual Family Income</Label>
                <Select value={form.annual_income} onValueChange={v => update('annual_income', v)}>
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>{INCOME_RANGES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <ReviewSection title="Personal" items={[
                  ['Name', form.full_name], ['DOB', form.date_of_birth], ['Gender', form.gender],
                  ['Blood Group', form.blood_group], ['Category', form.category], ['Aadhaar', form.aadhaar_no],
                ]} onEdit={() => setStep(0)} />
                <ReviewSection title="Contact" items={[
                  ['Email', form.email], ['Phone', form.phone], ['City', form.city], ['State', form.state],
                ]} onEdit={() => setStep(1)} />
                <ReviewSection title="Academic" items={[
                  ['Admission No', form.admission_no], ['Admission Date', form.admission_date],
                  ['Roll No', form.roll_no], ['Previous School', form.prev_school],
                ]} onEdit={() => setStep(2)} />
                <ReviewSection title="Guardian" items={[
                  ['Guardian 1', form.guardian1_name], ['Phone', form.guardian1_phone],
                  ['Guardian 2', form.guardian2_name], ['Income', form.annual_income],
                ]} onEdit={() => setStep(3)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate('/admin/students')} disabled={saving}>
          <ChevronLeft className="w-4 h-4 mr-1" /> {step === 0 ? 'Cancel' : 'Previous'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {isEdit ? 'Update Student' : 'Add Student'}
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewSection({ title, items, onEdit }: { title: string; items: [string, string][]; onEdit: () => void }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-foreground">{title}</h4>
        <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={onEdit}>Edit</Button>
      </div>
      <div className="space-y-1">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground font-medium">{value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
