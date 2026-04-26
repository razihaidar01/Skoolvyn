import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Printer, Search, FileText, Award, IdCard, GraduationCap, Star, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CERT_TYPES = [
  { id: 'tc', label: 'Transfer Certificate (TC)', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  { id: 'dob', label: 'Date of Birth Certificate', icon: Award, color: 'text-emerald-600 bg-emerald-50' },
  { id: 'character', label: 'Character Certificate', icon: Star, color: 'text-purple-600 bg-purple-50' },
  { id: 'bonafide', label: 'Bonafide Certificate', icon: ClipboardList, color: 'text-amber-600 bg-amber-50' },
  { id: 'id_card', label: 'ID Card', icon: IdCard, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'admit_card', label: 'Admit Card', icon: GraduationCap, color: 'text-red-600 bg-red-50' },
  { id: 'appreciation', label: 'Appreciation Certificate', icon: Star, color: 'text-yellow-600 bg-yellow-50' },
];

export function CertificatesModule() {
  const { institutionId } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedCert, setSelectedCert] = useState('tc');
  const [loading, setLoading] = useState(false);
  const [tcNo, setTcNo] = useState(`TC-${new Date().getFullYear()}-${Math.floor(Math.random()*9000+1000)}`);

  useEffect(() => {
    if (institutionId) {
      fetchInstitution();
    }
  }, [institutionId]);

  useEffect(() => {
    if (institutionId && search.length >= 2) fetchStudents();
    else if (!search) setStudents([]);
  }, [search, institutionId]);

  const fetchInstitution = async () => {
    const { data } = await (supabase as any).from('institutions').select('*').eq('id', institutionId!).single();
    setInstitution(data);
  };

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('students')
      .select('*, batches(name), programs:batches(programs(name))')
      .eq('institution_id', institutionId!)
      .ilike('full_name', `%${search}%`)
      .limit(10);
    setStudents(data || []);
    setLoading(false);
  };

  const printCertificate = () => {
    if (!selectedStudent) { toast({ title: 'Select a student first', variant: 'destructive' }); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const dob = selectedStudent.date_of_birth
      ? new Date(selectedStudent.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : '___________';

    const certContent = getCertContent(selectedCert, selectedStudent, institution, today, dob);
    printWindow.document.write(certContent);
    printWindow.document.close();
    printWindow.print();
    toast({ title: '✅ Certificate sent to printer!' });
  };

  const getCertContent = (type: string, s: any, inst: any, today: string, dob: string) => {
    const base = `
      <html><head><style>
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 40px; color: #000; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 15px; margin-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; text-transform: uppercase; }
        .school-info { font-size: 12px; margin: 4px 0; }
        .cert-title { text-align: center; font-size: 20px; font-weight: bold; text-decoration: underline; margin: 20px 0; text-transform: uppercase; }
        .cert-no { text-align: right; font-size: 13px; margin-bottom: 10px; }
        .body { font-size: 15px; line-height: 2.2; text-align: justify; }
        .field { border-bottom: 1px solid #000; display: inline-block; min-width: 200px; }
        .footer { margin-top: 60px; display: flex; justify-content: space-between; }
        .sign-block { text-align: center; }
        .seal { width: 80px; height: 80px; border: 2px solid #000; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; text-align: center; }
        @media print { @page { margin: 1cm; } }
      </style></head><body>
      <div class="header">
        <div class="school-name">${inst?.name || 'Institution Name'}</div>
        <div class="school-info">${[inst?.address, inst?.city, inst?.state].filter(Boolean).join(', ')}</div>
        <div class="school-info">Phone: ${inst?.phone || ''} | Email: ${inst?.email || ''}</div>
        ${inst?.affiliation_no ? `<div class="school-info">Affiliation No: ${inst.affiliation_no}</div>` : ''}
      </div>`;

    if (type === 'tc') return base + `
      <div class="cert-no">TC No: ${tcNo} | Date: ${today}</div>
      <div class="cert-title">Transfer Certificate</div>
      <div class="body">
        <p>This is to certify that <strong>${s.full_name}</strong>, 
        Son/Daughter/Ward of <span class="field">${s.guardian1_name || '___________'}</span>,
        bearing Admission No. <strong>${s.admission_no}</strong>,
        Date of Birth: <strong>${dob}</strong>,
        ${s.category ? `Category: <strong>${s.category}</strong>,` : ''}
        was a bonafide student of this institution.</p>
        <p>S/He has cleared all dues and left the institution on <span class="field">${today}</span>.</p>
        <p>S/He bears good moral character.</p>
        <p>This certificate is issued on the request of the student/parent for the purpose of <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>.</p>
      </div>
      <div class="footer">
        <div class="sign-block"><div style="margin-top:40px;border-top:1px solid #000;padding-top:5px;">Class Teacher</div></div>
        <div class="sign-block"><div class="seal">SCHOOL<br>SEAL</div></div>
        <div class="sign-block"><div style="margin-top:40px;border-top:1px solid #000;padding-top:5px;">Principal / Head</div></div>
      </div></body></html>`;

    if (type === 'dob') return base + `
      <div class="cert-no">Cert No: DOB-${Date.now().toString().slice(-6)} | Date: ${today}</div>
      <div class="cert-title">Date of Birth Certificate</div>
      <div class="body">
        <p>This is to certify that as per the school records, <strong>${s.full_name}</strong>,
        Son/Daughter/Ward of <span class="field">${s.guardian1_name || '___________'}</span>,
        bearing Admission No. <strong>${s.admission_no}</strong>,
        was born on <strong>${dob}</strong>
        (${s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '___________'} in words).</p>
        <p>This certificate is issued on the basis of school admission records.</p>
      </div>
      <div class="footer">
        <div class="sign-block"><div style="margin-top:40px;border-top:1px solid #000;padding-top:5px;">Class Teacher</div></div>
        <div class="sign-block"><div class="seal">SCHOOL<br>SEAL</div></div>
        <div class="sign-block"><div style="margin-top:40px;border-top:1px solid #000;padding-top:5px;">Principal / Head</div></div>
      </div></body></html>`;

    if (type === 'character') return base + `
      <div class="cert-no">Cert No: CC-${Date.now().toString().slice(-6)} | Date: ${today}</div>
      <div class="cert-title">Character Certificate</div>
      <div class="body">
        <p>This is to certify that <strong>${s.full_name}</strong>,
        Son/Daughter/Ward of <span class="field">${s.guardian1_name || '___________'}</span>,
        bearing Admission No. <strong>${s.admission_no}</strong>,
        is/was a student of this institution.</p>
        <p>During his/her stay in this institution, he/she has been found to be of <strong>good character and conduct</strong>. He/She is hardworking, sincere and well-behaved.</p>
        <p>We wish him/her all the best for his/her future endeavours.</p>
      </div>
      <div class="footer">
        <div class="sign-block"><div style="margin-top:40px;border-top:1px solid #000;padding-top:5px;">Class Teacher</div></div>
        <div class="sign-block"><div class="seal">SCHOOL<br>SEAL</div></div>
        <div class="sign-block"><div style="margin-top:40px;border-top:1px solid #000;padding-top:5px;">Principal / Head</div></div>
      </div></body></html>`;

    if (type === 'bonafide') return base + `
      <div class="cert-no">Cert No: BF-${Date.now().toString().slice(-6)} | Date: ${today}</div>
      <div class="cert-title">Bonafide Certificate</div>
      <div class="body">
        <p>This is to certify that <strong>${s.full_name}</strong>,
        Son/Daughter/Ward of <span class="field">${s.guardian1_name || '___________'}</span>,
        bearing Admission No. <strong>${s.admission_no}</strong>,
        Date of Birth: <strong>${dob}</strong>,
        is a bonafide student of this institution.</p>
        <p>This certificate is issued for the purpose of <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>.</p>
      </div>
      <div class="footer">
        <div class="sign-block"><div style="margin-top:40px;border-top:1px solid #000;padding-top:5px;">Class Teacher</div></div>
        <div class="sign-block"><div class="seal">SCHOOL<br>SEAL</div></div>
        <div class="sign-block"><div style="margin-top:40px;border-top:1px solid #000;padding-top:5px;">Principal / Head</div></div>
      </div></body></html>`;

    if (type === 'id_card') {
      return `<html><head><style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; padding: 40px; }
        .card { width: 320px; border: 3px solid #1a56db; border-radius: 12px; overflow: hidden; box-shadow: 2px 2px 8px rgba(0,0,0,0.2); }
        .card-header { background: #1a56db; color: white; padding: 12px; text-align: center; }
        .school-n { font-size: 14px; font-weight: bold; }
        .school-sub { font-size: 10px; opacity: 0.9; }
        .card-body { padding: 16px; background: white; }
        .photo { width: 80px; height: 90px; border: 2px solid #ccc; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; font-size: 10px; color: #666; }
        .name { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 8px; }
        .info-row { font-size: 11px; margin: 4px 0; display: flex; gap: 4px; }
        .label { font-weight: bold; color: #1a56db; min-width: 80px; }
        .card-footer { background: #1a56db; color: white; padding: 8px 12px; font-size: 10px; text-align: center; }
        @media print { @page { size: 85mm 54mm; margin: 0; } body { padding: 5px; } }
      </style></head><body>
        <div class="card">
          <div class="card-header">
            <div class="school-n">${inst?.name || 'School Name'}</div>
            <div class="school-sub">${inst?.city || ''} | Student ID Card</div>
          </div>
          <div class="card-body">
            <div class="photo">PHOTO</div>
            <div class="name">${s.full_name}</div>
            <div class="info-row"><span class="label">Adm No:</span>${s.admission_no}</div>
            <div class="info-row"><span class="label">Class:</span>${s.batches?.name || '___'}</div>
            <div class="info-row"><span class="label">DOB:</span>${dob}</div>
            <div class="info-row"><span class="label">Phone:</span>${s.phone || s.guardian1_phone || '___'}</div>
            <div class="info-row"><span class="label">Blood:</span>${s.blood_group || '___'}</div>
          </div>
          <div class="card-footer">Principal Signature ___________</div>
        </div>
      </body></html>`;
    }

    if (type === 'admit_card') return base + `
      <div class="cert-title">Admit Card</div>
      <div style="border: 1px solid #000; padding: 15px; margin: 10px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr><td style="padding: 5px; width: 40%;"><strong>Student Name:</strong></td><td>${s.full_name}</td></tr>
          <tr><td style="padding: 5px;"><strong>Admission No:</strong></td><td>${s.admission_no}</td></tr>
          <tr><td style="padding: 5px;"><strong>Class:</strong></td><td>${s.batches?.name || '___'}</td></tr>
          <tr><td style="padding: 5px;"><strong>Date of Birth:</strong></td><td>${dob}</td></tr>
          <tr><td style="padding: 5px;"><strong>Father's Name:</strong></td><td>${s.guardian1_name || '___'}</td></tr>
        </table>
      </div>
      <div style="margin-top: 15px; font-size: 13px; font-weight: bold;">Examination Schedule:</div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px;">
        <tr style="background: #f0f0f0;">
          <th style="border: 1px solid #000; padding: 6px;">Date</th>
          <th style="border: 1px solid #000; padding: 6px;">Subject</th>
          <th style="border: 1px solid #000; padding: 6px;">Time</th>
          <th style="border: 1px solid #000; padding: 6px;">Max Marks</th>
        </tr>
        ${['', '', '', ''].map(() => `<tr>
          <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
        </tr>`).join('')}
      </table>
      <div class="footer">
        <div class="sign-block"><div style="margin-top:40px;border-top:1px solid #000;padding-top:5px;">Student Signature</div></div>
        <div class="sign-block"><div class="seal">EXAM<br>SEAL</div></div>
        <div class="sign-block"><div style="margin-top:40px;border-top:1px solid #000;padding-top:5px;">Principal / Controller of Exams</div></div>
      </div></body></html>`;

    if (type === 'appreciation') return base + `
      <div class="cert-no">Cert No: APP-${Date.now().toString().slice(-6)} | Date: ${today}</div>
      <div class="cert-title">Appreciation Certificate</div>
      <div style="text-align:center;margin:20px 0">
        <div style="font-size:48px">🌟</div>
        <p style="font-size:18px;font-style:italic;color:#1a56db;margin:10px 0">This certificate is proudly presented to</p>
        <p style="font-size:28px;font-weight:bold;border-bottom:2px solid #1a56db;display:inline-block;padding-bottom:5px">${s.full_name}</p>
      </div>
      <div class="body" style="text-align:center">
        <p>In recognition of outstanding performance, dedication, and excellence demonstrated in academic and co-curricular activities.</p>
        <p>We appreciate your hard work and commitment to excellence.</p>
        <p style="font-style:italic;margin-top:15px">"Excellence is not a skill, it is an attitude."</p>
      </div>
      <div class="footer">
        <div class="sign-block"><div style="margin-top:40px;border-top:1px solid #000;padding-top:5px;">Class Teacher</div></div>
        <div class="sign-block"><div class="seal">SCHOOL<br>SEAL</div></div>
        <div class="sign-block"><div style="margin-top:40px;border-top:1px solid #000;padding-top:5px;">Principal / Head</div></div>
      </div></body></html>`;

    return base + `<div class="cert-title">Certificate</div><div class="body"><p>Certificate for ${s.full_name}</p></div></body></html>`;
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
      <div>
        <h2 className="text-lg font-semibold">Certificates & Documents</h2>
        <p className="text-sm text-muted-foreground">Generate TC, DOB, Character, Bonafide, ID Card & Admit Card</p>
      </div>

      {/* Certificate Type Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CERT_TYPES.map(ct => {
          const Icon = ct.icon;
          return (
            <button key={ct.id} onClick={() => setSelectedCert(ct.id)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                selectedCert === ct.id ? 'border-primary shadow-md' : 'border-muted hover:border-primary/40'
              }`}>
              <div className={`w-10 h-10 rounded-full ${ct.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium leading-tight">{ct.label}</p>
            </button>
          );
        })}
      </div>

      {/* Student Search */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Search Student</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Type student name to search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading && <Skeleton className="h-12 w-full" />}

          {students.length > 0 && !selectedStudent && (
            <div className="border rounded-lg overflow-hidden">
              {students.map(s => (
                <button key={s.id} onClick={() => { setSelectedStudent(s); setSearch(s.full_name); setStudents([]); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 border-b last:border-0 text-left">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{s.full_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.admission_no} · {s.batches?.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedStudent && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedStudent.full_name}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Adm: {selectedStudent.admission_no}</span>
                    <span>Class: {selectedStudent.batches?.name || '—'}</span>
                    <span>DOB: {selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString('en-IN') : '—'}</span>
                    {selectedStudent.category && <Badge variant="outline" className="text-xs">{selectedStudent.category}</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(null); setSearch(''); }}>
                  Change
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TC Number field (for TC only) */}
      {selectedCert === 'tc' && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Label className="w-32 flex-shrink-0">TC Number</Label>
              <Input value={tcNo} onChange={e => setTcNo(e.target.value)} className="max-w-xs" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Button */}
      <div className="flex gap-3">
        <Button size="lg" onClick={printCertificate} disabled={!selectedStudent}>
          <Printer className="w-5 h-5 mr-2" />
          Print {CERT_TYPES.find(c => c.id === selectedCert)?.label}
        </Button>
        {selectedStudent && (
          <Button variant="outline" size="lg" onClick={() => {
            setSelectedStudent(null);
            setSearch('');
          }}>Clear</Button>
        )}
      </div>
    </div>
  );
}