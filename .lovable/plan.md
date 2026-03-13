

## Opprett testdata via edge function

Lager en `seed-test-data` edge function som kan kjøres én gang for å sette opp alt.

### Hva den gjør

**1. Oppretter 7 brukere via Supabase Auth Admin API** (`supabase.auth.admin.createUser`):
- admin@asco-test.no → system_admin, alle sites
- leder.tananger@asco-test.no → site_manager, Tananger
- disponent.mosjoen@asco-test.no → site_manager, Mosjøen
- felt.tananger@asco-test.no → field_worker, Tananger
- felt.farsund@asco-test.no → field_worker, Farsund
- kari@alcoa-test.no → customer
- ole@equinor-test.no → customer

**2. Oppdaterer profiles** med riktig site_id, organization_id, og customer_id (for kundebrukere).

**3. Setter user_roles** for hver bruker.

**4. Setter user_site_access** for admin (alle 4 sites) og andre brukere.

**5. Oppretter 4 kunder** (Alcoa, Equinor, Hydro, TestBedrift) med org_number og riktig site/status.

**6. Oppretter 15 arbeidsordrer** fordelt på kundene med riktige statuser, priser, og interne ordrer med cost_center.

> Merk: work_orders har ikke `priority`-kolonne, så hasteordren opprettes med `notes: 'HASTER'` i stedet.

### Fil
- **Ny:** `supabase/functions/seed-test-data/index.ts`
- **Endring:** `supabase/config.toml` — legg til `[functions.seed-test-data]` med `verify_jwt = false`

### Bruk
Kjør funksjonen én gang via Supabase dashboard eller curl. Den sjekker om admin@asco-test.no allerede finnes og avbryter i så fall (idempotent).

