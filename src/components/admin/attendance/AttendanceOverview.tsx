import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  ClipboardCheck, Users, UserCheck, TrendingUp,
  ChevronRight, Calendar, AlertCircle
} from 'lucide-react';

interface BatchSummary {
  id: string;
  name: string;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendancePct: number;
  isMarked: boolean;
}

export function AttendanceOverview() {
  const { institutionId } = useAuth();
  const navigate = useNavigate();

  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0, presentToday: 0, absentToday: 0, pct: 0
  });

  useEffect(() => {
    if (institutionId) fetchOverview();
  }, [institutionId, selectedDate]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      // Fetch all active batches
      const { data: batchData } = await (supabase as any)
        .from('batches')
        .select('id, name')
        .eq('institution_id', institutionId!)
        .eq('is_active', true)
        .order('name');

      if (!batchData?.length) { setLoading(false); return; }

      // For each batch get student count + attendance for selected date
      const summaries = await Promise.all(batchData.map(async (batch) => {
        const [studRes, attRes] = await Promise.all([
          (supabase as any).from('students').select('id', { count: 'exact', head: true })
            .eq('institution_id', institutionId!).eq('batch_id', batch.id).eq('status', 'active'),
          (supabase as any).from('student_attendance').select('status')
            .eq('institution_id', institutionId!).eq('batch_id', batch.id).eq('date', selectedDate),
        ]);

        const total = studRes.count || 0;
        const attRecords = attRes.data || [];
        const present = attRecords.filter((a: any) => a.status === 'present').length;
        const absent = attRecords.filter((a: any) => a.status === 'absent').length;
        const isMarked = attRecords.length > 0;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;

        return { id: batch.id, name: batch.name, totalStudents: total, presentToday: present, absentToday: absent, attendancePct: pct, isMarked };
      }));

      setBatches(summaries);

      const totalS = summaries.reduce((s, b) => s + b.totalStudents, 0);
      const totalP = summaries.reduce((s, b) => s + b.presentToday, 0);
      const totalA = summaries.reduce((s, b) => s + b.absentToday, 0);
      setOverallStats({ totalStudents: totalS, presentToday: totalP, absentToday: totalA, pct: totalS > 0 ? Math.round((totalP / totalS) * 100) : 0 });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Wait for institutionId
  if (!institutionId) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-32 bg-muted rounded"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    );
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Attendance</h2>
          <p className="text-sm text-muted-foreground">Track and manage student attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: overallStats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Present', value: overallStats.presentToday, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Absent', value: overallStats.absentToday, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Attendance %', value: `${overallStats.pct}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
        ].map(stat => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {loading ? <Skeleton className="h-7 w-16" /> : stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Batch-wise Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Batch-wise Attendance — {isToday ? "Today" : new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-foreground">No batches found</p>
              <p className="text-sm text-muted-foreground mt-1">Set up batches in Academic Setup first</p>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map(batch => (
                <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{batch.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{batch.name}</p>
                      <p className="text-xs text-muted-foreground">{batch.totalStudents} students</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center hidden sm:block">
                      <p className="text-lg font-bold text-emerald-600">{batch.presentToday}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-lg font-bold text-red-500">{batch.absentToday}</p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-bold ${batch.attendancePct >= 75 ? 'text-emerald-600' : batch.attendancePct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {batch.isMarked ? `${batch.attendancePct}%` : '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">Attendance</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!batch.isMarked && isToday ? (
                        <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Not Marked</Badge>
                      ) : batch.isMarked ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Marked</Badge>
                      ) : null}
                      <Button
                        size="sm"
                        variant={batch.isMarked ? "outline" : "default"}
                        onClick={() => navigate(`/admin/attendance/${batch.id}?date=${selectedDate}`)}
                      >
                        {batch.isMarked ? 'View/Edit' : isToday ? 'Mark Now' : 'View'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}