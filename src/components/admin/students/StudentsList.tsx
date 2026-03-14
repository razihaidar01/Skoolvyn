import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Search, Plus, Download, Eye, Pencil, MoreHorizontal,
  Users, ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  full_name: string;
  admission_no: string;
  roll_no: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  status: string | null;
  batch_id: string | null;
  profile_photo_url: string | null;
  guardian1_phone: string | null;
  created_at: string | null;
}

interface BatchOption {
  id: string;
  name: string;
  program_id: string;
}

interface ProgramOption {
  id: string;
  name: string;
}

export function StudentsList() {
  const { institutionId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<'full_name' | 'roll_no' | 'created_at'>('full_name');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!institutionId) return;
    fetchFilters();
  }, [institutionId]);

  useEffect(() => {
    if (!institutionId) return;
    setPage(0);
    fetchStudents();
  }, [institutionId, search, filterBatch, filterProgram, filterStatus, sortField, sortAsc]);

  useEffect(() => {
    if (!institutionId) return;
    fetchStudents();
  }, [page]);

  const fetchFilters = async () => {
    if (!institutionId) return;
    const [batchRes, programRes] = await Promise.all([
      supabase.from('batches').select('id, name, program_id').eq('institution_id', institutionId).eq('is_active', true),
      supabase.from('programs').select('id, name').eq('institution_id', institutionId).eq('is_active', true),
    ]);
    setBatches((batchRes.data as BatchOption[]) || []);
    setPrograms((programRes.data as ProgramOption[]) || []);
  };

  const fetchStudents = async () => {
    if (!institutionId) return;
    setLoading(true);

    let query = supabase
      .from('students')
      .select('id, full_name, admission_no, roll_no, email, phone, gender, status, batch_id, profile_photo_url, guardian1_phone, created_at', { count: 'exact' })
      .eq('institution_id', institutionId);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,admission_no.ilike.%${search}%,roll_no.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (filterBatch !== 'all') query = query.eq('batch_id', filterBatch);
    if (filterStatus !== 'all') query = query.eq('status', filterStatus);
    if (filterProgram !== 'all') {
      const batchIds = batches.filter(b => b.program_id === filterProgram).map(b => b.id);
      if (batchIds.length > 0) query = query.in('batch_id', batchIds);
      else query = query.eq('batch_id', 'none');
    }

    query = query.order(sortField, { ascending: sortAsc });
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count } = await query;
    setStudents((data as Student[]) || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  const batchMap = useMemo(() => {
    const map: Record<string, string> = {};
    batches.forEach(b => { map[b.id] = b.name; });
    return map;
  }, [batches]);

  const programByBatch = useMemo(() => {
    const map: Record<string, string> = {};
    const progMap: Record<string, string> = {};
    programs.forEach(p => { progMap[p.id] = p.name; });
    batches.forEach(b => { map[b.id] = progMap[b.program_id] || ''; });
    return map;
  }, [batches, programs]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s.id)));
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const exportCSV = () => {
    const rows = students.filter(s => selectedIds.size === 0 || selectedIds.has(s.id));
    const header = 'Name,Admission No,Roll No,Batch,Phone,Status\n';
    const csv = header + rows.map(s =>
      `"${s.full_name}","${s.admission_no}","${s.roll_no || ''}","${batchMap[s.batch_id || ''] || ''}","${s.phone || ''}","${s.status || 'active'}"`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${rows.length} students exported.` });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  const statusBadge = (status: string | null) => {
    const s = status || 'active';
    const variants: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      inactive: 'bg-muted text-muted-foreground',
      transferred: 'bg-amber-100 text-amber-700',
    };
    return <Badge className={`text-xs ${variants[s] || variants.active}`}>{s}</Badge>;
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Students</h2>
          <Badge variant="secondary">{totalCount}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/students/new')}>
            <Plus className="w-4 h-4 mr-1" /> Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search name, roll no, email, phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Program" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterBatch} onValueChange={setFilterBatch}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Batch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.filter(b => filterProgram === 'all' || b.program_id === filterProgram).map(b =>
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
          <Button variant="outline" size="sm" onClick={exportCSV}>Export Selected</Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      {/* Table */}
      <Card className="shadow-sm overflow-hidden">
        {loading ? (
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </CardContent>
        ) : students.length === 0 ? (
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">No students found</h3>
            <p className="text-sm text-muted-foreground mt-1">Add your first student to get started!</p>
            <Button className="mt-4" size="sm" onClick={() => navigate('/admin/students/new')}>
              <Plus className="w-4 h-4 mr-1" /> Add Student
            </Button>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selectedIds.size === students.length && students.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('full_name')}>
                    <span className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('roll_no')}>
                    <span className="flex items-center gap-1">Roll No <ArrowUpDown className="w-3 h-3" /></span>
                  </TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Parent Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox checked={selectedIds.has(student.id)} onCheckedChange={() => toggleSelect(student.id)} />
                    </TableCell>
                    <TableCell>
                      {student.profile_photo_url ? (
                        <img src={student.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{getInitials(student.full_name)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <button className="text-sm font-medium text-foreground hover:text-primary hover:underline text-left" onClick={() => navigate(`/admin/students/${student.id}`)}>
                        {student.full_name}
                      </button>
                      <p className="text-xs text-muted-foreground">{student.admission_no}</p>
                    </TableCell>
                    <TableCell className="text-sm">{student.roll_no || '—'}</TableCell>
                    <TableCell className="text-sm">{batchMap[student.batch_id || ''] || '—'}</TableCell>
                    <TableCell className="text-sm">{programByBatch[student.batch_id || ''] || '—'}</TableCell>
                    <TableCell className="text-sm">{student.phone || '—'}</TableCell>
                    <TableCell className="text-sm">{student.guardian1_phone || '—'}</TableCell>
                    <TableCell>{statusBadge(student.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/students/${student.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/students/${student.id}/edit`)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
