-- Add league_name and venue columns to football_h2h table.
-- league_name captures the human-readable league name from API-Football responses.
-- venue captures the stadium/venue name from each fixture.

ALTER TABLE football_h2h
ADD COLUMN league_name VARCHAR(255) NOT NULL DEFAULT '';

ALTER TABLE football_h2h
ADD COLUMN venue VARCHAR(255) DEFAULT ''
