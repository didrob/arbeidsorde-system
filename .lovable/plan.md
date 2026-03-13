

## Kundeportal — Full implementering i 4 faser

### FASE 1: Database — `customer` rolle + kobling

**DB-migrering:**
- `ALTER TYPE app_role ADD VALUE 'customer'` — ny rolle i enum
- `ALTER TABLE profiles ADD COLUMN customer_id uuid REFERENCES customers(id)` — kobler bruker til bedrift
- Oppdater `get_current_user_role()` og `handle_new_user()` for å inkludere customer-prioritet
- Security definer function `is_customer()` etter mønster fra `is_admin()`

**RLS-policies på work_orders for kunder:**
- SELECT: `EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.customer_id = work_orders.customer_id)`
- INSERT: Samme sjekk + `status = 'pending'`
- Ingen UPDATE/DELETE for kunder

**RLS på customers for kunder:**
- SELECT: Kunder kan lese sin egen kunderad via `profiles.customer_id`

**useAuth utvidelse:**
- Legg til `isCustomer: userRole === 'customer'` og `customerId` (hentes fra profiles)
- Oppdater `fetchUserRole` til å også hente `customer_id` fra profiles
- Oppdater `AuthContextType` interface

### FASE 2: Landingsside + kundeportal-layout

**Ny `src/pages/Landing.tsx`:**
- ASCO-logo sentrert, velkomsttekst
- To bokser side-om-side (CSS grid, stacker på mobil):
  - "Ansatt" (bg-cobalt, text-white) → `/auth`
  - "Kundeportal" (bg-asco-teal, text-cobalt) → `/portal/login`
- "Ny kunde? Registrer bedrift" → `/register-customer`
- Kontaktinfo + nødkontakt nederst

**Ny `src/pages/portal/PortalLogin.tsx`:**
- Steg 1: Lokasjonsvelger — 4 knapper fra sites-tabell, localStorage-hukommelse (`asco-portal-site`)
- Steg 2: Login-skjema (epost + passord) — gjenbruker `supabase.auth.signInWithPassword`
- Link til `/register-customer`

**Ny `src/components/portal/CustomerLayout.tsx`:**
- Enkel topbar: ASCO-logo venstre, kundenavn + lokasjon + logg ut høyre
- Ingen sidebar
- Desktop: Tabs-navigasjon (Dashboard | Mine ordrer | Ny bestilling)
- Mobil: Bottom nav med 4 tabs
- Wrapper for alle `/portal/*` ruter

**Ny `CustomerProtectedRoute` i App.tsx:**
- Krever auth + `isCustomer` rolle
- Ruter til `/portal/login` hvis ikke innlogget
- Bruker `CustomerLayout` i stedet for `ResponsiveLayout`

**Ruting-oppdatering i App.tsx:**
- `/` → `Landing` (offentlig, erstatter ProtectedRoute-wrapped Index)
- `/dashboard` → `ProtectedRoute<Index>` (ansatt-dashboard, ny rute)
- `/portal/login` → `PortalLogin`
- `/portal` → `CustomerProtectedRoute<CustomerDashboard>`
- `/portal/orders` → `CustomerProtectedRoute<CustomerOrders>`
- `/portal/new-order` → `CustomerProtectedRoute<NewOrder>`
- Oppdater `useSmartRouting`: Kunder → `/portal`, ansatte → `/dashboard`
- ProtectedRoute: Ikke-innloggede → `/` (landing) i stedet for `/auth`

### FASE 3: Kunde-dashboard + Mine ordrer

**Ny `src/pages/portal/CustomerDashboard.tsx`:**
- "Velkommen, [Bedriftsnavn]" + lokasjon
- 3 KPI-kort: Aktive ordrer, Denne måneden, Siste aktivitet
- Stor "Ny bestilling" CTA (teal, full bredde mobil)
- Siste 5 ordrer med status-badge
- Data: Henter work_orders via customer_id fra useAuth

**Ny `src/pages/portal/CustomerOrders.tsx`:**
- Filter-tabs: Alle | Ventende | Pågår | Fullført
- Ordrekort: Tittel, type, dato, status-badge, lokasjon
- Klikk → detaljvisning (dialog eller ekspandert kort):
  - Tidslinje: Bestilt → Akseptert → Pågår → Fullført
  - Beskrivelse, bilder, notater (read-only)
  - Tildelt feltarbeider
- Responsive: Tabell desktop, kort mobil

**Ny hook `src/hooks/useCustomerOrders.ts`:**
- Henter work_orders filtrert på customer_id (fra auth context)
- Filtreringsmuligheter (status)
- React Query-basert

### FASE 4: Kundebestillingsskjema

**Ny `src/pages/portal/NewOrder.tsx`:**
- 4-stegs wizard (enklere enn admin):
  1. **Hva:** Type-dropdown (Kontainerflytting, Transport, Renhold, Brøyting, Vedlikehold, Annet), beskrivelse, prioritet (Normal/Haster)
  2. **Hvor/når:** Adresse (fritekst), dato + tidsvindu eller "Snarest mulig", GPS-knapp på mobil
  3. **Bilder:** Kamera/fil-velger, maks 5, upload til `work-order-attachments` bucket
  4. **Bekreftelse:** Oppsummering + "Send bestilling"
- Oppretter work_order med `status='pending'`, `customer_id` fra auth, `site_id` fra portal-lokasjon
- Logger ordrebekreftelses-epost til `email_log`
- Bekreftelsesside med ordrenummer

### Filer som opprettes/endres

| Fil | Operasjon |
|---|---|
| DB-migrering | Ny: app_role + profiles.customer_id + RLS |
| `src/hooks/useAuth.tsx` | Endre: isCustomer, customerId |
| `src/hooks/useSmartRouting.tsx` | Endre: kunde-ruting |
| `src/pages/Landing.tsx` | Ny |
| `src/pages/portal/PortalLogin.tsx` | Ny |
| `src/pages/portal/CustomerDashboard.tsx` | Ny |
| `src/pages/portal/CustomerOrders.tsx` | Ny |
| `src/pages/portal/NewOrder.tsx` | Ny |
| `src/components/portal/CustomerLayout.tsx` | Ny |
| `src/hooks/useCustomerOrders.ts` | Ny |
| `src/App.tsx` | Endre: nye ruter, landing som rot |
| `src/types/index.ts` | Endre: UserRole + customer types |

### Viktige designbeslutninger

- Landing på `/` er offentlig — ansatt-dashboard flyttes til `/dashboard`
- Kunder bruker **samme Supabase Auth** men med `customer`-rolle i `user_roles`
- `CustomerLayout` er helt separat fra `ResponsiveLayout` — ingen sidebar, enkel navigasjon
- Alle portal-sider lazy-loaded via `React.lazy()`
- Lokasjonsvalg persisteres i localStorage og brukes som kontekst i hele portalen

