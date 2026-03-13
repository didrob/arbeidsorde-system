

## Fix: Assets + Landing Overlay

### 1. Fonts — Safe Fallback (no font files available)

The 3 `.woff2` files were never committed. Since we don't have the actual font files (commercial/licensed fonts), we make the fallback explicit and clean:

- Update `@font-face` declarations in `index.css` to use `font-display: swap` (already done) — Arial fallback works silently
- No code changes needed — the current fallback chain is correct
- **Action item for you:** If you have the font files, add them to `/public/fonts/` and commit

### 2. Landing Page Overlay — Darker Treatment

**`src/components/public/PublicLayout.tsx`:**

Replace the current overlay layers with:
- Base cobalt stays
- Background image opacity: keep at `0.35` for landing
- **Primary overlay:** `bg-[rgba(41,44,63,0.85)]` (was 0.75)
- **Add gradient overlay on top:** `bg-gradient-to-b from-[rgba(30,32,48,0.95)] via-[rgba(41,44,63,0.80)] to-[rgba(41,44,63,0.75)]`

**`src/pages/Landing.tsx`:**

- Entry boxes: Change from `bg-white/[0.06]` to `bg-black/40` with `border-white/20`
- Kundeportal box: Keep teal border accent but use same darker bg
- All text: Ensure pure `text-white` (#FFFFFF) — already the case
- Logo: Already `text-white text-5xl font-bold` — no change needed

### Files Changed

| File | Change |
|---|---|
| `src/components/public/PublicLayout.tsx` | Darker overlay + gradient layer |
| `src/pages/Landing.tsx` | Darker box backgrounds and borders |

~15 lines changed total. No structural changes.

