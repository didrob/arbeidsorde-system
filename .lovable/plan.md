

## Total designoppgradering — Offentlige sider

### Konsept
Alle 4 offentlige sider får alltid-mørk bakgrunn med 5-lags visuell dybde og konsistent hvit/teal tekst. Fjerner alle `isDark`-betingelser fra public pages — de er alltid "mørke".

### Steg 1: Generer bakgrunnsbilde
Bruk Nano Banana til å generere et industrielt logistikk-bilde (container-terminal/havn i mørke blåtoner). Lagres som `public/bg-industrial.webp`. Vises ved 10-15% opacity.

### Steg 2: Oppgrader `PublicLayout.tsx`
Fjern all `isDark`-logikk. Bakgrunnen er alltid mørk uavhengig av tema.

5-lags bakgrunn:
1. **Base:** Cobalt gradient (`#1E2030` → `#292C3F`)
2. **Bilde:** `bg-industrial.webp` med `opacity-[0.12]`, `object-cover`, `fixed`
3. **Overlay:** Mørk gradient top-to-bottom for lesbarhet
4. **Grid:** Teal-linjer ved 6% opacity (CSS `background-image`)
5. **Teal glow:** Radial gradient sentrert, teal ved 6% opacity

Logo alltid hvit (`/logo-dark.png`). Tilbake-lenke alltid `text-white/60`. Footer alltid mørk-modus farger.

### Steg 3: Oppgrader `GlassCard.tsx`
Fjern `isDark`-logikk. Alltid mørk glassmorphism:
- `bg-white/[0.08]`
- `backdrop-blur-[20px]`
- `border border-white/[0.15]`
- Hover: `hover:border-asco-teal/40 hover:shadow-[0_0_30px_rgba(0,253,199,0.08)]`

### Steg 4: Oppgrader `Landing.tsx`
- Fjern alle `isDark` conditionals — alt er hvit/pale-blue/teal
- Logo: Alltid `/logo-dark.png`, `h-14 md:h-20`
- Heading: `text-white`
- Undertekst: `text-pale-blue`
- Ansatt-ikon: `text-white/80`
- Kundeportal-ikon: `text-asco-teal`
- Bokser: Større (`min-h-[200px] min-w-[280px]`)
- Register-lenke: `text-asco-teal`

### Steg 5: Oppgrader `Auth.tsx`
- Fjern `isDark` conditionals
- Logo alltid `/logo-dark.png`
- Labels: `text-white/80`
- Inputs: `bg-white/10 border-white/20 text-white`
- "Ansattportal" tekst: `text-pale-blue`

### Steg 6: Oppgrader `PortalLogin.tsx`
- Fjern `isDark` conditionals
- Samme mørk-only styling
- Lokasjonskort og login-kort: hvit tekst, teal ikoner

### Steg 7: Oppgrader `RegisterCustomer.tsx`
- Fjern `isDark` conditionals — alltid mørk styling
- Progress labels: teal for aktive, `text-white/50` for inaktive
- All tekst hvit/pale-blue

### Filer som endres

| Fil | Endring |
|---|---|
| `public/bg-industrial.webp` | Ny: AI-generert bakgrunnsbilde |
| `src/components/public/PublicLayout.tsx` | Alltid mørk, 5-lags bakgrunn |
| `src/components/public/GlassCard.tsx` | Alltid mørk glassmorphism |
| `src/pages/Landing.tsx` | Fjern isDark, hvit/teal styling |
| `src/pages/Auth.tsx` | Fjern isDark, mørk-only |
| `src/pages/portal/PortalLogin.tsx` | Fjern isDark, mørk-only |
| `src/pages/RegisterCustomer.tsx` | Fjern isDark, mørk-only |
| `src/index.css` | Oppdater `.public-bg` klasser |

