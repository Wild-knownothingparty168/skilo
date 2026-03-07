-- Skilo Database Schema for Cloudflare D1

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Orgs table
CREATE TABLE orgs (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Org members
CREATE TABLE org_members (
  org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (org_id, user_id)
);

-- Skills table
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  namespace TEXT NOT NULL,
  description TEXT,
  latest_version TEXT DEFAULT '0.0.0',
  privacy TEXT DEFAULT 'public',  -- public, unlisted, org_private
  deprecated INTEGER DEFAULT 0,
  deprecation_message TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(namespace, name)
);

-- Skill versions
CREATE TABLE skill_versions (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  tarball_url TEXT NOT NULL,
  size INTEGER,
  checksumsha256 TEXT,
  signature TEXT,
  public_key TEXT,
  yanked INTEGER DEFAULT 0,
  yanked_reason TEXT,
  metadata_json TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(skill_id, version)
);

-- API Keys
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  permissions TEXT DEFAULT 'read',
  created_at INTEGER DEFAULT (unixepoch())
);

-- OAuth Clients
CREATE TABLE oauth_clients (
  id TEXT PRIMARY KEY,
  client_id TEXT UNIQUE NOT NULL,
  client_secret_hash TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER DEFAULT (unixepoch())
);

-- OAuth Tokens
CREATE TABLE oauth_tokens (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at INTEGER NOT NULL,
  scope TEXT DEFAULT 'read',
  created_at INTEGER DEFAULT (unixepoch())
);

-- Share links (one-time or expiring)
CREATE TABLE share_links (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  one_time INTEGER DEFAULT 0,
  expires_at INTEGER,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  password_hash TEXT,
  created_by TEXT REFERENCES users(id),
  notify_url TEXT,
  opened_at INTEGER,
  opened_by TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Audit log
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata_json TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Trusted publishers
CREATE TABLE trusted_publishers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  fingerprint TEXT NOT NULL,
  name TEXT,
  trusted_at INTEGER DEFAULT (unixepoch())
);

-- Indexes
CREATE INDEX idx_skills_namespace ON skills(namespace);
CREATE INDEX idx_skills_privacy ON skills(privacy);
CREATE INDEX idx_skill_versions_skill_id ON skill_versions(skill_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_oauth_tokens_access_token ON oauth_tokens(access_token);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_share_links_token ON share_links(token);

-- Full-text search
CREATE VIRTUAL TABLE skills_fts USING fts5(
  name,
  description,
  namespace,
  content='skills',
  content_rowid='rowid'
);

-- FTS triggers
CREATE TRIGGER skills_fts_insert AFTER INSERT ON skills BEGIN
  INSERT INTO skills_fts(rowid, name, description, namespace)
  VALUES (NEW.rowid, NEW.name, NEW.description, NEW.namespace);
END;

CREATE TRIGGER skills_fts_delete AFTER DELETE ON skills BEGIN
  INSERT INTO skills_fts(skills_fts, rowid, name, description, namespace)
  VALUES ('delete', OLD.rowid, OLD.name, OLD.description, OLD.namespace);
END;

CREATE TRIGGER skills_fts_update AFTER UPDATE ON skills BEGIN
  INSERT INTO skills_fts(skills_fts, rowid, name, description, namespace)
  VALUES ('delete', OLD.rowid, OLD.name, OLD.description, OLD.namespace);
  INSERT INTO skills_fts(rowid, name, description, namespace)
  VALUES (NEW.rowid, NEW.name, NEW.description, NEW.namespace);
END;