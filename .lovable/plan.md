

## Fix ASCO-logoen: Custom A uten midtstrek + teal prikk

### Problem
Alle steder ASCO-logoen rendres bruker en vanlig font-A med horisontal tverrstrek. ASCO sin A skal være en omvendt V (teltform) uten midtstrek, med en teal prikk rett under venstre ben.

### Steder som må fikses (5 stk)

| Fil | Bruk |
|---|---|
| `src/components/ASCOLogo.tsx` | Sidebar + mobil header (text fallback) |
| `src/components/public/PublicLayout.tsx` | Topbar på offentlige sider |
| `src/pages/Landing.tsx` | Stor hero-logo |
| `src/pages/portal/PortalLogin.tsx` | Kundeportal login |
| `public/favicon.svg` | Favicon |

### Løsning

**1. Lag en felles inline SVG-komponent** (`src/components/AscoLogoMark.tsx`)

Rendrer hele "ASCO"-teksten som SVG med:
- A som to linjer (omvendt V, ingen crossbar) — `<path d="M0,H L W/2,0 L W,H" />` stil
- "SCO" som vanlig SVG-tekst
- Teal sirkel (r=4-5) posisjonert rett under A-ens venstre fot
- Props: `size` (height), `color` (white/cobalt), `className`

**2. Oppdater alle 4 komponentfiler** til å bruke `<AscoLogoMark>` i stedet for font-basert tekst.

**3. Oppdater `public/favicon.svg`** med SVG-path for A uten crossbar (to linjer som møtes i toppen) + teal sirkel.

### Teknisk detalj — SVG A-path

```text
  /\
 /  \      ← Ingen tverrstrek
/    \
●        ← Teal dot under venstre fot
```

SVG path: `M 2 24 L 11 4 L 20 24` (stroke, no fill) for favicon.
For komponent-logoen skaleres dette relativt til `size`-prop.

