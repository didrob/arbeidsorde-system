

## Oppgradering av offentlige sider — Premium bakgrunn og logo-fiks

### Endringer

**`PublicLayout.tsx`** — Utvid bakgrunnen med variant-støtte:
- Legg til prop `variant?: 'landing' | 'form'` (default `'form'`)
- **Felles for begge:** Cobalt base gradient (beholdes som nå)
- **`landing`-variant:** 3 asymmetriske glows:
  1. Teal glow øvre høyre: `radial-gradient(600px 600px at 75% 20%, rgba(0,253,199,0.07), transparent)`
  2. Cobalt-light glow nedre venstre: `radial-gradient(500px 500px at 20% 80%, rgba(50,54,80,0.15), transparent)`
  3. Sentrert glow bak bokser: `radial-gradient(400px 300px at 50% 55%, rgba(0,253,199,0.04), transparent)`
  - Subtilt rounded rectangle: `div` med `border border-white/[0.04] rounded-[32px]` sentrert bak innholdet (~800x500px)
  - Verdenskart: SVG dot-pattern (inline, teal ved 4% opacity) fullbredde bak innhold
- **`form`-variant:** Kun én sentrert teal glow (som nå)
- **Logo-fiks i topbar:** Teal dot flyttes til A-ens venstre ben med `left-0` i stedet for `left-1/2 -translate-x-1/2`. Reduser tracking til `tracking-[0.15em]`

**`Landing.tsx`** — Logo og bokser:
- Hero-logo: Samme dot-fiks (venstre ben), reduser tracking til `tracking-[0.15em]`
- Bokser: Øk padding til `px-12 py-14`, bredde `w-[280px]`, legg til `hover:-translate-y-0.5 transition-all duration-300`
- Undertekst `whitespace-nowrap` for å hindre wrap

**`Auth.tsx`** og **`PortalLogin.tsx`** — Logo dot-fiks:
- Samme dot-posisjonering som over

**Verdenskart SVG:** Liten inline SVG-komponent med ~50 sirkler (r=1.5, fill teal, opacity 4%) plassert i et verdenskart-mønster. Rendres som absolutt posisjonert bak innhold kun på landing.

### Filer

| Fil | Endring |
|---|---|
| `src/components/public/PublicLayout.tsx` | Variant-prop, 3 glows, rounded rect, verdenskart SVG |
| `src/pages/Landing.tsx` | Logo-fiks, større bokser, hover-løft |
| `src/pages/Auth.tsx` | Logo dot-fiks |
| `src/pages/portal/PortalLogin.tsx` | Logo dot-fiks |

