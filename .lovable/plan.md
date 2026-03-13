

## Designoppgradering — Alle offentlige sider

### Konsept

Lage en felles `PublicLayout`-komponent med delt bakgrunn, topbar og footer som wrapper alle 4 offentlige sider. Alle sider får glassmorphism-kort og konsistent ASCO-branding.

### Nye filer

**`src/components/public/PublicLayout.tsx`**
- Felles bakgrunn: Cobalt gradient med CSS-basert geometrisk grid-mønster (subtile firkanter i ulike opaciteter via `background-image: repeating-linear-gradient(...)` eller SVG pattern)
- Light mode: Pale-blue/hvit gradient med mørkere grid-linjer
- Topbar: Logo venstre (hvit på mørk bg, cobalt på lys), ThemeToggle høyre, "← Tilbake" på undersider
- Footer: Kontaktinfo + hasteordre (kun på landing, valgfri prop)
- Props: `showBack?: boolean`, `showFooter?: boolean`, `children`

**`src/components/public/GlassCard.tsx`**
- Glassmorphism-kort: `bg-white/5 dark:bg-white/5 bg-white/80 backdrop-blur-xl border border-white/10 dark:border-white/10 border-border/50 rounded-brand shadow-brand-lg`
- Tilpasser seg begge temaer via CSS variables
- Gjenbrukes på alle 4 sider

### CSS-tillegg i `index.css`

Nye utility-klasser:
```css
.public-bg {
  background: linear-gradient(135deg, hsl(var(--cobalt-deep)), hsl(var(--cobalt)), hsl(var(--cobalt-light)));
  /* Light mode override via .light-public-bg or theme-aware approach */
}
.public-grid-pattern {
  background-image: 
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}
.glass-card {
  @apply backdrop-blur-xl rounded-brand shadow-brand-lg;
  /* theme-aware bg/border via CSS vars */
}
```

Light mode bakgrunn: `bg-gradient-to-br from-pale-blue/30 via-background to-accent` med mørkere grid.

### Endringer per side

**Landing.tsx (`/`):**
- Wrap i `PublicLayout showFooter`
- Logo større (h-16), sentrert
- Heading i `font-heading text-3xl md:text-4xl text-white dark:text-white` (på mørk bg alltid hvit)
- To bokser → `GlassCard` med hover:border-asco-teal transition
- Ansatt-boks: Users-ikon, glass-stil
- Kundeportal-boks: Teal accent `border-asco-teal/30` for å markere primær
- Register-lenke i `text-asco-teal`
- Footer med klikkbart telefonnummer (`<a href="tel:+4738395700">`)

**Auth.tsx (`/auth`):**
- Fjern truck-bakgrunn import og inline style
- Wrap i `PublicLayout showBack`
- Kort → `GlassCard`, ASCO-logo (img) øverst i kortet, "Ansattportal" undertekst
- Fjern "Opprett konto"-toggle — ansatte kan ikke selvregistrere, endre til "Kontakt administrator"
- Input-felt: Legg til `bg-white/10 dark:bg-white/10 border-white/20` for kontrast på glass

**PortalLogin.tsx (`/portal/login`):**
- Wrap i `PublicLayout showBack`
- Lokasjonsknapper → 4 `GlassCard`-mini med hover-glow, valgt = `border-asco-teal ring-2 ring-asco-teal/30`
- Login-kort → `GlassCard` med logo + "Kundeportal" undertekst

**RegisterCustomer.tsx (`/register-customer`):**
- Fjern egen header (cobalt topbar)
- Wrap i `PublicLayout showBack`
- Wizard-kort → `GlassCard`
- Progress bar forblir, sjekk kontrast

### Tekst-kontrast på bakgrunn

Siden bakgrunnen er mørk (cobalt) i dark mode og lys i light mode:
- PublicLayout setter tekst-kontekst: på mørk bg → `text-white`, på lys bg → `text-foreground`
- GlassCard innhold: I dark mode `text-white`, light mode `text-foreground`
- Input-felt i glass-kort: Eksplisitt `bg-background/80 border-border` for å sikre lesbarhet uansett tema

### Filer som endres

| Fil | Endring |
|---|---|
| `src/components/public/PublicLayout.tsx` | Ny: felles layout |
| `src/components/public/GlassCard.tsx` | Ny: glassmorphism-kort |
| `src/index.css` | Nye utility-klasser for bakgrunn og grid |
| `src/pages/Landing.tsx` | Redesign med PublicLayout + GlassCard |
| `src/pages/Auth.tsx` | Fjern truck-bg, bruk PublicLayout + GlassCard |
| `src/pages/portal/PortalLogin.tsx` | Bruk PublicLayout + GlassCard |
| `src/pages/RegisterCustomer.tsx` | Fjern egen header, bruk PublicLayout + GlassCard |

