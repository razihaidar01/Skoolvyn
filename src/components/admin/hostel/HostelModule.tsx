import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Plus, Users, Loader2, BedDouble } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function HostelModule() {
  const { institutionId } = useAuth();
  const { toast } = useToast();

  const [hostels, setHostels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHostelDialog, setShowHostelDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showAllocDialog, setShowAllocDialog] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState<string>('all');

  const [hostelForm, setHostelForm] = useState({ name: '', type: 'boys', total_rooms: '', total_capacity: '' });
  const [roomForm, setRoomForm] = useState({ hostel_id: '', room_no: '', floor: '', capacity: '2', monthly_fee: '' });
  const [allocForm, setAllocForm] = useState({ student_id: '', room_id: '', allotment_date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (institutionId) fetchAll();
  }, [institutionId]);

  const fetchAll = async () => {
    setLoading(true);
    const [hRes, rRes, aRes, sRes] = await Promise.all([
      (supabase as any).from('hostels').select('*').eq('institution_id', institutionId!).order('name'),
      (supabase as any).from('hostel_rooms').select('*').eq('institution_id', institutionId!).order('room_no'),
      (supabase as any).from('hostel_allocations').select('*').eq('institution_id', institutionId!).eq('status', 'active').order('allotment_date', { ascending: false }),
      (supabase as any).from('students').select('id, full_name, admission_no').eq('institution_id', institutionId!).eq('status', 'active'),
    ]);
    setHostels(hRes.data || []);
    setRooms(rRes.data || []);
    setAllocations(aRes.data || []);
    setStudents(sRes.data || []);
    setLoading(false);
  };

  const handleSaveHostel = async () => {
    if (!hostelForm.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await (supabase as any).from('hostels').insert({
        institution_id: institutionId,
        name: hostelForm.name,
        type: hostelForm.type,
        total_rooms: hostelForm.total_rooms ? parseInt(hostelForm.total_rooms) : null,
        total_capacity: hostelForm.total_capacity ? parseInt(hostelForm.total_capacity) : null,
      });
      toast({ title: 'Hostel added!' });
      setShowHostelDialog(false);
      setHostelForm({ name: '', type: 'boys', total_rooms: '', total_capacity: '' });
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const handleSaveRoom = async () => {
    if (!roomForm.hostel_id || !roomForm.room_no) { toast({ title: 'Hostel and Room No required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await (supabase as any).from('hostel_rooms').insert({
        institution_id: institutionId,
        hostel_id: roomForm.hostel_id,
        room_no: roomForm.room_no,
        floor: roomForm.floor ? parseInt(roomForm.floor) : null,
        capacity: parseInt(roomForm.capacity) || 2,
        monthly_fee: roomForm.monthly_fee ? parseFloat(roomForm.monthly_fee) : null,
        occupied: 0,
        is_available: true,
      });
      toast({ title: 'Room added!' });
      setShowRoomDialog(false);
      setRoomForm({ hostel_id: '', room_no: '', floor: '', capacity: '2', monthly_fee: '' });
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const handleAllocate = async () => {
    if (!allocForm.student_id || !allocForm.room_id) { toast({ title: 'Student and Room required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await (supabase as any).from('hostel_allocations').insert({
        institution_id: institutionId,
        student_id: allocForm.student_id,
        room_id: allocForm.room_id,
        allotment_date: allocForm.allotment_date,
        status: 'active',
      });
      const room = rooms.find(r => r.id === allocForm.room_id);
      if (room) {
        await (supabase as any).from('hostel_rooms').update({
          occupied: (room.occupied || 0) + 1,
          is_available: (room.occupied || 0) + 1 < (room.capacity || 2),
        }).eq('id', allocForm.room_id);
      }
      toast({ title: 'Room allocated!' });
      setShowAllocDialog(false);
      setAllocForm({ student_id: '', room_id: '', allotment_date: new Date().toISOString().split('T')[0] });
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const handleVacate = async (allocId: string, roomId: string) => {
    if (!confirm('Vacate this room allocation?')) return;
    await (supabase as any).from('hostel_allocations').update({ status: 'vacated', vacate_date: new Date().toISOString().split('T')[0] }).eq('id', allocId);
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      const newOccupied = Math.max(0, (room.occupied || 1) - 1);
      await (supabase as any).from('hostel_rooms').update({ occupied: newOccupied, is_available: newOccupied < (room.capacity || 2) }).eq('id', roomId);
    }
    toast({ title: 'Room vacated' });
    fetchAll();
  };

  const hostelMap: Record<string, string> = {};
  hostels.forEach(h => { hostelMap[h.id] = h.name; });
  const studentMap: Record<string, string> = {};
  students.forEach(s => { studentMap[s.id] = `${s.full_name} (${s.admission_no})`; });
  const roomMap: Record<string, any> = {};
  rooms.forEach(r => { roomMap[r.id] = r; });

  const filteredRooms = selectedHostel === 'all' ? rooms : rooms.filter(r => r.hostel_id === selectedHostel);
  const availableRooms = rooms.filter(r => r.is_available);
  const totalCapacity = rooms.reduce((s, r) => s + (r.capacity || 0), 0);
  const totalOccupied = rooms.reduce((s, r) => s + (r.occupied || 0), 0);

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Hostel</h2>
          <p className="text-sm text-muted-foreground">Manage hostel blocks, rooms and allocations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRoomDialog(true)}><BedDouble className="w-4 h-4 mr-1" /> Add Room</Button>
          <Button variant="outline" size="sm" onClick={() => setShowAllocDialog(true)}><Users className="w-4 h-4 mr-1" /> Allocate</Button>
          <Button size="sm" onClick={() => setShowHostelDialog(true)}><Plus className="w-4 h-4 mr-1" /> Add Hostel</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Hostels', value: hostels.length, color: 'text-primary' },
          { label: 'Total Rooms', value: rooms.length, color: 'text-blue-600' },
          { label: 'Occupied', value: totalOccupied, color: 'text-amber-600' },
          { label: 'Available', value: totalCapacity - totalOccupied, color: 'text-emerald-600' },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="hostels">Hostels ({hostels.length})</TabsTrigger>
          <TabsTrigger value="rooms">Rooms ({rooms.length})</TabsTrigger>
          <TabsTrigger value="allocations">Allocations ({allocations.length})</TabsTrigger>
        </TabsList>

        {/* HOSTELS */}
        <TabsContent value="hostels">
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hostels.length === 0 ? (
                <Card className="col-span-3 shadow-sm">
                  <CardContent className="py-16 text-center">
                    <Home className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-medium">No hostels added</p>
                    <Button className="mt-4" size="sm" onClick={() => setShowHostelDialog(true)}><Plus className="w-4 h-4 mr-1" /> Add Hostel</Button>
                  </CardContent>
                </Card>
              ) : hostels.map(h => {
                const hostelRooms = rooms.filter(r => r.hostel_id === h.id);
                const occ = hostelRooms.reduce((s, r) => s + (r.occupied || 0), 0);
                const cap = hostelRooms.reduce((s, r) => s + (r.capacity || 0), 0);
                return (
                  <Card key={h.id} className="shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{h.name}</h3>
                          <Badge variant="outline" className="text-xs mt-1 capitalize">{h.type}</Badge>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Home className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Rooms</span><span className="font-medium">{hostelRooms.length}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Occupied</span><span className="font-medium text-amber-600">{occ}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="font-medium text-emerald-600">{cap - occ}</span></div>
                      </div>
                      {/* Occupancy bar */}
                      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: cap > 0 ? `${Math.round((occ / cap) * 100)}%` : '0%' }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{cap > 0 ? Math.round((occ / cap) * 100) : 0}% occupied</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ROOMS */}
        <TabsContent value="rooms" className="space-y-3">
          <div className="flex gap-3">
            <Select value={selectedHostel} onValueChange={setSelectedHostel}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Hostels" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hostels</SelectItem>
                {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room No.</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead className="text-center">Capacity</TableHead>
                    <TableHead className="text-center">Occupied</TableHead>
                    <TableHead>Monthly Fee</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No rooms added</TableCell></TableRow>
                  ) : filteredRooms.map(room => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.room_no}</TableCell>
                      <TableCell className="text-sm">{hostelMap[room.hostel_id] || '—'}</TableCell>
                      <TableCell className="text-sm">{room.floor !== null ? `Floor ${room.floor}` : '—'}</TableCell>
                      <TableCell className="text-center text-sm">{room.capacity || 0}</TableCell>
                      <TableCell className="text-center text-sm">{room.occupied || 0}</TableCell>
                      <TableCell className="text-sm">{room.monthly_fee ? `₹${room.monthly_fee}` : '—'}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs border-0 ${room.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {room.is_available ? 'Available' : 'Full'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALLOCATIONS */}
        <TabsContent value="allocations">
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead>Allotment Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No allocations</TableCell></TableRow>
                  ) : allocations.map(alloc => {
                    const room = roomMap[alloc.room_id];
                    return (
                      <TableRow key={alloc.id}>
                        <TableCell className="text-sm">{studentMap[alloc.student_id] || alloc.student_id.slice(0, 8) + '...'}</TableCell>
                        <TableCell className="text-sm font-medium">{room?.room_no || '—'}</TableCell>
                        <TableCell className="text-sm">{room ? hostelMap[room.hostel_id] : '—'}</TableCell>
                        <TableCell className="text-sm">{new Date(alloc.allotment_date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell><Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30"
                            onClick={() => handleVacate(alloc.id, alloc.room_id)}>Vacate</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Hostel Dialog */}
      <Dialog open={showHostelDialog} onOpenChange={setShowHostelDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Hostel</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Hostel Name *</Label><Input value={hostelForm.name} onChange={e => setHostelForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Boys Hostel Block A" /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={hostelForm.type} onValueChange={v => setHostelForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Total Rooms</Label><Input type="number" value={hostelForm.total_rooms} onChange={e => setHostelForm(f => ({ ...f, total_rooms: e.target.value }))} placeholder="50" /></div>
              <div className="space-y-1.5"><Label>Total Capacity</Label><Input type="number" value={hostelForm.total_capacity} onChange={e => setHostelForm(f => ({ ...f, total_capacity: e.target.value }))} placeholder="200" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHostelDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveHostel} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Hostel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Hostel *</Label>
              <Select value={roomForm.hostel_id} onValueChange={v => setRoomForm(f => ({ ...f, hostel_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                <SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Room No. *</Label><Input value={roomForm.room_no} onChange={e => setRoomForm(f => ({ ...f, room_no: e.target.value }))} placeholder="101" /></div>
              <div className="space-y-1.5"><Label>Floor</Label><Input type="number" value={roomForm.floor} onChange={e => setRoomForm(f => ({ ...f, floor: e.target.value }))} placeholder="1" /></div>
              <div className="space-y-1.5"><Label>Capacity (beds)</Label><Input type="number" value={roomForm.capacity} onChange={e => setRoomForm(f => ({ ...f, capacity: e.target.value }))} placeholder="2" /></div>
              <div className="space-y-1.5"><Label>Monthly Fee (₹)</Label><Input type="number" value={roomForm.monthly_fee} onChange={e => setRoomForm(f => ({ ...f, monthly_fee: e.target.value }))} placeholder="3000" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoomDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRoom} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Dialog */}
      <Dialog open={showAllocDialog} onOpenChange={setShowAllocDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Allocate Room</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Select Student *</Label>
              <Select value={allocForm.student_id} onValueChange={v => setAllocForm(f => ({ ...f, student_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Select Room *</Label>
              <Select value={allocForm.room_id} onValueChange={v => setAllocForm(f => ({ ...f, room_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose available room" /></SelectTrigger>
                <SelectContent>
                  {availableRooms.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {hostelMap[r.hostel_id]} — Room {r.room_no} ({(r.capacity || 0) - (r.occupied || 0)} beds free)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Allotment Date</Label><Input type="date" value={allocForm.allotment_date} onChange={e => setAllocForm(f => ({ ...f, allotment_date: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllocDialog(false)}>Cancel</Button>
            <Button onClick={handleAllocate} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Allocate Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
