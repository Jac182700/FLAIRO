CREATE TABLE `manual_reconciliation_records` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`item` text NOT NULL,
	`property` text DEFAULT '' NOT NULL,
	`vendor_id` text NOT NULL,
	`partner` text DEFAULT '' NOT NULL,
	`program` text DEFAULT '' NOT NULL,
	`service_period` text NOT NULL,
	`billing_period` text NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL,
	`amount_cents` integer DEFAULT 0 NOT NULL,
	`suggested_action` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_manual_reconciliation_vendor_period` ON `manual_reconciliation_records` (`vendor_id`,`billing_period`,`status`);