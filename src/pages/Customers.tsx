import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers, useCreateCustomer, useUpdateCustomer } from '@/hooks/useApi';
import { useSiteFilter } from '@/hooks/useSiteFilter';
import { useAuth } from '@/hooks/useAuth';
import { SiteSelector } from '@/components/site/SiteSelector';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { Search, Mail, Phone, MapPin, Edit, CheckCircle, XCircle, Building2, Loader2, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBrregLookup } from '@/features/customers/useBrregLookup';
import { supabase } from '@/integrations/supabase/client';

interface CustomerForm {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  org_number?: string;
  invoice_email?: string;
}

export default function Customers() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { selectedSiteId, setSelectedSiteId } = useSiteFilter();
  const { user } = useAuth();

  const { data: customers, isLoading, refetch } = useCustomers(selectedSiteId);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue: setFormValue, formState: { errors } } = useForm<CustomerForm>();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue, formState: { errors: editErrors } } = useForm<CustomerForm>();

  // BRREG lookup for create dialog
  const { lookup: brregLookup, isLoading: brregLoading, result: brregResult, reset: resetBrreg } = useBrregLookup();
  const [createOrgInput, setCreateOrgInput] = useState('');

  useEffect(() => {
    const clean = createOrgInput.replace(/\s/g, '');
    if (clean.length !== 9 || !/^\d{9}$/.test(clean)) return;
    const timer = setTimeout(() => brregLookup(clean), 500);
    return () => clearTimeout(timer);
  }, [createOrgInput, brregLookup]);

  useEffect(() => {
    if (brregResult) {
      setFormValue('name', brregResult.name);
      setFormValue('address', brregResult.address);
      setFormValue('org_number', brregResult.org_number);
    }
  }, [brregResult, setFormValue]);

  const filterByStatus = (list: any[], status?: string) => {
    if (!list) return [];
    let filtered = list;
    if (status && status !== 'all') {
      filtered = filtered.filter((c: any) => c.registration_status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((c: any) =>
        c.name?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        c.contact_person?.toLowerCase().includes(s) ||
        c.org_number?.includes(s)
      );
    }
    return filtered;
  };

  const pendingCount = customers?.filter((c: any) => c.registration_status === 'pending_approval').length || 0;

  const onSubmit = async (formData: CustomerForm) => {
    try {
      await createCustomer.mutateAsync({
        ...formData,
        registration_status: 'approved',
        registered_by: 'admin',
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        org_form: brregResult?.org_form || null,
        industry_code: brregResult?.industry_code || null,
      });
      toast({ title: 'Kunde opprettet', description: 'Ny kunde er lagt til' });
      setIsCreateDialogOpen(false);
      reset();
      resetBrreg();
      setCreateOrgInput('');
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

  const onEditSubmit = async (formData: CustomerForm) => {
    try {
      await updateCustomer.mutateAsync({ id: selectedCustomer.id, data: formData });
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      resetEdit();
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };

  const handleEditClick = (customer: any) => {
    setSelectedCustomer(customer);
    setValue('name', customer.name || '');
    setValue('contact_person', customer.contact_person || '');
    setValue('email', customer.email || '');
    setValue('phone', customer.phone || '');
    setValue('address', customer.address || '');
    setValue('org_number', customer.org_number || '');
    setValue('invoice_email', customer.invoice_email || '');
    setIsEditDialogOpen(true);
  };

  const handleApprove = async (customer: any) => {
    setActionLoading(customer.id);
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        data: {
          registration_status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        },
      });

      // Log welcome email (not sending yet)
      await supabase.from('email_log').insert({
        email_type: 'customer_approved',
        recipient_email: customer.email || '',
        recipient_name: customer.contact_person || customer.name,
        subject: `Velkommen som ASCO-kunde, ${customer.name}`,
        status: 'queued',
      } as any);

      toast({ title: 'Kunde godkjent', description: `${customer.name} er nå godkjent.` });
    } catch {
      toast({ title: 'Feil', description: 'Kunne ikke godkjenne kunden.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedCustomer) return;
    setActionLoading(selectedCustomer.id);
    try {
      await updateCustomer.mutateAsync({
        id: selectedCustomer.id,
        data: {
          registration_status: 'rejected',
          rejection_reason: rejectionReason,
        },
      });

      await supabase.from('email_log').insert({
        email_type: 'customer_rejected',
        recipient_email: selectedCustomer.email || '',
        recipient_name: selectedCustomer.contact_person || selectedCustomer.name,
        subject: `Registrering avvist — ${selectedCustomer.name}`,
        status: 'queued',
        metadata: { rejection_reason: rejectionReason },
      } as any);

      toast({ title: 'Kunde avvist', description: `${selectedCustomer.name} er avvist.` });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedCustomer(null);
    } catch {
      toast({ title: 'Feil', description: 'Kunne ikke avvise kunden.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const renderCustomerCard = (customer: any, showActions = false) => (
    <Card key={customer.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{customer.name}</CardTitle>
            {customer.org_number && (
              <p className="text-xs text-muted-foreground mt-1">Org.nr: {customer.org_number}</p>
            )}
          </div>
          {!showActions && (
            <Button variant="ghost" size="sm" onClick={() => handleEditClick(customer)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {customer.contact_person && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Kontaktperson:</span>
              <span className="text-muted-foreground">{customer.contact_person}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{customer.phone}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">{customer.address}</span>
            </div>
          )}
        </div>

        {showActions ? (
          <div className="mt-4 pt-4 border-t flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handleApprove(customer)}
              disabled={actionLoading === customer.id}
            >
              {actionLoading === customer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Godkjenn
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => { setSelectedCustomer(customer); setIsRejectDialogOpen(true); }}
              disabled={actionLoading === customer.id}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Avslå
            </Button>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              Opprettet: {new Date(customer.created_at).toLocaleDateString('nb-NO')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <TopBar
        title="Kunder"
        onCreateClick={() => setIsCreateDialogOpen(true)}
        createLabel="Ny kunde"
        actions={
          <SiteSelector selectedSiteId={selectedSiteId} onSiteChange={setSelectedSiteId} />
        }
      />

      <div className="flex-1 p-8">
        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Søk etter kunder..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="approved">Godkjente</TabsTrigger>
            <TabsTrigger value="pending_approval" className="relative">
              Ventende
              {pendingCount > 0 && (
                <Badge variant="default" className="ml-2 h-5 min-w-[1.25rem] px-1 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">Avviste</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="all">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filterByStatus(customers || [], 'all').map((c: any) => renderCustomerCard(c))}
                </div>
              </TabsContent>
              <TabsContent value="approved">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filterByStatus(customers || [], 'approved').map((c: any) => renderCustomerCard(c))}
                </div>
              </TabsContent>
              <TabsContent value="pending_approval">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filterByStatus(customers || [], 'pending_approval').map((c: any) => renderCustomerCard(c, true))}
                </div>
                {filterByStatus(customers || [], 'pending_approval').length === 0 && (
                  <p className="text-center text-muted-foreground py-12">Ingen ventende registreringer.</p>
                )}
              </TabsContent>
              <TabsContent value="rejected">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filterByStatus(customers || [], 'rejected').map((c: any) => renderCustomerCard(c))}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Create Customer Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={v => { setIsCreateDialogOpen(v); if (!v) { reset(); resetBrreg(); setCreateOrgInput(''); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Legg til ny kunde</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Org number with BRREG lookup */}
              <div>
                <Label htmlFor="create-org">Org.nr (valgfritt)</Label>
                <div className="relative mt-1">
                  <Input
                    id="create-org"
                    placeholder="123 456 789"
                    value={createOrgInput}
                    onChange={e => { setCreateOrgInput(e.target.value); setFormValue('org_number', e.target.value.replace(/\s/g, '')); }}
                    maxLength={11}
                  />
                  {brregLoading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                {brregResult && (
                  <div className="mt-2 p-2 rounded border border-primary/20 bg-primary/5 text-xs flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span>{brregResult.name}</span>
                  </div>
                )}
              </div>

              <div>
                <Input placeholder="Firmanavn *" {...register('name', { required: 'Firmanavn er påkrevd' })} />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
              </div>
              <Input placeholder="Kontaktperson" {...register('contact_person')} />
              <Input type="email" placeholder="E-post" {...register('email')} />
              <Input placeholder="Telefon" {...register('phone')} />
              <Input placeholder="Adresse" {...register('address')} />
              <Input type="email" placeholder="Faktura-epost" {...register('invoice_email')} />

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createCustomer.isPending}>
                  {createCustomer.isPending ? 'Oppretter...' : 'Opprett'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Avbryt</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rediger kunde</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
              <div>
                <Input placeholder="Firmanavn *" {...registerEdit('name', { required: 'Firmanavn er påkrevd' })} />
                {editErrors.name && <p className="text-destructive text-sm mt-1">{editErrors.name.message}</p>}
              </div>
              <Input placeholder="Org.nr" {...registerEdit('org_number')} />
              <Input placeholder="Kontaktperson" {...registerEdit('contact_person')} />
              <Input type="email" placeholder="E-post" {...registerEdit('email')} />
              <Input placeholder="Telefon" {...registerEdit('phone')} />
              <Input placeholder="Adresse" {...registerEdit('address')} />
              <Input type="email" placeholder="Faktura-epost" {...registerEdit('invoice_email')} />

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={updateCustomer.isPending}>
                  {updateCustomer.isPending ? 'Oppdaterer...' : 'Oppdater'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedCustomer(null); resetEdit(); }}>Avbryt</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={v => { setIsRejectDialogOpen(v); if (!v) { setRejectionReason(''); setSelectedCustomer(null); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Avslå registrering</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Du er i ferd med å avslå registreringen for <span className="font-medium text-foreground">{selectedCustomer?.name}</span>.
              </p>
              <div className="space-y-2">
                <Label>Begrunnelse</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Skriv en begrunnelse for avslaget..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Avbryt</Button>
                <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim() || actionLoading === selectedCustomer?.id}>
                  {actionLoading === selectedCustomer?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Avslå
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
