import { useState } from 'react';
import { useCustomers, useCreateCustomer, useUpdateCustomer } from '@/hooks/useApi';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Search, Mail, Phone, MapPin, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerForm {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
}

export default function Customers() {
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerForm>();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue, formState: { errors: editErrors } } = useForm<CustomerForm>();

  const filteredCustomers = customers?.filter((customer: any) => 
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email?.toLowerCase().includes(search.toLowerCase()) ||
    customer.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: CustomerForm) => {
    try {
      await createCustomer.mutateAsync(data);
      toast({ title: 'Kunde opprettet', description: 'Ny kunde er lagt til' });
      setIsCreateDialogOpen(false);
      reset();
    } catch (error) {
      // Error handling is done in the hook's onError callback
      console.error('Failed to create customer:', error);
    }
  };

  const onEditSubmit = async (data: CustomerForm) => {
    try {
      await updateCustomer.mutateAsync({ id: selectedCustomer.id, data });
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
    setIsEditDialogOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <TopBar 
        title="Kunder" 
        onCreateClick={() => setIsCreateDialogOpen(true)}
      />
      
      <div className="flex-1 p-8">
        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Søk etter kunder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customers Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers?.map((customer: any) => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(customer)}>
                      <Edit className="h-4 w-4" />
                    </Button>
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
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Opprettet: {new Date(customer.created_at).toLocaleDateString('nb-NO')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Customer Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Legg til ny kunde</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  placeholder="Firmanavn *"
                  {...register('name', { required: 'Firmanavn er påkrevd' })}
                />
                {errors.name && (
                  <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <Input
                  placeholder="Kontaktperson"
                  {...register('contact_person')}
                />
              </div>

              <div>
                <Input
                  type="email"
                  placeholder="E-post"
                  {...register('email')}
                />
              </div>

              <div>
                <Input
                  placeholder="Telefon"
                  {...register('phone')}
                />
              </div>

              <div>
                <Input
                  placeholder="Adresse"
                  {...register('address')}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createCustomer.isPending}>
                  {createCustomer.isPending ? 'Oppretter...' : 'Opprett'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Avbryt
                </Button>
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
                <Input
                  placeholder="Firmanavn *"
                  {...registerEdit('name', { required: 'Firmanavn er påkrevd' })}
                />
                {editErrors.name && (
                  <p className="text-destructive text-sm mt-1">{editErrors.name.message}</p>
                )}
              </div>
              
              <div>
                <Input
                  placeholder="Kontaktperson"
                  {...registerEdit('contact_person')}
                />
              </div>

              <div>
                <Input
                  type="email"
                  placeholder="E-post"
                  {...registerEdit('email')}
                />
              </div>

              <div>
                <Input
                  placeholder="Telefon"
                  {...registerEdit('phone')}
                />
              </div>

              <div>
                <Input
                  placeholder="Adresse"
                  {...registerEdit('address')}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={updateCustomer.isPending}>
                  {updateCustomer.isPending ? 'Oppdaterer...' : 'Oppdater'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedCustomer(null);
                    resetEdit();
                  }}
                >
                  Avbryt
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}