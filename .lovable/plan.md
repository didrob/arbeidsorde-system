

## To fikser: Logo-synlighet + Dobbel knapp

### FIX 1 — Logo-synlighet

**Problem:** `ASCOLogo` bruker `variant` prop for å velge bilde, men på desktop sidebar (mørk bg) brukes `variant="dark"` som viser cobalt logo mot cobalt bakgrunn — usynlig.

**Løsning:** Oppdater `ASCOLogo.tsx`:
- Sidebar bruker allerede `variant="dark"` — dette er feil. Sidebar har mørk bakgrunn, trenger lys logo.
- Men det virkelige problemet: Sidebar er alltid cobalt (mørk), uavhengig av tema. Topbar er også alltid cobalt. Så logo bør alltid være `variant="light"` der.
- For tekst-fallbacken: Legg til `text-white` (sidebar/topbar er alltid cobalt-bg) og `dark:text-white` for safety.

Sjekk `SimpleSidebar.tsx` — den bruker `variant="dark"` som er problemet.

**Endring i `SimpleSidebar.tsx`:** Endre `variant="dark"` → `variant="light"` (sidebar er alltid cobalt bakgrunn).

**Endring i `ASCOLogo.tsx`:** Forbedre tekst-fallback med dynamisk farge basert på variant.

### FIX 2 — Dobbel knapp

**Problem:** `TopBar` har innebygd "Opprett ny"-knapp via `onCreateClick` prop. Denne dupliserer den globale "Ny ordre" i cobalt-topbaren.

**Løsning:**
- **WorkOrders.tsx**: Fjern `onCreateClick` fra TopBar (den globale knappen håndterer dette)
- **Customers.tsx**: Behold `onCreateClick` men endre TopBar til å vise sekundær knapp (outline) med tekst "Ny kunde"  
- **Materials.tsx**: Behold `onCreateClick` men outline-variant med tekst "Nytt material"
- **TopBar.tsx**: Endre knappene til `variant="outline"` og aksepter `createLabel` prop for tekst

| Fil | Endring |
|---|---|
| `SimpleSidebar.tsx` | `variant="dark"` → `variant="light"` |
| `ASCOLogo.tsx` | Forbedre fallback-styling |
| `TopBar.tsx` | Knapp endres til outline-variant, ny `createLabel` prop |
| `WorkOrders.tsx` | Fjern `onCreateClick` |
| `Customers.tsx` | Legg til `createLabel="Ny kunde"` |
| `Materials.tsx` | Legg til `createLabel="Nytt material"` |

