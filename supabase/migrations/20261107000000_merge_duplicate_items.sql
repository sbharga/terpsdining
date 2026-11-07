alter table public.items
 add column canonical_id text references public.items on delete set null,
 add column recipe_allergens text[] not null default '{}',
 add column recipe_dietary text[] not null default '{}',
 add constraint items_canonical_not_self check (canonical_id <> id);
update public.items set recipe_allergens=allergens, recipe_dietary=dietary;
create index items_canonical_id on public.items(canonical_id) where canonical_id is not null;
create function public.item_name_key(p_name text) returns text language sql immutable set search_path='' as $$ select lower(regexp_replace(trim(p_name),'\s+',' ','g')) $$;
create function public.merge_items() returns int language plpgsql security invoker set search_path='' as $$
declare merged int;
begin
 with ranked as (select id, first_value(id) over(partition by public.item_name_key(name) order by first_seen nulls last, id) as root from public.items where canonical_id is null)
 update public.items i set canonical_id=r.root from ranked r where i.id=r.id and r.root<>r.id;
 get diagnostics merged = row_count;
 update public.items a set canonical_id=m.canonical_id from public.items m where a.canonical_id=m.id and m.canonical_id is not null;
 delete from public.reviews r using public.items ri where ri.id=r.item_id and exists(
  select 1 from public.reviews k join public.items ki on ki.id=k.item_id
  where k.user_id=r.user_id and k.item_id<>r.item_id and coalesce(ki.canonical_id,ki.id)=coalesce(ri.canonical_id,ri.id)
  and (k.updated_at,k.item_id)>(r.updated_at,r.item_id));
 update public.reviews r set item_id=a.canonical_id from public.items a where r.item_id=a.id and a.canonical_id is not null;
 insert into public.favorites(user_id,item_id,created_at)
  select distinct on(f.user_id,a.canonical_id) f.user_id,a.canonical_id,f.created_at from public.favorites f join public.items a on a.id=f.item_id
  where a.canonical_id is not null order by f.user_id,a.canonical_id,f.created_at
  on conflict (user_id,item_id) do nothing;
 delete from public.favorites f using public.items a where f.item_id=a.id and a.canonical_id is not null;
 insert into public.offerings(hall_id,date,meal,station,item_id,portion)
  select distinct on(o.hall_id,o.date,o.meal,o.station,a.canonical_id) o.hall_id,o.date,o.meal,o.station,a.canonical_id,o.portion
  from public.offerings o join public.items a on a.id=o.item_id where a.canonical_id is not null
  order by o.hall_id,o.date,o.meal,o.station,a.canonical_id,o.item_id
  on conflict do nothing;
 delete from public.offerings o using public.items a where o.item_id=a.id and a.canonical_id is not null;
 update public.items m set first_seen=least(m.first_seen,g.first_seen), last_seen=greatest(m.last_seen,g.last_seen), image_path=coalesce(m.image_path,g.image_path)
 from (select canonical_id, min(first_seen) first_seen, max(last_seen) last_seen, (array_agg(image_path order by id) filter (where image_path is not null))[1] image_path
       from public.items where canonical_id is not null group by canonical_id) g
 where m.id=g.canonical_id;
 with members as (select coalesce(canonical_id,id) root, recipe_allergens, recipe_dietary from public.items),
 sizes as (select root, count(*) n from members group by root),
 allergen_sets as (select m.root, array_agg(distinct a order by a) v from members m cross join unnest(m.recipe_allergens) a group by m.root),
 diet_counts as (select m.root, d, count(*) c from members m cross join unnest(m.recipe_dietary) d group by m.root, d),
 diet_sets as (select dc.root, array_agg(dc.d order by dc.d) v from diet_counts dc join sizes s using(root) where dc.c=s.n group by dc.root)
 update public.items i set allergens=coalesce(al.v,'{}'), dietary=coalesce(ds.v,'{}')
 from sizes s left join allergen_sets al using(root) left join diet_sets ds using(root)
 where i.id=s.root and (i.allergens is distinct from coalesce(al.v,'{}') or i.dietary is distinct from coalesce(ds.v,'{}'));
 update public.items set allergens=recipe_allergens, dietary=recipe_dietary
  where canonical_id is not null and (allergens is distinct from recipe_allergens or dietary is distinct from recipe_dietary);
 return merged;
end $$;
revoke execute on function public.merge_items() from public,anon,authenticated;
grant execute on function public.merge_items() to service_role;
create or replace function public.replace_offerings(p_hall smallint,p_date date,p_meal public.meal,p_rows jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
 delete from public.offerings where hall_id=p_hall and date=p_date and meal=p_meal;
 insert into public.offerings(hall_id,date,meal,station,item_id,portion)
 select distinct on(x.item_id,x.station) p_hall,p_date,p_meal,x.station,x.item_id,x.portion
 from (select coalesce(i.canonical_id,r.item_id) item_id, r.station, r.portion from jsonb_to_recordset(p_rows) as r(item_id text,station text,portion text) left join public.items i on i.id=r.item_id) x
 order by x.item_id,x.station;
 update public.items set first_seen=least(coalesce(first_seen,p_date),p_date),last_seen=greatest(coalesce(last_seen,p_date),p_date)
 where id in(select coalesce(i.canonical_id,r.item_id) from jsonb_to_recordset(p_rows) as r(item_id text) left join public.items i on i.id=r.item_id);
end $$;
create or replace function public.search_items(p_query text,p_date date,p_limit int default 30,p_offset int default 0,p_diet text[] default '{}',p_avoid text[] default '{}')
returns table(id text,name text,image_path text,allergens text[],dietary text[],rating_avg numeric,rating_count int,halls jsonb,last_seen date,total_count bigint)
language sql stable security invoker set search_path='' as $$
 select i.id,i.name,i.image_path,i.allergens,i.dietary,i.rating_avg,i.rating_count,
 coalesce((select jsonb_agg(distinct jsonb_build_object('slug',h.slug,'name',h.name,'meal',o.meal)) from public.offerings o join public.halls h on h.id=o.hall_id where o.item_id=i.id and o.date=p_date),'[]'::jsonb),i.last_seen,
 count(*) over()
 from public.items i where length(trim(p_query))>=2 and i.name ilike all(array(select '%'||replace(replace(replace(t,'\','\\'),'%','\%'),'_','\_')||'%' from regexp_split_to_table(trim(p_query),'\s+') t))
 and i.dietary @> p_diet and not i.allergens && p_avoid and i.canonical_id is null
 order by exists(select 1 from public.offerings o where o.item_id=i.id and o.date=p_date) desc,
 i.rating_count>0 desc,(i.rating_sum+10.5)/(i.rating_count+3.0) desc,i.rating_count desc,
 i.name ilike '%'||replace(replace(replace(regexp_replace(trim(p_query),'\s+',' ','g'),'\','\\'),'%','\%'),'_','\_')||'%' desc,extensions.similarity(i.name,p_query) desc,i.last_seen desc nulls last,i.name,i.id limit p_limit offset p_offset;
$$;
select public.merge_items();
