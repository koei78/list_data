CREATE TABLE admin_sessions (
 token_hash text PRIMARY KEY,
 user_id text NOT NULL,
 credential_version text NOT NULL,
 expires_at text NOT NULL,
 created_at text NOT NULL
);
CREATE INDEX admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX admin_sessions_expiry ON admin_sessions(expires_at);
