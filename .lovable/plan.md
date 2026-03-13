

## Konsolidere UI-komponenter, mobil navigasjon og responsive tabeller

### DEL 1 — Erstatte non-ASCO farger

Fant ~17 filer som bruker default Tailwind-farger (blue-500, green-600, amber-500, etc.). Disse skal erstattes med ASCO designsystem-farger.

**Fargekartlegging:**
```text
blue-500/600/50/700  → primary-text / accent / muted (info-kontekst)
green-500/600/50     → status-complete
amber-500/600        → status-active (warning)
red-500              → destructive
orange-600/50        → status-active
```

**Filer som endres:**

| Fil | Endring |
|---|---|
| `WorkOrderDetails.tsx` | blue-50/600 → accent/primary-text, green-50/600 → status-complete, orange → status-active |
| `FieldWorkerDashboard.tsx` | blue-600 → primary-text, amber-600 → status-active, green-600 → status-complete, border-l-blue/green → border-l-primary/status-complete |
| `NotificationCenter.tsx` | blue-500 → primary-text, green-500 → status-complete |
| `OrderBlock.tsx` | blue-500 → asco-teal, amber-500 → status-active, green-500 → status-complete |
| `PlanningStep.tsx` | blue-50/600/700 → accent bg + foreground, green-50/200/900 → status-complete |
| `DocumentationStep.tsx` | blue-500 → primary-text, green-500 → status-complete, blue-50 tips → accent |
| `WorkOrderCompletionDialog.tsx` | green-500 → status-complete |
| `MobileFieldWorker.tsx` | green-50/200/700 → status-complete-varianter |
| `InvoiceDetailsDialog.tsx` | green-600/50 → status-complete |
| `Settings.tsx` | green-500/50/200/900 → status-complete, red-500 → destructive |
| `Map.tsx` | blue-600 → primary-text, green-600 → status-complete |

**Nye CSS-hjelpeklasser i `index.css`** for å unngå inline-farger:
- `.bg-info` / `.text-info` → accent-bakgrunn + primary-text tekst (erstatter blue-50/blue-600 mønsteret)
- `.bg-success-subtle` → status-complete med lav opacity

### DEL 2 — Mobil Bottom Navigation

Eksisterende `MobileNav.tsx` har 5 tabs. Oppdateres til nytt design:

**4 tabs + fremhevet FAB:**
1. **Hjem** — `LayoutDashboard` ikon, route `/`
2. **Oppdrag** — `ClipboardList` ikon, route `/work-orders`
3. **+ Ny** — Stor teal sirkel (56px), løftet over baren med `-translate-y-4`, åpner WorkOrderWizard
4. **Profil** — `User` ikon, route `/settings`

**Design:**
- Bakgrunn: `bg-card` (hvit i light, cobalt i dark via CSS vars)
- Aktiv tab: `text-primary-text` (mørkere teal for lesbarhet)
- Inaktive: `text-muted-grey`
- Safe area: `pb-safe-bottom` (allerede definert i tailwind.config)
- Fjern `GlobalWorkOrderButton` FAB på mobil (erstattes av "+" i bottom nav)

**Endringer:**
- `MobileNav.tsx` — Redesigne med 4 tabs + sentral FAB
- `GlobalWorkOrderButton.tsx` — Skjule mobil-FAB (bottom nav har "+" nå)
- `ResponsiveLayout.tsx` — Fjerne separat FAB-rendering for mobil

### DEL 3 — Responsive Tabell → Kort

`MobileDataTable.tsx` eksisterer allerede med expand/collapse mønster. Oppdatere den + integrere i sider som bruker tabeller.

**Endringer i `MobileDataTable.tsx`:**
- Kort bruker `rounded-brand shadow-brand-sm`
- Primærfelt (tittel, status) alltid synlig
- Sekundærfelt bak "Vis mer" accordion
- Touch-vennlig med `min-h-touch`

**Sider som trenger mobil-kort:**
- `WorkOrders.tsx` — Allerede har GridView for mobil, men TabellView bør auto-switche til kort på mobil
- `Customers.tsx` — Allerede kort-layout, OK
- `Materials.tsx` — Enkel grid, kan forbedres med `MobileDataTable`

**Tilnærming:** I `WorkOrderTableView` — wrapp i `useIsMobile()` sjekk, vis stablede kort med tittel + status synlig, kunde + dato bak "Vis mer".

### Filer

| Fil | Type |
|---|---|
| `src/components/mobile/MobileNav.tsx` | Redesign |
| `src/components/GlobalWorkOrderButton.tsx` | Fjern mobil FAB |
| `src/components/layout/ResponsiveLayout.tsx` | Oppdater mobil layout |
| `src/index.css` | Legg til utility-klasser |
| `src/components/WorkOrderDetails.tsx` | Fargefiks |
| `src/components/FieldWorkerDashboard.tsx` | Fargefiks |
| `src/components/NotificationCenter.tsx` | Fargefiks |
| `src/components/planner/OrderBlock.tsx` | Fargefiks |
| `src/components/workorder-wizard/steps/PlanningStep.tsx` | Fargefiks |
| `src/components/workorder-wizard/steps/DocumentationStep.tsx` | Fargefiks |
| `src/components/WorkOrderCompletionDialog.tsx` | Fargefiks |
| `src/components/MobileFieldWorker.tsx` | Fargefiks |
| `src/components/invoices/InvoiceDetailsDialog.tsx` | Fargefiks |
| `src/pages/Settings.tsx` | Fargefiks |
| `src/pages/Map.tsx` | Fargefiks |
| `src/components/workorders/WorkOrderTableView.tsx` | Responsiv kort-modus |
| `src/components/mobile/MobileDataTable.tsx` | Standardisering |

