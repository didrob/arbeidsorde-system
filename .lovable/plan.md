

## Fix: Mobil FAB-duplisering

### Analyse

- **`QuickOrderFAB.tsx`** — Standalone floating button (`fixed bottom-20 right-4 z-50`). Definert men **aldri importert** noe sted. Død kode som bør slettes.
- **`GlobalWorkOrderButton`** — Returnerer allerede `null` på mobil. Kun rendret i desktop topbar. OK.
- **`MobileNav`** — Har den korrekte sentrale FAB-knappen integrert i bottom nav. Posisjonert `fixed bottom-0`, full bredde, med `safe-area-inset-bottom`. OK.
- **`GlobalWorkOrderWizardPortal`** — Wizard-panel, ikke en FAB. OK.

### Problem

`QuickOrderFAB.tsx` er død kode — den importeres ikke og rendres ikke. Hvis brukeren ser en "tilfeldig" grønn pluss-knapp, kan det skyldes at `MobileNav`-knappen med `-mt-4` forhøyning ser visuelt feilplassert. Alternativt kan `MobileFieldWorker`-komponenten (brukt på `/field`-ruten) ha sin egen FAB-logikk.

`/field`-ruten bruker **ikke** `ProtectedRoute` (og dermed ikke `ResponsiveLayout`/`MobileNav`), men wrapper seg selv i `ResponsiveLayout`. Det betyr MobileNav rendres der også — dette er korrekt.

### Plan

| Fil | Endring |
|---|---|
| `src/features/field-orders/QuickOrderFAB.tsx` | **Slett** — død kode, aldri importert |
| `src/components/mobile/MobileNav.tsx` | Verifiser at FAB-knappen er korrekt sentrert og visuelt tydelig som del av nav-baren (allerede OK basert på kode) |

Kun 1 fil slettes. Ingen andre endringer nødvendig — MobileNav er allerede korrekt implementert med `fixed bottom-0`, `safe-area-inset-bottom`, og sentrert FAB.

