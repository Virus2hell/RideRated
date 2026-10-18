-- Step 3: rider profiles
-- The year a rider started riding, shown as "Riding since 2018" on their profile.
ALTER TABLE users
  ADD COLUMN riding_since SMALLINT CHECK (riding_since BETWEEN 1950 AND 2100);

-- Fast "people this user follows" lookups for the Following feed.
CREATE INDEX follows_follower_idx ON follows(follower_id, created_at DESC);
