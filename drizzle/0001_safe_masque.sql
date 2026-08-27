CREATE TABLE `mobile_sync_state` (
	`id` text PRIMARY KEY NOT NULL,
	`connection_status` text NOT NULL,
	`last_checked_at` text NOT NULL,
	`last_push_at` text,
	`pending_changes` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_push_summary` text DEFAULT 'No mobile app push yet' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_mobile_sync_updated_at` ON `mobile_sync_state` (`updated_at`);