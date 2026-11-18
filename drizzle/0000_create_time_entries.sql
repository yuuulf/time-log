CREATE TABLE `time_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_name` text DEFAULT '' NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `time_entries_started_at_idx` ON `time_entries` (`started_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `time_entries_one_running_idx` ON `time_entries` (("ended_at" IS NULL)) WHERE "time_entries"."ended_at" IS NULL;