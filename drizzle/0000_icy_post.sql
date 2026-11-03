CREATE TABLE `flowers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`submission_id` text NOT NULL,
	`event_id` text DEFAULT 'umdw-2026' NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`recipe` text NOT NULL,
	`svg` text NOT NULL,
	`projection_svg` text NOT NULL,
	`generator_version` text DEFAULT 'final1014-v1' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `flowers_submission_id_unique` ON `flowers` (`submission_id`);--> statement-breakpoint
CREATE INDEX `flowers_event_id_idx` ON `flowers` (`event_id`,`id`);