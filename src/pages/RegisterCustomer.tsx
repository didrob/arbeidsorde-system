import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBrregLookup } from '@/features/customers/useBrregLookup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, CheckCircle2, Search, ArrowLeft, ArrowRight, Send, Loader2, AlertCircle } from 'lucide-react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { GlassCard } from '@/components/public/GlassCard';

const STEPS = ['Organisasjon', 'Kontaktinfo', 'Lokasjon', 'Bekreftelse'];

interface RegistrationData {
  org_number: string;
  name: string;
  address: string;
  org_form: string;
  industry_code: string;
  contact_person: string;
  email: string;
  phone: string;
  invoice_email: string;
  site_id: string;
}

export default function RegisterCustomer() {
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [orgInput, setOrgInput] = useState('');
  const { lookup, isLoading: brregLoading, error: brregError, result: brregResult, reset: resetBrreg } = useBrregLookup();

  const [data, setData] = useState<RegistrationData>({
    org_number: '', name: '', address: '', org_form: '', industry_code: '',
    contact_person: '', email: '', phone: '', invoice_email: '', site_id: '',
  });

  useEffect(() => {
    supabase.from('sites').select('id, name').eq('is_active', true).order('name')
      .then(({ data: s }) => { if (s) setSites(s); });
  }, []);

  useEffect(() => {
    const clean = orgInput.replace(/\s/g, '');
    if (clean.length !== 9 || !/^\d{9}$/.test(clean)) return;
    const timer = setTimeout(() => { lookup(clean); }, 500);
    return () => clearTimeout(timer);
  }, [orgInput, lookup]);

  useEffect(() => {
    if (brregResult) {
      setData(prev => ({
        ...prev,
        org_number: brregResult.org_number,
        name: brregResult.name,
        address: brregResult.address,
        org_form: brregResult.org_form,
        industry_code: brregResult.industry_code,
      }));
    }
  }, [brregResult]);

  const handleOrgInputChange = (value: string) => {
    setOrgInput(value);
    setConfirmed(false);
    resetBrreg();
  };

  const canProceed = useCallback(() => {
    switch (step) {
      case 0: return confirmed && !!data.name;
      case 1: return !!data.contact_person.trim() && !!data.email.trim() && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(data.email);
      case 2: return !!data.site_id;
      case 3: return true;
      default: return false;
    }
  }, [step, confirmed, data]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { error } = await supabase.from('customers').insert({
        name: data.name,
        org_number: data.org_number || null,
        org_form: data.org_form || null,
        industry_code: data.industry_code || null,
        address: data.address || null,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone || null,
        invoice_email: data.invoice_email || null,
        site_id: data.site_id,
        registration_status: 'pending_approval',
        registered_by: 'self',
      } as any);
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err?.message || 'Noe gikk galt. Prøv igjen.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'bg-white/10 border-white/20 text-white placeholder:text-white/40';

  if (submitted) {
    return (
      <PublicLayout showBack>
        <GlassCard className="max-w-md w-full p-8 text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto text-asco-teal mb-4" />
          <h2 className="text-2xl font-heading mb-2 text-white">Takk for registreringen!</h2>
          <p className="text-pale-blue">
            Din registrering er sendt til ASCO for godkjenning. Du vil bli kontaktet når søknaden er behandlet.
          </p>
        </GlassCard>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout showBack>
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-xs font-medium ${i <= step ? 'text-asco-teal' : 'text-white/50'}`}>
                {s}
              </span>
            ))}
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
        </div>

        <GlassCard className="p-6 md:p-8">
          <h2 className="font-heading text-xl mb-6 text-white">
            {step === 0 && 'Finn din organisasjon'}
            {step === 1 && 'Kontaktinformasjon'}
            {step === 2 && 'Foretrukket lokasjon'}
            {step === 3 && 'Bekreft registrering'}
          </h2>

          <div className="space-y-6">
            {/* Step 0: Org number */}
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="org_number" className="text-white/80">Organisasjonsnummer</Label>
                  <div className="relative">
                    <Input
                      id="org_number"
                      placeholder="123 456 789"
                      value={orgInput}
                      onChange={(e) => handleOrgInputChange(e.target.value)}
                      className={`text-lg h-12 pr-10 ${inputClass}`}
                      maxLength={11}
                    />
                    {brregLoading && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-white/50" />}
                    {!brregLoading && !brregResult && <Search className="absolute right-3 top-3 h-5 w-5 text-white/50" />}
                  </div>
                  <p className="text-xs text-white/50">Skriv inn 9-sifret organisasjonsnummer for automatisk oppslag</p>
                </div>

                {brregError && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{brregError}</span>
                  </div>
                )}

                {brregResult && !confirmed && (
                  <div className="rounded-lg border-2 border-asco-teal/30 bg-asco-teal/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-asco-teal" />
                      <span className="font-semibold text-white">{brregResult.name}</span>
                    </div>
                    <div className="text-sm space-y-1 text-white/50">
                      <p>{brregResult.address}</p>
                      <p>Organisasjonsform: {brregResult.org_form}</p>
                      {brregResult.industry_code && <p>Næring: {brregResult.industry_code}</p>}
                    </div>
                    <Button onClick={() => setConfirmed(true)} className="w-full bg-asco-teal text-asco-teal-foreground hover:bg-asco-teal/90">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Ja, dette er riktig bedrift
                    </Button>
                  </div>
                )}

                {confirmed && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-asco-teal/10 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-asco-teal" />
                    <span className="font-medium text-white">{data.name}</span>
                    <Button variant="ghost" size="sm" className="ml-auto text-xs text-white/60 hover:text-white hover:bg-white/10" onClick={() => { setConfirmed(false); resetBrreg(); }}>
                      Endre
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Step 1: Contact info */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label className="text-white/80">Kontaktperson *</Label>
                  <Input value={data.contact_person} onChange={e => setData(d => ({ ...d, contact_person: e.target.value }))} placeholder="Fullt navn" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">E-post *</Label>
                  <Input type="email" value={data.email} onChange={e => setData(d => ({ ...d, email: e.target.value }))} placeholder="kontakt@bedrift.no" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Telefon</Label>
                  <Input value={data.phone} onChange={e => setData(d => ({ ...d, phone: e.target.value }))} placeholder="+47 123 45 678" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Faktura-epost</Label>
                  <Input type="email" value={data.invoice_email} onChange={e => setData(d => ({ ...d, invoice_email: e.target.value }))} placeholder="Samme som kontakt-epost" className={inputClass} />
                </div>
              </>
            )}

            {/* Step 2: Site selection */}
            {step === 2 && (
              <div className="space-y-2">
                <Label className="text-white/80">Foretrukket ASCO-lokasjon *</Label>
                <Select value={data.site_id} onValueChange={v => setData(d => ({ ...d, site_id: v }))}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Velg lokasjon" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/10 p-4 space-y-3 text-sm">
                  <Row label="Bedrift" value={data.name} />
                  <Row label="Org.nr" value={data.org_number} />
                  <Row label="Adresse" value={data.address} />
                  <Row label="Org.form" value={data.org_form} />
                  {data.industry_code && <Row label="Næring" value={data.industry_code} />}
                  <hr className="border-white/10" />
                  <Row label="Kontaktperson" value={data.contact_person} />
                  <Row label="E-post" value={data.email} />
                  {data.phone && <Row label="Telefon" value={data.phone} />}
                  {data.invoice_email && <Row label="Faktura-epost" value={data.invoice_email} />}
                  <hr className="border-white/10" />
                  <Row label="Lokasjon" value={sites.find(s => s.id === data.site_id)?.name || ''} />
                </div>
                {submitError && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              {step < 3 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="bg-asco-teal text-asco-teal-foreground hover:bg-asco-teal/90"
                >
                  Neste
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-asco-teal text-asco-teal-foreground hover:bg-asco-teal/90"
                >
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  {submitting ? 'Sender...' : 'Send registrering'}
                </Button>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </PublicLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-white/50">{label}</span>
      <span className="font-medium text-right text-white">{value}</span>
    </div>
  );
}
