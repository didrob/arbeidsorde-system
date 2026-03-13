import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Loader2, MapPin, X } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

const STORAGE_KEY = 'asco-portal-site';

const orderTypes = [
  'Kontainerflytting',
  'Transport',
  'Renhold',
  'Brøyting',
  'Vedlikehold',
  'Annet',
];

interface OrderForm {
  type: string;
  description: string;
  priority: 'normal' | 'urgent';
  address: string;
  desiredDate: string;
  asap: boolean;
  useGps: boolean;
  gpsLat: number | null;
  gpsLng: number | null;
  images: File[];
  notes: string;
}

const initialForm: OrderForm = {
  type: '',
  description: '',
  priority: 'normal',
  address: '',
  desiredDate: '',
  asap: false,
  useGps: false,
  gpsLat: null,
  gpsLng: null,
  images: [],
  notes: '',
};

const NewOrder = () => {
  const navigate = useNavigate();
  const { user, customerId } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OrderForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const update = (patch: Partial<OrderForm>) => setForm(prev => ({ ...prev, ...patch }));

  const canNext = () => {
    if (step === 1) return form.type && form.description;
    if (step === 2) return form.asap || form.desiredDate;
    return true;
  };

  const handleGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => update({ gpsLat: pos.coords.latitude, gpsLng: pos.coords.longitude, useGps: true }),
        () => toast({ variant: 'destructive', title: 'GPS feilet', description: 'Kunne ikke hente posisjon' })
      );
    }
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (form.images.length + files.length > 5) {
      toast({ variant: 'destructive', title: 'Maks 5 bilder' });
      return;
    }
    update({ images: [...form.images, ...files] });
  };

  const removeImage = (index: number) => {
    update({ images: form.images.filter((_, i) => i !== index) });
  };

  const handleSubmit = async () => {
    if (!user || !customerId) return;
    setSubmitting(true);

    try {
      const siteId = localStorage.getItem(STORAGE_KEY);

      // Create work order
      const { data: wo, error: woError } = await supabase
        .from('work_orders')
        .insert({
          title: `${form.type}: ${form.description.slice(0, 50)}`,
          description: form.description,
          status: 'pending',
          customer_id: customerId,
          user_id: user.id,
          site_id: siteId,
          pricing_type: 'hourly',
          notes: [
            form.priority === 'urgent' ? '⚠️ HASTER' : '',
            form.address ? `Adresse: ${form.address}` : '',
            form.asap ? 'Ønsket: Snarest mulig' : form.desiredDate ? `Ønsket dato: ${form.desiredDate}` : '',
            form.notes || '',
          ].filter(Boolean).join('\n'),
          scheduled_start: form.asap ? null : form.desiredDate ? new Date(form.desiredDate).toISOString() : null,
          gps_location: form.gpsLat && form.gpsLng ? `(${form.gpsLng},${form.gpsLat})` : null,
        })
        .select('id')
        .single();

      if (woError) throw woError;

      // Upload images
      for (const file of form.images) {
        const ext = file.name.split('.').pop();
        const path = `${wo.id}/${crypto.randomUUID()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('work-order-attachments')
          .upload(path, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('work-order-attachments')
            .getPublicUrl(path);

          await supabase.from('work_order_attachments').insert({
            work_order_id: wo.id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
          });
        }
      }

      setOrderNumber(wo.id.slice(0, 8).toUpperCase());
      setStep(5); // Confirmation

      toast({ title: 'Bestilling sendt!', description: 'Du mottar bekreftelse.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Feil', description: error.message || 'Kunne ikke opprette bestilling' });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmation step
  if (step === 5) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-primary-text" />
        </div>
        <div>
          <h1 className="font-heading text-2xl text-foreground mb-2">Bestilling sendt!</h1>
          <p className="text-muted-foreground">Ordrenummer: <strong>WO-{orderNumber}</strong></p>
          <p className="text-sm text-muted-foreground mt-1">Du får bekreftelse på e-post.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/portal/orders')}>Mine ordrer</Button>
          <Button onClick={() => navigate('/portal')}>Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Ny bestilling</h1>
        <p className="text-muted-foreground text-sm">Steg {step} av 4</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <Card className="shadow-brand-sm">
        <CardContent className="pt-6">
          {/* Step 1: What */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Oppdragstype *</Label>
                <Select value={form.type} onValueChange={v => update({ type: v })}>
                  <SelectTrigger><SelectValue placeholder="Velg type" /></SelectTrigger>
                  <SelectContent>
                    {orderTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Beskrivelse *</Label>
                <Textarea
                  value={form.description}
                  onChange={e => update({ description: e.target.value })}
                  placeholder="Beskriv hva som skal gjøres..."
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Haster?</Label>
                <Switch
                  checked={form.priority === 'urgent'}
                  onCheckedChange={checked => update({ priority: checked ? 'urgent' : 'normal' })}
                />
              </div>
            </div>
          )}

          {/* Step 2: Where & When */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input
                  value={form.address}
                  onChange={e => update({ address: e.target.value })}
                  placeholder="Gateadresse, postnummer"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleGps} className="gap-1">
                  <MapPin className="h-3 w-3" /> Bruk min posisjon
                </Button>
                {form.useGps && (
                  <p className="text-xs text-primary-text">GPS-posisjon registrert ✓</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Label>Snarest mulig</Label>
                <Switch
                  checked={form.asap}
                  onCheckedChange={checked => update({ asap: checked, desiredDate: checked ? '' : form.desiredDate })}
                />
              </div>
              {!form.asap && (
                <div className="space-y-2">
                  <Label>Ønsket dato</Label>
                  <Input
                    type="date"
                    value={form.desiredDate}
                    onChange={e => update({ desiredDate: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Images */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bilder (valgfritt, maks 5)</Label>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((file, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-brand overflow-hidden border border-border">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {form.images.length < 5 && (
                    <label className="w-20 h-20 rounded-brand border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                      <input type="file" accept="image/*" capture="environment" onChange={handleImageAdd} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ekstra notater</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => update({ notes: e.target.value })}
                  placeholder="Eventuell tilleggsinformasjon..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-heading text-lg">Oppsummering</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Type</span>
                  <span className="text-foreground font-medium">{form.type}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Prioritet</span>
                  <span className={form.priority === 'urgent' ? 'text-status-urgent font-medium' : 'text-foreground'}>
                    {form.priority === 'urgent' ? 'Haster' : 'Normal'}
                  </span>
                </div>
                <div className="py-2 border-b border-border">
                  <span className="text-muted-foreground block mb-1">Beskrivelse</span>
                  <span className="text-foreground">{form.description}</span>
                </div>
                {form.address && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Adresse</span>
                    <span className="text-foreground">{form.address}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Tidspunkt</span>
                  <span className="text-foreground">
                    {form.asap ? 'Snarest mulig' : form.desiredDate || '—'}
                  </span>
                </div>
                {form.images.length > 0 && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Bilder</span>
                    <span className="text-foreground">{form.images.length} vedlagt</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => step === 1 ? navigate('/portal') : setStep(step - 1)}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 1 ? 'Avbryt' : 'Tilbake'}
        </Button>

        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-1">
            Neste <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="gap-1">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send bestilling
          </Button>
        )}
      </div>
    </div>
  );
};

export default NewOrder;
