-- V1__init.sql
-- Initial schema for What Anime Today (Postgres)

-- users table: basic Discord-linked user
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  discord_id VARCHAR(64) UNIQUE NOT NULL,
  username VARCHAR(255),
  discriminator VARCHAR(16),
  avatar VARCHAR(512),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- watchlists: one row per user/anime entry
CREATE TABLE IF NOT EXISTS watchlists (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anime_id VARCHAR(64) NOT NULL,
  source VARCHAR(32) DEFAULT 'mal', -- source identifier (mal, tmdb, etc.)
  status VARCHAR(32) DEFAULT 'planned', -- planned, watching, completed, dropped
  note TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, anime_id, source)
);

-- Simple indexes
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_anime ON watchlists(anime_id);

-- Optional example data (commented)
-- INSERT INTO users (discord_id, username, discriminator) VALUES ('123456789012345678','exampleuser','1234');
-- INSERT INTO watchlists (user_id, anime_id, source, status) VALUES (1, '1575', 'mal', 'planned');

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_on_users ON users;
CREATE TRIGGER set_timestamp_on_users
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_on_watchlists ON watchlists;
CREATE TRIGGER set_timestamp_on_watchlists
  BEFORE UPDATE ON watchlists
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();
