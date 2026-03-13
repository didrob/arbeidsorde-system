

## Fix: Kontrastproblem på offentlige sider

### Rotårsak

`PublicLayout` har to behandlinger basert på `variant`:
- **Landing** (`isLanding=true`): bg-image opacity 0.35, overlay `rgba(41,44,63,0.85)`, + gradient — **fungerer bra**
- **Form** (`isLanding=false`): bg-image opacity 0.15, overlay `bg-asco-cobalt/85`, **ingen gradient** — for lyst

Alle form-sider (`/portal/login`, `/auth`, `/register-customer`) bruker `variant='form'` (default) og får den svakere behandlingen. Kombinert med `GlassCard` sin `bg-white/[0.06]` blir kortene nesten usynlige.

### Løsning

**`PublicLayout.tsx`** — Gjør form-varianten like mørk som landing:
- Bg-image opacity: `0.15` → `0.20` (subtilt industrielt preg)
- Overlay: `bg-asco-cobalt/85` → `bg-[rgba(41,44,63,0.90)]` (mørkere enn landing)
- Legg til gradient også for form: `from-[rgba(30,32,48,0.95)] to-[rgba(41,44,63,0.85)]`

**`GlassCard.tsx`** — Sterkere glassmorphism:
- `bg-white/[0.06]` → `bg-black/40`
- `border-white/[0.12]` → `border-white/20`
- Hover: `border-white/[0.25]` → `border-white/30`

### Filer

| Fil | Endring |
|---|---|
| `src/components/public/PublicLayout.tsx` | Mørkere overlay + gradient for form-variant |
| `src/components/public/GlassCard.tsx` | Sterkere bakgrunn og border |

~6 linjer endret. Fikser `/portal/login`, `/auth`, og `/register-customer` samtidig.

