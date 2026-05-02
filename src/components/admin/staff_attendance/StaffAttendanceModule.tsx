import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Save, Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AttStatus = 'present' | 'absent' | 'half_day' | 'late' | 'on_leave';

const STATUS_COLORS: Record<AttStatus, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-red-100 text-red-700',
  half_day: 'bg-amber-100 text-amber-700',
  late: 'bg-orange-100 text-orange-700',
  on_leave: 'bg-blue-100 text-blue-700',
};

export function StaffAttendanceModule() {
  const { institutionId } = useAuth();
  const { toast } = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { status: AttStatus; remarks: string; id?: string }>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'mark' | 'report'>('mark');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  useEffect(() => { if (institutionId) fetchStaff(); }, [institutionId]);
  useEffect(() => { if (institutionId && staff.length) fetchAttendance(); }, [date, staff]);
  useEffect(() => { if (viewMode === 'report' && institutionId) fetchMonthlyReport(); }, [viewMode, reportMonth, reportYear]);

  const fetchStaff = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('staff').select('id, full_name, designation, department_id, employee_id').eq('institution_id', institutionId!).eq('status', 'active').order('full_name');
    setStaff(data || []);
    setLoading(false);
  };

  const fetchAttendance = async () => {
    const { data } = await (supabase as any).from('staff_attendance').select('*').eq('institution_id', institutionId!).eq('date', date);
    const map: Record<string, any> = {};
    (data || []).forEach((a: any) => { map[a.staff_id] = { status: a.status, remarks: a.remarks || '', id: a.id }; });
    // Set defaults for staff without record
    const newAtt: Record<string, any> = {};
    staff.forEach(s => { newAtt[s.id] = map[s.id] || { status: 'present', remarks: '' }; });
    setAttendance(newAtt);
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    const start = `${reportYear}-${String(reportMonth).padStart(2,'0')}-01`;
    const endDate = new Date(reportYear, reportMonth, 0);
    const end = `${reportYear}-${String(reportMonth).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}`;
    const { data } = await (supabase as any).from('staff_attendance').select('staff_id, status').eq('institution_id', institutionId!).gte('date', start).lte('date', end);
    const summary: Record<string, Record<string, number>> = {};
    staff.forEach(s => { summary[s.id] = { present: 0, absent: 0, half_day: 0, late: 0, on_leave: 0 }; });
    (data || []).forEach((a: any) => { if (summary[a.staff_id]) summary[a.staff_id][a.status] = (summary[a.staff_id][a.status] || 0) + 1; });
    setMonthlyReport(staff.map(s => ({ ...s, ...summary[s.id] })));
    setLoading(false);
  };

  const setStatus = (staffId: string, status: AttStatus) => {
    setAttendance(prev => ({ ...prev, [staffId]: { ...prev[staffId], status } }));
  };

  const markAll = (status: AttStatus) => {
    const newAtt = { ...attendance };
    staff.forEach(s => { newAtt[s.id] = { ...newAtt[s.id], status }; });
    setAttendance(newAtt);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const toUpsert = staff.map(s => ({
        institution_id: institutionId,
        staff_id: s.id,
        date,
        status: attendance[s.id]?.status || 'present',
        remarks: attendance[s.id]?.remarks || null,
      }));
      await (supabase as any).from('staff_attendance').upsert(toUpsert, { onConflict: 'staff_id,date' });
      toast({ title: '✅ Attendance saved!' });
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const presentCount = Object.values(attendance).filter(a => a.status === 'present').length;
  const absentCount = Object.values(attendance).filter(a => a.status === 'absent').length;

  // Guard: wait for institutionId
  if (!institutionId) {

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Staff Attendance</h2><p className="text-sm text-muted-foreground">Mark and track staff attendance</p></div>
        <div className="flex gap-2">
          <Button variant={viewMode === 'mark' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('mark')}>Mark Attendance</Button>
          <Button variant={viewMode === 'report' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('report')}>Monthly Report</Button>
        </div>
      </div>

      {viewMode === 'mark' && (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto" max={new Date().toISOString().split('T')[0]} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-emerald-600" onClick={() => markAll('present')}>All Present</Button>
              <Button variant="outline" size="sm" className="text-red-500" onClick={() => markAll('absent')}>All Absent</Button>
            </div>
            <div className="ml-auto flex gap-3 text-sm">
              <span className="text-emerald-600 font-medium">{presentCount} Present</span>
              <span className="text-red-500 font-medium">{absentCount} Absent</span>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
                  : staff.map((s, idx) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground">{s.employee_id}</p>
                      </TableCell>
                      <TableCell className="text-sm">{s.designation || '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {(['present','absent','half_day','late','on_leave'] as AttStatus[]).map(st => (
                            <button key={st} onClick={() => setStatus(s.id, st)}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                                attendance[s.id]?.status === st
                                  ? STATUS_COLORS[st] + ' border-current'
                                  : 'bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30'
                              }`}>
                              {st.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input className="h-7 text-xs w-32" placeholder="Optional" value={attendance[s.id]?.remarks || ''}
                          onChange={e => setAttendance(prev => ({ ...prev, [s.id]: { ...prev[s.id], remarks: e.target.value } }))} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveAttendance} disabled={saving} size="lg">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" /> Save Attendance
            </Button>
          </div>
        </>
      )}

      {viewMode === 'report' && (
        <>
          <div className="flex gap-3">
            <Select value={reportMonth.toString()} onValueChange={v => setReportMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={reportYear.toString()} onValueChange={v => setReportYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>{[0,1].map(i => { const y = new Date().getFullYear()-i; return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>; })}</SelectContent>
            </Select>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead className="text-center text-emerald-600">Present</TableHead>
                    <TableHead className="text-center text-red-500">Absent</TableHead>
                    <TableHead className="text-center text-amber-600">Half Day</TableHead>
                    <TableHead className="text-center text-orange-500">Late</TableHead>
                    <TableHead className="text-center text-blue-600">On Leave</TableHead>
                    <TableHead className="text-center">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyReport.map(s => {
                    const total = (s.present||0)+(s.absent||0)+(s.half_day||0)+(s.late||0)+(s.on_leave||0);
                    const pct = total > 0 ? Math.round(((s.present||0) + (s.half_day||0)*0.5 + (s.late||0)) / total * 100) : 0;
                    return (
                      <TableRow key={s.id}>
                        <TableCell><p className="font-medium text-sm">{s.full_name}</p><p className="text-xs text-muted-foreground">{s.employee_id}</p></TableCell>
                        <TableCell className="text-center font-medium text-emerald-600">{s.present || 0}</TableCell>
                        <TableCell className="text-center font-medium text-red-500">{s.absent || 0}</TableCell>
                        <TableCell className="text-center font-medium text-amber-600">{s.half_day || 0}</TableCell>
                        <TableCell className="text-center font-medium text-orange-500">{s.late || 0}</TableCell>
                        <TableCell className="text-center font-medium text-blue-600">{s.on_leave || 0}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-xs border-0 ${pct >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{pct}%</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}