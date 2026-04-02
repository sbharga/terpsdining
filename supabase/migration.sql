TRUNCATE TABLE foods CASCADE;

ALTER TABLE foods ADD COLUMN nutrition_url text;

ALTER TABLE menus ADD COLUMN section text NOT NULL DEFAULT 'Unknown';

ALTER TABLE menus DROP CONSTRAINT menus_date_meal_period_dining_hall_id_food_id_key;
ALTER TABLE menus ADD CONSTRAINT menus_date_meal_period_dining_hall_id_food_id_section_key UNIQUE (date, meal_period, dining_hall_id, food_id, section);
