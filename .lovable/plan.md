

## Audit: Multisite-grunnmur — hva finnes allerede vs. hva mangler

### Allerede implementert
- **`sites` tabell** med id, name, address, location, organization_id, is_active, created_at, updated_at
- **`user_site_access` tabell** med id, user_id, site_id, granted_by, granted_at
- **`user_roles` tabell** med app_role enum (system_admin, site_manager, field_worker)
- **RLS-policies** med `user_has_site_access()`, `is_admin()`, `is_system_admin()` security definer functions
- **`site_id` på work_orders, customers, profiles, materials, equipment, personnel`** — allerede på plass
- **`SiteSelector` komponent** med dropdown og "Alle sites" valg
- **`SiteFilterProvider` context** med localStorage-persistering
- **`SiteManagement` admin-side** under Innstillinger med create/edit/toggle
- **`useUserAccessibleSites` hook** via `get_user_accessible_sites()` DB-funksjon
- **`get_user_accessible_site_ids()` DB-funksjon** brukt i RLS

### Hva mangler (gap-analyse)

| Gap | Beskrivelse |
|---|---|
| **DB: Manglende kolonner på `sites`** | `latitude`, `longitude`, `contact_email`, `contact_phone` mangler |
| **DB: Seed-data** | De 4 lokasjonene (Farsund, Mosjøen, Tananger, Sandnessjøen) er ikke seedet |
| **Frontend: SiteSelector i topbar** | SiteSelector eksisterer men er IKKE plassert i topbar/ResponsiveLayout |
| **Frontend: Site-navn i sidebar** | Sidebar viser ikke gjeldende site under logoen |
| **Frontend: "Alle lokasjoner" kun for CEO** | SiteSelector viser "Alle sites" for alle med multi-site access — bør begrenses til system_admin |
| **DB: Kontaktinfo i admin-UI** | CreateSiteDialog/EditSiteDialog mangler felter for lat/lng, kontakt-epost, kontakttelefon |

### Hva som IKKE trengs (allerede dekket)
- Rolle-basert tilgang via `user_roles` + `user_site_access` — fungerer
- RLS uten rekursjon — allerede løst med security definer functions
- site_id på hovedtabeller — allerede der
- Organizations-hierarki (sites tilhører organizations) — fungerer
- NOT NULL constraint på site_id for work_orders/customers — delvis (nullable i dag, men det er bevisst for bakoverkompatibilitet)

---

### Plan — kan gjøres i én fase

**Fase 1: DB-migrering**
1. Legg til `latitude`, `longitude`, `contact_email`, `contact_phone` kolonner på `sites`
2. Seed de 4 lokasjonene (INSERT med ON CONFLICT DO NOTHING for idempotens) — krever at det finnes en organization. Sjekk om det finnes en, ellers opprett en default "ASCO" org.

**Fase 2: Oppdater admin-UI (3 filer)**
- `CreateSiteDialog.tsx` — Legg til felter for lat, lng, kontakt-epost, kontakttelefon
- `EditSiteDialog.tsx` — Samme felter
- `SiteManagement.tsx` — Vis kontaktinfo i kort-visningen

**Fase 3: Integrer SiteSelector i topbar (2 filer)**
- `ResponsiveLayout.tsx` — Legg til `SiteSelector` i desktop topbar mellom logo-area og ThemeToggle. Koble til `useSiteFilter`.
- `SimpleSidebar.tsx` — Vis gjeldende site-navn under ASCO-logoen

**Fase 4: Begrens "Alle lokasjoner" til system_admin**
- `SiteSelector.tsx` — Bruk `useAuth` for å sjekke `isSystemAdmin`, skjul "Alle sites" for andre roller

### Filer som endres

| Fil | Endring |
|---|---|
| DB-migrering | Nye kolonner + seed-data |
| `src/components/admin/CreateSiteDialog.tsx` | +4 felter |
| `src/components/admin/EditSiteDialog.tsx` | +4 felter |
| `src/components/admin/SiteManagement.tsx` | Vis kontaktinfo |
| `src/components/layout/ResponsiveLayout.tsx` | SiteSelector i topbar |
| `src/components/SimpleSidebar.tsx` | Site-navn under logo |
| `src/components/site/SiteSelector.tsx` | Begrens "Alle" til admin |
| `src/hooks/useOrganizations.ts` | Oppdater Site interface |

