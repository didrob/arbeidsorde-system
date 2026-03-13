

## Bakgrunnsbilde-oppgradering — Offentlige sider

### Hva gjøres

1. **Generer bakgrunnsbilde** med AI: Industriarbeider med tablet i havne-/lagermiljø, mørke blåtoner, desaturert
2. **Oppdater `PublicLayout.tsx`**:
   - Fjern `WorldMapDots`-komponenten helt
   - Fjern alle teal glows, cobalt glows, rounded rectangle frame
   - Behold cobalt base-gradient som fallback
   - Legg til `<img>` med generert bilde: `absolute inset-0 w-full h-full object-cover object-center opacity-[0.35]`
   - Landing-variant: Cobalt overlay ved 75% opacity (`bg-[rgba(41,44,63,0.75)]`)
   - Form-variant: Sterkere overlay ved 85% opacity (`bg-[rgba(41,44,63,0.85)]`)

### Filer

| Fil | Endring |
|---|---|
| `public/bg-industrial.webp` | Ny: AI-generert bakgrunnsbilde |
| `src/components/public/PublicLayout.tsx` | Fjern dots/glows/frame, legg til bilde + overlay |

Alt annet (logo, bokser, tekst, layout) forblir uendret.

