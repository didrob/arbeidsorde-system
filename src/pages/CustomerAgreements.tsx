import React, { useState } from 'react';
import { TopBar } from "@/components/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCustomers } from "@/hooks/useApi";
import { useCustomerPricingAgreements, useCreateCustomerPricingAgreement, usePersonnel, useEquipment } from "@/hooks/useResources";
import { useMaterials } from "@/hooks/useApi";
import { toast } from "sonner";

export default function CustomerAgreements() {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    customer_id: "",
    resource_type: "" as "personnel" | "equipment" | "material" | "",
    resource_id: "",
    agreement_type: "" as "fixed_rate" | "percentage_discount" | "bulk_pricing" | "",
    pricing_type: "hourly" as "hourly" | "daily" | "fixed",
    custom_rate: "",
    valid_from: new Date(),
    valid_until: undefined as Date | undefined,
    notes: ""
  });

  const { data: customers } = useCustomers();
  const { data: agreements, refetch: refetchAgreements } = useCustomerPricingAgreements(selectedCustomer);
  const { data: personnel } = usePersonnel();
  const { data: equipment } = useEquipment();
  const { data: materials } = useMaterials();
  const createAgreement = useCreateCustomerPricingAgreement();

  const filteredAgreements = agreements?.filter(agreement => {
    if (!searchTerm) return true;
    const customer = customers?.find(c => c.id === agreement.customer_id);
    return customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.resource_type || !formData.agreement_type || !formData.custom_rate) {
      toast.error("Vennligst fyll ut alle påkrevde felt");
      return;
    }

    try {
      await createAgreement.mutateAsync({
        customer_id: formData.customer_id,
        resource_type: formData.resource_type,
        resource_id: formData.resource_id || null,
        agreement_type: formData.agreement_type,
        pricing_type: formData.pricing_type,
        custom_rate: parseFloat(formData.custom_rate),
        valid_from: formData.valid_from.toISOString().split('T')[0],
        valid_until: formData.valid_until?.toISOString().split('T')[0] || null,
        notes: formData.notes || null
      });

      toast.success("Kundeavtale opprettet");
      setShowCreateDialog(false);
      setFormData({
        customer_id: "",
        resource_type: "",
        resource_id: "",
        agreement_type: "",
        pricing_type: "hourly",
        custom_rate: "",
        valid_from: new Date(),
        valid_until: undefined,
        notes: ""
      });
      refetchAgreements();
    } catch (error) {
      toast.error("Feil ved opprettelse av kundeavtale");
    }
  };

  const getResourceName = (agreement: any) => {
    if (!agreement.resource_id) return "Generell avtale";
    
    switch (agreement.resource_type) {
      case "personnel":
        return personnel?.find(p => p.id === agreement.resource_id)?.name || "Ukjent personell";
      case "equipment":
        return equipment?.find(e => e.id === agreement.resource_id)?.name || "Ukjent utstyr";
      case "material":
        return materials?.find(m => m.id === agreement.resource_id)?.name || "Ukjent materiale";
      default:
        return "Ukjent ressurs";
    }
  };

  const getAgreementTypeLabel = (type: string) => {
    switch (type) {
      case "fixed_rate": return "Fast pris";
      case "percentage_discount": return "Prosentrabatt";
      case "bulk_pricing": return "Volumpris";
      default: return type;
    }
  };

  const getPricingTypeLabel = (type: string) => {
    switch (type) {
      case "hourly": return "per time";
      case "daily": return "per dag";
      case "fixed": return "fast";
      default: return type;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar 
        title="Kundeavtaler" 
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Opprett kundeavtale</DialogTitle>
              <DialogDescription>
                Opprett en spesiell prisavtale for en kunde
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">Kunde *</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg kunde" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="resource_type">Ressurstype *</Label>
                  <Select value={formData.resource_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, resource_type: value, resource_id: "" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personnel">Personell</SelectItem>
                      <SelectItem value="equipment">Utstyr</SelectItem>
                      <SelectItem value="material">Materiale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.resource_type && (
                <div>
                  <Label htmlFor="resource">Spesifikk ressurs (valgfritt)</Label>
                  <Select value={formData.resource_id} onValueChange={(value) => setFormData(prev => ({ ...prev, resource_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg ressurs eller la stå tom for generell avtale" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.resource_type === "personnel" && personnel?.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                      {formData.resource_type === "equipment" && equipment?.map(eq => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.name}
                        </SelectItem>
                      ))}
                      {formData.resource_type === "material" && materials?.map(mat => (
                        <SelectItem key={mat.id} value={mat.id}>
                          {mat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agreement_type">Avtaletype *</Label>
                  <Select value={formData.agreement_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, agreement_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg avtaletype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_rate">Fast pris</SelectItem>
                      <SelectItem value="percentage_discount">Prosentrabatt</SelectItem>
                      <SelectItem value="bulk_pricing">Volumpris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pricing_type">Pristype</Label>
                  <Select value={formData.pricing_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, pricing_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Per time</SelectItem>
                      <SelectItem value="daily">Per dag</SelectItem>
                      <SelectItem value="fixed">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="custom_rate">Pris/rabatt *</Label>
                <Input
                  id="custom_rate"
                  type="number"
                  step="0.01"
                  value={formData.custom_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_rate: e.target.value }))}
                  placeholder={formData.agreement_type === "percentage_discount" ? "Rabatt i %" : "Pris i NOK"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gyldig fra</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.valid_from && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.valid_from ? format(formData.valid_from, "PPP", { locale: nb }) : "Velg dato"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.valid_from}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, valid_from: date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Gyldig til (valgfritt)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.valid_until && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.valid_until ? format(formData.valid_until, "PPP", { locale: nb }) : "Ingen sluttdato"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.valid_until}
                        onSelect={(date) => setFormData(prev => ({ ...prev, valid_until: date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notater</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Tilleggskommentarer til avtalen..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={createAgreement.isPending}>
                  {createAgreement.isPending ? "Oppretter..." : "Opprett avtale"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrer avtaler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">Søk</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Søk etter kunde..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="customer_filter">Filtrer på kunde</Label>
                <Select value={selectedCustomer || 'all'} onValueChange={(value) => setSelectedCustomer(value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle kunder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle kunder</SelectItem>
                    {customers?.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agreements Table */}
        <Card>
          <CardHeader>
            <CardTitle>Kundeavtaler</CardTitle>
            <CardDescription>
              {filteredAgreements?.length || 0} avtaler funnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Ressurstype</TableHead>
                    <TableHead>Ressurs</TableHead>
                    <TableHead>Avtaletype</TableHead>
                    <TableHead>Pris</TableHead>
                    <TableHead>Gyldighetstid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgreements?.map((agreement) => {
                    const customer = customers?.find(c => c.id === agreement.customer_id);
                    const isActive = new Date() >= new Date(agreement.valid_from || "") && 
                                   (!agreement.valid_until || new Date() <= new Date(agreement.valid_until));
                    
                    return (
                      <TableRow key={agreement.id}>
                        <TableCell className="font-medium">{customer?.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {agreement.resource_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{getResourceName(agreement)}</TableCell>
                        <TableCell>{getAgreementTypeLabel(agreement.agreement_type)}</TableCell>
                        <TableCell>
                          {agreement.agreement_type === "percentage_discount" 
                            ? `${agreement.custom_rate}%` 
                            : `${agreement.custom_rate} NOK ${getPricingTypeLabel(agreement.pricing_type)}`
                          }
                        </TableCell>
                        <TableCell>
                          {agreement.valid_from && format(new Date(agreement.valid_from), "dd.MM.yyyy", { locale: nb })}
                          {agreement.valid_until && ` - ${format(new Date(agreement.valid_until), "dd.MM.yyyy", { locale: nb })}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!filteredAgreements?.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Ingen kundeavtaler funnet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}