-- Marks when a partner finished first-time onboarding, so the wizard shows once.
alter table public.partner_apps
  add column if not exists onboarded_at timestamptz;
