import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWizard } from '../WizardContext';
import { usePersonnel, useEquipment } from '@/hooks/useResources';
import { useMaterials } from '@/hooks/useApi';
import { Users, Wrench, Package, Plus, X } from 'lucide-react';

export function ResourcesStep() {
  const { formData, dispatch, getTotalEstimatedCost } = useWizard();
  const { data: personnelList } = usePersonnel();
  const { data: equipmentList } = useEquipment();
  const { data: materialsList } = useMaterials();

  const [selectedPersonnel, setSelectedPersonnel] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');

  const addPersonnel = () => {
    if (!selectedPersonnel) return;
    
    const person = personnelList?.find(p => p.id === selectedPersonnel);
    if (!person) return;

    const newPersonnel = {
      id: person.id,
      estimated_hours: 8, // Default 8 hours
      hourly_rate: person.standard_hourly_rate || 0,
    };

    dispatch({
      type: 'UPDATE_DATA',
      payload: {
        personnel: [...formData.personnel, newPersonnel]
      }
    });
    setSelectedPersonnel('');
  };

  const updatePersonnel = (index: number, field: string, value: number) => {
    const updatedPersonnel = [...formData.personnel];
    updatedPersonnel[index] = { ...updatedPersonnel[index], [field]: value };
    
    dispatch({
      type: 'UPDATE_DATA',
      payload: { personnel: updatedPersonnel }
    });
  };

  const removePersonnel = (index: number) => {
    const updatedPersonnel = formData.personnel.filter((_, i) => i !== index);
    dispatch({
      type: 'UPDATE_DATA',
      payload: { personnel: updatedPersonnel }
    });
  };

  const addEquipment = () => {
    if (!selectedEquipment) return;
    
    const equipment = equipmentList?.find(e => e.id === selectedEquipment);
    if (!equipment) return;

    const newEquipment = {
      id: equipment.id,
      estimated_quantity: 1,
      rate: equipment.standard_rate || 0,
      pricing_type: equipment.pricing_type as 'hourly' | 'daily' | 'fixed',
    };

    dispatch({
      type: 'UPDATE_DATA',
      payload: {
        equipment: [...formData.equipment, newEquipment]
      }
    });
    setSelectedEquipment('');
  };

  const updateEquipment = (index: number, field: string, value: any) => {
    const updatedEquipment = [...formData.equipment];
    updatedEquipment[index] = { ...updatedEquipment[index], [field]: value };
    
    dispatch({
      type: 'UPDATE_DATA',
      payload: { equipment: updatedEquipment }
    });
  };

  const removeEquipment = (index: number) => {
    const updatedEquipment = formData.equipment.filter((_, i) => i !== index);
    dispatch({
      type: 'UPDATE_DATA',
      payload: { equipment: updatedEquipment }
    });
  };

  const addMaterial = () => {
    if (!selectedMaterial) return;
    
    const material = materialsList?.find(m => m.id === selectedMaterial);
    if (!material) return;

    const newMaterial = {
      id: material.id,
      quantity: 1,
      unit_price: material.price || 0,
    };

    dispatch({
      type: 'UPDATE_DATA',
      payload: {
        materials: [...formData.materials, newMaterial]
      }
    });
    setSelectedMaterial('');
  };

  const updateMaterial = (index: number, field: string, value: number) => {
    const updatedMaterials = [...formData.materials];
    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
    
    dispatch({
      type: 'UPDATE_DATA',
      payload: { materials: updatedMaterials }
    });
  };

  const removeMaterial = (index: number) => {
    const updatedMaterials = formData.materials.filter((_, i) => i !== index);
    dispatch({
      type: 'UPDATE_DATA',
      payload: { materials: updatedMaterials }
    });
  };

  React.useEffect(() => {
    // Mark step as completed (optional step)
    dispatch({ type: 'MARK_STEP_COMPLETE', payload: 3 });
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Ressurser</h3>
          <p className="text-sm text-muted-foreground">
            Legg til personell, utstyr og materialer som skal brukes
          </p>
        </div>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {getTotalEstimatedCost().toLocaleString('no-NO')} kr
            </div>
            <div className="text-sm text-muted-foreground">Estimert totalkostnad</div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="personnel" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personnel" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Personell</span>
            {formData.personnel.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {formData.personnel.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center space-x-2">
            <Wrench className="w-4 h-4" />
            <span>Utstyr</span>
            {formData.equipment.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {formData.equipment.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Materialer</span>
            {formData.materials.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {formData.materials.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legg til personell</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Select value={selectedPersonnel} onValueChange={setSelectedPersonnel}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Velg person" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {personnelList?.filter(p => !formData.personnel.find(fp => fp.id === p.id))
                      .map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name} - {person.standard_hourly_rate || 0} kr/t
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={addPersonnel} disabled={!selectedPersonnel}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {formData.personnel.map((person, index) => {
              const personnelData = personnelList?.find(p => p.id === person.id);
              return (
                <Card key={`${person.id}-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{personnelData?.name}</h4>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label className="text-xs">Timer</Label>
                            <Input
                              type="number"
                              value={person.estimated_hours}
                              onChange={(e) => updatePersonnel(index, 'estimated_hours', Number(e.target.value))}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Kr/time</Label>
                            <Input
                              type="number"
                              value={person.hourly_rate}
                              onChange={(e) => updatePersonnel(index, 'hourly_rate', Number(e.target.value))}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="font-medium">
                          {(person.estimated_hours * person.hourly_rate).toLocaleString('no-NO')} kr
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePersonnel(index)}
                          className="text-destructive hover:text-destructive mt-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legg til utstyr</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Velg utstyr" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {equipmentList?.filter(e => !formData.equipment.find(fe => fe.id === e.id))
                      .map(equipment => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name} - {equipment.standard_rate || 0} kr/{equipment.pricing_type}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={addEquipment} disabled={!selectedEquipment}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {formData.equipment.map((equipment, index) => {
              const equipmentData = equipmentList?.find(e => e.id === equipment.id);
              return (
                <Card key={`${equipment.id}-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{equipmentData?.name}</h4>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label className="text-xs">Mengde ({equipment.pricing_type})</Label>
                            <Input
                              type="number"
                              value={equipment.estimated_quantity}
                              onChange={(e) => updateEquipment(index, 'estimated_quantity', Number(e.target.value))}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Pris per enhet</Label>
                            <Input
                              type="number"
                              value={equipment.rate}
                              onChange={(e) => updateEquipment(index, 'rate', Number(e.target.value))}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="font-medium">
                          {(equipment.estimated_quantity * equipment.rate).toLocaleString('no-NO')} kr
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEquipment(index)}
                          className="text-destructive hover:text-destructive mt-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legg til materialer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Velg materiale" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {materialsList?.filter(m => !formData.materials.find(fm => fm.id === m.id))
                      .map(material => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} - {material.price || 0} kr/{material.unit}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={addMaterial} disabled={!selectedMaterial}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {formData.materials.map((material, index) => {
              const materialData = materialsList?.find(m => m.id === material.id);
              return (
                <Card key={`${material.id}-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{materialData?.name}</h4>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label className="text-xs">Antall ({materialData?.unit})</Label>
                            <Input
                              type="number"
                              value={material.quantity}
                              onChange={(e) => updateMaterial(index, 'quantity', Number(e.target.value))}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Pris per {materialData?.unit}</Label>
                            <Input
                              type="number"
                              value={material.unit_price}
                              onChange={(e) => updateMaterial(index, 'unit_price', Number(e.target.value))}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="font-medium">
                          {(material.quantity * material.unit_price).toLocaleString('no-NO')} kr
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMaterial(index)}
                          className="text-destructive hover:text-destructive mt-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}