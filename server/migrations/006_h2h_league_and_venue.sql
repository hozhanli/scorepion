-- Add league_name and venue columns to football_h2h table.
-- league_name captures the human-readable league name from API-Football responses.
-- venue captures the stadium/venue name from each fixture.

ALTER TABLE football_h2h
ADD COLUMN IF NOT EXISTS league_name TEXT NOT NULL DEFAULT '';

ALTER TABLE football_h2h
ADD COLUMN IF NOT EXISTS venue TEXT DEFAULT '';
