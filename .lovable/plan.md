

## Plan: Fjern "ASCO" under site-navn i SiteSelector

Enkel endring: Fjern `<span className="text-xs text-muted-foreground">{site.organization_name}</span>` fra dropdown-items i SiteSelector. Alle sites er ASCO, så det er unødvendig informasjon.

### Endring

**`src/components/site/SiteSelector.tsx`**:
- Endre SelectItem fra å vise to linjer (site_name + organization_name) til kun én linje (site_name)

Fra:
```tsx
<SelectItem key={site.site_id} value={site.site_id}>
  <div className="flex flex-col">
    <span>{site.site_name}</span>
    <span className="text-xs text-muted-foreground">{site.organization_name}</span>
  </div>
</SelectItem>
```

Til:
```tsx
<SelectItem key={site.site_id} value={site.site_id}>
  <span>{site.site_name}</span>
</SelectItem>
```

