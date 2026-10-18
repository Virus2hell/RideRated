-- Step 3.5: banners, posts, custom tags, comment replies, PIN codes, OSM roads

-- Profile banner image (like LinkedIn / YouTube)
ALTER TABLE users ADD COLUMN banner_url TEXT;

-- Roads: PIN code + the OpenStreetMap id of the road it came from (prevents duplicates)
ALTER TABLE roads
  ADD COLUMN pincode CHAR(6) CHECK (pincode ~ '^[1-9][0-9]{5}$'),
  ADD COLUMN osm_id BIGINT UNIQUE;

-- Custom tags: TEXT[] of fixed keys  ->  JSONB array of { "label": "Potholes", "tone": "bad" }
-- (Postgres can't use a subquery in ALTER COLUMN ... USING, so: new column, copy, swap.)
ALTER TABLE road_reviews ADD COLUMN tags_new JSONB NOT NULL DEFAULT '[]';
UPDATE road_reviews SET tags_new = COALESCE((
  SELECT jsonb_agg(jsonb_build_object(
    'label', CASE t WHEN 'off_road' THEN 'Off-road' WHEN 'food_stops' THEN 'Food stops'
                    WHEN 'heavy_traffic' THEN 'Heavy traffic' WHEN 'no_fuel_nearby' THEN 'No fuel nearby'
                    WHEN 'unsafe_at_night' THEN 'Unsafe at night' ELSE initcap(replace(t, '_', ' ')) END,
    'tone', CASE WHEN t IN ('potholes', 'construction', 'heavy_traffic', 'no_fuel_nearby', 'unsafe_at_night')
                 THEN 'bad' ELSE 'good' END))
  FROM unnest(tags) AS t), '[]');
DROP INDEX road_reviews_tags_gin;
ALTER TABLE road_reviews DROP COLUMN tags;
ALTER TABLE road_reviews RENAME COLUMN tags_new TO tags;
CREATE INDEX road_reviews_tags_gin ON road_reviews USING GIN (tags jsonb_path_ops);

-- Comment replies: a comment can answer another comment (deleting a comment deletes its replies)
ALTER TABLE review_comments ADD COLUMN parent_id UUID REFERENCES review_comments(id) ON DELETE CASCADE;
CREATE INDEX review_comments_parent_idx ON review_comments(parent_id);

-- Posts: Instagram-style photo posts on a rider's profile
CREATE TABLE posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caption     TEXT CHECK (char_length(caption) <= 1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX posts_user_idx ON posts(user_id, created_at DESC);

CREATE TABLE post_photos (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url       TEXT NOT NULL,
  position  SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX post_photos_post_idx ON post_photos(post_id, position);

CREATE TABLE post_likes (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
CREATE INDEX post_likes_post_idx ON post_likes(post_id);

-- Garage is replaced by posts
DROP TABLE bikes;
