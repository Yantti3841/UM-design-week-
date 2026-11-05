CREATE TABLE invitation_creations (
 creation_id text PRIMARY KEY NOT NULL,
 visitor_id text NOT NULL,
 event_id text NOT NULL,
 consent_version text NOT NULL,
 created_at text NOT NULL,
 expires_at text NOT NULL
);
--> statement-breakpoint
CREATE INDEX invitation_event_visitor_idx ON invitation_creations (event_id,visitor_id);
--> statement-breakpoint
CREATE INDEX invitation_expiry_idx ON invitation_creations (expires_at);
