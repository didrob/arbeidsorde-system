import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Material {
  id: string;
  name: string;
  unit: string;
  price: number;
}

interface UsedMaterial {
  id: string;
  material_id: string;
  material: Material;
  quantity: number;
  unit_price: number;
  notes: string;
}

interface MaterialTrackerProps {
  workOrderId: string;
}

export function MaterialTracker({ workOrderId }: MaterialTrackerProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [usedMaterials, setUsedMaterials] = useState<UsedMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterials();
    fetchUsedMaterials();
  }, [workOrderId]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchUsedMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('work_order_materials')
        .select(`
          *,
          material:materials(*)
        `)
        .eq('work_order_id', workOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsedMaterials(data || []);
    } catch (error) {
      console.error('Error fetching used materials:', error);
    }
  };

  const addMaterial = async () => {
    if (!selectedMaterial || !quantity || !user) return;

    try {
      const material = materials.find(m => m.id === selectedMaterial);
      if (!material) return;

      const { error } = await supabase
        .from('work_order_materials')
        .insert({
          work_order_id: workOrderId,
          material_id: selectedMaterial,
          quantity: parseFloat(quantity),
          unit_price: material.price,
          notes: notes,
          added_by: user.id
        });

      if (error) throw error;

      setSelectedMaterial('');
      setQuantity('');
      setNotes('');
      setShowAddForm(false);
      
      await fetchUsedMaterials();
      
      toast({
        title: "Materiale lagt til",
        description: `${quantity} ${material.unit} ${material.name} er registrert.`,
      });
    } catch (error) {
      console.error('Error adding material:', error);
      toast({
        variant: "destructive",
        title: "Feil ved registrering",
        description: "Kunne ikke legge til materiale.",
      });
    }
  };

  const removeMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('work_order_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      await fetchUsedMaterials();
      
      toast({
        title: "Materiale fjernet",
        description: "Materialet er fjernet fra arbeidsordren.",
      });
    } catch (error) {
      console.error('Error removing material:', error);
      toast({
        variant: "destructive",
        title: "Feil ved fjerning",
        description: "Kunne ikke fjerne materiale.",
      });
    }
  };

  const totalCost = usedMaterials.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Materialer
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Legg til
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger>
                <SelectValue placeholder="Velg materiale" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name} ({material.unit}) - kr {material.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              placeholder="Antall"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="0.1"
            />
            
            <Input
              placeholder="Notater (valgfritt)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            
            <div className="flex gap-2">
              <Button
                onClick={addMaterial}
                disabled={!selectedMaterial || !quantity}
                size="sm"
                className="flex-1"
              >
                Registrer
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                size="sm"
              >
                Avbryt
              </Button>
            </div>
          </div>
        )}

        {usedMaterials.length > 0 ? (
          <div className="space-y-2">
            {usedMaterials.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.material.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} {item.material.unit} × kr {item.unit_price} = kr {(item.quantity * item.unit_price).toFixed(2)}
                  </div>
                  {item.notes && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.notes}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMaterial(item.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {totalCost > 0 && (
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Totalt:</span>
                  <Badge variant="secondary" className="text-lg">
                    kr {totalCost.toFixed(2)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Ingen materialer registrert ennå
          </p>
        )}
      </CardContent>
    </Card>
  );
}