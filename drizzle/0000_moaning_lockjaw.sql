CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`subject` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_events_created_at` ON `audit_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `communities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`market` text NOT NULL,
	`address` text NOT NULL,
	`property_manager` text NOT NULL,
	`homes` integer NOT NULL,
	`occupied_homes` integer NOT NULL,
	`plus_enabled` integer DEFAULT false NOT NULL,
	`plus_members` integer DEFAULT 0 NOT NULL,
	`service_penetration` real DEFAULT 0 NOT NULL,
	`net_income_cents` integer DEFAULT 0 NOT NULL,
	`statement_status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_communities_market` ON `communities` (`market`);--> statement-breakpoint
CREATE INDEX `idx_communities_statement_status` ON `communities` (`statement_status`);--> statement-breakpoint
CREATE TABLE `community_statements` (
	`id` text PRIMARY KEY NOT NULL,
	`community_id` text NOT NULL,
	`period` text NOT NULL,
	`gross_revenue_cents` integer NOT NULL,
	`vendor_remittance_cents` integer NOT NULL,
	`flairo_fee_cents` integer NOT NULL,
	`community_share_cents` integer NOT NULL,
	`rewards_liability_cents` integer NOT NULL,
	`statement_status` text NOT NULL,
	`issued_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_community_statements_community_id` ON `community_statements` (`community_id`);--> statement-breakpoint
CREATE INDEX `idx_community_statements_period` ON `community_statements` (`period`);--> statement-breakpoint
CREATE TABLE `invoice_triggers` (
	`id` text PRIMARY KEY NOT NULL,
	`job_order_id` text NOT NULL,
	`vendor_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text NOT NULL,
	`bluevine_reference` text,
	`due_date` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`job_order_id`) REFERENCES `job_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_invoice_triggers_status` ON `invoice_triggers` (`status`);--> statement-breakpoint
CREATE INDEX `idx_invoice_triggers_vendor_id` ON `invoice_triggers` (`vendor_id`);--> statement-breakpoint
CREATE TABLE `job_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`vendor_id` text,
	`task_status` text NOT NULL,
	`service_date` text,
	`schedule_confirmed_at` text,
	`vendor_confirmed_at` text,
	`payment_consult_status` text DEFAULT 'not_started' NOT NULL,
	`resident_paid_vendor` integer DEFAULT false NOT NULL,
	`service_amount_cents` integer NOT NULL,
	`flairo_fee_cents` integer NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`invoice_trigger_status` text DEFAULT 'waiting' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `resident_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_job_orders_task_status` ON `job_orders` (`task_status`);--> statement-breakpoint
CREATE INDEX `idx_job_orders_vendor_id` ON `job_orders` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `idx_job_orders_invoice_trigger_status` ON `job_orders` (`invoice_trigger_status`);--> statement-breakpoint
CREATE TABLE `resident_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`resident_name` text NOT NULL,
	`resident_email` text NOT NULL,
	`resident_phone` text NOT NULL,
	`community_id` text NOT NULL,
	`market` text NOT NULL,
	`unit` text NOT NULL,
	`home_profile` text NOT NULL,
	`service_name` text NOT NULL,
	`preferred_window` text NOT NULL,
	`board_status` text NOT NULL,
	`visible_to_vendors` integer DEFAULT true NOT NULL,
	`resident_info_released` integer DEFAULT false NOT NULL,
	`requested_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_resident_requests_board_status` ON `resident_requests` (`board_status`);--> statement-breakpoint
CREATE INDEX `idx_resident_requests_community_id` ON `resident_requests` (`community_id`);--> statement-breakpoint
CREATE INDEX `idx_resident_requests_service_name` ON `resident_requests` (`service_name`);--> statement-breakpoint
CREATE TABLE `reward_ledger_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`resident_name` text NOT NULL,
	`community_id` text NOT NULL,
	`request_id` text,
	`entry_type` text NOT NULL,
	`status` text NOT NULL,
	`points` integer NOT NULL,
	`dollar_value_cents` integer DEFAULT 0 NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`request_id`) REFERENCES `resident_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reward_ledger_community_id` ON `reward_ledger_entries` (`community_id`);--> statement-breakpoint
CREATE INDEX `idx_reward_ledger_status` ON `reward_ledger_entries` (`status`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`mobile_visible` integer DEFAULT true NOT NULL,
	`standard_price_cents` integer NOT NULL,
	`plus_price_cents` integer NOT NULL,
	`points_rule` text NOT NULL,
	`vendor_pool_rule` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_services_category` ON `services` (`category`);--> statement-breakpoint
CREATE INDEX `idx_services_mobile_visible` ON `services` (`mobile_visible`);--> statement-breakpoint
CREATE TABLE `vendor_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`document_type` text NOT NULL,
	`status` text NOT NULL,
	`storage_key` text,
	`expires_at` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_vendor_documents_vendor_id` ON `vendor_documents` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `idx_vendor_documents_status` ON `vendor_documents` (`status`);--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`business_name` text NOT NULL,
	`primary_contact` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`markets` text NOT NULL,
	`services` text NOT NULL,
	`onboarding_stage` text NOT NULL,
	`compliance_status` text NOT NULL,
	`board_access` integer DEFAULT false NOT NULL,
	`insurance_status` text DEFAULT 'Needs upload' NOT NULL,
	`license_status` text DEFAULT 'Needs upload' NOT NULL,
	`insurance_expires_at` text,
	`license_expires_at` text,
	`w9_status` text DEFAULT 'missing' NOT NULL,
	`flairo_fee_percent` real DEFAULT 10 NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_vendors_compliance_status` ON `vendors` (`compliance_status`);--> statement-breakpoint
CREATE INDEX `idx_vendors_board_access` ON `vendors` (`board_access`);