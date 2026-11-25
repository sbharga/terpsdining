-- Future menus are scraped ahead of time; items.first_seen/last_seen and item history only count dates up to today (America/New_York).
create or replace function public.replace_offerings(p_hall smallint,p_date date,p_meal public.meal,p_rows jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
 delete from public.offerings where hall_id=p_hall and date=p_date and meal=p_meal;
 insert into public.offerings(hall_id,date,meal,station,item_id,portion,recipe_id)
 select distinct on(x.item_id,x.station,x.recipe_id) p_hall,p_date,p_meal,x.station,x.item_id,x.portion,x.recipe_id
 from (select coalesce(i.canonical_id,r.item_id) item_id, r.station, r.portion, r.item_id recipe_id from jsonb_to_recordset(p_rows) as r(item_id text,station text,portion text) left join public.items i on i.id=r.item_id) x
 order by x.item_id,x.station,x.recipe_id;
 update public.items set first_seen=least(coalesce(first_seen,p_date),p_date),last_seen=greatest(coalesce(last_seen,p_date),p_date)
 where p_date<=(now() at time zone 'America/New_York')::date and id in(select coalesce(i.canonical_id,r.item_id) from jsonb_to_recordset(p_rows) as r(item_id text) left join public.items i on i.id=r.item_id);
end $$;
create or replace function public.item_histories(p_ids text[])
returns table(item_id text,history jsonb)
language sql stable security invoker set search_path='' as $$
 select x.id,coalesce((select jsonb_agg(jsonb_build_object('date',o.date,'meal',o.meal,'station',o.station,'recipe_id',o.recipe_id,'hall',jsonb_build_object('slug',h.slug,'name',h.name)) order by o.date desc)
  from (select * from public.offerings where item_id=x.id and date<=(now() at time zone 'America/New_York')::date order by date desc limit 300) o join public.halls h on h.id=o.hall_id),'[]'::jsonb)
 from unnest(p_ids) as x(id);
$$;
-- Earlier --days N runs may have recorded future dates.
update public.items i set
 last_seen=(select max(o.date) from public.offerings o where o.item_id=i.id and o.date<=(now() at time zone 'America/New_York')::date),
 first_seen=case when i.first_seen>(now() at time zone 'America/New_York')::date
  then (select min(o.date) from public.offerings o where o.item_id=i.id and o.date<=(now() at time zone 'America/New_York')::date)
  else i.first_seen end
where i.canonical_id is null and (i.last_seen>(now() at time zone 'America/New_York')::date or i.first_seen>(now() at time zone 'America/New_York')::date);
