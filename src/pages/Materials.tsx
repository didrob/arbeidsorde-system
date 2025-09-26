import { useState } from 'react';
import { useMaterials } from '@/hooks/useApi';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { Search, Package, Edit, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MaterialForm {
  name: string;
  unit: string;
  price?: number;
}

export default function Materials() {
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { data: materials, isLoading } = useMaterials();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaterialForm>();

  const filteredMaterials = materials?.filter((material: any) => 
    material.name.toLowerCase().includes(search.toLowerCase()) ||
    material.unit.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: MaterialForm) => {
    // This would need to be implemented in the API layer
    toast({ title: 'Material opprettet', description: 'Nytt material er lagt til' });
    setIsCreateDialogOpen(false);
    reset();
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Ikke satt';
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK'
    }).format(price);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <TopBar 
        title="Materialer" 
      />
      
      <div className="flex-1 p-8">
        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Søk etter materialer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Materials Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMaterials?.map((material: any) => (
              <Card key={material.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{material.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Enhet:</span>
                      <Badge variant="secondary">{material.unit}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Pris:</span>
                      <span className="text-sm font-semibold text-primary">
                        {formatPrice(material.price)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Opprettet: {new Date(material.created_at).toLocaleDateString('nb-NO')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Material Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Legg til nytt material</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  placeholder="Materialnavn *"
                  {...register('name', { required: 'Materialnavn er påkrevd' })}
                />
                {errors.name && (
                  <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <Input
                  placeholder="Enhet (stk, meter, kg, etc.) *"
                  {...register('unit', { required: 'Enhet er påkrevd' })}
                />
                {errors.unit && (
                  <p className="text-destructive text-sm mt-1">{errors.unit.message}</p>
                )}
              </div>

              <div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Pris per enhet (NOK)"
                  {...register('price', { valueAsNumber: true })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Opprett
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
      </div>
    </div>
  );
}