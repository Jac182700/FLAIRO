import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const communities = sqliteTable(
  'communities',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    market: text('market').notNull(),
    address: text('address').notNull(),
    propertyManager: text('property_manager').notNull(),
    homes: integer('homes').notNull(),
    occupiedHomes: integer('occupied_homes').notNull(),
    plusEnabled: integer('plus_enabled', { mode: 'boolean' }).notNull().default(false),
    plusMembers: integer('plus_members').notNull().default(0),
    servicePenetration: real('service_penetration').notNull().default(0),
    netIncomeCents: integer('net_income_cents').notNull().default(0),
    statementStatus: text('statement_status').notNull().default('draft'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_communities_market').on(table.market),
    index('idx_communities_statement_status').on(table.statementStatus),
  ],
);

export const services = sqliteTable(
  'services',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    mobileVisible: integer('mobile_visible', { mode: 'boolean' }).notNull().default(true),
    standardPriceCents: integer('standard_price_cents').notNull(),
    plusPriceCents: integer('plus_price_cents').notNull(),
    pointsRule: text('points_rule').notNull(),
    vendorPoolRule: text('vendor_pool_rule').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_services_category').on(table.category),
    index('idx_services_mobile_visible').on(table.mobileVisible),
  ],
);

export const vendors = sqliteTable(
  'vendors',
  {
    id: text('id').primaryKey(),
    businessName: text('business_name').notNull(),
    primaryContact: text('primary_contact').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    markets: text('markets', { mode: 'json' }).notNull(),
    services: text('services', { mode: 'json' }).notNull(),
    onboardingStage: text('onboarding_stage').notNull(),
    complianceStatus: text('compliance_status').notNull(),
    boardAccess: integer('board_access', { mode: 'boolean' }).notNull().default(false),
    preferredVendor: integer('preferred_vendor', { mode: 'boolean' }).notNull().default(false),
    insuranceStatus: text('insurance_status').notNull().default('Needs upload'),
    licenseStatus: text('license_status').notNull().default('Needs upload'),
    insuranceExpiresAt: text('insurance_expires_at'),
    licenseExpiresAt: text('license_expires_at'),
    w9Status: text('w9_status').notNull().default('missing'),
    flairoFeePercent: real('flairo_fee_percent').notNull().default(10),
    rating: real('rating').notNull().default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_vendors_compliance_status').on(table.complianceStatus),
    index('idx_vendors_board_access').on(table.boardAccess),
  ],
);

export const vendorDocuments = sqliteTable(
  'vendor_documents',
  {
    id: text('id').primaryKey(),
    vendorId: text('vendor_id').notNull().references(() => vendors.id),
    documentType: text('document_type').notNull(),
    status: text('status').notNull(),
    storageKey: text('storage_key'),
    expiresAt: text('expires_at'),
    reviewedBy: text('reviewed_by'),
    reviewedAt: text('reviewed_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_vendor_documents_vendor_id').on(table.vendorId),
    index('idx_vendor_documents_status').on(table.status),
  ],
);

export const residentRequests = sqliteTable(
  'resident_requests',
  {
    id: text('id').primaryKey(),
    residentName: text('resident_name').notNull(),
    residentEmail: text('resident_email').notNull(),
    residentPhone: text('resident_phone').notNull(),
    communityId: text('community_id').notNull().references(() => communities.id),
    market: text('market').notNull(),
    unit: text('unit').notNull(),
    homeProfile: text('home_profile').notNull(),
    serviceName: text('service_name').notNull(),
    preferredWindow: text('preferred_window').notNull(),
    boardStatus: text('board_status').notNull(),
    visibleToVendors: integer('visible_to_vendors', { mode: 'boolean' }).notNull().default(true),
    residentInfoReleased: integer('resident_info_released', { mode: 'boolean' }).notNull().default(false),
    requestedAt: text('requested_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_resident_requests_board_status').on(table.boardStatus),
    index('idx_resident_requests_community_id').on(table.communityId),
    index('idx_resident_requests_service_name').on(table.serviceName),
  ],
);

export const jobOrders = sqliteTable(
  'job_orders',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id').notNull().references(() => residentRequests.id),
    vendorId: text('vendor_id').references(() => vendors.id),
    taskStatus: text('task_status').notNull(),
    serviceDate: text('service_date'),
    scheduleConfirmedAt: text('schedule_confirmed_at'),
    vendorConfirmedAt: text('vendor_confirmed_at'),
    claimedAt: text('claimed_at'),
    scheduleDueAt: text('schedule_due_at'),
    paymentConsultStatus: text('payment_consult_status').notNull().default('not_started'),
    residentPaidVendor: integer('resident_paid_vendor', { mode: 'boolean' }).notNull().default(false),
    vendorPaymentConfirmed: integer('vendor_payment_confirmed', { mode: 'boolean' }).notNull().default(false),
    residentPaymentConfirmed: integer('resident_payment_confirmed', { mode: 'boolean' }).notNull().default(false),
    amountPaidCents: integer('amount_paid_cents'),
    paymentDate: text('payment_date'),
    receiptNumber: text('receipt_number'),
    paymentInquiryStatus: text('payment_inquiry_status'),
    serviceAmountCents: integer('service_amount_cents').notNull(),
    flairoFeeCents: integer('flairo_fee_cents').notNull(),
    points: integer('points').notNull().default(0),
    invoiceTriggerStatus: text('invoice_trigger_status').notNull().default('waiting'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_job_orders_task_status').on(table.taskStatus),
    index('idx_job_orders_vendor_id').on(table.vendorId),
    index('idx_job_orders_invoice_trigger_status').on(table.invoiceTriggerStatus),
  ],
);

export const rewardLedgerEntries = sqliteTable(
  'reward_ledger_entries',
  {
    id: text('id').primaryKey(),
    residentName: text('resident_name').notNull(),
    communityId: text('community_id').notNull().references(() => communities.id),
    requestId: text('request_id').references(() => residentRequests.id),
    entryType: text('entry_type').notNull(),
    status: text('status').notNull(),
    points: integer('points').notNull(),
    dollarValueCents: integer('dollar_value_cents').notNull().default(0),
    reason: text('reason').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_reward_ledger_community_id').on(table.communityId),
    index('idx_reward_ledger_status').on(table.status),
  ],
);

export const invoiceTriggers = sqliteTable(
  'invoice_triggers',
  {
    id: text('id').primaryKey(),
    jobOrderId: text('job_order_id').notNull().references(() => jobOrders.id),
    vendorId: text('vendor_id').notNull().references(() => vendors.id),
    amountCents: integer('amount_cents').notNull(),
    status: text('status').notNull(),
    bluevineReference: text('bluevine_reference'),
    dueDate: text('due_date').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_invoice_triggers_status').on(table.status),
    index('idx_invoice_triggers_vendor_id').on(table.vendorId),
  ],
);

export const mobileSyncState = sqliteTable(
  'mobile_sync_state',
  {
    id: text('id').primaryKey(),
    connectionStatus: text('connection_status').notNull(),
    lastCheckedAt: text('last_checked_at').notNull(),
    lastPushAt: text('last_push_at'),
    pendingChanges: integer('pending_changes').notNull().default(0),
    revision: integer('revision').notNull().default(0),
    lastPushSummary: text('last_push_summary').notNull().default('No mobile app push yet'),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_mobile_sync_updated_at').on(table.updatedAt)],
);

export const communityStatements = sqliteTable(
  'community_statements',
  {
    id: text('id').primaryKey(),
    communityId: text('community_id').notNull().references(() => communities.id),
    period: text('period').notNull(),
    grossRevenueCents: integer('gross_revenue_cents').notNull(),
    vendorRemittanceCents: integer('vendor_remittance_cents').notNull(),
    flairoFeeCents: integer('flairo_fee_cents').notNull(),
    communityShareCents: integer('community_share_cents').notNull(),
    rewardsLiabilityCents: integer('rewards_liability_cents').notNull(),
    statementStatus: text('statement_status').notNull(),
    issuedAt: text('issued_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_community_statements_community_id').on(table.communityId),
    index('idx_community_statements_period').on(table.period),
  ],
);

export const auditEvents = sqliteTable(
  'audit_events',
  {
    id: text('id').primaryKey(),
    actor: text('actor').notNull(),
    action: text('action').notNull(),
    subject: text('subject').notNull(),
    detail: text('detail').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_audit_events_created_at').on(table.createdAt)],
);
