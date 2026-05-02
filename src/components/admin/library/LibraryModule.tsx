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
import { BookOpen, Plus, Search, Download, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Book {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  category: string | null;
  publisher: string | null;
  edition: string | null;
  year: number | null;
  total_copies: number | null;
  available_copies: number | null;
  rack_no: string | null;
}

interface Issue {
  id: string;
  book_id: string;
  user_id: string;
  issued_date: string;
  due_date: string;
  returned_date: string | null;
  status: string | null;
  fine_amount: number | null;
  fine_paid: boolean | null;
  book_title?: string;
  member_name?: string;
}

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Geography', 'Literature', 'Reference', 'Magazine', 'Other'];

export function LibraryModule() {
  const { institutionId, user } = useAuth();
  const { toast } = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [members, setMembers] = useState<any[]>([]);

  const [bookForm, setBookForm] = useState({
    title: '', author: '', isbn: '', category: '', publisher: '',
    edition: '', year: '', total_copies: '1', rack_no: '',
  });

  const [issueForm, setIssueForm] = useState({
    book_id: '', user_id: '', due_date: '',
  });

  useEffect(() => {
    if (institutionId) { fetchBooks(); fetchIssues(); fetchMembers(); }
  }, [institutionId]);

  const fetchBooks = async () => {
    setLoading(true);
    let q = (supabase as any).from('library_books')
      .select('*').eq('institution_id', institutionId!).order('title');
    if (search) q = q.ilike('title', `%${search}%`);
    if (filterCategory !== 'all') q = q.eq('category', filterCategory);
    const { data } = await q;
    setBooks(data || []);
    setLoading(false);
  };

  const fetchIssues = async () => {
    const { data } = await (supabase as any).from('library_issues')
      .select('*').eq('institution_id', institutionId!)
      .order('issued_date', { ascending: false }).limit(50);
    setIssues(data || []);
  };

  const fetchMembers = async () => {
    const [studRes, staffRes] = await Promise.all([
      (supabase as any).from('students').select('id, full_name, admission_no')
        .eq('institution_id', institutionId!).eq('status', 'active'),
      (supabase as any).from('staff').select('id, full_name, employee_id')
        .eq('institution_id', institutionId!).eq('status', 'active'),
    ]);
    const students = (studRes.data || []).map((s: any) => ({ id: s.id, name: `${s.full_name} (${s.admission_no}) - Student` }));
    const staff = (staffRes.data || []).map((s: any) => ({ id: s.id, name: `${s.full_name} (${s.employee_id}) - Staff` }));
    setMembers([...students, ...staff]);
  };

  useEffect(() => { if (institutionId) fetchBooks(); }, [search, filterCategory]);

  const openAddBook = () => {
    setEditBook(null);
    setBookForm({ title: '', author: '', isbn: '', category: '', publisher: '', edition: '', year: '', total_copies: '1', rack_no: '' });
    setShowBookDialog(true);
  };

  const openEditBook = (book: Book) => {
    setEditBook(book);
    setBookForm({
      title: book.title, author: book.author || '', isbn: book.isbn || '',
      category: book.category || '', publisher: book.publisher || '',
      edition: book.edition || '', year: book.year?.toString() || '',
      total_copies: book.total_copies?.toString() || '1', rack_no: book.rack_no || '',
    });
    setShowBookDialog(true);
  };

  const handleSaveBook = async () => {
    if (!bookForm.title.trim()) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = {
        institution_id: institutionId,
        title: bookForm.title.trim(),
        author: bookForm.author || null,
        isbn: bookForm.isbn || null,
        category: bookForm.category || null,
        publisher: bookForm.publisher || null,
        edition: bookForm.edition || null,
        year: bookForm.year ? parseInt(bookForm.year) : null,
        total_copies: parseInt(bookForm.total_copies) || 1,
        available_copies: editBook
          ? editBook.available_copies! + (parseInt(bookForm.total_copies) - (editBook.total_copies || 0))
          : parseInt(bookForm.total_copies) || 1,
        rack_no: bookForm.rack_no || null,
      };
      if (editBook) {
        await (supabase as any).from('library_books').update(payload).eq('id', editBook.id);
        toast({ title: 'Book updated!' });
      } else {
        await (supabase as any).from('library_books').insert(payload);
        toast({ title: 'Book added!' });
      }
      setShowBookDialog(false);
      fetchBooks();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Delete this book?')) return;
    await (supabase as any).from('library_books').delete().eq('id', id);
    toast({ title: 'Book deleted' });
    fetchBooks();
  };

  const handleIssueBook = async () => {
    if (!issueForm.book_id || !issueForm.user_id || !issueForm.due_date) {
      toast({ title: 'All fields required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      await (supabase as any).from('library_issues').insert({
        institution_id: institutionId,
        book_id: issueForm.book_id,
        user_id: issueForm.user_id,
        issued_date: new Date().toISOString().split('T')[0],
        due_date: issueForm.due_date,
        status: 'issued',
        issued_by: user?.id,
      });
      await (supabase as any).from('library_books')
        .update({ available_copies: (supabase as any).rpc('decrement', { x: 1 }) })
        .eq('id', issueForm.book_id);
      // Manual decrement
      const book = books.find(b => b.id === issueForm.book_id);
      if (book) {
        await (supabase as any).from('library_books')
          .update({ available_copies: Math.max(0, (book.available_copies || 1) - 1) })
          .eq('id', issueForm.book_id);
      }
      toast({ title: 'Book issued!' });
      setShowIssueDialog(false);
      setIssueForm({ book_id: '', user_id: '', due_date: '' });
      fetchBooks(); fetchIssues();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const handleReturn = async () => {
    if (!selectedIssue) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(selectedIssue.due_date);
      const returnDate = new Date(today);
      const daysLate = Math.max(0, Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      const fine = daysLate * 5; // ₹5 per day

      await (supabase as any).from('library_issues').update({
        returned_date: today,
        status: 'returned',
        fine_amount: fine,
      }).eq('id', selectedIssue.id);

      const book = books.find(b => b.id === selectedIssue.book_id);
      if (book) {
        await (supabase as any).from('library_books')
          .update({ available_copies: (book.available_copies || 0) + 1 })
          .eq('id', selectedIssue.book_id);
      }

      toast({ title: `Book returned! ${fine > 0 ? `Fine: ₹${fine}` : 'No fine.'}` });
      setShowReturnDialog(false);
      setSelectedIssue(null);
      fetchBooks(); fetchIssues();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const totalBooks = books.reduce((s, b) => s + (b.total_copies || 0), 0);
  const availableBooks = books.reduce((s, b) => s + (b.available_copies || 0), 0);
  const issuedBooks = totalBooks - availableBooks;
  const overdueIssues = issues.filter(i => i.status === 'issued' && new Date(i.due_date) < new Date());

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
          <h2 className="text-lg font-semibold">Library</h2>
          <p className="text-sm text-muted-foreground">Manage books and issue records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setIssueForm({ book_id: '', user_id: '', due_date: '' }); setShowIssueDialog(true); }}>
            <BookOpen className="w-4 h-4 mr-1" /> Issue Book
          </Button>
          <Button size="sm" onClick={openAddBook}>
            <Plus className="w-4 h-4 mr-1" /> Add Book
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Books', value: books.length, sub: `${totalBooks} copies`, color: 'text-primary' },
          { label: 'Available', value: availableBooks, color: 'text-emerald-600' },
          { label: 'Issued', value: issuedBooks, color: 'text-amber-600' },
          { label: 'Overdue', value: overdueIssues.length, color: 'text-red-500' },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="books">
        <TabsList>
          <TabsTrigger value="books">Books ({books.length})</TabsTrigger>
          <TabsTrigger value="issues">Issue Records</TabsTrigger>
          {overdueIssues.length > 0 && (
            <TabsTrigger value="overdue">
              Overdue <Badge className="ml-1 bg-red-500 text-white text-xs">{overdueIssues.length}</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* BOOKS TAB */}
        <TabsContent value="books" className="space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by title..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : books.length === 0 ? (
                <div className="py-16 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-medium">No books found</p>
                  <Button className="mt-4" size="sm" onClick={openAddBook}><Plus className="w-4 h-4 mr-1" /> Add Book</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Rack</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Available</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map(book => (
                      <TableRow key={book.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{book.title}</p>
                          {book.publisher && <p className="text-xs text-muted-foreground">{book.publisher} {book.year ? `· ${book.year}` : ''}</p>}
                        </TableCell>
                        <TableCell className="text-sm">{book.author || '—'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{book.category || '—'}</Badge></TableCell>
                        <TableCell className="text-sm font-mono">{book.isbn || '—'}</TableCell>
                        <TableCell className="text-sm">{book.rack_no || '—'}</TableCell>
                        <TableCell className="text-center text-sm">{book.total_copies || 0}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-xs ${(book.available_copies || 0) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} border-0`}>
                            {book.available_copies || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditBook(book)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleDeleteBook(book.id)}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ISSUES TAB */}
        <TabsContent value="issues">
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book ID</TableHead>
                    <TableHead>Member ID</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Fine</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No issue records</TableCell></TableRow>
                  ) : issues.map(issue => {
                    const isOverdue = issue.status === 'issued' && new Date(issue.due_date) < new Date();
                    return (
                      <TableRow key={issue.id} className={isOverdue ? 'bg-red-50/50' : ''}>
                        <TableCell className="text-xs font-mono">{issue.book_id.slice(0, 8)}...</TableCell>
                        <TableCell className="text-xs font-mono">{issue.user_id.slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm">{new Date(issue.issued_date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="text-sm">{new Date(issue.due_date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="text-sm">{issue.returned_date ? new Date(issue.returned_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                        <TableCell className="text-sm">{issue.fine_amount ? `₹${issue.fine_amount}` : '—'}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs border-0 ${
                            issue.status === 'returned' ? 'bg-emerald-100 text-emerald-700' :
                            isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {isOverdue ? 'Overdue' : issue.status || 'issued'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {issue.status === 'issued' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => { setSelectedIssue(issue); setShowReturnDialog(true); }}>
                              Return
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OVERDUE TAB */}
        <TabsContent value="overdue">
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book ID</TableHead>
                    <TableHead>Member ID</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Late</TableHead>
                    <TableHead>Fine (₹5/day)</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueIssues.map(issue => {
                    const daysLate = Math.ceil((new Date().getTime() - new Date(issue.due_date).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <TableRow key={issue.id} className="bg-red-50/50">
                        <TableCell className="text-xs font-mono">{issue.book_id.slice(0, 8)}...</TableCell>
                        <TableCell className="text-xs font-mono">{issue.user_id.slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm">{new Date(issue.due_date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="text-sm font-bold text-red-500">{daysLate} days</TableCell>
                        <TableCell className="text-sm font-bold text-red-500">₹{daysLate * 5}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => { setSelectedIssue(issue); setShowReturnDialog(true); }}>
                            Return
                          </Button>
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

      {/* Add/Edit Book Dialog */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editBook ? 'Edit Book' : 'Add New Book'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Title *</Label>
              <Input value={bookForm.title} onChange={e => setBookForm(f => ({ ...f, title: e.target.value }))} placeholder="Book title" />
            </div>
            <div className="space-y-1.5">
              <Label>Author</Label>
              <Input value={bookForm.author} onChange={e => setBookForm(f => ({ ...f, author: e.target.value }))} placeholder="Author name" />
            </div>
            <div className="space-y-1.5">
              <Label>ISBN</Label>
              <Input value={bookForm.isbn} onChange={e => setBookForm(f => ({ ...f, isbn: e.target.value }))} placeholder="ISBN number" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={bookForm.category} onValueChange={v => setBookForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Publisher</Label>
              <Input value={bookForm.publisher} onChange={e => setBookForm(f => ({ ...f, publisher: e.target.value }))} placeholder="Publisher" />
            </div>
            <div className="space-y-1.5">
              <Label>Edition</Label>
              <Input value={bookForm.edition} onChange={e => setBookForm(f => ({ ...f, edition: e.target.value }))} placeholder="e.g. 3rd" />
            </div>
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input type="number" value={bookForm.year} onChange={e => setBookForm(f => ({ ...f, year: e.target.value }))} placeholder="2024" />
            </div>
            <div className="space-y-1.5">
              <Label>Total Copies</Label>
              <Input type="number" min="1" value={bookForm.total_copies} onChange={e => setBookForm(f => ({ ...f, total_copies: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Rack No.</Label>
              <Input value={bookForm.rack_no} onChange={e => setBookForm(f => ({ ...f, rack_no: e.target.value }))} placeholder="e.g. A-12" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveBook} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editBook ? 'Save Changes' : 'Add Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Book Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Book</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Select Book *</Label>
              <Select value={issueForm.book_id} onValueChange={v => setIssueForm(f => ({ ...f, book_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose book" /></SelectTrigger>
                <SelectContent>
                  {books.filter(b => (b.available_copies || 0) > 0).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Issue To (Student/Staff) *</Label>
              <Select value={issueForm.user_id} onValueChange={v => setIssueForm(f => ({ ...f, user_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date *</Label>
              <Input type="date" value={issueForm.due_date}
                onChange={e => setIssueForm(f => ({ ...f, due_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIssueDialog(false)}>Cancel</Button>
            <Button onClick={handleIssueBook} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Issue Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Return Book</DialogTitle></DialogHeader>
          {selectedIssue && (
            <div className="space-y-3 py-2">
              <p className="text-sm">Issued: <strong>{new Date(selectedIssue.issued_date).toLocaleDateString('en-IN')}</strong></p>
              <p className="text-sm">Due: <strong>{new Date(selectedIssue.due_date).toLocaleDateString('en-IN')}</strong></p>
              {new Date(selectedIssue.due_date) < new Date() && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 font-medium">
                    Overdue! Fine: ₹{Math.ceil((new Date().getTime() - new Date(selectedIssue.due_date).getTime()) / (1000 * 60 * 60 * 24)) * 5}
                  </p>
                  <p className="text-xs text-red-500">(₹5 per day late)</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
            <Button onClick={handleReturn} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
