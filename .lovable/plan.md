

## Fjern tema-toggle fra offentlige sider

### Hva skal gjøres

**`src/components/public/PublicLayout.tsx`**:
- Fjern import: `import { ThemeToggle } from '@/components/ThemeToggle';`
- Fjern komponent fra header: `<ThemeToggle />` (linje 67)
- Resultat: Offentlige sider viser kun ASCO-logo og eventuell "Tilbake"-knapp i topbaren

### Endringer

| Fil | Endring |
|---|---|
| `src/components/public/PublicLayout.tsx` | Fjern ThemeToggle import og komponent fra header |

Tema-toggle forblir tilgjengelig i:
- `ResponsiveLayout.tsx` (admin-topbar etter innlogging)
- Øvrige interne layouts i appen

Offentlige sider vil nå alltid være mørke uten mulighet for brukeren å endre tema.

