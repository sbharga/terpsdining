ALTER TABLE foods ADD COLUMN IF NOT EXISTS slug text UNIQUE;
UPDATE foods SET slug = trim(both '-' from lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')));
