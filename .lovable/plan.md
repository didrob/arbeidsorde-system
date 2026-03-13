

## Implementer Kundeprofil-detaljside (F1.4)

### Fase 1: Database

**Migration:** Opprett `customer_notes`, `customer_attachments` og storage bucket.

```sql
-- customer_notes
CREATE TABLE public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- RLS: site-basert via customer.site_id
CREATE POLICY "Users can manage notes for customers on their sites"
  ON public.customer_notes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_notes.customer_id
    AND user_has_site_access(c.site_id)
  ));

-- customer_attachments
CREATE TABLE public.customer_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage attachments for customers on their sites"
  ON public.customer_attachments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_attachments.customer_id
    AND user_has_site_access(c.site_id)
  ));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-attachments', 'customer-attachments', false);

CREATE POLICY "Authenticated users can upload customer attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'customer-attachments');

CREATE POLICY "Authenticated users can view customer attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'customer-attachments');

CREATE POLICY "Authenticated users can delete customer attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'customer-attachments');
```

### Fase 2: Nye filer

| Fil | Beskrivelse |
|---|---|
| `src/hooks/useCustomerDetail.ts` | Hook: henter kunde, ordrer, notater, vedlegg, økonomi-aggregat |
| `src/pages/CustomerDetail.tsx` | Fullskjerms kundeprofil med 6 faner |

### Fase 3: Endrede filer

| Fil | Endring |
|---|---|
| `src/App.tsx` | Ny lazy-loaded rute `/customers/:id` bak `ProtectedRoute` |
| `src/pages/Customers.tsx` | Kundekort klikkbare med `useNavigate` til `/customers/:id` |

### Detaljert komponentstruktur

**`useCustomerDetail.ts`** — React Query hooks:
- `useCustomerDetail(id)` — henter enkelt kunde fra `customers` tabell
- `useCustomerOrders(customerId)` — work_orders filtrert på customer_id med status/dato-filter
- `useCustomerEconomy(customerId)` — aggregert omsetning fra work_orders (price_value), gruppert per måned
- `useCustomerNotes(customerId)` — CRUD for customer_notes med bruker-join (profiles.full_name)
- `useCustomerAttachments(customerId)` — CRUD for customer_attachments + storage upload/download

**`CustomerDetail.tsx`** — Struktur:
- Header: Bedriftsnavn, org.nr, status-badge, site-navn, kontaktinfo, «Rediger»-knapp, «← Tilbake»
- 3 KPI-kort: Totalt ordrer, total omsetning, aktive ordrer
- 6 faner via `Tabs`:
  1. **Oversikt**: Bedriftsinfo, kontakt, registrering, lokasjon
  2. **Ordrehistorikk**: Filtrert tabell (status, dato), klikkbar til ordre. MobileDataTable på mobil.
  3. **Økonomi**: Omsetning per periode (recharts BarChart), fordeling per type, ventende beløp
  4. **Avtaler**: Gjenbruker `useCustomerPricingAgreements` fra useResources, tabell + opprett-knapp
  5. **Notater**: Tidslinje med ny-notat-felt, redigering/sletting av egne
  6. **Vedlegg**: Filopplasting til `customer-attachments` bucket, filliste med download

**`Customers.tsx`** — Endringer:
- Importer `useNavigate`
- Wrap kundekort i klikkbar container med `onClick={() => navigate('/customers/' + customer.id)}`
- Legg til hover-effekt og `ChevronRight`-ikon
- Edit-knapp stopper propagation (`e.stopPropagation()`)

**`App.tsx`** — Endringer:
- `const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));`
- Ny rute: `<Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />`

### Design

- ASCO-farger: teal aktiv tab, muted-grey inaktiv
- KPI-kort: Samme stil som dashboard (`DashboardKPICard`)
- Økonomi-chart: recharts `BarChart` med ASCO teal/cobalt
- Notater: Kompakt tidslinje med initialer-avatar
- Ingen inline styles — kun Tailwind-klasser

Estimat: 2 DB-tabeller + 1 bucket, 2 nye filer, 2 endrede filer, ~800 linjer kode.

