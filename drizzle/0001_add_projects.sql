CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`client_name` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_name_idx` ON `projects` (`name`);--> statement-breakpoint
ALTER TABLE `time_entries` ADD `project_id` integer REFERENCES projects(id) ON DELETE restrict;--> statement-breakpoint
CREATE INDEX `time_entries_project_id_idx` ON `time_entries` (`project_id`);