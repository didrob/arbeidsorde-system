

## Fix: Bakgrunnsbilde synlig på alle offentlige sider

### Problem

Bakgrunnsbildet (`bg-industrial.jpg`) rendres, men er usynlig fordi:
1. Bildet har `opacity-[0.20]` (form) / `opacity-[0.35]` (landing)
2. Oppå dette ligger et cobalt overlay med 85-90% opacity
3. Netto synlighet: ~2-5% — praktisk talt usynlig

### Løsning

Juster opacity-verdier i `PublicLayout.tsx` for å gjøre bildet subtilt synlig:

| Element | Nåværende (landing / form) | Nytt (landing / form) |
|---|---|---|
| Bilde opacity | 0.35 / 0.20 | 0.50 / 0.35 |
| Cobalt overlay | 0.85 / 0.90 | 0.65 / 0.75 |
| Gradient from | 0.95 | 0.85 |

Dette gir et subtilt industrielt bilde i bakgrunnen mens tekst forblir lesbar.

### Fil

`src/components/public/PublicLayout.tsx` — oppdater opacity-verdier på linje 39-40, 47 og 53-55.

