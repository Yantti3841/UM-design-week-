CREATE TABLE `collection_state` (
	`event_id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `flowers` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `flowers` ADD `restore_status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `flowers` ADD `updated_at` text;--> statement-breakpoint
CREATE INDEX `flowers_event_status_idx` ON `flowers` (`event_id`,`status`,`id`);