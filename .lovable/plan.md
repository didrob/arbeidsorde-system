

## ASCO-logo i applikasjonen

### Oversikt
Legge til ASCO-logoen i toppen av applikasjonen — i sidebar for desktop og som header for mobil. Logoene `logo-light.png` (hvit) og `logo-dark.png` (cobalt) finnes allerede i `/public/`.

### Analyse av eksisterende struktur
- **Desktop**: `SimpleSidebar.tsx` har "WorkFlow" header — erstattes med ASCO-logo
- **Mobil**: `ResponsiveLayout.tsx` har ingen header — legges til med logo
- **TopBar**: Side-spesifikk, skal ikke ha global logo

### Implementasjon

**Ny fil: `src/components/ASCOLogo.tsx`**
Gjenbrukbar logo-komponent som:
- Viser `logo-light.png` på mørk/cobalt bakgrunn (desktop sidebar)
- Viser `logo-dark.png` på lys/hvit bakgrunn (mobil header)
- Fallback: "ASCO" i `font-heading` med teal dot under A
- 40px høyde, beholder aspect ratio
- Klikkbar, navigerer til `/`

**Endringer i `SimpleSidebar.tsx`**
- Erstatte "WorkFlow" header (linje 47-57) med `<ASCOLogo />`
- Beholder samme padding og struktur

**Endringer i `ResponsiveLayout.tsx`**
- For mobil/feltarbeider: Legge til header med logo øverst
- Header: `bg-cobalt` med `ASCOLogo` til venstre
- GlobalWorkOrderButton beholdes (høyre side på desktop, FAB på mobil)

**Teknisk**
- Bruker Tailwind `dark:` modifier for automatisk temabytte
- Ingen inline styles — kun Tailwind classes
- `useTheme` hook for å sjekke `isDark` hvis nødvendig

### Filer
- **Ny**: `src/components/ASCOLogo.tsx`
- **Endret**: `SimpleSidebar.tsx`, `ResponsiveLayout.tsx`

