

## Fix: Bakgrunnsbilde mangler på /portal/login

### Rotårsak

`PublicLayout.tsx` linje 32 bruker `bg-asco-cobalt` — men denne Tailwind-klassen finnes ikke. I `tailwind.config.ts` er fargen definert som `cobalt.DEFAULT`, som gir klassen `bg-cobalt`.

Resultatet: Den mørke base-bakgrunnen rendres ikke. De semi-transparente overlays (rgba med 85-90% opacity) legges over en hvit body-bakgrunn (fra light mode), noe som gjør at alle PublicLayout-sider ser lysere ut enn tiltenkt. Landingssiden overlever bedre fordi den har sterkere gradient og høyere bilde-opacity.

### Løsning

**`src/components/public/PublicLayout.tsx`** — Én linje-endring:

`bg-asco-cobalt` → `bg-cobalt`

Dette fikser base-bakgrunnen på **alle** offentlige sider (/, /auth, /portal/login, /register-customer) samtidig.

| Fil | Endring |
|---|---|
| `src/components/public/PublicLayout.tsx` | Linje 32: `bg-asco-cobalt` → `bg-cobalt` |

