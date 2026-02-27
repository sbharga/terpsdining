

create extension if not exists "uuid-ossp";


create table dining_halls (
    id   uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text not null unique
);

insert into dining_halls (name, slug) values
    ('South Campus',  'south'),
    ('Yahentamitsi',  'yahentamitsi'),
    ('251 North',     '251_north');


create table foods (
    id           uuid        primary key default uuid_generate_v4(),
    name         text        not null unique,
    allergens    text[]      default '{}',
    image_url    text,
    avg_rating   decimal(3,2) default 0,
    rating_count int         default 0,
    created_at   timestamptz default now()
);


create table menus (
    id             uuid primary key default uuid_generate_v4(),
    date           date not null,
    meal_period    text check (meal_period in ('Breakfast', 'Lunch', 'Dinner')),
    dining_hall_id uuid references dining_halls(id) on delete cascade,
    food_id        uuid references foods(id)         on delete cascade,
    unique(date, meal_period, dining_hall_id, food_id)
);


create table hours (
    id             uuid primary key default uuid_generate_v4(),
    date           date not null,
    dining_hall_id uuid references dining_halls(id) on delete cascade,
    breakfast      text default 'Closed',
    lunch          text default 'Closed',
    dinner         text default 'Closed',
    unique(date, dining_hall_id)
);


create table profiles (
    id         uuid primary key references auth.users on delete cascade,
    username   text unique,
    is_admin   boolean     default false,
    updated_at timestamptz default now()
);


create table ratings (
    id             uuid primary key default uuid_generate_v4(),
    user_id        uuid references auth.users    on delete cascade,
    food_id        uuid references foods(id)     on delete cascade,
    rating_overall int  check (rating_overall between 1 and 5),
    rating_taste   int  check (rating_taste   between 1 and 5),
    rating_health  int  check (rating_health  between 1 and 5),
    created_at     timestamptz default now(),
    unique(user_id, food_id)
);


create index idx_menus_date       on menus(date);
create index idx_ratings_food_id  on ratings(food_id);


create or replace function handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
    insert into public.profiles (id)
    values (new.id);
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure handle_new_user();


create or replace function update_food_rating()
returns trigger
language plpgsql security definer
as $$
declare
    target_food_id uuid;
begin
    target_food_id := coalesce(new.food_id, old.food_id);

    update foods
    set
        avg_rating   = (
            select coalesce(round(avg(rating_overall)::numeric, 2), 0)
            from   ratings
            where  food_id = target_food_id
        ),
        rating_count = (
            select count(*)
            from   ratings
            where  food_id = target_food_id
        )
    where id = target_food_id;

    return coalesce(new, old);
end;
$$;

create trigger on_rating_change
    after insert or update or delete on ratings
    for each row execute procedure update_food_rating();



alter table dining_halls enable row level security;
alter table foods         enable row level security;
alter table menus         enable row level security;
alter table hours         enable row level security;
alter table profiles      enable row level security;
alter table ratings       enable row level security;

create policy "Public read dining_halls"
    on dining_halls for select
    to anon, authenticated
    using (true);

create policy "Public read foods"
    on foods for select
    to anon, authenticated
    using (true);

create policy "Admin update foods"
    on foods for update
    to authenticated
    using (
        exists (
            select 1 from profiles
            where id = auth.uid() and is_admin = true
        )
    );

create policy "Public read menus"
    on menus for select
    to anon, authenticated
    using (true);

create policy "Public read hours"
    on hours for select
    to anon, authenticated
    using (true);

create policy "Public read profiles"
    on profiles for select
    to anon, authenticated
    using (true);

create policy "User update own profile"
    on profiles for update
    to authenticated
    using (id = auth.uid());

create policy "Public read ratings"
    on ratings for select
    to anon, authenticated
    using (true);

create policy "User insert own rating"
    on ratings for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "User update own rating"
    on ratings for update
    to authenticated
    using (user_id = auth.uid());

create policy "User delete own rating"
    on ratings for delete
    to authenticated
    using (user_id = auth.uid());



insert into storage.buckets (id, name, public)
values ('food-images', 'food-images', true)
on conflict (id) do nothing;

create policy "Public Access"
    on storage.objects for select
    using ( bucket_id = 'food-images' );

create policy "Admin Upload"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'food-images' AND
        exists (
            select 1 from public.profiles
            where id = auth.uid() and is_admin = true
        )
    );

create policy "Admin Update"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'food-images' AND
        exists (
            select 1 from public.profiles
            where id = auth.uid() and is_admin = true
        )
    );
