import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  useCustomerDetail,
  useCustomerOrders,
  useCustomerEconomy,
  useCustomerNotes,
  useCustomerAttachments,
  useCustomerAgreements,
} from '@/hooks/useCustomerDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useUpdateCustomer } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ArrowLeft, Edit, Building2, Mail, Phone, MapPin, FileText,
  ClipboardList, TrendingUp, Handshake, MessageSquare, Paperclip,
  Plus, Trash2, Download, Upload, Calendar, User,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  approved: { label: 'Godkjent', variant: 'default' },
  pending_approval: { label: 'Ventende', variant: 'secondary' },
  rejected: { label: 'Avvist', variant: 'destructive' },
};

const orderStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Ventende', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'Pågår', className: 'bg-[hsl(var(--status-active))]/10 text-[hsl(var(--status-active))]' },
  completed: { label: 'Fullført', className: 'bg-[hsl(var(--status-complete))]/10 text-[hsl(var(--status-complete))]' },
  cancelled: { label: 'Kansellert', className: 'bg-destructive/10 text-destructive' },
};

const pricingTypeLabels: Record<string, string> = {
  hourly: 'Timebasert',
  fixed: 'Fastpris',
  material_only: 'Kun materiell',
  unknown: 'Ukjent',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(amount);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: customer, isLoading } = useCustomerDetail(id!);
  const { data: orders } = useCustomerOrders(id!);
  const { data: economy } = useCustomerEconomy(id!);
  const { data: notes, addNote, deleteNote, updateNote } = useCustomerNotes(id!);
  const { data: attachments, uploadAttachment, deleteAttachment, getDownloadUrl } = useCustomerAttachments(id!);
  const { data: agreements } = useCustomerAgreements(id!);
  const updateCustomer = useUpdateCustomer();

  const [activeTab, setActiveTab] = useState('overview');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { register, handleSubmit, reset, setValue } = useForm();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Kunde ikke funnet</p>
          <Button variant="outline" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Tilbake
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[customer.registration_status] || statusConfig.approved;
  // Exclude internal orders from customer stats
  const externalOrders = orders?.filter(o => !o.is_internal);
  const activeOrders = externalOrders?.filter(o => o.status === 'in_progress').length || 0;
  const totalOrders = externalOrders?.length || 0;
  const totalRevenue = economy?.totalRevenue || 0;

  const filteredOrders = orderStatusFilter === 'all'
    ? orders || []
    : (orders || []).filter(o => o.status === orderStatusFilter);

  const handleEditOpen = () => {
    setValue('name', customer.name);
    setValue('contact_person', customer.contact_person || '');
    setValue('email', customer.email || '');
    setValue('phone', customer.phone || '');
    setValue('address', customer.address || '');
    setValue('org_number', customer.org_number || '');
    setValue('invoice_email', customer.invoice_email || '');
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (formData: any) => {
    try {
      await updateCustomer.mutateAsync({ id: customer.id, data: formData });
      toast({ title: 'Kunde oppdatert' });
      setIsEditDialogOpen(false);
    } catch {
      toast({ title: 'Feil', description: 'Kunne ikke oppdatere kunden.', variant: 'destructive' });
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await addNote.mutateAsync(newNote.trim());
    setNewNote('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadAttachment.mutateAsync(file);
    }
    toast({ title: 'Fil(er) lastet opp' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const url = await getDownloadUrl(filePath);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    }
  };

  // Monthly chart data
  const chartData = Object.entries(economy?.monthlyRevenue || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, value]) => {
      const [year, month] = key.split('-');
      return { name: `${month}/${year.slice(2)}`, value };
    });

  const typeData = Object.entries(economy?.byType || {}).map(([type, data]) => ({
    type: pricingTypeLabels[type] || type,
    count: data.count,
    revenue: data.revenue,
    percent: economy?.totalOrders ? Math.round((data.count / economy.totalOrders) * 100) : 0,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-4 md:px-8 md:py-6">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => navigate('/customers')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake til kundeliste
        </Button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{customer.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            {customer.org_number && (
              <p className="text-sm text-muted-foreground">Org.nr: {customer.org_number}</p>
            )}
            {customer.site_name && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {customer.site_name}
              </p>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {customer.contact_person && (
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {customer.contact_person}</span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {customer.email}</span>
              )}
              {customer.phone && (
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {customer.phone}</span>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={handleEditOpen} className="self-start md:ml-4">
              <Edit className="h-4 w-4 mr-1" /> Rediger
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Card className="bg-background">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
              <p className="text-xs text-muted-foreground">Totalt ordrer</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Total omsetning</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{activeOrders}</p>
              <p className="text-xs text-muted-foreground">Aktive ordrer</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 p-4 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
            <TabsTrigger value="overview" className="gap-1"><FileText className="h-3.5 w-3.5" /> Oversikt</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1"><ClipboardList className="h-3.5 w-3.5" /> Ordrer</TabsTrigger>
            <TabsTrigger value="economy" className="gap-1"><TrendingUp className="h-3.5 w-3.5" /> Økonomi</TabsTrigger>
            <TabsTrigger value="agreements" className="gap-1"><Handshake className="h-3.5 w-3.5" /> Avtaler</TabsTrigger>
            <TabsTrigger value="notes" className="gap-1"><MessageSquare className="h-3.5 w-3.5" /> Notater</TabsTrigger>
            <TabsTrigger value="attachments" className="gap-1"><Paperclip className="h-3.5 w-3.5" /> Vedlegg</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5" /> Bedriftsinformasjon</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoRow label="Navn" value={customer.name} />
                  <InfoRow label="Org.nr" value={customer.org_number} />
                  <InfoRow label="Org.form" value={customer.org_form} />
                  <InfoRow label="Næringskode" value={customer.industry_code} />
                  <InfoRow label="Adresse" value={customer.address} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Mail className="h-5 w-5" /> Kontakt</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoRow label="Kontaktperson" value={customer.contact_person} />
                  <InfoRow label="E-post" value={customer.email} />
                  <InfoRow label="Telefon" value={customer.phone} />
                  <InfoRow label="Faktura-epost" value={customer.invoice_email} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5" /> Registrering</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoRow label="Registrert av" value={customer.registered_by === 'self' ? 'Selvregistrering' : 'Admin'} />
                  <InfoRow label="Godkjent av" value={customer.approved_by_name} />
                  <InfoRow label="Godkjent dato" value={customer.approved_at ? format(new Date(customer.approved_at), 'dd.MM.yyyy', { locale: nb }) : undefined} />
                  <InfoRow label="Opprettet" value={format(new Date(customer.created_at), 'dd.MM.yyyy', { locale: nb })} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5" /> Lokasjon</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoRow label="ASCO-site" value={customer.site_name} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ORDERS */}
          <TabsContent value="orders">
            <div className="mb-4">
              <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statuser</SelectItem>
                  <SelectItem value="pending">Ventende</SelectItem>
                  <SelectItem value="in_progress">Pågår</SelectItem>
                  <SelectItem value="completed">Fullført</SelectItem>
                  <SelectItem value="cancelled">Kansellert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Ingen ordrer funnet.</p>
            ) : isMobile ? (
              <div className="space-y-3">
                {filteredOrders.map(o => {
                  const os = orderStatusConfig[o.status] || orderStatusConfig.pending;
                  return (
                    <Card key={o.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/work-orders')}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm">{o.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${os.className}`}>{os.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{format(new Date(o.created_at), 'dd.MM.yyyy', { locale: nb })}</span>
                          {o.price_value && <span>{formatCurrency(o.price_value)}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium text-muted-foreground">Tittel</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Dato</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Pris</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(o => {
                        const os = orderStatusConfig[o.status] || orderStatusConfig.pending;
                        return (
                          <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer" onClick={() => navigate('/work-orders')}>
                            <td className="p-3 font-medium">{o.title}</td>
                            <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${os.className}`}>{os.label}</span></td>
                            <td className="p-3 text-muted-foreground">{pricingTypeLabels[o.pricing_type] || o.pricing_type}</td>
                            <td className="p-3 text-muted-foreground">{format(new Date(o.created_at), 'dd.MM.yyyy', { locale: nb })}</td>
                            <td className="p-3 text-right">{o.price_value ? formatCurrency(o.price_value) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ECONOMY */}
          <TabsContent value="economy">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(economy?.totalRevenue || 0)}</p>
                  <p className="text-xs text-muted-foreground">Total omsetning</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(economy?.uninvoiced || 0)}</p>
                  <p className="text-xs text-muted-foreground">Ventende fakturering</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{economy?.totalOrders || 0}</p>
                  <p className="text-xs text-muted-foreground">Totalt oppdrag</p>
                </CardContent>
              </Card>
            </div>

            {chartData.length > 0 && (
              <Card className="mb-6">
                <CardHeader><CardTitle className="text-lg">Omsetning per måned</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill="hsl(var(--primary))" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {typeData.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Fordeling per type</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {typeData.map(t => (
                      <div key={t.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm">{t.type}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{t.count} oppdrag</span>
                          <span>{t.percent}%</span>
                          <span className="font-medium text-foreground">{formatCurrency(t.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AGREEMENTS */}
          <TabsContent value="agreements">
            {!agreements?.length ? (
              <p className="text-center text-muted-foreground py-12">Ingen prisavtaler for denne kunden.</p>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Pristype</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Sats</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Gyldig fra</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Gyldig til</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agreements.map(a => (
                        <tr key={a.id} className="border-b last:border-0">
                          <td className="p-3">{a.agreement_type}</td>
                          <td className="p-3 text-muted-foreground">{a.pricing_type}</td>
                          <td className="p-3 text-right">{formatCurrency(a.custom_rate)}</td>
                          <td className="p-3 text-muted-foreground">{a.valid_from || '—'}</td>
                          <td className="p-3 text-muted-foreground">{a.valid_until || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate('/customer-agreements')}>
                <Plus className="h-4 w-4 mr-1" /> Administrer avtaler
              </Button>
            </div>
          </TabsContent>

          {/* NOTES */}
          <TabsContent value="notes">
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Skriv et internt notat..."
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim() || addNote.isPending} className="self-end">
                    <Plus className="h-4 w-4 mr-1" /> Legg til
                  </Button>
                </div>
              </CardContent>
            </Card>
            {!notes?.length ? (
              <p className="text-center text-muted-foreground py-8">Ingen notater ennå.</p>
            ) : (
              <div className="space-y-3">
                {notes.map(note => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                          {getInitials(note.author_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{note.author_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.created_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
                            </span>
                          </div>
                          {editingNoteId === note.id ? (
                            <div className="space-y-2">
                              <Textarea value={editingNoteContent} onChange={e => setEditingNoteContent(e.target.value)} rows={2} />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={async () => {
                                  await updateNote.mutateAsync({ noteId: note.id, content: editingNoteContent });
                                  setEditingNoteId(null);
                                }}>Lagre</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>Avbryt</Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                          )}
                        </div>
                        {note.user_id === user?.id && editingNoteId !== note.id && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingNoteContent(note.content);
                            }}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteNote.mutateAsync(note.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ATTACHMENTS */}
          <TabsContent value="attachments">
            <Card className="mb-4">
              <CardContent className="p-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadAttachment.isPending}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadAttachment.isPending ? 'Laster opp...' : 'Last opp fil(er)'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Kontrakter, SLA-dokumenter, avtaler osv.</p>
              </CardContent>
            </Card>
            {!attachments?.length ? (
              <p className="text-center text-muted-foreground py-8">Ingen vedlegg ennå.</p>
            ) : (
              <div className="space-y-2">
                {attachments.map(att => (
                  <Card key={att.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{att.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {att.file_size ? formatFileSize(att.file_size) : ''} · {att.uploader_name} · {format(new Date(att.created_at), 'dd.MM.yyyy', { locale: nb })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(att.file_url, att.file_name)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAttachment.mutateAsync({ id: att.id, fileUrl: att.file_url })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Rediger kunde</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <div><Label>Firmanavn</Label><Input {...register('name', { required: true })} /></div>
            <div><Label>Org.nr</Label><Input {...register('org_number')} /></div>
            <div><Label>Kontaktperson</Label><Input {...register('contact_person')} /></div>
            <div><Label>E-post</Label><Input type="email" {...register('email')} /></div>
            <div><Label>Telefon</Label><Input {...register('phone')} /></div>
            <div><Label>Adresse</Label><Input {...register('address')} /></div>
            <div><Label>Faktura-epost</Label><Input type="email" {...register('invoice_email')} /></div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={updateCustomer.isPending}>{updateCustomer.isPending ? 'Oppdaterer...' : 'Oppdater'}</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Avbryt</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || '—'}</span>
    </div>
  );
}
