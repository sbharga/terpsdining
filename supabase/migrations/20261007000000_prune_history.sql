create function public.prune_history() returns bigint language plpgsql security invoker set search_path='' as $$
declare cutoff date := ((now() at time zone 'America/New_York')::date - interval '1 year')::date; offerings_deleted bigint; hours_deleted bigint;
begin
 delete from public.offerings where date<cutoff;
 get diagnostics offerings_deleted = row_count;
 delete from public.hours where date<cutoff;
 get diagnostics hours_deleted = row_count;
 return offerings_deleted+hours_deleted;
end $$;
revoke execute on function public.prune_history() from public,anon,authenticated;
grant execute on function public.prune_history() to service_role;
