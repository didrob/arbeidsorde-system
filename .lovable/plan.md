

## Designsystem-fundament — ASCO Brand Guidelines

### Oversikt
Erstatte dagens generiske HSL-baserte fargesystem med ASCO sine offisielle brand-farger, fonter, og design tokens. Alt samles i CSS custom properties + Tailwind config som eneste kilde til sannhet.

### Endringer

**`tailwind.config.ts`** — Komplett overhaul av `extend`:
- **Farger**: Erstatt eksisterende med ASCO brand-farger via CSS variables:
  - `cobalt` med varianter: `deep` (#1E2030), `DEFAULT` (#292C3F), `light` (#323650), `lighter` (#3C4165)
  - `pale-blue` (#CFCED8)
  - `teal` (#00FDC7) — aksent/CTA
  - `muted-grey` (#8F8C90)
  - Status: `status-new`, `status-active`, `status-complete`, `status-urgent`, `status-waiting`
  - Behold shadcn semantiske farger (`primary`, `secondary`, `card`, etc.) men map til ASCO-verdier
- **Fonter**: `fontFamily.heading` (PP Neue Machina), `fontFamily.body` (TT Commons Pro, Arial)
- **Spacing**: `touch` → 56px
- **Border radius**: `brand` → 8px
- **Shadows**: `brand-sm`, `brand-lg`

**`src/index.css`** — Fullstendig rewrite av `:root` og `.dark`:
- Light mode: Hvit/pale-blue bakgrunner, cobalt tekst, teal aksent
- Dark mode: Cobalt-varianter som bakgrunner, hvit/pale-blue tekst, teal aksent
- Map shadcn CSS variables (`--primary`, `--card`, etc.) til ASCO-farger
- `@font-face` for TT Commons Pro (400, 600) og PP Neue Machina (400) — self-hosted i `/public/fonts/` med fallback til Google Fonts CDN
- Base styles: `font-body`, antialiased, smooth 150ms color transitions, min font 14px
- Teal focus outline (2px) for alle interaktive elementer

**`src/lib/theme.ts`** — Ny fil:
- TypeScript types: `Theme`, `BrandColor`, `StatusColor`
- `BRAND_COLORS` const med alle hex-verdier som referanse
- `getStatusColor(status)` helper

**`src/hooks/useTheme.ts`** — Ny fil:
- Wrapper rundt `next-themes` (allerede installert) med typed API
- `theme`, `setTheme`, `isDark`, `isLight`, `toggleTheme`

**`index.html`**:
- Oppdater `theme-color` meta til `#292C3F`
- Legg til font preloads for TT Commons Pro og PP Neue Machina

### Font-strategi
TT Commons Pro og PP Neue Machina er kommersielle fonter uten gratis CDN. Plan:
1. Legg til `@font-face`-deklarasjoner med paths til `/fonts/` (for når fontfilene er tilgjengelige)
2. Bruk Arial som fungerende fallback umiddelbart
3. Fontene vil fungere med en gang fontfilene plasseres i `/public/fonts/`

### Viktige beslutninger
- Shadcn-komponentene beholder sine CSS variable-navn (`--primary`, `--card`, etc.) men verdiene endres til ASCO-farger — dette sikrer at alle eksisterende komponenter umiddelbart får ny styling uten kodeendringer
- Teal brukes som `--primary` (CTA), cobalt som `--secondary`
- Ingen default Tailwind-farger — kun ASCO brand tokens

