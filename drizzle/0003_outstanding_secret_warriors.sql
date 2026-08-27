ALTER TABLE `job_orders` ADD `vendor_payment_confirmed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `job_orders` ADD `resident_payment_confirmed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `job_orders` ADD `amount_paid_cents` integer;--> statement-breakpoint
ALTER TABLE `job_orders` ADD `payment_date` text;--> statement-breakpoint
ALTER TABLE `job_orders` ADD `receipt_number` text;--> statement-breakpoint
ALTER TABLE `job_orders` ADD `payment_inquiry_status` text;--> statement-breakpoint
ALTER TABLE `vendors` ADD `preferred_vendor` integer DEFAULT false NOT NULL;