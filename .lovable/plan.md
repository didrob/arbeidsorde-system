

## Minimalt mobil-skjema for feltarbeidere — hurtig ordreopprettelse

### Oversikt
Et dedikert bottom-sheet-basert skjema optimalisert for feltarbeidere med hansker, utendørs, under 30 sekunder. Separat fra den eksisterende admin-wizarden — dette er en strippet ned "quick create" for mobil.

### Nye filer

**`src/features/field-orders/QuickOrderSheet.tsx`**
Hovedkomponenten — et bottom sheet (Vaul drawer) med:
- 4 felt: HVA (fritekst + mikrofon), KUNDE (dropdown forhåndsvalgt sist brukte), HASTER (toggle), BILDE (kamera capture)
- GPS registreres automatisk ved åpning via `navigator.geolocation`
- Etter opprettelse: to knapper — "Tildel til meg + Start nå" og "Send til disponent"
- Alle touch targets 56x56px minimum
- Optimistisk UI med toast-bekreftelse
- Offline-kø via localStorage

**`src/features/field-orders/SpeechInput.tsx`**
Fritekst-input med stort mikrofon-ikon (48px). Bruker Web Speech API (`webkitSpeechRecognition`) med fallback til vanlig input. Visuell feedback når den lytter (pulserende rød ring).

**`src/features/field-orders/QuickOrderFAB.tsx`**
FAB-knapp i bunnen av feltarbeider-skjermen — 64x64px, teal bg, cobalt ikon, alltid synlig. Viser badge med antall offline-køede ordrer.

**`src/features/field-orders/useQuickOrder.ts`**
Custom hook som håndterer:
- GPS-innhenting
- Sist brukte kunde (lagret i localStorage)
- Offline-kø: Lagrer ordrer lokalt, synker når nett er tilbake
- Opprettelse via `supabase.from('work_orders').insert(...)` direkte
- "Tildel + start" flow: oppretter ordre, setter `assigned_to`, starter time entry

**`src/features/field-orders/useSpeechRecognition.ts`**
Wrapper rundt Web Speech API med state for `isListening`, `transcript`, `isSupported`.

### Endringer i eksisterende filer

**`src/components/MobileFieldWorker.tsx`**
- Importer og render `<QuickOrderFAB />` og `<QuickOrderSheet />` i bunnen
- FAB erstatter/supplerer eksisterende "+"-knapp

**`src/pages/FieldWorker.tsx`**
- Ingen endringer nødvendig, MobileFieldWorker håndterer alt

### Teknisk

- **Bottom sheet**: Vaul (`vaul` allerede installert) med `snapPoints={[0.6, 1]}` for drag-to-fullscreen
- **Kamera**: `<input type="file" accept="image/*" capture="environment" />` — direkte kamera, ingen fil-dialog
- **GPS**: `navigator.geolocation.getCurrentPosition()` ved sheet-åpning, lagres som `gps_location` point
- **Offline-kø**: `localStorage`-basert kø, synker på `online`-event, badge viser antall i kø
- **Kunde-forhåndsvalg**: Lagrer sist brukte `customer_id` i localStorage, forhåndsvelger ved neste åpning
- **Optimistisk UI**: Toast vises umiddelbart, insert skjer async
- **Web Speech API**: `webkitSpeechRecognition` med `lang='nb-NO'`, fallback til manuell input
- **Tailwind only**, ingen inline styles, TypeScript strict

### Design
- Hvit bakgrunn, lys grå seksjonsbg (`bg-gray-50`)
- Opprett-knapp: `bg-[#00FDC7] text-[#292C3F]` full bredde, 56px høy
- Haste-toggle: rød (`bg-red-600`) når aktiv
- Bottom sheet: `rounded-t-2xl` (16px), skygge
- Alle inputs `text-base` (16px), touch targets `min-h-[56px] min-w-[56px]`

