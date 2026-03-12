

## Global «Ny arbeidsordre»-knapp

### Oversikt
Legge til en global knapp for å opprette arbeidsordrer som alltid er synlig, uavhengig av hvilken side brukeren er på. Desktop: i en ny topbar. Mobil: FAB i nedre høyre hjørne. Wizarden åpnes som slide-in panel fra høyre.

### Nye filer

**`src/contexts/WorkOrderWizardContext.tsx`**
- React context med `openWizard()` / `closeWizard()` / `isOpen` state
- Wraps hele appen i `App.tsx`
- Keyboard shortcut "N" listener (ignorerer når input/textarea har fokus)

**`src/components/GlobalWorkOrderButton.tsx`**
- Desktop: Knapp med tekst «+ Ny ordre» — ASCO teal bg (`bg-[#00FDC7]`), cobalt tekst (`text-[#292C3F]`), `rounded-lg`
- Mobil: FAB 56x56px i nedre høyre hjørne, rund, fast posisjonert, z-50
- Bruker `useWizardContext()` for å åpne wizarden

**`src/components/GlobalWorkOrderWizardPortal.tsx`**
- React portal som rendrer til `document.body`
- Lazy loader `WorkOrderWizard` med `React.lazy()`
- Slide-in fra høyre: 480px bredde desktop, fullskjerm mobil
- Overlay med backdrop, 200ms ease-out animasjon
- Toast-bekreftelse etter opprettelse via `sonner`

### Endringer i eksisterende filer

**`src/App.tsx`**
- Wrap med `<WorkOrderWizardProvider>` inne i `AuthProvider`
- Legg til `<GlobalWorkOrderWizardPortal />` som sibling til `<Routes>`

**`src/components/layout/ResponsiveLayout.tsx`**
- Desktop: Legg til en topbar over main-content med cobalt bakgrunn (`bg-[#292C3F]`), som inneholder `<GlobalWorkOrderButton />` til høyre
- Mobil: Render `<GlobalWorkOrderButton />` som FAB (fixed position)

**`src/components/workorder-wizard/WorkOrderWizard.tsx`**
- Legg til «Lagre som kladd»-knapp i footer ved siden av «Opprett»
- Eksporter som default for lazy loading

### Teknisk
- Lazy loading via `React.lazy()` + `Suspense`
- Portal via `createPortal()`
- Context for state — ingen prop drilling
- Alle farger som Tailwind arbitrary values, ingen inline styles
- Z-index: `z-[60]` for modal overlay

