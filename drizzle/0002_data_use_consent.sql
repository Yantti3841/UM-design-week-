ALTER TABLE flowers ADD consent_version text;
--> statement-breakpoint
ALTER TABLE flowers ADD expires_at text;
--> statement-breakpoint
CREATE INDEX flowers_expiry_idx ON flowers (event_id,expires_at);
