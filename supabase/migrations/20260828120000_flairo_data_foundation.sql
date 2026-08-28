begin;

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

create or replace function public.flairo_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.flairo_app_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('owner', 'admin', 'resident', 'vendor', 'community_manager')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  community_id uuid,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flairo_communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  property_manager text,
  market text not null,
  address_line1 text,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text,
  timezone text not null default 'America/New_York',
  plus_enabled boolean not null default true,
  active boolean not null default true,
  launch_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.flairo_app_users
  add constraint flairo_app_users_community_id_fkey
  foreign key (community_id) references public.flairo_communities(id);

create table public.flairo_services (
  id uuid primary key default gen_random_uuid(),
  service_key text not null unique,
  name text not null,
  category text not null,
  description text,
  mobile_visible boolean not null default true,
  active boolean not null default true,
  standard_price_cents integer not null default 0 check (standard_price_cents >= 0),
  plus_price_cents integer not null default 0 check (plus_price_cents >= 0),
  plus_only_points boolean not null default true,
  plume_points_earn integer not null default 0 check (plume_points_earn >= 0),
  redemption_allowed boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flairo_resident_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  community_id uuid not null references public.flairo_communities(id),
  full_name text not null,
  email text not null,
  phone text,
  unit text,
  home_profile text,
  plus_member boolean not null default false,
  plus_status text not null default 'not_enrolled' check (plus_status in ('active', 'past_due', 'paused', 'cancelled', 'not_enrolled')),
  plume_points_balance integer not null default 0,
  plume_points_lifetime_earned integer not null default 0,
  plume_points_lifetime_redeemed integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flairo_plus_memberships (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.flairo_resident_profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'past_due', 'paused', 'cancelled')),
  monthly_fee_cents integer not null default 500 check (monthly_fee_cents >= 0),
  started_at timestamptz not null default now(),
  renews_at timestamptz,
  cancelled_at timestamptz,
  billing_provider text,
  billing_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (resident_id)
);

create table public.flairo_vendor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  business_name text not null,
  dba_name text,
  primary_contact text not null,
  work_alert_email text not null,
  phone text,
  compliance_status text not null default 'pending_onboarding' check (compliance_status in ('compliant', 'review_needed', 'pending_onboarding', 'suspended', 'inactive')),
  onboarding_stage text not null default 'invited' check (onboarding_stage in ('invited', 'documents_needed', 'under_review', 'approved', 'paused')),
  board_access boolean not null default false,
  preferred_vendor boolean not null default false,
  preferred_visibility_minutes integer not null default 60 check (preferred_visibility_minutes >= 0),
  flairo_fee_percent numeric(5,2) not null default 10.00 check (flairo_fee_percent >= 0),
  preferred_fee_percent numeric(5,2) check (preferred_fee_percent is null or preferred_fee_percent >= 0),
  rating_average numeric(3,2) not null default 0.00 check (rating_average >= 0 and rating_average <= 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  high_rated_vendor boolean not null default false,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flairo_vendor_service_areas (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.flairo_vendor_profiles(id) on delete cascade,
  city text,
  state text,
  postal_code text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (city is not null or postal_code is not null)
);

create table public.flairo_vendor_service_eligibilities (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.flairo_vendor_profiles(id) on delete cascade,
  service_id uuid not null references public.flairo_services(id) on delete cascade,
  eligible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, service_id)
);

create table public.flairo_vendor_compliance_documents (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.flairo_vendor_profiles(id) on delete cascade,
  document_type text not null check (document_type in ('insurance', 'business_license', 'w9', 'flairo_b2b_contract', 'other')),
  status text not null default 'uploaded' check (status in ('missing', 'uploaded', 'under_review', 'verified', 'expiring', 'expired', 'archived', 'not_required')),
  storage_bucket text not null default 'flairo-vendor-documents',
  storage_path text,
  file_name text,
  contract_year integer,
  effective_at date,
  expires_at date,
  archived_at timestamptz,
  requirement_overridden boolean not null default false,
  override_reason text,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flairo_reward_program_settings (
  id text primary key default 'current' check (id = 'current'),
  point_value_cents numeric(10,4) not null default 1.0000,
  redemption_cap_percent numeric(5,2) not null default 10.00 check (redemption_cap_percent >= 0),
  plus_membership_monthly_cents integer not null default 500 check (plus_membership_monthly_cents >= 0),
  plus_only_accrual boolean not null default true,
  gold_balance_threshold integer not null default 500 check (gold_balance_threshold >= 0),
  expiration_months integer not null default 12 check (expiration_months >= 0),
  expiration_reminder_days integer not null default 7 check (expiration_reminder_days >= 0),
  adoption_index_previous_month numeric(5,2) not null default 0,
  registration_growth_percent numeric(5,2) not null default 0,
  activation_rate_percent numeric(5,2) not null default 0,
  first_service_conversion_percent numeric(5,2) not null default 0,
  active_30_day_rate_percent numeric(5,2) not null default 0,
  repeat_use_rate_percent numeric(5,2) not null default 0,
  survey_response_rate_percent numeric(5,2) not null default 0,
  avg_cx_rating numeric(3,2) not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.flairo_reward_program_settings (id)
values ('current')
on conflict (id) do nothing;

create table public.flairo_job_requests (
  id uuid primary key default gen_random_uuid(),
  public_job_number text unique,
  resident_id uuid not null references public.flairo_resident_profiles(id),
  community_id uuid not null references public.flairo_communities(id),
  service_id uuid not null references public.flairo_services(id),
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_by_admin boolean not null default false,
  source text not null default 'resident_mobile' check (source in ('resident_mobile', 'admin_control_center', 'vendor_portal')),
  status text not null default 'open' check (status in ('open', 'claimed', 'scheduling', 'scheduled', 'completed', 'invoice_ready', 'invoiced', 'cancelled', 'released')),
  visible_to_vendors boolean not null default true,
  release_to_preferred_at timestamptz not null default now(),
  release_to_all_at timestamptz not null default (now() + interval '1 hour'),
  unclaimed_timer_started_at timestamptz not null default now(),
  claimed_vendor_id uuid references public.flairo_vendor_profiles(id) on delete set null,
  claimed_at timestamptz,
  schedule_due_at timestamptz,
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  request_title text,
  request_notes text,
  service_address_line1 text,
  service_city text not null,
  service_state text not null,
  service_postal_code text,
  unit text,
  home_profile text,
  preferred_window_label text,
  preferred_window_start timestamptz,
  preferred_window_end timestamptz,
  service_amount_cents integer not null default 0 check (service_amount_cents >= 0),
  flairo_fee_percent numeric(5,2) not null default 10.00 check (flairo_fee_percent >= 0),
  flairo_fee_cents integer not null default 0 check (flairo_fee_cents >= 0),
  plume_points_redeemed integer not null default 0 check (plume_points_redeemed >= 0),
  plume_points_value_cents integer not null default 0 check (plume_points_value_cents >= 0),
  resident_contact_released boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flairo_job_claims (
  id uuid primary key default gen_random_uuid(),
  job_request_id uuid not null references public.flairo_job_requests(id) on delete cascade,
  vendor_id uuid not null references public.flairo_vendor_profiles(id),
  claim_status text not null default 'claimed' check (claim_status in ('claimed', 'scheduling', 'scheduled', 'released', 'expired', 'cancelled')),
  claimed_at timestamptz not null default now(),
  schedule_due_at timestamptz not null default (now() + interval '24 hours'),
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  schedule_confirmed_at timestamptz,
  released_at timestamptz,
  release_reason text,
  timer_reset_count integer not null default 0 check (timer_reset_count >= 0),
  last_timer_reset_at timestamptz,
  last_timer_reset_by_user_id uuid references auth.users(id) on delete set null,
  last_timer_reset_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index flairo_one_active_claim_per_job
  on public.flairo_job_claims(job_request_id)
  where claim_status in ('claimed', 'scheduling', 'scheduled');

create table public.flairo_job_timers (
  id uuid primary key default gen_random_uuid(),
  job_request_id uuid not null references public.flairo_job_requests(id) on delete cascade,
  claim_id uuid references public.flairo_job_claims(id) on delete cascade,
  timer_type text not null check (timer_type in ('unclaimed_on_board', 'schedule_after_claim')),
  status text not null default 'active' check (status in ('active', 'completed', 'expired', 'reset', 'cancelled')),
  started_at timestamptz not null default now(),
  due_at timestamptz,
  stopped_at timestamptz,
  reset_by_user_id uuid references auth.users(id) on delete set null,
  reset_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flairo_job_contact_releases (
  id uuid primary key default gen_random_uuid(),
  job_request_id uuid not null references public.flairo_job_requests(id) on delete cascade,
  resident_id uuid not null references public.flairo_resident_profiles(id),
  vendor_id uuid not null references public.flairo_vendor_profiles(id),
  resident_name text not null,
  resident_email text,
  resident_phone text,
  resident_unit text,
  access_notes text,
  released_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (job_request_id, vendor_id)
);

create table public.flairo_job_payments (
  id uuid primary key default gen_random_uuid(),
  job_request_id uuid not null unique references public.flairo_job_requests(id) on delete cascade,
  resident_id uuid not null references public.flairo_resident_profiles(id),
  vendor_id uuid not null references public.flairo_vendor_profiles(id),
  vendor_confirmed_paid boolean not null default false,
  vendor_confirmed_at timestamptz,
  vendor_reported_amount_cents integer check (vendor_reported_amount_cents is null or vendor_reported_amount_cents >= 0),
  resident_confirmed_paid boolean not null default false,
  resident_confirmed_at timestamptz,
  resident_reported_amount_cents integer check (resident_reported_amount_cents is null or resident_reported_amount_cents >= 0),
  resident_paid_at date,
  resident_receipt_number text,
  discrepancy_status text not null default 'none' check (discrepancy_status in ('none', 'resident_inquiry', 'vendor_disputed', 'admin_review', 'resolved')),
  inquiry_message text,
  inquiry_submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flairo_plume_point_ledger (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.flairo_resident_profiles(id) on delete cascade,
  community_id uuid not null references public.flairo_communities(id),
  membership_id uuid references public.flairo_plus_memberships(id) on delete set null,
  job_request_id uuid references public.flairo_job_requests(id) on delete set null,
  source text not null default 'job_completion' check (source in ('job_completion', 'service_redemption', 'manual_admin_adjustment', 'expiration_batch', 'reversal', 'launch_wallet')),
  status text not null default 'pending' check (status in ('pending', 'available', 'redeemed', 'expired', 'reversed')),
  plume_points integer not null,
  dollar_value_cents integer not null default 0,
  expires_at date,
  expiration_alert_at timestamptz,
  expiration_alert_sent_at timestamptz,
  redeemed_in_expiration_window boolean not null default false,
  created_by_user_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flairo_resident_surveys (
  id uuid primary key default gen_random_uuid(),
  job_request_id uuid not null unique references public.flairo_job_requests(id) on delete cascade,
  resident_id uuid not null references public.flairo_resident_profiles(id) on delete cascade,
  service_id uuid not null references public.flairo_services(id),
  vendor_id uuid not null references public.flairo_vendor_profiles(id),
  completion_date timestamptz not null,
  email_token uuid not null default gen_random_uuid(),
  app_available_at timestamptz,
  app_prompted_at timestamptz,
  email_queued_at timestamptz,
  email_sent_at timestamptz,
  submitted_at timestamptz,
  submitted_channel text check (submitted_channel in ('app', 'email')),
  email_completed_at timestamptz,
  app_completed_at timestamptz,
  overall_rating integer check (overall_rating between 1 and 5),
  vendor_confidence text check (vendor_confidence in ('absolutely_use_again', 'maybe_depends', 'prefer_different')),
  flagged_for_follow_up boolean generated always as (
    coalesce(overall_rating <= 2, false) or coalesce(vendor_confidence = 'prefer_different', false)
  ) stored,
  follow_up_status text not null default 'not_needed' check (follow_up_status in ('not_needed', 'needs_review', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email_token)
);

create table public.flairo_vendor_cx_metrics (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.flairo_vendor_profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  completed_job_count integer not null default 0 check (completed_job_count >= 0),
  survey_count integer not null default 0 check (survey_count >= 0),
  survey_response_rate numeric(5,2) not null default 0,
  average_rating numeric(3,2) not null default 0 check (average_rating >= 0 and average_rating <= 5),
  vendor_confidence_positive_rate numeric(5,2) not null default 0,
  flagged_response_count integer not null default 0 check (flagged_response_count >= 0),
  ranking_score numeric(6,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, period_start, period_end)
);

create table public.flairo_vendor_invoice_statements (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.flairo_vendor_profiles(id),
  period_start date not null,
  period_end date not null,
  statement_number text unique,
  status text not null default 'open' check (status in ('open', 'ready', 'sent', 'paid', 'void')),
  job_count integer not null default 0 check (job_count >= 0),
  total_resident_paid_cents integer not null default 0 check (total_resident_paid_cents >= 0),
  flairo_fee_cents integer not null default 0 check (flairo_fee_cents >= 0),
  preferred_vendor_fee_cents integer not null default 0 check (preferred_vendor_fee_cents >= 0),
  total_due_cents integer not null default 0 check (total_due_cents >= 0),
  bluevine_reference text,
  issued_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, period_start, period_end)
);

create table public.flairo_vendor_invoice_statement_items (
  id uuid primary key default gen_random_uuid(),
  statement_id uuid not null references public.flairo_vendor_invoice_statements(id) on delete cascade,
  job_request_id uuid not null unique references public.flairo_job_requests(id),
  service_id uuid not null references public.flairo_services(id),
  resident_id uuid not null references public.flairo_resident_profiles(id),
  community_id uuid not null references public.flairo_communities(id),
  service_completed_at timestamptz not null,
  resident_paid_cents integer not null default 0 check (resident_paid_cents >= 0),
  flairo_fee_percent numeric(5,2) not null default 10.00 check (flairo_fee_percent >= 0),
  flairo_fee_cents integer not null default 0 check (flairo_fee_cents >= 0),
  survey_rating integer check (survey_rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flairo_community_reports (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.flairo_communities(id),
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'issued', 'void')),
  plus_member_count integer not null default 0 check (plus_member_count >= 0),
  completed_job_count integer not null default 0 check (completed_job_count >= 0),
  gross_service_value_cents integer not null default 0 check (gross_service_value_cents >= 0),
  flairo_fee_cents integer not null default 0 check (flairo_fee_cents >= 0),
  community_share_cents integer not null default 0 check (community_share_cents >= 0),
  plume_points_redeemed_cents integer not null default 0 check (plume_points_redeemed_cents >= 0),
  plume_points_expired_cents integer not null default 0 check (plume_points_expired_cents >= 0),
  adoption_velocity_index numeric(5,2) not null default 0,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, period_start, period_end)
);

create table public.flairo_admin_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  report_type text not null check (report_type in ('daily_attention', 'vendor_performance', 'reward_liability', 'community_income', 'invoice_closeout', 'cx_follow_up')),
  period_start date,
  period_end date,
  filters jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.flairo_mobile_sync_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('admin_control_center', 'resident_mobile', 'vendor_mobile', 'system')),
  change_type text not null,
  entity_table text not null,
  entity_id uuid,
  status text not null default 'staged' check (status in ('staged', 'pushed', 'failed', 'received')),
  revision integer not null default 1,
  pushed_at timestamptz,
  received_at timestamptz,
  summary text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flairo_notification_queue (
  id uuid primary key default gen_random_uuid(),
  recipient_role text not null check (recipient_role in ('resident', 'vendor', 'admin', 'community_manager')),
  resident_id uuid references public.flairo_resident_profiles(id) on delete cascade,
  vendor_id uuid references public.flairo_vendor_profiles(id) on delete cascade,
  admin_user_id uuid references public.flairo_app_users(id) on delete cascade,
  channel text not null check (channel in ('push', 'email', 'in_app')),
  notification_type text not null check (notification_type in ('survey_request', 'plume_points_expiring', 'vendor_document_nudge', 'job_reactivated', 'job_available', 'payment_inquiry', 'invoice_ready')),
  subject text,
  body text not null,
  related_job_request_id uuid references public.flairo_job_requests(id) on delete cascade,
  related_survey_id uuid references public.flairo_resident_surveys(id) on delete cascade,
  related_reward_entry_id uuid references public.flairo_plume_point_ledger(id) on delete cascade,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'cancelled')),
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flairo_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_label text not null default 'FLAIRO ADMIN',
  action text not null,
  entity_table text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function private.flairo_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select au.role
  from public.flairo_app_users au
  where au.user_id = (select auth.uid())
    and au.status = 'active'
  limit 1
$$;

create or replace function private.flairo_current_community_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select au.community_id
  from public.flairo_app_users au
  where au.user_id = (select auth.uid())
    and au.status = 'active'
  limit 1
$$;

create or replace function private.flairo_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.flairo_role() in ('owner', 'admin'), false)
$$;

create or replace function private.flairo_current_resident_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select rp.id
  from public.flairo_resident_profiles rp
  where rp.user_id = (select auth.uid())
  limit 1
$$;

create or replace function private.flairo_current_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select vp.id
  from public.flairo_vendor_profiles vp
  where vp.user_id = (select auth.uid())
  limit 1
$$;

create or replace function private.flairo_can_vendor_view_job(p_job_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.flairo_job_requests jr
    join public.flairo_vendor_profiles vp
      on vp.id = private.flairo_current_vendor_id()
    join public.flairo_vendor_service_eligibilities vse
      on vse.vendor_id = vp.id
     and vse.service_id = jr.service_id
     and vse.eligible = true
    join public.flairo_vendor_service_areas vsa
      on vsa.vendor_id = vp.id
     and vsa.active = true
    where jr.id = p_job_request_id
      and jr.visible_to_vendors = true
      and jr.claimed_vendor_id is null
      and jr.status in ('open', 'released')
      and vp.board_access = true
      and vp.compliance_status = 'compliant'
      and (
        jr.release_to_all_at <= now()
        or (vp.preferred_vendor = true and jr.release_to_preferred_at <= now())
      )
      and (
        (vsa.postal_code is not null and vsa.postal_code = jr.service_postal_code)
        or (
          vsa.city is not null
          and lower(vsa.city) = lower(jr.service_city)
          and (vsa.state is null or lower(vsa.state) = lower(jr.service_state))
        )
      )
  )
$$;

create or replace function private.flairo_can_access_job(p_job_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.flairo_job_requests jr
    where jr.id = p_job_request_id
      and (
        private.flairo_is_admin()
        or jr.resident_id = private.flairo_current_resident_id()
        or jr.claimed_vendor_id = private.flairo_current_vendor_id()
        or exists (
          select 1
          from public.flairo_job_claims jc
          where jc.job_request_id = jr.id
            and jc.vendor_id = private.flairo_current_vendor_id()
            and jc.claim_status in ('claimed', 'scheduling', 'scheduled')
        )
      )
  )
$$;

grant usage on schema private to authenticated;
revoke execute on all functions in schema private from public;
grant execute on function private.flairo_role() to authenticated;
grant execute on function private.flairo_current_community_id() to authenticated;
grant execute on function private.flairo_is_admin() to authenticated;
grant execute on function private.flairo_current_resident_id() to authenticated;
grant execute on function private.flairo_current_vendor_id() to authenticated;
grant execute on function private.flairo_can_vendor_view_job(uuid) to authenticated;
grant execute on function private.flairo_can_access_job(uuid) to authenticated;

create index flairo_app_users_user_id_idx on public.flairo_app_users(user_id);
create index flairo_app_users_role_idx on public.flairo_app_users(role);
create index flairo_communities_market_idx on public.flairo_communities(market);
create index flairo_resident_profiles_user_id_idx on public.flairo_resident_profiles(user_id);
create index flairo_resident_profiles_community_id_idx on public.flairo_resident_profiles(community_id);
create index flairo_plus_memberships_resident_id_idx on public.flairo_plus_memberships(resident_id);
create index flairo_vendor_profiles_user_id_idx on public.flairo_vendor_profiles(user_id);
create index flairo_vendor_profiles_compliance_idx on public.flairo_vendor_profiles(compliance_status, board_access);
create index flairo_vendor_service_areas_vendor_id_idx on public.flairo_vendor_service_areas(vendor_id);
create index flairo_vendor_service_areas_location_idx on public.flairo_vendor_service_areas(postal_code, city, state);
create index flairo_vendor_service_eligibilities_vendor_id_idx on public.flairo_vendor_service_eligibilities(vendor_id);
create index flairo_vendor_compliance_documents_vendor_id_idx on public.flairo_vendor_compliance_documents(vendor_id);
create index flairo_vendor_compliance_documents_expiry_idx on public.flairo_vendor_compliance_documents(document_type, expires_at, status);
create index flairo_job_requests_resident_id_idx on public.flairo_job_requests(resident_id);
create index flairo_job_requests_vendor_id_idx on public.flairo_job_requests(claimed_vendor_id);
create index flairo_job_requests_board_idx on public.flairo_job_requests(status, visible_to_vendors, release_to_all_at, release_to_preferred_at);
create index flairo_job_requests_location_idx on public.flairo_job_requests(service_postal_code, service_city, service_state);
create index flairo_job_claims_job_request_id_idx on public.flairo_job_claims(job_request_id);
create index flairo_job_claims_vendor_id_idx on public.flairo_job_claims(vendor_id);
create index flairo_job_claims_schedule_due_idx on public.flairo_job_claims(schedule_due_at, claim_status);
create index flairo_job_timers_job_request_id_idx on public.flairo_job_timers(job_request_id);
create index flairo_job_timers_status_idx on public.flairo_job_timers(timer_type, status, due_at);
create index flairo_job_payments_job_request_id_idx on public.flairo_job_payments(job_request_id);
create index flairo_plume_point_ledger_resident_id_idx on public.flairo_plume_point_ledger(resident_id);
create index flairo_plume_point_ledger_status_idx on public.flairo_plume_point_ledger(status, expires_at);
create index flairo_resident_surveys_vendor_id_idx on public.flairo_resident_surveys(vendor_id);
create index flairo_resident_surveys_flagged_idx on public.flairo_resident_surveys(flagged_for_follow_up, follow_up_status);
create index flairo_vendor_cx_metrics_vendor_period_idx on public.flairo_vendor_cx_metrics(vendor_id, period_start, period_end);
create index flairo_vendor_invoice_statements_vendor_period_idx on public.flairo_vendor_invoice_statements(vendor_id, period_start, period_end);
create index flairo_community_reports_period_idx on public.flairo_community_reports(community_id, period_start, period_end);
create index flairo_mobile_sync_events_status_idx on public.flairo_mobile_sync_events(status, created_at);
create index flairo_notification_queue_status_idx on public.flairo_notification_queue(status, scheduled_for);
create index flairo_audit_events_entity_idx on public.flairo_audit_events(entity_table, entity_id, created_at);

create trigger flairo_app_users_updated_at before update on public.flairo_app_users for each row execute function public.flairo_touch_updated_at();
create trigger flairo_communities_updated_at before update on public.flairo_communities for each row execute function public.flairo_touch_updated_at();
create trigger flairo_services_updated_at before update on public.flairo_services for each row execute function public.flairo_touch_updated_at();
create trigger flairo_resident_profiles_updated_at before update on public.flairo_resident_profiles for each row execute function public.flairo_touch_updated_at();
create trigger flairo_plus_memberships_updated_at before update on public.flairo_plus_memberships for each row execute function public.flairo_touch_updated_at();
create trigger flairo_vendor_profiles_updated_at before update on public.flairo_vendor_profiles for each row execute function public.flairo_touch_updated_at();
create trigger flairo_vendor_service_areas_updated_at before update on public.flairo_vendor_service_areas for each row execute function public.flairo_touch_updated_at();
create trigger flairo_vendor_service_eligibilities_updated_at before update on public.flairo_vendor_service_eligibilities for each row execute function public.flairo_touch_updated_at();
create trigger flairo_vendor_compliance_documents_updated_at before update on public.flairo_vendor_compliance_documents for each row execute function public.flairo_touch_updated_at();
create trigger flairo_reward_program_settings_updated_at before update on public.flairo_reward_program_settings for each row execute function public.flairo_touch_updated_at();
create trigger flairo_job_requests_updated_at before update on public.flairo_job_requests for each row execute function public.flairo_touch_updated_at();
create trigger flairo_job_claims_updated_at before update on public.flairo_job_claims for each row execute function public.flairo_touch_updated_at();
create trigger flairo_job_timers_updated_at before update on public.flairo_job_timers for each row execute function public.flairo_touch_updated_at();
create trigger flairo_job_payments_updated_at before update on public.flairo_job_payments for each row execute function public.flairo_touch_updated_at();
create trigger flairo_plume_point_ledger_updated_at before update on public.flairo_plume_point_ledger for each row execute function public.flairo_touch_updated_at();
create trigger flairo_resident_surveys_updated_at before update on public.flairo_resident_surveys for each row execute function public.flairo_touch_updated_at();
create trigger flairo_vendor_cx_metrics_updated_at before update on public.flairo_vendor_cx_metrics for each row execute function public.flairo_touch_updated_at();
create trigger flairo_vendor_invoice_statements_updated_at before update on public.flairo_vendor_invoice_statements for each row execute function public.flairo_touch_updated_at();
create trigger flairo_vendor_invoice_statement_items_updated_at before update on public.flairo_vendor_invoice_statement_items for each row execute function public.flairo_touch_updated_at();
create trigger flairo_community_reports_updated_at before update on public.flairo_community_reports for each row execute function public.flairo_touch_updated_at();
create trigger flairo_mobile_sync_events_updated_at before update on public.flairo_mobile_sync_events for each row execute function public.flairo_touch_updated_at();
create trigger flairo_notification_queue_updated_at before update on public.flairo_notification_queue for each row execute function public.flairo_touch_updated_at();

alter table public.flairo_app_users enable row level security;
alter table public.flairo_communities enable row level security;
alter table public.flairo_services enable row level security;
alter table public.flairo_resident_profiles enable row level security;
alter table public.flairo_plus_memberships enable row level security;
alter table public.flairo_vendor_profiles enable row level security;
alter table public.flairo_vendor_service_areas enable row level security;
alter table public.flairo_vendor_service_eligibilities enable row level security;
alter table public.flairo_vendor_compliance_documents enable row level security;
alter table public.flairo_reward_program_settings enable row level security;
alter table public.flairo_job_requests enable row level security;
alter table public.flairo_job_claims enable row level security;
alter table public.flairo_job_timers enable row level security;
alter table public.flairo_job_contact_releases enable row level security;
alter table public.flairo_job_payments enable row level security;
alter table public.flairo_plume_point_ledger enable row level security;
alter table public.flairo_resident_surveys enable row level security;
alter table public.flairo_vendor_cx_metrics enable row level security;
alter table public.flairo_vendor_invoice_statements enable row level security;
alter table public.flairo_vendor_invoice_statement_items enable row level security;
alter table public.flairo_community_reports enable row level security;
alter table public.flairo_admin_report_snapshots enable row level security;
alter table public.flairo_mobile_sync_events enable row level security;
alter table public.flairo_notification_queue enable row level security;
alter table public.flairo_audit_events enable row level security;

revoke all on public.flairo_app_users from anon, authenticated;
revoke all on public.flairo_communities from anon, authenticated;
revoke all on public.flairo_services from anon, authenticated;
revoke all on public.flairo_resident_profiles from anon, authenticated;
revoke all on public.flairo_plus_memberships from anon, authenticated;
revoke all on public.flairo_vendor_profiles from anon, authenticated;
revoke all on public.flairo_vendor_service_areas from anon, authenticated;
revoke all on public.flairo_vendor_service_eligibilities from anon, authenticated;
revoke all on public.flairo_vendor_compliance_documents from anon, authenticated;
revoke all on public.flairo_reward_program_settings from anon, authenticated;
revoke all on public.flairo_job_requests from anon, authenticated;
revoke all on public.flairo_job_claims from anon, authenticated;
revoke all on public.flairo_job_timers from anon, authenticated;
revoke all on public.flairo_job_contact_releases from anon, authenticated;
revoke all on public.flairo_job_payments from anon, authenticated;
revoke all on public.flairo_plume_point_ledger from anon, authenticated;
revoke all on public.flairo_resident_surveys from anon, authenticated;
revoke all on public.flairo_vendor_cx_metrics from anon, authenticated;
revoke all on public.flairo_vendor_invoice_statements from anon, authenticated;
revoke all on public.flairo_vendor_invoice_statement_items from anon, authenticated;
revoke all on public.flairo_community_reports from anon, authenticated;
revoke all on public.flairo_admin_report_snapshots from anon, authenticated;
revoke all on public.flairo_mobile_sync_events from anon, authenticated;
revoke all on public.flairo_notification_queue from anon, authenticated;
revoke all on public.flairo_audit_events from anon, authenticated;

grant select, insert, update, delete on public.flairo_app_users to authenticated;
grant select, insert, update, delete on public.flairo_communities to authenticated;
grant select, insert, update, delete on public.flairo_services to authenticated;
grant select, insert, update, delete on public.flairo_resident_profiles to authenticated;
grant select, insert, update, delete on public.flairo_plus_memberships to authenticated;
grant select, insert, update, delete on public.flairo_vendor_profiles to authenticated;
grant select, insert, update, delete on public.flairo_vendor_service_areas to authenticated;
grant select, insert, update, delete on public.flairo_vendor_service_eligibilities to authenticated;
grant select, insert, update, delete on public.flairo_vendor_compliance_documents to authenticated;
grant select, insert, update, delete on public.flairo_reward_program_settings to authenticated;
grant select, insert, update, delete on public.flairo_job_requests to authenticated;
grant select, insert, update, delete on public.flairo_job_claims to authenticated;
grant select, insert, update, delete on public.flairo_job_timers to authenticated;
grant select, insert, update, delete on public.flairo_job_contact_releases to authenticated;
grant select, insert, update, delete on public.flairo_job_payments to authenticated;
grant select, insert, update, delete on public.flairo_plume_point_ledger to authenticated;
grant select, insert, update, delete on public.flairo_resident_surveys to authenticated;
grant select, insert, update, delete on public.flairo_vendor_cx_metrics to authenticated;
grant select, insert, update, delete on public.flairo_vendor_invoice_statements to authenticated;
grant select, insert, update, delete on public.flairo_vendor_invoice_statement_items to authenticated;
grant select, insert, update, delete on public.flairo_community_reports to authenticated;
grant select, insert, update, delete on public.flairo_admin_report_snapshots to authenticated;
grant select, insert, update, delete on public.flairo_mobile_sync_events to authenticated;
grant select, insert, update, delete on public.flairo_notification_queue to authenticated;
grant select, insert, update, delete on public.flairo_audit_events to authenticated;

create policy "FLAIRO admins manage app users" on public.flairo_app_users for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Users can read their own app user" on public.flairo_app_users for select to authenticated using (user_id = (select auth.uid()));

create policy "FLAIRO admins manage communities" on public.flairo_communities for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Authenticated users read active communities" on public.flairo_communities for select to authenticated using (active = true);

create policy "FLAIRO admins manage services" on public.flairo_services for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Authenticated users read mobile services" on public.flairo_services for select to authenticated using (active = true and mobile_visible = true);

create policy "FLAIRO admins manage residents" on public.flairo_resident_profiles for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Residents read their own profile" on public.flairo_resident_profiles for select to authenticated using (id = private.flairo_current_resident_id());
create policy "Residents update their own profile" on public.flairo_resident_profiles for update to authenticated using (id = private.flairo_current_resident_id()) with check (id = private.flairo_current_resident_id());

create policy "FLAIRO admins manage memberships" on public.flairo_plus_memberships for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Residents read their PLUS membership" on public.flairo_plus_memberships for select to authenticated using (resident_id = private.flairo_current_resident_id());

create policy "FLAIRO admins manage vendors" on public.flairo_vendor_profiles for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Vendors read their own profile" on public.flairo_vendor_profiles for select to authenticated using (id = private.flairo_current_vendor_id());
create policy "Vendors update their own profile" on public.flairo_vendor_profiles for update to authenticated using (id = private.flairo_current_vendor_id()) with check (id = private.flairo_current_vendor_id());

create policy "FLAIRO admins manage vendor service areas" on public.flairo_vendor_service_areas for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Vendors read their service areas" on public.flairo_vendor_service_areas for select to authenticated using (vendor_id = private.flairo_current_vendor_id());

create policy "FLAIRO admins manage vendor service eligibility" on public.flairo_vendor_service_eligibilities for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Vendors read their service eligibility" on public.flairo_vendor_service_eligibilities for select to authenticated using (vendor_id = private.flairo_current_vendor_id());

create policy "FLAIRO admins manage vendor documents" on public.flairo_vendor_compliance_documents for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Vendors read their compliance documents" on public.flairo_vendor_compliance_documents for select to authenticated using (vendor_id = private.flairo_current_vendor_id());
create policy "Vendors upload their compliance documents" on public.flairo_vendor_compliance_documents for insert to authenticated with check (vendor_id = private.flairo_current_vendor_id());

create policy "FLAIRO admins manage reward settings" on public.flairo_reward_program_settings for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Authenticated users read reward settings" on public.flairo_reward_program_settings for select to authenticated using (true);

create policy "FLAIRO admins manage job requests" on public.flairo_job_requests for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Residents create their own job requests" on public.flairo_job_requests for insert to authenticated with check (resident_id = private.flairo_current_resident_id());
create policy "Residents read their own job requests" on public.flairo_job_requests for select to authenticated using (resident_id = private.flairo_current_resident_id());
create policy "Vendors read eligible board jobs or assigned jobs" on public.flairo_job_requests for select to authenticated using (private.flairo_can_vendor_view_job(id) or claimed_vendor_id = private.flairo_current_vendor_id());

create policy "FLAIRO admins manage job claims" on public.flairo_job_claims for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Vendors claim eligible jobs" on public.flairo_job_claims for insert to authenticated with check (vendor_id = private.flairo_current_vendor_id() and private.flairo_can_vendor_view_job(job_request_id));
create policy "Vendors read their job claims" on public.flairo_job_claims for select to authenticated using (vendor_id = private.flairo_current_vendor_id());
create policy "Vendors update their job schedule" on public.flairo_job_claims for update to authenticated using (vendor_id = private.flairo_current_vendor_id()) with check (vendor_id = private.flairo_current_vendor_id());

create policy "FLAIRO admins manage job timers" on public.flairo_job_timers for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Residents and vendors read job timers" on public.flairo_job_timers for select to authenticated using (private.flairo_can_access_job(job_request_id));

create policy "FLAIRO admins manage contact releases" on public.flairo_job_contact_releases for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Vendors read released resident contact" on public.flairo_job_contact_releases for select to authenticated using (vendor_id = private.flairo_current_vendor_id());
create policy "Residents read their own contact release record" on public.flairo_job_contact_releases for select to authenticated using (resident_id = private.flairo_current_resident_id());

create policy "FLAIRO admins manage job payments" on public.flairo_job_payments for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Residents read and update their job payments" on public.flairo_job_payments for select to authenticated using (resident_id = private.flairo_current_resident_id());
create policy "Residents confirm their job payments" on public.flairo_job_payments for update to authenticated using (resident_id = private.flairo_current_resident_id()) with check (resident_id = private.flairo_current_resident_id());
create policy "Vendors read and update their job payments" on public.flairo_job_payments for select to authenticated using (vendor_id = private.flairo_current_vendor_id());
create policy "Vendors confirm their job payments" on public.flairo_job_payments for update to authenticated using (vendor_id = private.flairo_current_vendor_id()) with check (vendor_id = private.flairo_current_vendor_id());

create policy "FLAIRO admins manage Plume Points" on public.flairo_plume_point_ledger for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Residents read their Plume Points ledger" on public.flairo_plume_point_ledger for select to authenticated using (resident_id = private.flairo_current_resident_id());

create policy "FLAIRO admins manage resident surveys" on public.flairo_resident_surveys for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Residents read their surveys" on public.flairo_resident_surveys for select to authenticated using (resident_id = private.flairo_current_resident_id());
create policy "Residents submit their surveys" on public.flairo_resident_surveys for update to authenticated using (resident_id = private.flairo_current_resident_id()) with check (resident_id = private.flairo_current_resident_id());

create policy "FLAIRO admins manage vendor CX metrics" on public.flairo_vendor_cx_metrics for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Vendors read their CX metrics" on public.flairo_vendor_cx_metrics for select to authenticated using (vendor_id = private.flairo_current_vendor_id());

create policy "FLAIRO admins manage vendor statements" on public.flairo_vendor_invoice_statements for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Vendors read their invoice statements" on public.flairo_vendor_invoice_statements for select to authenticated using (vendor_id = private.flairo_current_vendor_id());

create policy "FLAIRO admins manage vendor statement items" on public.flairo_vendor_invoice_statement_items for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Vendors read their statement items" on public.flairo_vendor_invoice_statement_items for select to authenticated using (
  exists (
    select 1
    from public.flairo_vendor_invoice_statements s
    where s.id = statement_id
      and s.vendor_id = private.flairo_current_vendor_id()
  )
);

create policy "FLAIRO admins manage community reports" on public.flairo_community_reports for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Community managers read their reports" on public.flairo_community_reports for select to authenticated using (community_id = private.flairo_current_community_id());

create policy "FLAIRO admins manage admin report snapshots" on public.flairo_admin_report_snapshots for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());

create policy "FLAIRO admins manage mobile sync events" on public.flairo_mobile_sync_events for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());

create policy "FLAIRO admins manage notification queue" on public.flairo_notification_queue for all to authenticated using (private.flairo_is_admin()) with check (private.flairo_is_admin());
create policy "Residents read their notifications" on public.flairo_notification_queue for select to authenticated using (resident_id = private.flairo_current_resident_id());
create policy "Vendors read their notifications" on public.flairo_notification_queue for select to authenticated using (vendor_id = private.flairo_current_vendor_id());

create policy "FLAIRO admins read audit events" on public.flairo_audit_events for select to authenticated using (private.flairo_is_admin());
create policy "FLAIRO admins create audit events" on public.flairo_audit_events for insert to authenticated with check (private.flairo_is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'flairo-vendor-documents',
  'flairo-vendor-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

create policy "FLAIRO admins manage vendor document files"
on storage.objects
for all
to authenticated
using (bucket_id = 'flairo-vendor-documents' and private.flairo_is_admin())
with check (bucket_id = 'flairo-vendor-documents' and private.flairo_is_admin());

create policy "Vendors upload their own document files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'flairo-vendor-documents'
  and (storage.foldername(name))[1] = private.flairo_current_vendor_id()::text
);

create policy "Vendors read their own document files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'flairo-vendor-documents'
  and (storage.foldername(name))[1] = private.flairo_current_vendor_id()::text
);

create policy "Vendors replace their own document files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'flairo-vendor-documents'
  and (storage.foldername(name))[1] = private.flairo_current_vendor_id()::text
)
with check (
  bucket_id = 'flairo-vendor-documents'
  and (storage.foldername(name))[1] = private.flairo_current_vendor_id()::text
);

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array[
      'flairo_services',
      'flairo_resident_profiles',
      'flairo_plus_memberships',
      'flairo_vendor_profiles',
      'flairo_vendor_compliance_documents',
      'flairo_job_requests',
      'flairo_job_claims',
      'flairo_job_timers',
      'flairo_job_payments',
      'flairo_plume_point_ledger',
      'flairo_resident_surveys',
      'flairo_vendor_cx_metrics',
      'flairo_vendor_invoice_statements',
      'flairo_vendor_invoice_statement_items',
      'flairo_community_reports',
      'flairo_mobile_sync_events',
      'flairo_notification_queue'
    ]
    loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end;
$$;

commit;