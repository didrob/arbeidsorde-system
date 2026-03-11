

## Gjenoppbygg database for nytt Supabase-prosjekt

### Problem
- Klienten (`src/integrations/supabase/client.ts`) peker fortsatt på det gamle prosjektet (`altwmywwfpjumzscxrjl`)
- Det nye Supabase-prosjektet (`pofayvcrhypkcnjgkhqk`) har tomme tabeller
- 64 migrasjoner i repo må konsolideres og kjøres mot ny database

### Plan

**Steg 1: Oppdater Supabase-klienten**
Endre `src/integrations/supabase/client.ts` til å bruke det nye prosjektets URL og anon key (fra `.env`).

**Steg 2: Kjør konsolidert databasemigrasjon**
Opprett én enkelt migrasjon som bygger hele skjemaet fra scratch. Denne inkluderer:

**Tabeller (15 stk):**
- `profiles` (brukerinfo + rolle + org/site-tilknytning)
- `organizations`, `sites`, `user_site_access`
- `user_roles` (med `app_role` enum: system_admin, site_manager, field_worker)
- `user_invitations`
- `customers`, `materials`, `personnel`, `equipment`
- `work_orders`, `work_order_materials`, `work_order_time_entries`, `work_order_breaks`
- `work_order_attachments`, `work_order_time_adjustments`, `adjustment_attachments`
- `work_order_personnel`, `work_order_equipment`
- `customer_pricing_agreements`
- `invoices`, `invoice_line_items`
- `audit_logs`, `work_order_audit_log`

**Funksjoner:**
- `update_updated_at_column()` - timestamp-trigger
- `handle_new_user()` - oppretter profil + rolle ved signup
- `get_current_user_role()`, `is_admin()`, `is_system_admin()`, `is_site_manager()`, `is_field_worker()`, `has_role()`
- `user_has_site_access()`, `user_has_org_access()`, `get_user_accessible_sites()`, `get_user_accessible_site_ids()`
- `claim_work_order()`, `soft_delete_work_order()`
- `generate_invoice_number()`
- `update_work_order_status_on_time_entry()`

**RLS-policies:** Site-basert tilgangskontroll på alle tabeller

**Views:** `site_work_order_stats`, `site_revenue_stats`, `site_productivity_stats` + org-views

**Storage buckets:** `work-order-attachments` (privat), `avatars` (offentlig)

**Triggers:** Automatisk `updated_at`, brukeropprettelse, arbeidsordreoppdatering

**CHECK constraints:** Validering av positive verdier, e-postformat, tidsintervaller

### Teknisk tilnærming
- Én stor konsolidert SQL-migrasjon som representerer endelig skjematilstand
- Unngår duplikat DROP/CREATE fra de 64 inkrementelle migrasjonene
- Inkluderer ikke testdata (INSERT-setninger for kunder/arbeidordrer hoppes over)

