

## E-postvarslingssystem for ordreflyten — oppdatert plan

### Oversikt
Asynkront e-postsystem via Resend (API key allerede konfigurert) og en Supabase Edge Function. 4 e-posttyper med ASCO-branding inkludert begge logovariantene brukeren har lastet opp.

### Logoer
- **logo-dark.png** (mørk ASCO-logo på hvit/lys bakgrunn) — brukes i e-postens body (hvit bakgrunn)
- **logo-light.png** (lys/hvit ASCO-logo) — brukes i e-postens cobalt header (#292C3F bakgrunn)

Begge kopieres til `public/` og lastes opp til en `email-assets` storage bucket i Supabase for stabil URL-tilgang i e-poster.

### Database

**Ny migrasjon: `email_log`-tabell**
- `id`, `work_order_id` (FK), `email_type` (enum: order_confirmation, status_update, quote_sent, urgent_alert)
- `recipient_email`, `recipient_name`, `subject`, `status` (queued/sent/failed), `error_message`
- `metadata` (jsonb), `created_at`, `sent_at`
- RLS: admins leser alle, andre kun egne ordrer
- Duplikatbeskyttelse: unik constraint på `(work_order_id, email_type)` innen 5 min vindu

### Edge Function: `send-order-email`

Én funksjon, 4 e-posttyper. Input: `{ type, work_order_id, extra? }`.

Flow:
1. Hent ordre + kunde fra DB (service role client)
2. Sjekk duplikat i `email_log`
3. Bygg HTML-mal med ASCO-branding
4. Send via Resend API (`RESEND_API_KEY`)
5. Logg i `email_log`

**E-postmaler (inline HTML):**
- **Header**: Cobalt (#292C3F) bg med hvit ASCO-logo (`logo-light.png` fra storage bucket)
- **Body**: Hvit bg, Arial font, kort tekst, ordredetaljer
- **CTA-knapp**: Teal (#00FDC7) med cobalt tekst, rounded 8px — "Se ordre i portalen"
- **Footer**: Grå (#8F8C90), kontaktinfo, "Ikke svar på denne e-posten"
- Responsivt: inline CSS, table-basert layout for Outlook-kompatibilitet

**4 maler:**
1. Ordrebekreftelse — ordrenummer, beskrivelse, lokasjon, kontaktinfo
2. Statusoppdatering — ny status, ETA (kun pending→in_progress, in_progress→completed)
3. Tilbud sendt — beløp, beskrivelse, godkjenn-lenke
4. Hasteordre — kunde, beskrivelse, GPS-lenke, bilde-URL

### Frontend: `src/lib/emailService.ts`

Helper-funksjon `sendOrderEmail(type, workOrderId, extra?)` som kaller edge function via `supabase.functions.invoke()`. Fire-and-forget — returnerer ikke, blokkerer ikke UI.

### Integrasjonspunkter

- **`useQuickOrder.ts`**: Etter opprettelse → `sendOrderEmail('order_confirmation', id)` + evt. `urgent_alert`
- **`GlobalWorkOrderWizardPortal.tsx`**: Etter opprettelse → `order_confirmation`
- **Statusendring i work order hooks**: → `status_update` (kun hovedsteg)

### Config

- `supabase/config.toml`: Oppdater `project_id` til `pofayvcrhypkcnjgkhqk`, legg til `[functions.send-order-email]` med `verify_jwt = false` (validerer manuelt i koden)

### Nye filer
- `supabase/functions/send-order-email/index.ts`
- `src/lib/emailService.ts`
- Migrasjon for `email_log`-tabell
- `public/logo-light.png`, `public/logo-dark.png` (kopiert fra uploads)

### Endrede filer
- `supabase/config.toml`
- `src/features/field-orders/useQuickOrder.ts`
- `src/components/GlobalWorkOrderWizardPortal.tsx`

