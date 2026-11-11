alter table public.offerings add column recipe_id text references public.items on delete set null;
-- Offerings of an item that has aliases were collapsed onto the main item by merge_items, so the recipe served is unknown (null).
update public.offerings o set recipe_id=o.item_id where not exists(select 1 from public.items a where a.canonical_id=o.item_id);
alter table public.offerings drop constraint offerings_pkey;
create unique index offerings_slot_recipe on public.offerings(hall_id,date,meal,station,item_id,coalesce(recipe_id,item_id));
create or replace function public.merge_items() returns int language plpgsql security invoker set search_path='' as $$
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
 insert into public.offerings(hall_id,date,meal,station,item_id,portion,recipe_id)
  select distinct on(o.hall_id,o.date,o.meal,o.station,a.canonical_id,coalesce(o.recipe_id,o.item_id)) o.hall_id,o.date,o.meal,o.station,a.canonical_id,o.portion,coalesce(o.recipe_id,o.item_id)
  from public.offerings o join public.items a on a.id=o.item_id where a.canonical_id is not null
  order by o.hall_id,o.date,o.meal,o.station,a.canonical_id,coalesce(o.recipe_id,o.item_id)
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
create or replace function public.replace_offerings(p_hall smallint,p_date date,p_meal public.meal,p_rows jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
 delete from public.offerings where hall_id=p_hall and date=p_date and meal=p_meal;
 insert into public.offerings(hall_id,date,meal,station,item_id,portion,recipe_id)
 select distinct on(x.item_id,x.station,x.recipe_id) p_hall,p_date,p_meal,x.station,x.item_id,x.portion,x.recipe_id
 from (select coalesce(i.canonical_id,r.item_id) item_id, r.station, r.portion, r.item_id recipe_id from jsonb_to_recordset(p_rows) as r(item_id text,station text,portion text) left join public.items i on i.id=r.item_id) x
 order by x.item_id,x.station,x.recipe_id;
 update public.items set first_seen=least(coalesce(first_seen,p_date),p_date),last_seen=greatest(coalesce(last_seen,p_date),p_date)
 where id in(select coalesce(i.canonical_id,r.item_id) from jsonb_to_recordset(p_rows) as r(item_id text) left join public.items i on i.id=r.item_id);
end $$;
create or replace function public.item_histories(p_ids text[])
returns table(item_id text,history jsonb)
language sql stable security invoker set search_path='' as $$
 select x.id,coalesce((select jsonb_agg(jsonb_build_object('date',o.date,'meal',o.meal,'station',o.station,'recipe_id',o.recipe_id,'hall',jsonb_build_object('slug',h.slug,'name',h.name)) order by o.date desc)
  from (select * from public.offerings where item_id=x.id order by date desc limit 300) o join public.halls h on h.id=o.hall_id),'[]'::jsonb)
 from unnest(p_ids) as x(id);
$$;
