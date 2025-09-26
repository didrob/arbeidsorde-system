import React, { useState } from 'react';
import { Plus, Users, Wrench, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePersonnel, useEquipment, useCreatePersonnel, useCreateEquipment, useUpdatePersonnel, useUpdateEquipment, useDeletePersonnel, useDeleteEquipment } from '@/hooks/useResources';
import { useForm } from 'react-hook-form';
import { Personnel, Equipment, EquipmentPricingType } from '@/types';
import { TopBar } from '@/components/TopBar';
import { LoadingState } from '@/components/common/LoadingState';

interface PersonnelForm {
  name: string;
  email?: string;
  phone?: string;
  standard_hourly_rate?: number;
  role: string;
}

interface EquipmentForm {
  name: string;
  category: string;
  pricing_type: EquipmentPricingType;
  standard_rate?: number;
  description?: string;
}

export default function Resources() {
  const [personnelDialogOpen, setPersonnelDialogOpen] = useState(false);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const { data: personnel = [], isLoading: personnelLoading } = usePersonnel();
  const { data: equipment = [], isLoading: equipmentLoading } = useEquipment();
  
  const createPersonnelMutation = useCreatePersonnel();
  const createEquipmentMutation = useCreateEquipment();
  const updatePersonnelMutation = useUpdatePersonnel();
  const updateEquipmentMutation = useUpdateEquipment();
  const deletePersonnelMutation = useDeletePersonnel();
  const deleteEquipmentMutation = useDeleteEquipment();

  const personnelForm = useForm<PersonnelForm>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'worker',
    },
  });

  const equipmentForm = useForm<EquipmentForm>({
    defaultValues: {
      name: '',
      category: 'tool',
      pricing_type: 'hourly',
      description: '',
    },
  });

  const handlePersonnelSubmit = async (data: PersonnelForm) => {
    try {
      if (editingPersonnel) {
        await updatePersonnelMutation.mutateAsync({
          id: editingPersonnel.id,
          ...data,
          is_active: true,
        });
      } else {
        await createPersonnelMutation.mutateAsync({
          ...data,
          is_active: true,
        });
      }
      personnelForm.reset();
      setPersonnelDialogOpen(false);
      setEditingPersonnel(null);
    } catch (error) {
      console.error('Error saving personnel:', error);
    }
  };

  const handleEquipmentSubmit = async (data: EquipmentForm) => {
    try {
      if (editingEquipment) {
        await updateEquipmentMutation.mutateAsync({
          id: editingEquipment.id,
          ...data,
          is_active: true,
        });
      } else {
        await createEquipmentMutation.mutateAsync({
          ...data,
          is_active: true,
        });
      }
      equipmentForm.reset();
      setEquipmentDialogOpen(false);
      setEditingEquipment(null);
    } catch (error) {
      console.error('Error saving equipment:', error);
    }
  };

  const handleEditPersonnel = (person: Personnel) => {
    setEditingPersonnel(person);
    personnelForm.reset({
      name: person.name,
      email: person.email || '',
      phone: person.phone || '',
      standard_hourly_rate: person.standard_hourly_rate || undefined,
      role: person.role,
    });
    setPersonnelDialogOpen(true);
  };

  const handleEditEquipment = (item: Equipment) => {
    setEditingEquipment(item);
    equipmentForm.reset({
      name: item.name,
      category: item.category,
      pricing_type: item.pricing_type,
      standard_rate: item.standard_rate || undefined,
      description: item.description || '',
    });
    setEquipmentDialogOpen(true);
  };

  const handleDeletePersonnel = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this personnel?')) {
      await deletePersonnelMutation.mutateAsync(id);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this equipment?')) {
      await deleteEquipmentMutation.mutateAsync(id);
    }
  };

  const formatRate = (rate?: number, pricingType?: string) => {
    if (!rate) return 'Not set';
    const currency = `${rate.toFixed(2)} kr`;
    
    switch (pricingType) {
      case 'hourly':
        return `${currency}/time`;
      case 'daily':
        return `${currency}/dag`;
      case 'fixed':
        return currency;
      default:
        return currency;
    }
  };

  if (personnelLoading || equipmentLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar title="Ressurser" />

      <div className="container mx-auto p-6">
        <Tabs defaultValue="personnel" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personnel" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Personell
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Utstyr
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personnel" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Personell</h2>
                <p className="text-muted-foreground">Administrer arbeidstakere og timepriser</p>
              </div>
              <Dialog open={personnelDialogOpen} onOpenChange={setPersonnelDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPersonnel ? 'Rediger Personell' : 'Legg til Personell'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPersonnel ? 'Oppdater personellopplysninger' : 'Legg til ny arbeidstaker med standard timepris'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={personnelForm.handleSubmit(handlePersonnelSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Navn *</Label>
                      <Input
                        id="name"
                        {...personnelForm.register('name', { required: true })}
                        placeholder="Fullt navn"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-post</Label>
                      <Input
                        id="email"
                        type="email"
                        {...personnelForm.register('email')}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        {...personnelForm.register('phone')}
                        placeholder="12345678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Rolle</Label>
                      <Select
                        value={personnelForm.watch('role')}
                        onValueChange={(value) => personnelForm.setValue('role', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="worker">Arbeider</SelectItem>
                          <SelectItem value="supervisor">Arbeidsleder</SelectItem>
                          <SelectItem value="specialist">Spesialist</SelectItem>
                          <SelectItem value="manager">Leder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="standard_hourly_rate">Standard Timepris (kr)</Label>
                      <Input
                        id="standard_hourly_rate"
                        type="number"
                        step="0.01"
                        {...personnelForm.register('standard_hourly_rate', { valueAsNumber: true })}
                        placeholder="500.00"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPersonnelDialogOpen(false);
                          setEditingPersonnel(null);
                        }}
                      >
                        Avbryt
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createPersonnelMutation.isPending || updatePersonnelMutation.isPending}
                      >
                        {editingPersonnel ? 'Oppdater' : 'Legg til'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {personnel.map((person) => (
                <Card key={person.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{person.name}</CardTitle>
                        <CardDescription>
                          <Badge variant="secondary">{person.role}</Badge>
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditPersonnel(person)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePersonnel(person.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {person.email && (
                        <p className="text-muted-foreground">{person.email}</p>
                      )}
                      {person.phone && (
                        <p className="text-muted-foreground">{person.phone}</p>
                      )}
                      <div className="pt-2 border-t">
                        <p className="font-medium">
                          Timepris: {formatRate(person.standard_hourly_rate, 'hourly')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Utstyr</h2>
                <p className="text-muted-foreground">Administrer utstyr og priser</p>
              </div>
              <Dialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEquipment ? 'Rediger Utstyr' : 'Legg til Utstyr'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingEquipment ? 'Oppdater utstyrsopplysninger' : 'Legg til nytt utstyr med priser'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={equipmentForm.handleSubmit(handleEquipmentSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Navn *</Label>
                      <Input
                        id="name"
                        {...equipmentForm.register('name', { required: true })}
                        placeholder="Navn på utstyr"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Kategori *</Label>
                      <Select
                        value={equipmentForm.watch('category')}
                        onValueChange={(value) => equipmentForm.setValue('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vehicle">Kjøretøy</SelectItem>
                          <SelectItem value="tool">Verktøy</SelectItem>
                          <SelectItem value="machinery">Maskineri</SelectItem>
                          <SelectItem value="lifting">Løfteutstyr</SelectItem>
                          <SelectItem value="safety">Sikkerhetsutstyr</SelectItem>
                          <SelectItem value="other">Annet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="pricing_type">Pristype *</Label>
                      <Select
                        value={equipmentForm.watch('pricing_type')}
                        onValueChange={(value: EquipmentPricingType) => equipmentForm.setValue('pricing_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Per time</SelectItem>
                          <SelectItem value="daily">Per dag</SelectItem>
                          <SelectItem value="fixed">Fastpris</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="standard_rate">Standard Pris (kr)</Label>
                      <Input
                        id="standard_rate"
                        type="number"
                        step="0.01"
                        {...equipmentForm.register('standard_rate', { valueAsNumber: true })}
                        placeholder="1000.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Beskrivelse</Label>
                      <Textarea
                        id="description"
                        {...equipmentForm.register('description')}
                        placeholder="Beskrivelse av utstyret..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEquipmentDialogOpen(false);
                          setEditingEquipment(null);
                        }}
                      >
                        Avbryt
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}
                      >
                        {editingEquipment ? 'Oppdater' : 'Legg til'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {equipment.map((item) => (
                <Card key={item.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription>
                          <Badge variant="secondary">{item.category}</Badge>
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditEquipment(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteEquipment(item.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {item.description && (
                        <p className="text-muted-foreground">{item.description}</p>
                      )}
                      <div className="pt-2 border-t">
                        <p className="font-medium">
                          Pris: {formatRate(item.standard_rate, item.pricing_type)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}