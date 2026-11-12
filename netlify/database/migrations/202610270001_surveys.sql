CREATE TABLE survey_leads (
 id text PRIMARY KEY,
 request_key_hash text UNIQUE NOT NULL,
 payload_hash text NOT NULL,
 kind text NOT NULL,
 company text NOT NULL,
 name text NOT NULL,
 email text NOT NULL,
 phone text NOT NULL DEFAULT '',
 purpose text NOT NULL,
 message text NOT NULL DEFAULT '',
 preferred_contact text NOT NULL,
 marketing_consent integer NOT NULL DEFAULT 0,
 restaurant_id text,
 consent_version text NOT NULL,
 consent_at text NOT NULL,
 created_at text NOT NULL,
 contact_status text NOT NULL DEFAULT 'new',
 contact_note text NOT NULL DEFAULT '',
 reviewed_at text,
 reviewed_by text,
 notification_status text NOT NULL DEFAULT 'pending',
 notification_attempted_at text,
 disabled integer NOT NULL DEFAULT 0
);
CREATE INDEX survey_leads_created ON survey_leads(created_at DESC);
CREATE TABLE survey_sessions (
 token_hash text PRIMARY KEY,
 lead_id text NOT NULL REFERENCES survey_leads(id),
 expires_at text NOT NULL,
 created_at text NOT NULL,
 revoked_at text
);
CREATE INDEX survey_sessions_lead ON survey_sessions(lead_id);
CREATE TABLE survey_rate_limits (
 key text PRIMARY KEY,
 used integer NOT NULL,
 expires_at text NOT NULL
);
