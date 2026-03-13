

## ASCO Branding — Erstatt Lovable-branding

### Analyse

- Ingen "Made with Lovable"-badge i UI-koden — kun dev-tooling (lovable-tagger i vite.config). Ingen synlig branding å fjerne.
- Favicon, meta-tags, manifest og apple-tags trenger oppdatering.
- Kan ikke generere faktiske bildefiler (favicon, PWA-ikoner) — men kan lage SVG-baserte favicons inline.

### Plan

**1. Favicon — SVG-basert (fungerer i alle moderne browsere)**

Lag `public/favicon.svg`: Cobalt bakgrunn (#292C3F), hvit "A" med teal dot. Referer fra `index.html` med `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`. Behold eksisterende `favicon.ico`/`favicon.png` som fallback.

**2. `index.html` — Meta-tags og Apple-tags**

| Tag | Nåværende | Nytt |
|---|---|---|
| `<title>` | Asco Workorder - Arbeidsordresystem | ASCO Workorder |
| `meta description` | Profesjonelt arbeidsordre-... | Arbeidsordre og bestillingsportal for ASCO |
| `meta theme-color` | #292C3F | #292C3F (uendret) |
| `apple-mobile-web-app-title` | Asco Workorder | ASCO |
| OG title | Asco Workorder - Arbeidsordresystem | ASCO Workorder |
| OG description | Profesjonelt arbeidsordre-... | Arbeidsordre og bestillingsportal for ASCO |
| Favicon link | Legg til SVG-favicon som primær | `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` |

**3. `public/manifest.json` — PWA**

| Felt | Nytt |
|---|---|
| name | ASCO Workorder |
| short_name | ASCO |
| description | Arbeidsordre og bestillingsportal for ASCO |
| theme_color | #292C3F |
| background_color | #292C3F |

**4. `vite.config.ts` — VitePWA manifest**

Oppdater samme felter i VitePWA-konfigurasjonen: name, short_name, description, theme_color, background_color til #292C3F.

### Filer

| Fil | Endring |
|---|---|
| `public/favicon.svg` | **Ny** — SVG favicon med ASCO-logo |
| `index.html` | Oppdater title, meta, apple-tags, favicon-link |
| `public/manifest.json` | Oppdater name, short_name, colors |
| `vite.config.ts` | Oppdater VitePWA manifest-felter |

**Merk:** Eksisterende PNG-ikoner (`app-icon-192.png`) beholdes som fallback. For pixel-perfekte PWA-ikoner i 192x192 og 512x512 anbefales det å laste opp egne PNG-filer — SVG-favicon dekker browser-tab og bokmerker.

