

## Total redesign — Offentlige sider

### Endringer

**`PublicLayout.tsx`** — Fjern alle 5 lag. Erstatt med:
- Solid cobalt base via Tailwind `bg-cobalt-deep`
- Én radial gradient: `radial-gradient(ellipse at 50% 40%, #323650 0%, #1E2030 70%)` — gir myk dybde
- Valgfri teal glow: `radial-gradient(ellipse 500px 300px at 50% 55%, rgba(0,253,199,0.035) 0%, transparent 70%)`
- Topbar: Ren HTML/CSS ASCO-logo (hvit tekst + teal dot) i stedet for img-tag som ikke rendres

**Topbar-logo (liten versjon):**
```
<span class="font-heading text-xl font-bold tracking-[0.2em] text-white">
  <span class="relative">A<span class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-asco-teal" /></span>SCO
</span>
```

**`Landing.tsx`** — Ny layout:
- Stor sentrert ASCO-logo i ren HTML/CSS (font-heading, text-5xl, bold, tracking-[0.3em], hvit + teal dot 12px)
- 32px gap → heading `text-white font-heading text-2xl md:text-[32px]`
- Undertekst `text-pale-blue text-base`
- 48px gap → to bokser inline (ikke GlassCard-komponent, direkte styling):
  - `bg-white/[0.06] border border-white/[0.12] rounded-[16px] p-12 w-[260px] h-[220px]`
  - Hover: `hover:border-white/30` (ansatt), `border-[rgba(0,253,199,0.3)] hover:border-asco-teal` (kundeportal)
  - Ingen backdrop-blur
- Register-lenke, footer

**`GlassCard.tsx`** — Fjern `backdrop-blur`. Behold som utility men med enklere styling:
- `bg-white/[0.06] border border-white/[0.12] rounded-[16px]`
- Ingen blur, ingen shadow
- Brukes fortsatt av Auth, PortalLogin, RegisterCustomer

**`Auth.tsx`** — Erstatt `<img>` logo med HTML/CSS ASCO-logo (mindre versjon)

**`PortalLogin.tsx`** — Samme: erstatt img-logo med HTML/CSS versjon

**`index.css`** — Fjern `.public-bg`, `.public-bg-light`, `.public-grid-pattern`, `.public-grid-pattern-light` utilities (ikke lenger nødvendig)

### Filer

| Fil | Endring |
|---|---|
| `src/components/public/PublicLayout.tsx` | Fjern 5 lag, ren gradient + teal glow |
| `src/components/public/GlassCard.tsx` | Fjern backdrop-blur |
| `src/pages/Landing.tsx` | Ny layout med HTML/CSS logo |
| `src/pages/Auth.tsx` | HTML/CSS logo i kort |
| `src/pages/portal/PortalLogin.tsx` | HTML/CSS logo i kort |
| `src/index.css` | Rydd opp ubrukte utilities |

`RegisterCustomer.tsx` trenger ingen endringer — den bruker allerede GlassCard og PublicLayout korrekt.

