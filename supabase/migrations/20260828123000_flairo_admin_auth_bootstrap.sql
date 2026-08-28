begin;

create unique index if not exists flairo_app_users_email_unique_idx
on public.flairo_app_users ((lower(email)));

create or replace function private.flairo_signed_in_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(nullif((select auth.jwt() ->> 'email'), ''))
$$;

create or replace function private.flairo_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select au.role
  from public.flairo_app_users au
  where au.status = 'active'
    and (
      au.user_id = (select auth.uid())
      or (
        au.user_id is null
        and lower(au.email) = private.flairo_signed_in_email()
      )
    )
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
  where au.status = 'active'
    and (
      au.user_id = (select auth.uid())
      or (
        au.user_id is null
        and lower(au.email) = private.flairo_signed_in_email()
      )
    )
  limit 1
$$;

create or replace function public.flairo_claim_app_user()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  signed_in_user_id uuid := (select auth.uid());
  signed_in_email text := private.flairo_signed_in_email();
begin
  if signed_in_user_id is null or signed_in_email is null then
    raise exception 'A signed-in Supabase Auth user is required to claim a FLAIRO app user.';
  end if;

  return query
    update public.flairo_app_users au
    set
      user_id = signed_in_user_id,
      status = 'active',
      last_seen_at = now(),
      updated_at = now()
    where lower(au.email) = signed_in_email
      and au.status in ('active', 'invited')
      and (au.user_id is null or au.user_id = signed_in_user_id)
    returning au.id, au.email, au.full_name, au.role, au.status;

  if not found then
    raise exception 'No FLAIRO app user invite matches this signed-in email.';
  end if;
end;
$$;

drop policy if exists "Users can read their own app user" on public.flairo_app_users;

create policy "Users can read their own app user"
on public.flairo_app_users
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (
    user_id is null
    and lower(email) = private.flairo_signed_in_email()
  )
);

grant execute on function private.flairo_signed_in_email() to authenticated;
grant execute on function public.flairo_claim_app_user() to authenticated;
do $$
declare
  existing_auth_user_id uuid;
begin
  select u.id
  into existing_auth_user_id
  from auth.users u
  where lower(u.email) = lower('info@flairo.org')
  limit 1;

  insert into public.flairo_app_users (
    user_id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
  )
  values (
    existing_auth_user_id,
    'info@flairo.org',
    'FLAIRO ADMIN',
    'owner',
    'active',
    now(),
    now()
  )
  on conflict ((lower(email))) do update
  set
    user_id = coalesce(public.flairo_app_users.user_id, excluded.user_id),
    full_name = excluded.full_name,
    role = excluded.role,
    status = excluded.status,
    updated_at = now();
end $$;

commit;
