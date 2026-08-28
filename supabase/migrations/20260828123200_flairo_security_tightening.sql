begin;

alter function public.flairo_touch_updated_at() set search_path = '';
alter function public.flairo_connection_ping() set search_path = '';

drop function if exists public.flairo_connection_health();

revoke execute on function public.flairo_claim_app_user() from public;
grant execute on function public.flairo_claim_app_user() to authenticated;

commit;
