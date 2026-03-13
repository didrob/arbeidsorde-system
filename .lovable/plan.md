

## Plan: Systematisk light mode kontrastfiks

### Kjerneendringer

**1. CSS Custom Properties (`src/index.css`)** — Oppdater light mode tokens:
- `--sidebar-background`: `0 0% 100%` (hvit)
- `--sidebar-foreground`: `232 21% 20%` (cobalt)
- `--sidebar-accent`: `246 10% 90%` (pale-blue hover)
- `--sidebar-accent-foreground`: `232 21% 20%` (cobalt)
- `--sidebar-border`: `220 13% 91%` (#E5E7EB)
- `--card`: `0 0% 100%` (hvit, ikke off-white)
- `--card-foreground`: `232 21% 20%` (cobalt)
- `--background`: `220 14% 96%` (#F6F8FA pale bakgrunn)
- `--muted-foreground`: justert for bedre kontrast

Dark mode tokens forblir uendret.

**2. ASCOLogo tema-bytte (`src/components/ASCOLogo.tsx`)**:
- Importer `useTheme` hook
- Ny prop `autoTheme?: boolean` (default true i sidebar/topbar)
- Light mode: bruk `/logo-dark.png` (cobalt logo), dark mode: bruk `/logo-light.png` (hvit logo)
- Fallback SVG bruker tilsvarende farger

**3. SimpleSidebar (`src/components/SimpleSidebar.tsx`)**:
- Endre `ASCOLogo variant` til `"auto"` (ny variant som bruker useTheme)
- Sidebar bruker allerede `bg-card` og `text-muted-foreground` tokens — disse fikses via CSS-variablene
- Nav-items: aktiv stil bruker `bg-primary text-primary-foreground` (teal+cobalt) — fungerer i begge temaer

**4. ResponsiveLayout topbar (`src/components/layout/ResponsiveLayout.tsx`)**:
- Endre `bg-cobalt` til `bg-white dark:bg-cobalt` for desktop topbar
- Endre `text-primary-foreground` til `text-foreground` for site-selector

**5. CustomerLayout header (`src/components/portal/CustomerLayout.tsx`)**:
- Bruk tema-bevisst logo
- Topbar: `bg-card dark:bg-secondary` for light mode kompatibilitet

### Filer som endres

| Fil | Endring |
|---|---|
| `src/index.css` | Light mode sidebar/card/background CSS tokens |
| `src/components/ASCOLogo.tsx` | Tema-bevisst logobytte via useTheme |
| `src/components/SimpleSidebar.tsx` | Bruk auto-tema logo |
| `src/components/layout/ResponsiveLayout.tsx` | Topbar light mode farger |
| `src/components/portal/CustomerLayout.tsx` | Header light mode farger |

### Hva dette fikser
- Logo synlig i begge temaer
- Sidebar hvit med cobalt tekst i light mode
- Topbar hvit med cobalt tekst i light mode
- Innholdsområde pale bakgrunn med hvite kort
- Alle primærtekst i cobalt, ikke grå-på-grå
- Dark mode uendret

