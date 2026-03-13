

## Implementer Intern Ordre-funksjonalitet (F1.5)

### Fase 1: Database-migration

Én migration som legger til 3 kolonner på `work_orders` og seeder «ASCO Intern»-kunder per aktive site:

```sql
-- Nye kolonner
ALTER TABLE public.work_orders
  ADD COLUMN is_internal boolean NOT NULL DEFAULT false,
  ADD COLUMN cost_center text,
  ADD COLUMN linked_order_id uuid REFERENCES public.work_orders(id);

-- Seed ASCO Intern-kunde per aktiv site
INSERT INTO public.customers (name, site_id, registered_by, registration_status, org_number)
SELECT 'ASCO Intern', s.id, 'system', 'approved', NULL
FROM public.sites s
WHERE s.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM public.customers c
  WHERE c.site_id = s.id AND c.registered_by = 'system' AND c.name = 'ASCO Intern'
);
```

### Fase 2: Utility-modul

**Ny fil: `src/lib/internalOrders.ts`**

Gjenbrukbare hjelpefunksjoner:
- `isInternalOrder(order)` — sjekker `is_internal === true`
- `getInternalCustomerForSite(customers, siteId)` — finner ASCO Intern-kunden for en gitt site
- `isInternalCustomer(customer)` — sjekker `registered_by === 'system' && name === 'ASCO Intern'`
- `COST_CENTERS` — konstantliste: `['Intern drift', 'Vedlikehold utstyr', 'Klargjøring', 'Annet']`

### Fase 3: Wizard-oppdatering

**`src/components/workorder-wizard/types.ts`** — Legg til `is_internal`, `cost_center`, `linked_order_id` i `WizardFormData`.

**`src/components/workorder-wizard/WizardContext.tsx`** — Initialverdier for nye felter.

**`src/components/workorder-wizard/steps/BasicInfoStep.tsx`** — Hovedendring:
- Intern-toggle (Switch) øverst med label «Intern ordre»
- Når PÅ: Cobalt banner «Intern ordre — Ikke fakturerbar», kundevalg skjules (auto-settes til ASCO Intern for brukerens site), kostnadssenter-dropdown vises, pris settes til 0
- Når AV: Normal oppførsel
- Valgfritt felt: «Knyttet til kundeoppdrag» — Select med eksisterende kundeordrer
- Krever `useCurrentUser` for å hente brukerens site_id

### Fase 4: Mobil (QuickOrderSheet)

**`src/features/field-orders/QuickOrderSheet.tsx`** — Intern-toggle i bottom sheet. Når aktiv: kunde auto-settes til ASCO Intern, kostnadssenter vises.

**`src/features/field-orders/useQuickOrder.ts`** — Legg til `is_internal`, `cost_center` i `QuickOrderData` og `orderPayload`.

### Fase 5: Ordrelister og filtrering

**`src/pages/WorkOrders.tsx`**:
- Ny state `showInternal` (default `false`)
- Switch-filter «Vis interne ordrer» i filterbar
- `filteredWorkOrders` inkluderer `!order.is_internal || showInternal`
- Oppdater tabs-tellere til å respektere intern-filter

**4 visningskomponenter** (`WorkOrderGridView`, `WorkOrderListView`, `WorkOrderTableView`, `WorkOrderCompactView`):
- Vis cobalt «INTERN»-badge ved siden av status-badge når `order.is_internal`
- Subtle bakgrunnsfarge for interne ordrer

### Fase 6: Fakturering og kundevisninger

**`src/pages/Invoices.tsx`** — Filtrer ut `is_internal = true` fra invoice-data (i useInvoices eller inline).

**`src/pages/CustomerDetail.tsx`** — Ekskluder interne ordrer fra ordrehistorikk og økonomi-aggregat.

**`src/pages/Customers.tsx`** — Skjul «ASCO Intern»-kunder fra kundelisten som standard (filtrer `registered_by !== 'system'`).

### Fase 7: API-lag

**`src/lib/api.ts`** — `getWorkOrders`: Legg til valgfri `includeInternal`-parameter. Default ekskluderer `is_internal = true`.

**`src/integrations/supabase/types.ts`** — Oppdateres automatisk etter migration.

### Endringsoversikt

| Fil | Type | Beskrivelse |
|---|---|---|
| `supabase/migrations/...` | Ny | ALTER work_orders + seed ASCO Intern |
| `src/lib/internalOrders.ts` | Ny | Utility-funksjoner og konstanter |
| `src/components/workorder-wizard/types.ts` | Endret | Nye felter i WizardFormData |
| `src/components/workorder-wizard/WizardContext.tsx` | Endret | Initialverdier |
| `src/components/workorder-wizard/steps/BasicInfoStep.tsx` | Endret | Intern-toggle + kostnadssenter |
| `src/features/field-orders/QuickOrderSheet.tsx` | Endret | Intern-toggle i mobil |
| `src/features/field-orders/useQuickOrder.ts` | Endret | Intern-felter i payload |
| `src/pages/WorkOrders.tsx` | Endret | Intern-filter |
| `src/components/workorders/WorkOrderGridView.tsx` | Endret | INTERN-badge |
| `src/components/workorders/WorkOrderListView.tsx` | Endret | INTERN-badge |
| `src/components/workorders/WorkOrderTableView.tsx` | Endret | INTERN-badge |
| `src/components/workorders/WorkOrderCompactView.tsx` | Endret | INTERN-badge |
| `src/pages/Invoices.tsx` | Endret | Filtrer ut interne |
| `src/pages/CustomerDetail.tsx` | Endret | Ekskluder interne fra økonomi |
| `src/pages/Customers.tsx` | Endret | Skjul ASCO Intern-kunder |
| `src/lib/api.ts` | Endret | includeInternal parameter |

Estimat: 1 migration, 1 ny fil, 14 endrede filer, ~400 linjer ny kode.

