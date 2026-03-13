

## Implementer Salgsordre-funksjonalitet (F1.6)

### Fase 1: Database-migration

Én migration som oppretter `sales_orders`, `sales_order_lines`, legger til `sales_order_id` på `work_orders`, og Dynamics-prep-kolonner på `customers`.

```sql
-- Funksjon for SO-nummer: SO-2026-0001
CREATE OR REPLACE FUNCTION public.generate_sales_order_number() ...

-- sales_orders tabell med site-basert RLS
CREATE TABLE public.sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id),
  site_id uuid NOT NULL REFERENCES sites(id),
  status text NOT NULL DEFAULT 'draft',  -- draft/approved/exported/paid
  period_from date, period_to date,
  subtotal numeric DEFAULT 0, tax_amount numeric DEFAULT 0, total_amount numeric DEFAULT 0,
  notes text, approved_by/at, exported_by/at, paid_at,
  created_by uuid NOT NULL, created_at, updated_at
);

-- sales_order_lines med FK til sales_orders og work_orders
CREATE TABLE public.sales_order_lines (
  id, sales_order_id, work_order_id, description, quantity, unit_price,
  line_total, vat_rate (default 25), vat_amount, item_type, sort_order
);

-- Kobling
ALTER TABLE work_orders ADD COLUMN sales_order_id uuid REFERENCES sales_orders(id);

-- Dynamics-prep (ikke aktive)
ALTER TABLE customers ADD COLUMN dynamics_customer_number text, dynamics_account text;
```

RLS: `user_has_site_access(site_id)` på sales_orders, join-basert på sales_order_lines.

### Fase 2: Hook — `src/hooks/useSalesOrders.ts`

| Hook | Beskrivelse |
|---|---|
| `useReadyForSalesOrder()` | Henter completed, non-internal, no sales_order_id work_orders, gruppert per kunde |
| `useSalesOrders()` | Alle salgsordrer med kunde-join |
| `useSalesOrder(id)` | Enkelt SO med linjer |
| `useCreateSalesOrder()` | Samler ordrer → opprett SO + linjer, link work_orders |
| `useUpdateSalesOrderStatus()` | Status-endring med approved_by/exported_by/paid_at |
| `useDeleteSalesOrder()` | Slett utkast, unlink work_orders |

MVA beregnes per linje (default 25%). Linjer grupperes etter `pricing_type` som `item_type`.

### Fase 3: Eksport — `src/utils/salesOrderExport.ts`

**CSV:** Semikolon-separert med BOM for Excel-kompatibilitet. Kolonner: SO-nr, Kundenavn, Org.nr, Linjenr, Beskrivelse, Type, Antall, Enhetspris, MVA-sats, MVA-beløp, Linjetotal. Totalrad nederst. Filnavn: `SO-2026-0001_Alcoa_2026-03.csv`.

**PDF:** jsPDF med ASCO-header, kundeinfo, linjeposter gruppert per type, subtotal/MVA/total. Filnavn: `SO-2026-0001_Alcoa_2026-03.pdf`.

### Fase 4: UI — `src/pages/SalesOrders.tsx`

Erstatter Invoices-siden. Struktur:

1. **«Klare for salgsordre»-seksjon** — fullførte, ikke-interne ordrer uten SO, gruppert per kunde. Per kunde: navn, antall ordrer, estimert beløp, «Opprett salgsordre»-knapp. «Opprett alle»-batch-knapp.

2. **4 KPI-kort** — Utkast, Godkjent, Eksportert, Betalt (antall + verdi).

3. **Status-tabs** — Utkast | Godkjent | Eksportert | Betalt. Tabell: SO-nummer, kunde, periode, beløp, status-badge, dato.

4. **Detalj-modal** — Header med SO-nr/kunde/periode/total. Linjeposter gruppert per type. Subtotal + MVA + Total. Handlinger etter status:
   - Utkast: Godkjenn, Slett
   - Godkjent: Eksporter CSV, Eksporter PDF, Marker betalt
   - Eksportert: Marker betalt
   - Betalt: Ingen (arkivert)

### Fase 5: Integrasjon

| Fil | Endring |
|---|---|
| `src/App.tsx` | Erstatt `/invoices` rute med `/sales-orders` → `SalesOrders`. Fjern `Invoices` lazy import. |
| `src/components/SimpleSidebar.tsx` | Endre «Fakturaer» → «Salgsordrer», url `/invoices` → `/sales-orders` |
| `src/components/mobile/MobileNav.tsx` | Samme endring for mobil |
| `src/pages/CustomerDetail.tsx` | Legg til salgsordre-oversikt i Økonomi-fanen |
| `src/integrations/supabase/types.ts` | Oppdateres med nye tabeller/kolonner |

### Design

- Status-badges: Utkast (muted-grey), Godkjent (teal), Eksportert (blue), Betalt (grønn)
- «Klare»-seksjon: Teal-accent bakgrunn
- Linjeposter: Ren tabell med skillelinjer mellom typer

Estimat: 1 migration, 3 nye filer, 5 endrede filer, ~700 linjer kode.

