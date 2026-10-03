create extension if not exists pg_trgm with schema extensions;
create type public.meal as enum ('Breakfast','Lunch','Dinner');
create type public.hours_status as enum ('open','closed','tbd');
create table public.halls (id smallint primary key, slug text unique not null, name text not null, sheet_name text unique not null);
insert into public.halls values (16,'south-campus','South Campus','South Campus'),(19,'yahentamitsi','Yahentamitsi','Yahentamitsi'),(51,'251-north','251 North','251 North');
create table public.hours (hall_id smallint references public.halls, date date, meal public.meal, status public.hours_status not null, label text not null, opens time, closes time, primary key(hall_id,date,meal));
create table public.items (
 id text primary key, name text not null, allergens text[] not null default '{}', dietary text[] not null default '{}',
 label_url text, nutrition jsonb, ingredients text, label_allergens text, nutrition_checked_at timestamptz,
 image_path text, image_checked_at timestamptz, first_seen date, last_seen date,
 rating_sum int not null default 0, rating_count int not null default 0,
 rating_avg numeric generated always as (case when rating_count=0 then null else round(rating_sum::numeric/rating_count,2) end) stored,
 created_at timestamptz not null default now()
);
create index items_name_trgm on public.items using gin (name extensions.gin_trgm_ops);
create index items_last_seen on public.items(last_seen desc);
create table public.offerings (hall_id smallint references public.halls, date date, meal public.meal, station text, item_id text references public.items on delete cascade, portion text, primary key(hall_id,date,meal,station,item_id));
create index offerings_item_date on public.offerings(item_id,date desc);
create index offerings_date_hall on public.offerings(date,hall_id);
create table public.reviews (user_id uuid not null default auth.uid() references auth.users on delete cascade, item_id text references public.items on delete cascade, rating smallint not null check(rating between 1 and 5), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(user_id,item_id));
create function public.sync_item_rating() returns trigger language plpgsql security definer set search_path='' as $$
declare target text;
begin
 for target in select distinct x from unnest(array[case when TG_OP <> 'DELETE' then new.item_id end,case when TG_OP <> 'INSERT' then old.item_id end]) x where x is not null loop
  perform 1 from public.items where id=target for update;
  update public.items set rating_sum=(select coalesce(sum(rating),0) from public.reviews where item_id=target), rating_count=(select count(*) from public.reviews where item_id=target) where id=target;
 end loop;
 return null;
end $$;
create trigger sync_item_rating after insert or update or delete on public.reviews for each row execute function public.sync_item_rating();
create function public.touch_review() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
create trigger touch_review before update on public.reviews for each row execute function public.touch_review();
alter table public.halls enable row level security;
alter table public.hours enable row level security;
alter table public.items enable row level security;
alter table public.offerings enable row level security;
alter table public.reviews enable row level security;
create policy "public read" on public.halls for select to anon,authenticated using(true);
create policy "public read" on public.hours for select to anon,authenticated using(true);
create policy "public read" on public.items for select to anon,authenticated using(true);
create policy "public read" on public.offerings for select to anon,authenticated using(true);
create policy "own reviews read" on public.reviews for select to authenticated using((select auth.uid())=user_id);
create policy "own reviews insert" on public.reviews for insert to authenticated with check((select auth.uid())=user_id);
create policy "own reviews update" on public.reviews for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy "own reviews delete" on public.reviews for delete to authenticated using((select auth.uid())=user_id);
create function public.replace_offerings(p_hall smallint,p_date date,p_meal public.meal,p_rows jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
 delete from public.offerings where hall_id=p_hall and date=p_date and meal=p_meal;
 insert into public.offerings(hall_id,date,meal,station,item_id,portion)
 select distinct on(item_id,station) p_hall,p_date,p_meal,station,item_id,portion from jsonb_to_recordset(p_rows) as r(item_id text,station text,portion text) order by item_id,station;
 update public.items set first_seen=least(coalesce(first_seen,p_date),p_date),last_seen=greatest(coalesce(last_seen,p_date),p_date) where id in(select r.item_id from jsonb_to_recordset(p_rows) as r(item_id text));
end $$;
revoke execute on function public.replace_offerings(smallint,date,public.meal,jsonb) from public,anon,authenticated;
grant execute on function public.replace_offerings(smallint,date,public.meal,jsonb) to service_role;
create function public.popular_items(p_date date,p_hall smallint default null,p_limit int default 12)
returns table(id text,name text,image_path text,allergens text[],dietary text[],rating_avg numeric,rating_count int,halls jsonb)
language sql stable security invoker set search_path='' as $$
 select i.id,i.name,i.image_path,i.allergens,i.dietary,i.rating_avg,i.rating_count,
 (select jsonb_agg(distinct jsonb_build_object('slug',h.slug,'name',h.name,'meal',o.meal)) from public.offerings o join public.halls h on h.id=o.hall_id where o.item_id=i.id and o.date=p_date)
 from public.items i where i.rating_count>0 and exists(select 1 from public.offerings o where o.item_id=i.id and o.date=p_date and (p_hall is null or o.hall_id=p_hall))
 order by (i.rating_sum+10.5)/(i.rating_count+3.0) desc,i.rating_count desc,i.name limit p_limit;
$$;
create function public.search_items(p_query text,p_date date,p_limit int default 30)
returns table(id text,name text,image_path text,allergens text[],dietary text[],rating_avg numeric,rating_count int,halls jsonb,last_seen date)
language sql stable security invoker set search_path='' as $$
 select i.id,i.name,i.image_path,i.allergens,i.dietary,i.rating_avg,i.rating_count,
 coalesce((select jsonb_agg(distinct jsonb_build_object('slug',h.slug,'name',h.name,'meal',o.meal)) from public.offerings o join public.halls h on h.id=o.hall_id where o.item_id=i.id and o.date=p_date),'[]'::jsonb),i.last_seen
 from public.items i where length(trim(p_query))>=2 and i.name ilike '%'||replace(replace(replace(trim(p_query),'\','\\'),'%','\%'),'_','\_')||'%'
 order by exists(select 1 from public.offerings o where o.item_id=i.id and o.date=p_date) desc,extensions.similarity(i.name,p_query) desc,i.last_seen desc nulls last,i.name limit p_limit;
$$;
insert into storage.buckets(id,name,public) values('food-images','food-images',true) on conflict do nothing;
