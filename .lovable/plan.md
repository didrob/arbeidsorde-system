

## Plan: Kombinert org.nr / navnesøk mot BRREG

### Tilnærming
Navnesøk gjøres direkte fra frontend mot BRREG (de tillater CORS). Org.nr-oppslag bruker fortsatt edge function som i dag. Dette er enklere og raskere enn å utvide edge function.

### Endringer

**1. Ny hook: `src/features/customers/useBrregLookup.ts`**
- Utvid med `searchByName(query: string)` som kaller `data.brreg.no/enhetsregisteret/api/enheter?navn={query}&size=10`
- Returnerer `results: BrregResult[]` (liste for navnesøk) i tillegg til `result` (enkeltresultat for org.nr)
- Beholder eksisterende `lookup(orgNumber)` uendret

**2. Ny komponent: `src/features/customers/BrregSearchInput.tsx`**
- Kombinert søkefelt med placeholder «Søk på organisasjonsnummer eller bedriftsnavn»
- Logikk: kun tall + 9 siffer → org.nr oppslag. Inneholder bokstaver + min 3 tegn → navnesøk med 500ms debounce
- Dropdown under feltet med maks 10 treff (bedriftsnavn + org.nr + adresse)
- Klikk på treff → `onSelect(result: BrregResult)` callback
- Org.nr-treff viser direkte bekreftelse som i dag
- Gjenbrukbar i alle 3 kontekster med styling-props (glass/standard)

**3. Oppdater `src/pages/RegisterCustomer.tsx`**
- Erstatt org.nr-input + effekter med `<BrregSearchInput>` med glass-styling

**4. Oppdater `src/pages/Customers.tsx`**
- Erstatt org.nr-input i opprett-dialog med `<BrregSearchInput>`
- Legg til `<BrregSearchInput>` i rediger-dialog (erstatter org.nr plain input)

### Filer
| Fil | Endring |
|---|---|
| `src/features/customers/useBrregLookup.ts` | Legg til `searchByName`, `results[]` state |
| `src/features/customers/BrregSearchInput.tsx` | Ny komponent |
| `src/pages/RegisterCustomer.tsx` | Bruk ny komponent |
| `src/pages/Customers.tsx` | Bruk ny komponent i opprett + rediger dialog |

