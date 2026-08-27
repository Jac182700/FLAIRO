CREATE TABLE `reward_program_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`point_value_cents` integer DEFAULT 1 NOT NULL,
	`redemption_cap_percent` real DEFAULT 10 NOT NULL,
	`plus_membership_monthly_cents` integer DEFAULT 500 NOT NULL,
	`plus_only_accrual` integer DEFAULT true NOT NULL,
	`minimum_gold_balance` integer DEFAULT 500 NOT NULL,
	`expiration_months` integer DEFAULT 12 NOT NULL,
	`expiration_reminder_days` integer DEFAULT 7 NOT NULL,
	`adoption_index_previous_month` integer DEFAULT 69 NOT NULL,
	`registration_growth_percent` real DEFAULT 12 NOT NULL,
	`activation_rate_percent` real DEFAULT 46 NOT NULL,
	`first_service_conversion_percent` real DEFAULT 28 NOT NULL,
	`active_30_day_rate_percent` real DEFAULT 37 NOT NULL,
	`repeat_use_rate_percent` real DEFAULT 31 NOT NULL,
	`survey_response_rate_percent` real DEFAULT 38 NOT NULL,
	`avg_cx_rating` real DEFAULT 4.6 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reward_program_settings_updated_at` ON `reward_program_settings` (`updated_at`);--> statement-breakpoint
ALTER TABLE `reward_ledger_entries` ADD `expires_at` text;--> statement-breakpoint
ALTER TABLE `reward_ledger_entries` ADD `plus_member` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `reward_ledger_entries` ADD `alert_queued` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `reward_ledger_entries` ADD `redeemed_in_expiration_window` integer DEFAULT false NOT NULL;