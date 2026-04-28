import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bus, Plus, MapPin, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TransportModule() {
  const { institutionId } = useAuth();
  const { toast } = useToast();

  const [routes, setRoutes] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [showAllocDialog, setShowAllocDialog] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>('all');

  const [routeForm, setRouteForm] = useState({
    route_name: '', route_no: '', vehicle_no: '', driver_name: '',
    driver_phone: '', capacity: '', monthly_fee: '',
  });
  const [stopForm, setStopForm] = useState({
    route_id: '', stop_name: '', stop_order: '', pickup_time: '',
    drop_time: '', monthly_fee: '',
  });
  const [allocForm, setAllocForm] = useState({ student_id: '', route_id: '', stop_id: '' });

  useEffect(() => {
    if (institutionId) fetchAll();
  }, [institutionId]);

  const fetchAll = async () => {
    setLoading(true);
    const [rRes, sRes, aRes, studRes] = await Promise.all([
      (supabase as any).from('transport_routes').select('*').eq('institution_id', institutionId!).order('route_name'),
      (supabase as any).from('transport_stops').select('*').eq('institution_id', institutionId!).order('stop_order'),
      (supabase as any).from('student_transport').select('*').eq('institution_id', institutionId!).eq('status', 'active'),
      (supabase as any).from('students').select('id, full_name, admission_no').eq('institution_id', institutionId!).eq('status', 'active'),
    ]);
    setRoutes(rRes.data || []);
    setStops(sRes.data || []);
    setAllocations(aRes.data || []);
    setStudents(studRes.data || []);
    setLoading(false);
  };

  const handleSaveRoute = async () => {
    if (!routeForm.route_name.trim()) { toast({ title: 'Route name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await (supabase as any).from('transport_routes').insert({
        institution_id: institutionId,
        route_name: routeForm.route_name,
        route_no: routeForm.route_no || null,
        vehicle_no: routeForm.vehicle_no || null,
        driver_name: routeForm.driver_name || null,
        driver_phone: routeForm.driver_phone || null,
        capacity: routeForm.capacity ? parseInt(routeForm.capacity) : null,
        monthly_fee: routeForm.monthly_fee ? parseFloat(routeForm.monthly_fee) : null,
        is_active: true,
      });
      toast({ title: 'Route added!' });
      setShowRouteDialog(false);
      setRouteForm({ route_name: '', route_no: '', vehicle_no: '', driver_name: '', driver_phone: '', capacity: '', monthly_fee: '' });
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const handleSaveStop = async () => {
    if (!stopForm.route_id || !stopForm.stop_name.trim()) { toast({ title: 'Route and Stop name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await (supabase as any).from('transport_stops').insert({
        institution_id: institutionId,
        route_id: stopForm.route_id,
        stop_name: stopForm.stop_name,
        stop_order: stopForm.stop_order ? parseInt(stopForm.stop_order) : null,
        pickup_time: stopForm.pickup_time || null,
        drop_time: stopForm.drop_time || null,
        monthly_fee: stopForm.monthly_fee ? parseFloat(stopForm.monthly_fee) : null,
      });
      toast({ title: 'Stop added!' });
      setShowStopDialog(false);
      setStopForm({ route_id: '', stop_name: '', stop_order: '', pickup_time: '', drop_time: '', monthly_fee: '' });
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const handleAllocate = async () => {
    if (!allocForm.student_id || !allocForm.route_id) { toast({ title: 'Student and Route required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await (supabase as any).from('student_transport').insert({
        institution_id: institutionId,
        student_id: allocForm.student_id,
        route_id: allocForm.route_id,
        stop_id: allocForm.stop_id || null,
        status: 'active',
      });
      toast({ title: 'Transport allocated!' });
      setShowAllocDialog(false);
      setAllocForm({ student_id: '', route_id: '', stop_id: '' });
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const handleRemoveAlloc = async (id: string) => {
    if (!confirm('Remove transport allocation?')) return;
    await (supabase as any).from('student_transport').update({ status: 'inactive' }).eq('id', id);
    toast({ title: 'Allocation removed' });
    fetchAll();
  };

  const routeMap: Record<string, string> = {};
  routes.forEach(r => { routeMap[r.id] = r.route_name; });
  const stopMap: Record<string, string> = {};
  stops.forEach(s => { stopMap[s.id] = s.stop_name; });
  const studentMap: Record<string, string> = {};
  students.forEach(s => { studentMap[s.id] = `${s.full_name} (${s.admission_no})`; });

  const filteredStops = selectedRoute === 'all' ? stops : stops.filter(s => s.route_id === selectedRoute);
  const totalStudentsTransport = allocations.length;

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
          <h2 className="text-lg font-semibold">Transport</h2>
          <p className="text-sm text-muted-foreground">Manage routes, stops and student transport</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowStopDialog(true)}><MapPin className="w-4 h-4 mr-1" /> Add Stop</Button>
          <Button variant="outline" size="sm" onClick={() => setShowAllocDialog(true)}><Users className="w-4 h-4 mr-1" /> Assign Student</Button>
          <Button size="sm" onClick={() => setShowRouteDialog(true)}><Plus className="w-4 h-4 mr-1" /> Add Route</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Routes', value: routes.length, color: 'text-primary' },
          { label: 'Stops', value: stops.length, color: 'text-blue-600' },
          { label: 'Students', value: totalStudentsTransport, color: 'text-emerald-600' },
          { label: 'Active Routes', value: routes.filter(r => r.is_active).length, color: 'text-amber-600' },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="routes">
        <TabsList>
          <TabsTrigger value="routes">Routes ({routes.length})</TabsTrigger>
          <TabsTrigger value="stops">Stops ({stops.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({allocations.length})</TabsTrigger>
        </TabsList>

        {/* ROUTES */}
        <TabsContent value="routes">
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <div className="space-y-3">
              {routes.length === 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="py-16 text-center">
                    <Bus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-medium">No routes added</p>
                    <Button className="mt-4" size="sm" onClick={() => setShowRouteDialog(true)}><Plus className="w-4 h-4 mr-1" /> Add Route</Button>
                  </CardContent>
                </Card>
              ) : routes.map(route => {
                const routeStops = stops.filter(s => s.route_id === route.id);
                const routeStudents = allocations.filter(a => a.route_id === route.id);
                return (
                  <Card key={route.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bus className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{route.route_name}</h3>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                              {route.route_no && <span>Route No: {route.route_no}</span>}
                              {route.vehicle_no && <span>Vehicle: {route.vehicle_no}</span>}
                              {route.driver_name && <span>Driver: {route.driver_name}</span>}
                              {route.driver_phone && <span>📞 {route.driver_phone}</span>}
                              {route.capacity && <span>Capacity: {route.capacity}</span>}
                              {route.monthly_fee && <span>Fee: ₹{route.monthly_fee}/month</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="text-center">
                            <p className="font-bold text-primary">{routeStops.length}</p>
                            <p className="text-xs text-muted-foreground">Stops</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-emerald-600">{routeStudents.length}</p>
                            <p className="text-xs text-muted-foreground">Students</p>
                          </div>
                          <Badge className={`text-xs border-0 ${route.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                            {route.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* STOPS */}
        <TabsContent value="stops" className="space-y-3">
          <Select value={selectedRoute} onValueChange={setSelectedRoute}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Routes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Routes</SelectItem>
              {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Stop Name</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Pickup Time</TableHead>
                    <TableHead>Drop Time</TableHead>
                    <TableHead>Monthly Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStops.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No stops added</TableCell></TableRow>
                  ) : filteredStops.sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0)).map(stop => (
                    <TableRow key={stop.id}>
                      <TableCell className="text-sm text-muted-foreground">{stop.stop_order || '—'}</TableCell>
                      <TableCell className="font-medium text-sm">{stop.stop_name}</TableCell>
                      <TableCell className="text-sm">{routeMap[stop.route_id] || '—'}</TableCell>
                      <TableCell className="text-sm">{stop.pickup_time || '—'}</TableCell>
                      <TableCell className="text-sm">{stop.drop_time || '—'}</TableCell>
                      <TableCell className="text-sm">{stop.monthly_fee ? `₹${stop.monthly_fee}` : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STUDENTS */}
        <TabsContent value="students">
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Stop</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No students assigned</TableCell></TableRow>
                  ) : allocations.map(alloc => (
                    <TableRow key={alloc.id}>
                      <TableCell className="text-sm">{studentMap[alloc.student_id] || alloc.student_id.slice(0, 8) + '...'}</TableCell>
                      <TableCell className="text-sm">{routeMap[alloc.route_id] || '—'}</TableCell>
                      <TableCell className="text-sm">{alloc.stop_id ? stopMap[alloc.stop_id] : '—'}</TableCell>
                      <TableCell><Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30"
                          onClick={() => handleRemoveAlloc(alloc.id)}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Route Dialog */}
      <Dialog open={showRouteDialog} onOpenChange={setShowRouteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Transport Route</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Route Name *</Label><Input value={routeForm.route_name} onChange={e => setRouteForm(f => ({ ...f, route_name: e.target.value }))} placeholder="e.g. North Campus Route" /></div>
            <div className="space-y-1.5"><Label>Route No.</Label><Input value={routeForm.route_no} onChange={e => setRouteForm(f => ({ ...f, route_no: e.target.value }))} placeholder="R-01" /></div>
            <div className="space-y-1.5"><Label>Vehicle No.</Label><Input value={routeForm.vehicle_no} onChange={e => setRouteForm(f => ({ ...f, vehicle_no: e.target.value }))} placeholder="MH-12-AB-1234" /></div>
            <div className="space-y-1.5"><Label>Driver Name</Label><Input value={routeForm.driver_name} onChange={e => setRouteForm(f => ({ ...f, driver_name: e.target.value }))} placeholder="Driver name" /></div>
            <div className="space-y-1.5"><Label>Driver Phone</Label><Input value={routeForm.driver_phone} onChange={e => setRouteForm(f => ({ ...f, driver_phone: e.target.value }))} placeholder="+91 98765 43210" /></div>
            <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" value={routeForm.capacity} onChange={e => setRouteForm(f => ({ ...f, capacity: e.target.value }))} placeholder="40" /></div>
            <div className="space-y-1.5"><Label>Monthly Fee (₹)</Label><Input type="number" value={routeForm.monthly_fee} onChange={e => setRouteForm(f => ({ ...f, monthly_fee: e.target.value }))} placeholder="1500" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRouteDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRoute} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Route</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stop Dialog */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Stop</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Route *</Label>
              <Select value={stopForm.route_id} onValueChange={v => setStopForm(f => ({ ...f, route_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Stop Name *</Label><Input value={stopForm.stop_name} onChange={e => setStopForm(f => ({ ...f, stop_name: e.target.value }))} placeholder="Stop name" /></div>
              <div className="space-y-1.5"><Label>Stop Order</Label><Input type="number" value={stopForm.stop_order} onChange={e => setStopForm(f => ({ ...f, stop_order: e.target.value }))} placeholder="1" /></div>
              <div className="space-y-1.5"><Label>Pickup Time</Label><Input type="time" value={stopForm.pickup_time} onChange={e => setStopForm(f => ({ ...f, pickup_time: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Drop Time</Label><Input type="time" value={stopForm.drop_time} onChange={e => setStopForm(f => ({ ...f, drop_time: e.target.value }))} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Monthly Fee (₹)</Label><Input type="number" value={stopForm.monthly_fee} onChange={e => setStopForm(f => ({ ...f, monthly_fee: e.target.value }))} placeholder="500" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveStop} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Stop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Student Dialog */}
      <Dialog open={showAllocDialog} onOpenChange={setShowAllocDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Student to Transport</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Student *</Label>
              <Select value={allocForm.student_id} onValueChange={v => setAllocForm(f => ({ ...f, student_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Route *</Label>
              <Select value={allocForm.route_id} onValueChange={v => setAllocForm(f => ({ ...f, route_id: v, stop_id: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {allocForm.route_id && (
              <div className="space-y-1.5">
                <Label>Boarding Stop</Label>
                <Select value={allocForm.stop_id} onValueChange={v => setAllocForm(f => ({ ...f, stop_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select stop (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific stop</SelectItem>
                    {stops.filter(s => s.route_id === allocForm.route_id).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.stop_name}{s.pickup_time ? ` (${s.pickup_time})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllocDialog(false)}>Cancel</Button>
            <Button onClick={handleAllocate} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}