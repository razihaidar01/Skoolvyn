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
  UserCheck, ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Staff {
  id: string;
  full_name: string;
  employee_id: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  staff_type: string | null;
  department_id: string | null;
  joining_date: string | null;
  status: string | null;
  profile_photo_url: string | null;
}

interface DepartmentOption {
  id: string;
  name: string;
}

const DESIGNATIONS = [
  'principal', 'hod', 'faculty', 'hr_manager',
  'accountant', 'librarian', 'hostel_warden',
  'transport_manager', 'non_teaching_staff',
];

const PAGE_SIZE = 20;

export function StaffList() {
  const { institutionId, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterDesignation, setFilterDesignation] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<'full_name' | 'employee_id' | 'joining_date'>('full_name');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!institutionId) return;
    fetchDepartments();
  }, [institutionId]);

  useEffect(() => {
    if (!institutionId) return;
    setPage(0);
    fetchStaff();
  }, [institutionId, search, filterDept, filterDesignation, filterType, filterStatus, sortField, sortAsc]);

  useEffect(() => {
    if (!institutionId) return;
    fetchStaff();
  }, [page]);

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('id, name')
      .eq('institution_id', institutionId!);
    setDepartments(data || []);
  };

  const fetchStaff = async () => {
    if (!institutionId) return;
    setLoading(true);

    let query = (supabase as any)
      .from('staff')
      .select('id, full_name, employee_id, email, phone, designation, staff_type, department_id, joining_date, status, profile_photo_url', { count: 'exact' })
      .eq('institution_id', institutionId);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,employee_id.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (filterDept !== 'all') query = query.eq('department_id', filterDept);
    if (filterDesignation !== 'all') query = query.eq('designation', filterDesignation);
    if (filterType !== 'all') query = query.eq('staff_type', filterType);
    if (filterStatus !== 'all') query = query.eq('status', filterStatus);

    query = query.order(sortField, { ascending: sortAsc });
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count } = await query;
    setStaff(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  const deptMap = useMemo(() => {
    const map: Record<string, string> = {};
    departments.forEach(d => { map[d.id] = d.name; });
    return map;
  }, [departments]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === staff.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(staff.map(s => s.id)));
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const exportCSV = () => {
    const rows = staff.filter(s => selectedIds.size === 0 || selectedIds.has(s.id));
    const header = 'Name,Employee ID,Designation,Department,Phone,Status\n';
    const csv = header + rows.map(s =>
      `"${s.full_name}","${s.employee_id}","${s.designation || ''}","${deptMap[s.department_id || ''] || ''}","${s.phone || ''}","${s.status || 'active'}"`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'staff.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${rows.length} staff exported.` });
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
      on_leave: 'bg-amber-100 text-amber-700',
    };
    return <Badge className={`text-xs ${variants[s] || variants.active}`}>{s.replace('_', ' ')}</Badge>;
  };

  const formatDesignation = (d: string | null) =>
    d ? d.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const canSeeSalary = role === 'institution_admin' || role === 'hr_manager' || role === 'super_admin';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Staff</h2>
          <Badge variant="secondary">{totalCount}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/staff/new')}>
            <Plus className="w-4 h-4 mr-1" /> Add Staff
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search name, employee ID, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterDesignation} onValueChange={setFilterDesignation}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Designation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                {DESIGNATIONS.map(d => (
                  <SelectItem key={d} value={d}>{formatDesignation(d)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="teaching">Teaching</SelectItem>
                <SelectItem value="non_teaching">Non-Teaching</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
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
        ) : staff.length === 0 ? (
          <CardContent className="py-16 text-center">
            <UserCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">No staff found</h3>
            <p className="text-sm text-muted-foreground mt-1">Add your first staff member to get started!</p>
            <Button className="mt-4" size="sm" onClick={() => navigate('/admin/staff/new')}>
              <Plus className="w-4 h-4 mr-1" /> Add Staff
            </Button>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selectedIds.size === staff.length && staff.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('full_name')}>
                    <span className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('employee_id')}>
                    <span className="flex items-center gap-1">Employee ID <ArrowUpDown className="w-3 h-3" /></span>
                  </TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('joining_date')}>
                    <span className="flex items-center gap-1">Join Date <ArrowUpDown className="w-3 h-3" /></span>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map(member => (
                  <TableRow key={member.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox checked={selectedIds.has(member.id)} onCheckedChange={() => toggleSelect(member.id)} />
                    </TableCell>
                    <TableCell>
                      {member.profile_photo_url ? (
                        <img src={member.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-emerald-700">{getInitials(member.full_name)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-sm font-medium text-foreground hover:text-primary hover:underline text-left"
                        onClick={() => navigate(`/admin/staff/${member.id}`)}
                      >
                        {member.full_name}
                      </button>
                      <p className="text-xs text-muted-foreground">{member.email || '—'}</p>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{member.employee_id}</TableCell>
                    <TableCell className="text-sm">{formatDesignation(member.designation)}</TableCell>
                    <TableCell className="text-sm">{deptMap[member.department_id || ''] || '—'}</TableCell>
                    <TableCell className="text-sm">{member.phone || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {member.joining_date ? new Date(member.joining_date).toLocaleDateString('en-IN') : '—'}
                    </TableCell>
                    <TableCell>{statusBadge(member.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/staff/${member.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/staff/${member.id}/edit`)}>
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