
-- Update user role from field_worker to system_admin
UPDATE public.user_roles 
SET role = 'system_admin' 
WHERE user_id = 'eed97276-37e3-483a-a600-6eb3ad3be984';

-- Update profiles role
UPDATE public.profiles 
SET role = 'system_admin' 
WHERE user_id = 'eed97276-37e3-483a-a600-6eb3ad3be984';

-- Grant access to all 4 sites
INSERT INTO public.user_site_access (user_id, site_id, granted_by) VALUES
  ('eed97276-37e3-483a-a600-6eb3ad3be984', 'd3349a3f-4d78-427b-be10-e260d4af14cf', 'eed97276-37e3-483a-a600-6eb3ad3be984'),
  ('eed97276-37e3-483a-a600-6eb3ad3be984', 'bf4d8df8-d689-40a5-b85b-c188dc3436c3', 'eed97276-37e3-483a-a600-6eb3ad3be984'),
  ('eed97276-37e3-483a-a600-6eb3ad3be984', 'fccb249e-82ac-45b9-8d36-66ccec8c8b36', 'eed97276-37e3-483a-a600-6eb3ad3be984'),
  ('eed97276-37e3-483a-a600-6eb3ad3be984', '9e86b280-7968-4857-b77d-3d12a8960c63', 'eed97276-37e3-483a-a600-6eb3ad3be984')
ON CONFLICT DO NOTHING;
