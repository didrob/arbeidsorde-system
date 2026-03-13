

## To fikser: Kontrastproblem + Dark/Light Toggle

### FIX 1 — Kontrastproblem med teal tekst

**Problem:** `--primary` er teal (#00FDC7) som gir ~1.6:1 kontrast mot hvit — langt under WCAG AA (4.5:1).

**Løsning:** Legge til en `--primary-text` CSS-variabel med mørkere teal (#0D9488, ~4.6:1 kontrast mot hvit) for tekst-bruk, og oppdatere alle steder som bruker `text-primary` for verdier/tall til å bruke `text-foreground` eller ny `text-primary-text`.

**Endringer i `src/index.css`:**
- Legge til `--primary-text: 168 80% 30%` i `:root` (tilsvarer #0D9488)
- I `.dark`: `--primary-text: 167 100% 50%` (teal er OK mot mørk bg)

**Endringer i `tailwind.config.ts`:**
- Legge til `"primary-text": "hsl(var(--primary-text))"` under colors

**Filer som bruker `text-primary` for tallverdier som må fikses:**
- `src/pages/TimeTracking.tsx` (linje 188): "8.0 t" → `text-foreground`
- `src/components/MobileFieldWorker.tsx` (linje 370, 520): timer-display → `text-foreground`
- `src/components/QuickStartModal.tsx` (linje 455): kostnad → `text-foreground`
- `src/pages/Dashboard.tsx` (linje 467, 670): ranking-tall → `text-foreground`
- Ikoner med `text-primary` (Dashboard, PricingModelStep) er OK — ikoner har tykkere streker

### FIX 2 — Dark/Light Mode Toggle

**Problem:** `next-themes` ThemeProvider er ikke satt opp i App.tsx. `useTheme`-hooken eksisterer men vil ikke fungere uten provider.

**Løsning:**

**`src/App.tsx`:**
- Importere `ThemeProvider` fra `next-themes`
- Wrappe hele appen med `<ThemeProvider attribute="class" defaultTheme="system" storageKey="asco-theme">`
- `storageKey` sikrer localStorage-lagring
- `attribute="class"` matcher Tailwind's `darkMode: ["class"]`

**Ny komponent: `src/components/ThemeToggle.tsx`:**
- Bruker `useTheme`-hooken
- Sun-ikon (light) / Moon-ikon (dark)
- `Button variant="ghost"` med hvit foreground (topbar er cobalt)
- Klikk kaller `toggleTheme()`

**`src/components/layout/ResponsiveLayout.tsx`:**
- Desktop topbar (linje 74): Legge til `<ThemeToggle />` til venstre for `<GlobalWorkOrderButton />`

**Default tema-logikk:**
- `defaultTheme="system"` i ThemeProvider — lar nettleserens prefers-color-scheme bestemme
- Desktop brukere med system dark preference → dark mode
- Mobil brukere med system light preference → light mode
- Brukeren kan alltid overstyre, og valget lagres i localStorage

### Filer

| Fil | Handling |
|---|---|
| `src/index.css` | Legg til `--primary-text` variabel |
| `tailwind.config.ts` | Legg til `primary-text` farge |
| `src/App.tsx` | Wrap med ThemeProvider |
| `src/components/ThemeToggle.tsx` | Ny komponent |
| `src/components/layout/ResponsiveLayout.tsx` | Legg til toggle i topbar |
| `src/pages/TimeTracking.tsx` | Fix text-primary → text-foreground |
| `src/components/MobileFieldWorker.tsx` | Fix text-primary → text-foreground |
| `src/components/QuickStartModal.tsx` | Fix text-primary → text-foreground |
| `src/pages/Dashboard.tsx` | Fix text-primary → text-foreground |

