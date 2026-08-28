create or replace function public.flairo_connection_ping()
returns text
language sql
stable
as $$
  select 'ok'::text
$$;

grant execute on function public.flairo_connection_ping() to anon, authenticated;
