ALTER TABLE `invoice_triggers` ADD `billing_period` text;--> statement-breakpoint
CREATE INDEX `idx_invoice_triggers_billing` ON `invoice_triggers` (`vendor_id`,`billing_period`,`status`);