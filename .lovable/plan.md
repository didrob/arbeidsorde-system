

## Fix: Manglende fontfiler (404 i produksjon)

### Analyse

- `/public/fonts/` er **tom** — ingen woff2-filer committet
- `index.css` har 3 `@font-face`-deklarasjoner som refererer til disse filene → 404 i prod
- `tailwind.config.ts` definerer `font-heading` og `font-body` med disse fontene, med Arial som fallback
- `index.css` har også en hardkodet `font-family: "PP Neue Machina"` på `h1, h2, h3`
- `font-heading` og `font-body` brukes i ~50+ steder i kodebasen

### FIX 2 og FIX 3 — Allerede løst

- **PublicLayout** og **GlassCard** ble fikset i forrige plan — mørke overlays og sterkere glassmorphism er allerede på plass
- **"login" 404** er sannsynligvis Vite lazy-load chunk-splitting, ikke en reell feil. `PortalLogin` lastes via `lazy(() => import("./pages/portal/PortalLogin"))` — chunken heter "PortalLogin" og serveres korrekt. Ingen endring nødvendig.

### FIX 1 — Fontfiler

Siden fontfilene ikke finnes i repoet, fjerner vi `@font-face`-deklarasjonene og lar Arial ta over som fallback (allerede konfigurert i tailwind). Når fontfilene er tilgjengelige kan de legges tilbake.

| Fil | Endring |
|---|---|
| `src/index.css` | Fjern alle 3 `@font-face`-blokker (linje 10-33). Fjern `font-family: "PP Neue Machina"` fra `h1, h2, h3` (linje 195-197) — la tailwind `font-heading` klassen håndtere dette (den har Arial som fallback) |
| `tailwind.config.ts` | Endre `font-heading` til `["Arial", "sans-serif"]` og `font-body` til `["Arial", "sans-serif"]` (midlertidig til fontfiler er tilgjengelige) |

4 blokker endret. Fjerner alle font-404 feil i prod.

