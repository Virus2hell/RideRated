-- RideRated initial schema
-- Requires PostGIS for location-based road search.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;   -- case-insensitive email/username

-- ---------- Users ----------
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username       CITEXT UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_.]{3,30}$'),
  email          CITEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  display_name   TEXT NOT NULL,
  bio            TEXT CHECK (char_length(bio) <= 300),
  avatar_url     TEXT,
  city           TEXT,
  instagram_url  TEXT,
  youtube_url    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Garage: a user's bikes ----------
CREATE TABLE bikes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  make        TEXT NOT NULL,          -- e.g. Royal Enfield
  model       TEXT NOT NULL,          -- e.g. Himalayan 450
  year        SMALLINT CHECK (year BETWEEN 1950 AND 2100),
  nickname    TEXT,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bikes_user_id_idx ON bikes(user_id);

-- ---------- Follows ----------
CREATE TABLE follows (
  follower_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX follows_following_idx ON follows(following_id);

-- ---------- Roads ----------
-- A road (or stretch / ghat) is a place on the map. Many riders review the same road.
CREATE TABLE roads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,                       -- e.g. "Tamhini Ghat"
  city        TEXT,                                -- nearest city / region
  location    GEOGRAPHY(POINT, 4326) NOT NULL,     -- pin on the map (lng, lat)
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX roads_location_gix ON roads USING GIST (location);
CREATE INDEX roads_name_idx ON roads (lower(name));

-- ---------- Road reviews ----------
-- Multiple reviews per rider per road are allowed: road conditions change over time.
CREATE TABLE road_reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  road_id          UUID NOT NULL REFERENCES roads(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  body             TEXT NOT NULL CHECK (char_length(body) BETWEEN 10 AND 5000),
  rating_overall   SMALLINT NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  rating_surface   SMALLINT CHECK (rating_surface BETWEEN 1 AND 5),
  rating_scenery   SMALLINT CHECK (rating_scenery BETWEEN 1 AND 5),
  rating_traffic   SMALLINT CHECK (rating_traffic BETWEEN 1 AND 5),  -- 5 = very little traffic
  rating_safety    SMALLINT CHECK (rating_safety BETWEEN 1 AND 5),
  ridden_on        DATE,                                    -- when the rider was actually there
  best_season      TEXT CHECK (best_season IN ('monsoon', 'winter', 'summer', 'all_year')),
  tags             TEXT[] NOT NULL DEFAULT '{}',            -- ghat, highway, off_road, potholes...
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX road_reviews_road_idx ON road_reviews(road_id, created_at DESC);
CREATE INDEX road_reviews_user_idx ON road_reviews(user_id, created_at DESC);
CREATE INDEX road_reviews_feed_idx ON road_reviews(created_at DESC);
CREATE INDEX road_reviews_tags_gin ON road_reviews USING GIN (tags);

CREATE TABLE review_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID NOT NULL REFERENCES road_reviews(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  position    SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX review_photos_review_idx ON review_photos(review_id, position);

CREATE TABLE review_likes (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id   UUID NOT NULL REFERENCES road_reviews(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);
CREATE INDEX review_likes_review_idx ON review_likes(review_id);

CREATE TABLE review_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID NOT NULL REFERENCES road_reviews(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX review_comments_review_idx ON review_comments(review_id, created_at);
