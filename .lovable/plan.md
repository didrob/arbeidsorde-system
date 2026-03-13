

## Kunderegistrering — 3 faser, full implementering

### FASE 1: Database + Brønnøysund API

**DB-migrering** — Nye kolonner på `customers`:
- `org_number` (text, nullable, unique partial index)
- `org_form`, `industry_code`, `invoice_email` (text, nullable)
- `registration_status` (text, NOT NULL, default 'approved')
- `registered_by` (text, nullable)
- `approved_by` (uuid, nullable), `approved_at` (timestamptz, nullable)
- `rejection_reason` (text, nullable)
- RLS: Anon INSERT policy med `registration_status = 'pending_approval'`

**Edge function `lookup-organization`:**
- POST med `{ org_number }`, validerer 9 siffer
- Kaller `data.brreg.no/enhetsregisteret/api/enheter/{orgnr}`
- Returnerer: navn, adresse, org_form, industry_code
- Feilhåndtering: 404 (ikke funnet), 502 (API nede), 400 (ugyldig nr)
- Config: `verify_jwt = false` (brukes av anon selvregistrering)

**Hook `src/features/customers/useBrregLookup.ts`:**
- Wrapper rundt `supabase.functions.invoke('lookup-organization')`
- Returnerer `{ lookup, isLoading, error, result, reset }`

**Type-oppdatering `src/types/index.ts`:**
- Customer interface utvides med alle nye felter

### FASE 2: Selvregistrering (offentlig side)

**Ny side `src/pages/RegisterCustomer.tsx`:**
- 4-stegs wizard med progress-indikator
- Steg 1: Org.nr input (stort, sentrert) → auto-oppslag → bekreftelseskort
- Steg 2: Kontaktinfo (navn, epost, telefon, faktura-epost)
- Steg 3: Foretrukket site (dynamisk dropdown fra sites-tabellen)
- Steg 4: Oppsummering + send
- Lagrer via anon Supabase-klient (RLS tillater det)
- ASCO-logo i cobalt topbar, responsivt design

**Rute i `src/App.tsx`:**
- `<Route path="/register-customer" element={<RegisterCustomer />} />` — UTENFOR ProtectedRoute

### FASE 3: Admin godkjenningskø

**Oppdatert `src/pages/Customers.tsx`:**
- Tabs: Alle | Godkjente | Ventende (med badge-count) | Avviste
- Ventende-kort med bedriftsnavn, org.nr, kontaktperson, dato
- Godkjenn-knapp: setter status=approved, approved_by, approved_at
- Avslå-knapp: modal med begrunnelse, setter status=rejected + rejection_reason
- Logger til email_log (uten å sende — Resend kobles på senere)

**Oppdatert opprett-dialog:**
- Org.nr-felt med BRREG auto-utfylling (gjenbruker `useBrregLookup`)
- Invoice_email-felt
- registered_by = 'admin', registration_status = 'approved'

**Sidebar badge (`SimpleSidebar.tsx`):**
- Henter pending count, viser teal badge ved "Kunder"

### Filer som opprettes/endres

| Fil | Type |
|---|---|
| DB-migrering | Nye kolonner + RLS |
| `supabase/functions/lookup-organization/index.ts` | Ny edge function |
| `supabase/config.toml` | Legg til lookup-organization |
| `src/features/customers/useBrregLookup.ts` | Ny hook |
| `src/types/index.ts` | Utvid Customer interface |
| `src/pages/RegisterCustomer.tsx` | Ny offentlig side |
| `src/App.tsx` | Ny rute |
| `src/pages/Customers.tsx` | Tabs + godkjenningskø + utvidet dialog |
| `src/components/SimpleSidebar.tsx` | Pending-badge |
| `src/hooks/useApi.ts` | Approve/reject mutations |

