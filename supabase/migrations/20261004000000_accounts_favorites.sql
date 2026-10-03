create table public.favorites (user_id uuid not null default auth.uid() references auth.users on delete cascade, item_id text not null references public.items on delete cascade, created_at timestamptz not null default now(), primary key(user_id,item_id));
alter table public.favorites enable row level security;
create policy "own favorites read" on public.favorites for select to authenticated using((select auth.uid())=user_id);
create policy "own favorites insert" on public.favorites for insert to authenticated with check((select auth.uid())=user_id);
create policy "own favorites delete" on public.favorites for delete to authenticated using((select auth.uid())=user_id);
create function public.favorite_items(p_date date)
returns table(id text,name text,image_path text,allergens text[],dietary text[],rating_avg numeric,rating_count int,halls jsonb)
language sql stable security invoker set search_path='' as $$
 select i.id,i.name,i.image_path,i.allergens,i.dietary,i.rating_avg,i.rating_count,
 (select jsonb_agg(distinct jsonb_build_object('slug',h.slug,'name',h.name,'meal',o.meal)) from public.offerings o join public.halls h on h.id=o.hall_id where o.item_id=i.id and o.date=p_date)
 from public.favorites f join public.items i on i.id=f.item_id
 where f.user_id=(select auth.uid()) and exists(select 1 from public.offerings o where o.item_id=i.id and o.date=p_date)
 order by i.name;
$$;
revoke execute on function public.favorite_items(date) from public,anon;
grant execute on function public.favorite_items(date) to authenticated;
create function public.delete_account() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'not authenticated' using errcode='42501'; end if;
 delete from auth.users where id=auth.uid();
end $$;
revoke execute on function public.delete_account() from public,anon;
grant execute on function public.delete_account() to authenticated;
