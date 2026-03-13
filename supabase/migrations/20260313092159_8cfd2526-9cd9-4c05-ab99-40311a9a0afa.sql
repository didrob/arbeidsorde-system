
-- Add missing columns to sites table
ALTER TABLE public.sites 
  ADD COLUMN IF NOT EXISTS latitude decimal,
  ADD COLUMN IF NOT EXISTS longitude decimal,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text;

-- Seed the 4 ASCO locations
-- First ensure an ASCO organization exists
INSERT INTO public.organizations (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'ASCO', 'ASCO hovedorganisasjon')
ON CONFLICT (id) DO NOTHING;

-- Seed the 4 sites
INSERT INTO public.sites (name, organization_id, location, latitude, longitude, is_active)
VALUES 
  ('Farsund', '00000000-0000-0000-0000-000000000001', 'Farsund', 58.0942, 6.8045, true),
  ('Mosjøen', '00000000-0000-0000-0000-000000000001', 'Mosjøen', 65.8489, 13.1894, true),
  ('Tananger', '00000000-0000-0000-0000-000000000001', 'Tananger', 58.9310, 5.5770, true),
  ('Sandnessjøen', '00000000-0000-0000-0000-000000000001', 'Sandnessjøen', 66.0208, 12.6316, true)
ON CONFLICT DO NOTHING;
