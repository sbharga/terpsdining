create or replace function public.search_items(p_query text,p_date date,p_limit int default 30,p_offset int default 0)
returns table(id text,name text,image_path text,allergens text[],dietary text[],rating_avg numeric,rating_count int,halls jsonb,last_seen date,total_count bigint)
language sql stable security invoker set search_path='' as $$
 select i.id,i.name,i.image_path,i.allergens,i.dietary,i.rating_avg,i.rating_count,
 coalesce((select jsonb_agg(distinct jsonb_build_object('slug',h.slug,'name',h.name,'meal',o.meal)) from public.offerings o join public.halls h on h.id=o.hall_id where o.item_id=i.id and o.date=p_date),'[]'::jsonb),i.last_seen,
 count(*) over()
 from public.items i where length(trim(p_query))>=2 and i.name ilike all(array(select '%'||replace(replace(replace(t,'\','\\'),'%','\%'),'_','\_')||'%' from regexp_split_to_table(trim(p_query),'\s+') t))
 order by exists(select 1 from public.offerings o where o.item_id=i.id and o.date=p_date) desc,i.name ilike '%'||replace(replace(replace(regexp_replace(trim(p_query),'\s+',' ','g'),'\','\\'),'%','\%'),'_','\_')||'%' desc,extensions.similarity(i.name,p_query) desc,i.last_seen desc nulls last,i.name,i.id limit p_limit offset p_offset;
$$;
