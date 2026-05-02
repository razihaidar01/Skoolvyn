import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Loader2, Package, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = ['Furniture','Electronics','Sports','Lab Equipment','Stationery','Books','Cleaning','Kitchen','Vehicle','Other'];
const CONDITIONS = ['good','fair','poor','damaged'];

export function InventoryModule() {
  const { institutionId } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [form, setForm] = useState({ item_name:'', category:'', quantity:'1', unit:'pcs', purchase_price:'', purchase_date:'', vendor:'', condition:'good', location:'', notes:'' });

  useEffect(() => { if (institutionId) fetch(); }, [institutionId]);

  const fetch = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('inventory').select('*').eq('institution_id', institutionId!).order('item_name');
    setItems(data || []);
    setLoading(false);
  };

  const openAdd = () => { setEditId(null); setForm({ item_name:'',category:'',quantity:'1',unit:'pcs',purchase_price:'',purchase_date:'',vendor:'',condition:'good',location:'',notes:'' }); setDialog(true); };
  const openEdit = (i: any) => { setEditId(i.id); setForm({ item_name:i.item_name,category:i.category||'',quantity:i.quantity?.toString()||'1',unit:i.unit||'pcs',purchase_price:i.purchase_price?.toString()||'',purchase_date:i.purchase_date||'',vendor:i.vendor||'',condition:i.condition||'good',location:i.location||'',notes:i.notes||'' }); setDialog(true); };

  const save = async () => {
    if (!form.item_name.trim()) { toast({ title: 'Item name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = { institution_id: institutionId, item_name: form.item_name.trim(), category: form.category||null, quantity: parseInt(form.quantity)||0, unit: form.unit||'pcs', purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null, purchase_date: form.purchase_date||null, vendor: form.vendor||null, condition: form.condition, location: form.location||null, notes: form.notes||null, updated_at: new Date().toISOString() };
      if (editId) await (supabase as any).from('inventory').update(payload).eq('id', editId);
      else await (supabase as any).from('inventory').insert(payload);
      toast({ title: editId ? '✅ Updated!' : '✅ Item added!' });
      setDialog(false); fetch();
    } catch(err: any) { toast({ title:'Error', description:err.message, variant:'destructive' }); }
    setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await (supabase as any).from('inventory').delete().eq('id', id);
    toast({ title: 'Deleted' }); fetch();
  };

  const exportCSV = () => {
    const csv = 'Item,Category,Qty,Unit,Price,Vendor,Condition,Location\n' +
      filtered.map(i => `"${i.item_name}","${i.category||''}",${i.quantity},"${i.unit||''}",${i.purchase_price||0},"${i.vendor||''}","${i.condition}","${i.location||''}"`).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='inventory.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = items.filter(i => {
    const m = !search || i.item_name?.toLowerCase().includes(search.toLowerCase());
    const c = filterCat === 'all' || i.category === filterCat;
    return m && c;
  });

  const totalValue = items.reduce((s,i) => s + ((i.purchase_price||0)*(i.quantity||0)), 0);
  const goodItems = items.filter(i => i.condition === 'good').length;
  const poorItems = items.filter(i => ['poor','damaged'].includes(i.condition)).length;

  // Guard: wait for institutionId
  if (!institutionId) {

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Inventory / Stock</h2><p className="text-sm text-muted-foreground">Manage school assets and stock</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />Export</Button>
          <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Add Item</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{items.length}</p><p className="text-xs text-muted-foreground">Total Items</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{goodItems}</p><p className="text-xs text-muted-foreground">Good Condition</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 text-center"><p className="text-xl font-bold text-violet-600">₹{Math.round(totalValue/1000)}k</p><p className="text-xs text-muted-foreground">Total Value</p></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Item Name</TableHead><TableHead>Category</TableHead><TableHead className="text-center">Qty</TableHead><TableHead>Price</TableHead><TableHead>Vendor</TableHead><TableHead>Condition</TableHead><TableHead>Location</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
              : filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground"><Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" /><p>No items found</p></TableCell></TableRow>
              : filtered.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-sm">{item.item_name}</TableCell>
                  <TableCell className="text-sm">{item.category || '—'}</TableCell>
                  <TableCell className="text-center text-sm">{item.quantity} {item.unit}</TableCell>
                  <TableCell className="text-sm">{item.purchase_price ? `₹${item.purchase_price.toLocaleString('en-IN')}` : '—'}</TableCell>
                  <TableCell className="text-sm">{item.vendor || '—'}</TableCell>
                  <TableCell><Badge className={`text-xs border-0 capitalize ${item.condition === 'good' ? 'bg-emerald-100 text-emerald-700' : item.condition === 'fair' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{item.condition}</Badge></TableCell>
                  <TableCell className="text-sm">{item.location || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Item Name *</Label><Input value={form.item_name} onChange={e => setForm(f=>({...f, item_name:e.target.value}))} /></div>
            <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onValueChange={v => setForm(f=>({...f, category:v}))}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Condition</Label><Select value={form.condition} onValueChange={v => setForm(f=>({...f, condition:v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => setForm(f=>({...f, quantity:e.target.value}))} /></div>
            <div className="space-y-1.5"><Label>Unit</Label><Input value={form.unit} onChange={e => setForm(f=>({...f, unit:e.target.value}))} placeholder="pcs/kg/litre" /></div>
            <div className="space-y-1.5"><Label>Purchase Price ₹</Label><Input type="number" value={form.purchase_price} onChange={e => setForm(f=>({...f, purchase_price:e.target.value}))} /></div>
            <div className="space-y-1.5"><Label>Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={e => setForm(f=>({...f, purchase_date:e.target.value}))} /></div>
            <div className="space-y-1.5"><Label>Vendor</Label><Input value={form.vendor} onChange={e => setForm(f=>({...f, vendor:e.target.value}))} /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f=>({...f, location:e.target.value}))} placeholder="Room/Block" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f=>({...f, notes:e.target.value}))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editId ? 'Save' : 'Add Item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}