CREATE TABLE `crm_account_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`billing_contact` text DEFAULT '' NOT NULL,
	`accounting_email` text DEFAULT '' NOT NULL,
	`default_payment_terms` text DEFAULT 'Net 7' NOT NULL,
	`statement_approver` text DEFAULT '' NOT NULL,
	`document_requirements` text DEFAULT '' NOT NULL,
	`vendor_onboarding_owner` text DEFAULT '' NOT NULL,
	`mobile_catalog_owner` text DEFAULT '' NOT NULL,
	`support_routing` text DEFAULT '' NOT NULL,
	`account_mode` text DEFAULT 'Live operations' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_crm_account_settings_updated_at` ON `crm_account_settings` (`updated_at`);