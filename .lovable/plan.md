

## Fix feltarbeider-visningen — 3 problemer

### FIX 1: Duplikat pluss-knapp

**Problem:** `MobileFieldWorker.tsx` linje 664 rendrer `<QuickOrderFAB>` som en floating action button. Bottom nav (`MobileNav.tsx`) har allerede en sentral "+" knapp.

**Løsning:** Fjern `QuickOrderFAB`-import og rendering fra `MobileFieldWorker.tsx` (linje 27, 664). Behold `QuickOrderSheet` (linje 665) — den åpnes nå fra bottom nav.

### FIX 2: Desktop skal IKKE vise feltarbeider-view

**Problem:** `useIsMobile()` returnerer `true` på touch-enabled desktop (linje 11: `hasTouch || isSmallScreen`). `useSmartRouting` ruter field_workers til `/field` uansett skjermstørrelse. `ResponsiveLayout` gir field workers alltid mobil-layout (linje 30).

**Løsning:**

1. **`use-mobile.tsx`**: Fjern touch-prioritering. Bruk kun `window.innerWidth < 768` for å avgjøre mobil vs desktop. Touch-enabled laptops/desktops skal IKKE behandles som mobil.

2. **`useSmartRouting.tsx`**: Rut field workers til `/field` KUN på mobil. På desktop ruter de til `/` (admin-dashboard) som alle andre.

3. **`ResponsiveLayout.tsx`**: Fjern `isFieldWorker`-sjekken som tvinger mobil-layout. La `isMobile` alene styre layout. Field workers på desktop får sidebar + topbar som alle andre.

4. **`App.tsx` (`ProtectedRoute`)**: Fjern `isFieldWorker`-sjekken som tvinger `ResponsiveLayout showMobileNav={true}`. Alle brukere på desktop får `showMobileNav={false}`.

5. **`Index.tsx`**: Fjern `window.location.href = '/field'` redirect. Field workers på desktop ser admin-dashboard.

### FIX 3: Layout-opprydding feltarbeider

**`MobileFieldWorker.tsx`:**
- **Hurtigstart-kort** (linje 388): Bytt `bg-primary/5 border-primary/20` → `bg-cobalt text-white`. Teksten "Start en ny jobb" blir hvit for god kontrast.
- **Ingen ordrer-kort** (linje 486): Fjern spesialstyling, bruk standard `Card` med `shadow-brand-sm`.
- **Header** (linje 259): Erstatt "Dagens Arbeid"-header med ASCO-logo venstre + dato høyre. Fjern egen header — bruk `ResponsiveLayout`-headeren (cobalt topbar med logo) som allerede er der.

**`MobileNav.tsx`:** Øk ikon-størrelse fra `h-5 w-5` → `h-6 w-6` og label fra `text-[10px]` → `text-xs` for bedre lesbarhet.

### Filer som endres

| Fil | Endring |
|---|---|
| `src/hooks/use-mobile.tsx` | Kun skjermbredde, fjern touch-sjekk |
| `src/hooks/useSmartRouting.tsx` | Field workers → `/field` kun på mobil |
| `src/components/layout/ResponsiveLayout.tsx` | Fjern isFieldWorker-override |
| `src/components/MobileFieldWorker.tsx` | Fjern FAB, fiks hurtigstart-kort, fjern redundant header |
| `src/components/mobile/MobileNav.tsx` | Større ikoner/labels |
| `src/App.tsx` | Fjern isFieldWorker-layout-override i ProtectedRoute |
| `src/pages/Index.tsx` | Fjern field worker redirect |

