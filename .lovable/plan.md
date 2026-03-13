

## Plan: Brukeradministrasjon, rolleendring og hurtiginnlogging

### DEL 1 — Fiks din bruker (didrob@gmail.com)

Kjører to SQL-operasjoner mot Supabase:
1. Oppdater `user_roles` for user_id `eed97276-37e3-483a-a600-6eb3ad3be984`: endre rolle fra `field_worker` til `system_admin`
2. Oppdater `profiles` rolle til `system_admin`
3. Sett inn 4 rader i `user_site_access` (Tananger, Mosjøen, Farsund, Sandnessjøen) med `granted_by` = din egen user_id

### DEL 2 — Brukeradministrasjon (allerede eksisterer)

`UserManagement.tsx` har allerede en fungerende brukerforvaltning med tabell, søk, redigering av rolle/site/status. Den vises under Innstillinger for system_admin. Eksisterende funksjonalitet dekker kravene. Forbedringer:

- **Legg til e-post-kolonne** i brukertabellen (mangler i dag)
- **Legg til filter per lokasjon og rolle** (dropdown-filtre over tabellen)
- **Legg til oppsummering** øverst: antall brukere per rolle som badges/kort
- **Oppdater edit-dialogen** til å også endre `user_roles`-tabellen (ikke bare profiles.role)

### DEL 3 — Hurtiginnlogging for test

**`src/pages/Auth.tsx`**: Legg til en seksjon under login-skjemaet som kun rendres når `?test=true` er i URL. Viser grå boks med knapper for 5 ansatt-testbrukere. Klikk fyller inn e-post/passord og submitter.

**`src/pages/portal/PortalLogin.tsx`**: Samme mønster med 2 kunde-testbrukere.

### Filer som endres

| Fil | Endring |
|---|---|
| Database (SQL) | Oppdater rolle + site_access for din bruker |
| `src/components/admin/UserManagement.tsx` | E-post-kolonne, rolle/site-filtre, oppsummering, user_roles sync |
| `src/pages/Auth.tsx` | Hurtiginnlogging-seksjon |
| `src/pages/portal/PortalLogin.tsx` | Hurtiginnlogging-seksjon |

