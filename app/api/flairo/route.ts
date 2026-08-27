import { env } from 'cloudflare:workers';

export const dynamic = 'force-dynamic';

type ServiceSeed = {
  id: string;
  name: string;
  category: string;
  standardPrice: number;
  plusPrice: number;
  mobileVisible: boolean;
  pointsRule: string;
  vendorPoolRule: string;
};

type CommunitySeed = {
  id: string;
  name: string;
  market: string;
  address: string;
  manager: string;
  homes: number;
  occupied: number;
  plusMembers: number;
  servicePenetration: number;
  netIncome: number;
  statementStatus: string;
};

type VendorSeed = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  markets: string[];
  services: string[];
  status: string;
  boardAccess: boolean;
  insurance: string;
  license: string;
  w9: string;
  feePercent: number;
  stage: string;
  rating: number;
  preferred: boolean;
};

type JobSeed = {
  id: string;
  resident: string;
  phone: string;
  email: string;
  communityId: string;
  market: string;
  unit: string;
  homeProfile: string;
  service: string;
  preferredWindow: string;
  serviceDate: string;
  requestedAt: string;
  claimedAt: string | null;
  scheduleDueAt: string | null;
  scheduledAt: string | null;
  amount: number;
  flairoFee: number;
  points: number;
  vendorId: string | null;
  boardStatus: string;
  visibleToVendors: boolean;
  residentInfoReleased: boolean;
  vendorConfirmed: boolean;
  paymentConsult: string;
  vendorPaymentConfirmed: boolean;
  residentPaymentConfirmed: boolean;
  amountPaid: number | null;
  paymentDate: string | null;
  receiptNumber: string | null;
  paymentInquiryStatus: string | null;
  invoiceStatus: string;
};

type RewardSeed = {
  id: string;
  resident: string;
  communityId: string;
  source: string;
  status: string;
  points: number;
  value: number;
  note: string;
};

type InvoiceSeed = {
  id: string;
  jobId: string;
  vendorId: string;
  amount: number;
  status: string;
  dueDate: string;
  reference: string;
};

const now = () => new Date().toISOString();
const HOUR_MS = 60 * 60 * 1000;

function relativeIso(hoursOffset: number) {
  return new Date(Date.now() + hoursOffset * HOUR_MS).toISOString();
}

function addHours(isoDate: string, hours: number) {
  const timestamp = Date.parse(isoDate);
  const base = Number.isNaN(timestamp) ? Date.now() : timestamp;
  return new Date(base + hours * HOUR_MS).toISOString();
}

const services: ServiceSeed[] = [
  {
    id: 'recurring-housekeeping',
    name: 'Recurring housekeeping',
    category: 'Home Care',
    standardPrice: 185,
    plusPrice: 149,
    mobileVisible: true,
    pointsRule: '1x free, 2x PLUS, 100/200 completion bonus',
    vendorPoolRule: 'Compliant cleaning vendors by market',
  },
  {
    id: 'move-out-deep-cleaning',
    name: 'Move-out deep cleaning',
    category: 'Move-out',
    standardPrice: 245,
    plusPrice: 215,
    mobileVisible: true,
    pointsRule: '125/250 completion bonus',
    vendorPoolRule: 'Cleaning vendors with turnover access',
  },
  {
    id: 'pet-care',
    name: 'Dog walking and drop-ins',
    category: 'Pet Care',
    standardPrice: 32,
    plusPrice: 27,
    mobileVisible: true,
    pointsRule: 'Recurring eligible, low-cost visit bonus',
    vendorPoolRule: 'Pet vendors with active license',
  },
  {
    id: 'preferred-movers',
    name: 'Preferred movers',
    category: 'Moving',
    standardPrice: 325,
    plusPrice: 299,
    mobileVisible: true,
    pointsRule: '150/300 completion bonus',
    vendorPoolRule: 'Moving vendors by ZIP and availability',
  },
  {
    id: 'handyman-work',
    name: 'Handyman work',
    category: 'Home Care',
    standardPrice: 125,
    plusPrice: 110,
    mobileVisible: true,
    pointsRule: '50/100 completion bonus',
    vendorPoolRule: 'Home services vendors by task type',
  },
  {
    id: 'touch-up-painting',
    name: 'Move-out touch-up painting',
    category: 'Move-out',
    standardPrice: 225,
    plusPrice: 195,
    mobileVisible: false,
    pointsRule: '100/200 completion bonus',
    vendorPoolRule: 'Paint vendors with estimate approval',
  },
];

const communities: CommunitySeed[] = [
  {
    id: 'arbor',
    name: 'The Arbor on 7th',
    market: 'Fort Lauderdale, FL',
    address: '701 NE 7th Ave',
    manager: 'RISE Residential Management',
    homes: 214,
    occupied: 202,
    plusMembers: 48,
    servicePenetration: 36,
    netIncome: 1840,
    statementStatus: 'Ready',
  },
  {
    id: 'solara',
    name: 'Solara Midtown',
    market: 'Miami, FL',
    address: '1880 Midtown Blvd',
    manager: 'RISE Residential Management',
    homes: 288,
    occupied: 270,
    plusMembers: 61,
    servicePenetration: 31,
    netIncome: 2265,
    statementStatus: 'Draft',
  },
  {
    id: 'sawgrass',
    name: 'The Reserve at Sawgrass',
    market: 'Sunrise, FL',
    address: '1420 Sawgrass Parkway',
    manager: 'RISE Residential Management',
    homes: 312,
    occupied: 297,
    plusMembers: 73,
    servicePenetration: 44,
    netIncome: 2659.76,
    statementStatus: 'Issued',
  },
];

const vendors: VendorSeed[] = [
  {
    id: 'sparkle',
    name: 'Sparkle & Settle Cleaning Co.',
    contact: 'Elena Martinez',
    email: 'operations@sparklesettle.example',
    phone: '(305) 555-0181',
    markets: ['Fort Lauderdale, FL', 'Sunrise, FL'],
    services: ['Recurring housekeeping', 'Move-out deep cleaning'],
    status: 'Compliant',
    boardAccess: true,
    insurance: 'Verified',
    license: 'Verified',
    w9: 'Verified',
    feePercent: 10,
    stage: 'Board access active',
    rating: 4.8,
    preferred: true,
  },
  {
    id: 'pink-palm',
    name: 'Pink Palm Pet Care',
    contact: 'Jordan Ellis',
    email: 'hello@pinkpalmpet.example',
    phone: '(954) 555-0174',
    markets: ['Fort Lauderdale, FL'],
    services: ['Dog walking and drop-ins'],
    status: 'Review needed',
    boardAccess: false,
    insurance: 'Expiring',
    license: 'Verified',
    w9: 'Verified',
    feePercent: 10,
    stage: 'Insurance renewal review',
    rating: 4.7,
    preferred: false,
  },
  {
    id: 'porter',
    name: 'Porter Preferred Movers',
    contact: 'Andre Collins',
    email: 'dispatch@porterpreferred.example',
    phone: '(786) 555-0142',
    markets: ['Miami, FL', 'Sunrise, FL'],
    services: ['Preferred movers'],
    status: 'Pending onboarding',
    boardAccess: false,
    insurance: 'Under review',
    license: 'Needs upload',
    w9: 'Verified',
    feePercent: 10,
    stage: 'License upload needed',
    rating: 4.5,
    preferred: true,
  },
  {
    id: 'hex-key',
    name: 'Hex Key Home Services',
    contact: 'Nina Patel',
    email: 'jobs@hexkeyhome.example',
    phone: '(561) 555-0126',
    markets: ['Miami, FL', 'Fort Lauderdale, FL'],
    services: ['Handyman work', 'Move-out touch-up painting'],
    status: 'Compliant',
    boardAccess: true,
    insurance: 'Verified',
    license: 'Verified',
    w9: 'Verified',
    feePercent: 10,
    stage: 'Board access active',
    rating: 4.6,
    preferred: false,
  },
];

const jobs: JobSeed[] = [
  {
    id: 'J-1048',
    resident: 'Maya Chen',
    phone: '(305) 555-0199',
    email: 'maya.chen@example.com',
    communityId: 'arbor',
    market: 'Fort Lauderdale, FL',
    unit: '4B',
    homeProfile: '2BR / 2BA',
    service: 'Recurring housekeeping',
    preferredWindow: 'Fri morning',
    serviceDate: '2026-09-04',
    requestedAt: relativeIso(-8),
    claimedAt: relativeIso(-3),
    scheduleDueAt: relativeIso(21),
    scheduledAt: null,
    amount: 149,
    flairoFee: 14.9,
    points: 498,
    vendorId: 'sparkle',
    boardStatus: 'Claimed',
    visibleToVendors: false,
    residentInfoReleased: true,
    vendorConfirmed: false,
    paymentConsult: 'Vendor to confirm resident payment method',
    vendorPaymentConfirmed: false,
    residentPaymentConfirmed: false,
    amountPaid: null,
    paymentDate: null,
    receiptNumber: null,
    paymentInquiryStatus: null,
    invoiceStatus: 'Waiting',
  },
  {
    id: 'J-1049',
    resident: 'Chris Walker',
    phone: '(786) 555-0108',
    email: 'chris.walker@example.com',
    communityId: 'solara',
    market: 'Miami, FL',
    unit: '1208',
    homeProfile: '1BR / 1BA',
    service: 'Move-out deep cleaning',
    preferredWindow: 'Any weekday',
    serviceDate: '2026-09-02',
    requestedAt: relativeIso(-6.35),
    claimedAt: null,
    scheduleDueAt: null,
    scheduledAt: null,
    amount: 245,
    flairoFee: 24.5,
    points: 370,
    vendorId: null,
    boardStatus: 'Open',
    visibleToVendors: true,
    residentInfoReleased: false,
    vendorConfirmed: false,
    paymentConsult: 'Not started',
    vendorPaymentConfirmed: false,
    residentPaymentConfirmed: false,
    amountPaid: null,
    paymentDate: null,
    receiptNumber: null,
    paymentInquiryStatus: null,
    invoiceStatus: 'Waiting',
  },
  {
    id: 'J-1050',
    resident: 'Avery Brooks',
    phone: '(954) 555-0162',
    email: 'avery.brooks@example.com',
    communityId: 'arbor',
    market: 'Fort Lauderdale, FL',
    unit: '8C',
    homeProfile: 'Pet service',
    service: 'Dog walking and drop-ins',
    preferredWindow: 'Mon and Wed lunch',
    serviceDate: '2026-08-31',
    requestedAt: relativeIso(-52),
    claimedAt: relativeIso(-47),
    scheduleDueAt: relativeIso(-23),
    scheduledAt: relativeIso(-36),
    amount: 27,
    flairoFee: 2.7,
    points: 74,
    vendorId: 'pink-palm',
    boardStatus: 'Scheduled',
    visibleToVendors: false,
    residentInfoReleased: true,
    vendorConfirmed: true,
    paymentConsult: 'Resident and vendor confirmed direct payment',
    vendorPaymentConfirmed: true,
    residentPaymentConfirmed: true,
    amountPaid: 27,
    paymentDate: '2026-08-26',
    receiptNumber: 'RCPT-7718',
    paymentInquiryStatus: null,
    invoiceStatus: 'Ready',
  },
  {
    id: 'J-1051',
    resident: 'Daniel Ruiz',
    phone: '(561) 555-0137',
    email: 'daniel.ruiz@example.com',
    communityId: 'sawgrass',
    market: 'Sunrise, FL',
    unit: '2304',
    homeProfile: '3BR / 2BA',
    service: 'Preferred movers',
    preferredWindow: 'Sept 12 afternoon',
    serviceDate: '2026-09-12',
    requestedAt: relativeIso(-2.25),
    claimedAt: null,
    scheduleDueAt: null,
    scheduledAt: null,
    amount: 325,
    flairoFee: 32.5,
    points: 475,
    vendorId: null,
    boardStatus: 'Open',
    visibleToVendors: true,
    residentInfoReleased: false,
    vendorConfirmed: false,
    paymentConsult: 'Not started',
    vendorPaymentConfirmed: false,
    residentPaymentConfirmed: false,
    amountPaid: null,
    paymentDate: null,
    receiptNumber: null,
    paymentInquiryStatus: null,
    invoiceStatus: 'Waiting',
  },
];

const rewards: RewardSeed[] = [
  {
    id: 'R-8801',
    resident: 'Maya Chen',
    communityId: 'arbor',
    source: 'J-1048',
    status: 'Pending',
    points: 498,
    value: 4.98,
    note: 'PLUS recurring housekeeping earn',
  },
  {
    id: 'R-8794',
    resident: 'Avery Brooks',
    communityId: 'arbor',
    source: 'J-1050',
    status: 'Available',
    points: 74,
    value: 0.74,
    note: 'Pet care completion pending invoice trigger',
  },
  {
    id: 'R-8751',
    resident: 'Launch wallet pool',
    communityId: 'sawgrass',
    source: 'Admin',
    status: 'Available',
    points: 125000,
    value: 1250,
    note: 'Launch rewards liability',
  },
  {
    id: 'R-8700',
    resident: 'Jordan Lee',
    communityId: 'solara',
    source: 'Reward credit',
    status: 'Redeemed',
    points: -500,
    value: -5,
    note: 'Applied to move-out cleaning',
  },
];

const invoices: InvoiceSeed[] = [
  {
    id: 'INV-Q-2208',
    jobId: 'J-1050',
    vendorId: 'pink-palm',
    amount: 2.7,
    status: 'Ready',
    dueDate: '2026-09-07',
    reference: 'Ready for Bluevine draft',
  },
  {
    id: 'INV-Q-2209',
    jobId: 'J-1038',
    vendorId: 'sparkle',
    amount: 118.4,
    status: 'Draft queued',
    dueDate: '2026-09-05',
    reference: 'Bluevine draft requested',
  },
];

export async function GET() {
  try {
    await initializeDatabase(env.DB);
    await seedDatabase(env.DB);
    await touchMobileConnection(env.DB);
    return Response.json(await readState(env.DB));
  } catch (error) {
    return Response.json({ error: readableError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase(env.DB);
    await seedDatabase(env.DB);
    const body = await request.json() as { action?: string; payload?: Record<string, string> };
    const payload = body.payload ?? {};
    let stageMobileChange = false;

    switch (body.action) {
      case 'toggle_service_visibility':
        await env.DB.prepare('UPDATE services SET mobile_visible = CASE mobile_visible WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?')
          .bind(now(), payload.serviceId)
          .run();
        await logEvent('Mobile catalog', payload.serviceId ?? 'service', 'Employee changed resident app service visibility.');
        stageMobileChange = true;
        break;
      case 'upload_document':
        await recordDocumentUpload(payload.vendorId, payload.documentType);
        stageMobileChange = true;
        break;
      case 'approve_vendor':
        await approveVendor(payload.vendorId);
        stageMobileChange = true;
        break;
      case 'claim_job':
        await claimJob(payload.jobId);
        stageMobileChange = true;
        break;
      case 'confirm_schedule':
        await confirmSchedule(payload.jobId);
        stageMobileChange = true;
        break;
      case 'complete_job':
        await completeJob(payload.jobId);
        stageMobileChange = true;
        break;
      case 'reactivate_job':
        await reactivateJob(payload.jobId);
        stageMobileChange = true;
        break;
      case 'confirm_vendor_payment':
        await confirmVendorPayment(payload.jobId);
        stageMobileChange = true;
        break;
      case 'confirm_resident_payment':
        await confirmResidentPayment(payload.jobId);
        stageMobileChange = true;
        break;
      case 'submit_payment_inquiry':
        await submitPaymentInquiry(payload.jobId);
        stageMobileChange = true;
        break;
      case 'create_manual_job':
        await createManualJob(payload);
        stageMobileChange = true;
        break;
      case 'trigger_invoice':
        await triggerInvoice(payload.jobId);
        stageMobileChange = true;
        break;
      case 'process_vendor_month':
        await processVendorMonth(payload.vendorId, payload.monthKey);
        stageMobileChange = true;
        break;
      case 'mark_statement_issued':
        await env.DB.prepare('UPDATE communities SET statement_status = ?, updated_at = ? WHERE id = ?')
          .bind('Issued', now(), payload.communityId)
          .run();
        await logEvent('Statement issued', payload.communityId ?? 'community', 'Community statement marked issued.');
        stageMobileChange = true;
        break;
      case 'push_mobile_update':
        await pushMobileUpdate();
        break;
      default:
        return Response.json({ error: 'Unknown FLAIRO action.' }, { status: 400 });
    }

    if (stageMobileChange) {
      await stageMobileDraftChange();
    }
    await touchMobileConnection(env.DB);

    return Response.json(await readState(env.DB));
  } catch (error) {
    return Response.json({ error: readableError(error) }, { status: 500 });
  }
}

async function initializeDatabase(db: D1Database) {
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS communities (id TEXT PRIMARY KEY, name TEXT NOT NULL, market TEXT NOT NULL, address TEXT NOT NULL, property_manager TEXT NOT NULL, homes INTEGER NOT NULL, occupied_homes INTEGER NOT NULL, plus_enabled INTEGER NOT NULL DEFAULT 0, plus_members INTEGER NOT NULL DEFAULT 0, service_penetration REAL NOT NULL DEFAULT 0, net_income_cents INTEGER NOT NULL DEFAULT 0, statement_status TEXT NOT NULL DEFAULT "Draft", created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS services (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, mobile_visible INTEGER NOT NULL DEFAULT 1, standard_price_cents INTEGER NOT NULL, plus_price_cents INTEGER NOT NULL, points_rule TEXT NOT NULL, vendor_pool_rule TEXT NOT NULL, updated_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS vendors (id TEXT PRIMARY KEY, business_name TEXT NOT NULL, primary_contact TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, markets TEXT NOT NULL, services TEXT NOT NULL, onboarding_stage TEXT NOT NULL, compliance_status TEXT NOT NULL, board_access INTEGER NOT NULL DEFAULT 0, preferred_vendor INTEGER NOT NULL DEFAULT 0, insurance_status TEXT NOT NULL DEFAULT "Needs upload", license_status TEXT NOT NULL DEFAULT "Needs upload", w9_status TEXT NOT NULL DEFAULT "Needs upload", flairo_fee_percent REAL NOT NULL DEFAULT 10, rating REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS vendor_documents (id TEXT PRIMARY KEY, vendor_id TEXT NOT NULL, document_type TEXT NOT NULL, status TEXT NOT NULL, storage_key TEXT, expires_at TEXT, reviewed_by TEXT, reviewed_at TEXT, created_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS resident_requests (id TEXT PRIMARY KEY, resident_name TEXT NOT NULL, resident_email TEXT NOT NULL, resident_phone TEXT NOT NULL, community_id TEXT NOT NULL, market TEXT NOT NULL, unit TEXT NOT NULL, home_profile TEXT NOT NULL, service_name TEXT NOT NULL, preferred_window TEXT NOT NULL, board_status TEXT NOT NULL, visible_to_vendors INTEGER NOT NULL DEFAULT 1, resident_info_released INTEGER NOT NULL DEFAULT 0, requested_at TEXT NOT NULL, updated_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS job_orders (id TEXT PRIMARY KEY, request_id TEXT NOT NULL, vendor_id TEXT, task_status TEXT NOT NULL, service_date TEXT, schedule_confirmed_at TEXT, vendor_confirmed_at TEXT, claimed_at TEXT, schedule_due_at TEXT, payment_consult_status TEXT NOT NULL DEFAULT "Not started", resident_paid_vendor INTEGER NOT NULL DEFAULT 0, vendor_payment_confirmed INTEGER NOT NULL DEFAULT 0, resident_payment_confirmed INTEGER NOT NULL DEFAULT 0, amount_paid_cents INTEGER, payment_date TEXT, receipt_number TEXT, payment_inquiry_status TEXT, service_amount_cents INTEGER NOT NULL, flairo_fee_cents INTEGER NOT NULL, points INTEGER NOT NULL DEFAULT 0, invoice_trigger_status TEXT NOT NULL DEFAULT "Waiting", created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS reward_ledger_entries (id TEXT PRIMARY KEY, resident_name TEXT NOT NULL, community_id TEXT NOT NULL, request_id TEXT, entry_type TEXT NOT NULL, status TEXT NOT NULL, points INTEGER NOT NULL, dollar_value_cents INTEGER NOT NULL DEFAULT 0, reason TEXT NOT NULL, created_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS invoice_triggers (id TEXT PRIMARY KEY, job_order_id TEXT NOT NULL, vendor_id TEXT NOT NULL, amount_cents INTEGER NOT NULL, status TEXT NOT NULL, bluevine_reference TEXT, due_date TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS mobile_sync_state (id TEXT PRIMARY KEY, connection_status TEXT NOT NULL, last_checked_at TEXT NOT NULL, last_push_at TEXT, pending_changes INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 0, last_push_summary TEXT NOT NULL DEFAULT "No mobile app push yet", updated_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, subject TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL)'),
  ]);
  await db.batch([
    db.prepare('CREATE INDEX IF NOT EXISTS idx_requests_board ON resident_requests (board_status, visible_to_vendors)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_jobs_invoice ON job_orders (invoice_trigger_status)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_vendors_access ON vendors (board_access, compliance_status)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_rewards_status ON reward_ledger_entries (status)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_mobile_sync_updated_at ON mobile_sync_state (updated_at)'),
  ]);
  await ensureColumn(db, 'job_orders', 'claimed_at', 'TEXT');
  await ensureColumn(db, 'job_orders', 'schedule_due_at', 'TEXT');
  await ensureColumn(db, 'vendors', 'preferred_vendor', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'job_orders', 'vendor_payment_confirmed', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'job_orders', 'resident_payment_confirmed', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'job_orders', 'amount_paid_cents', 'INTEGER');
  await ensureColumn(db, 'job_orders', 'payment_date', 'TEXT');
  await ensureColumn(db, 'job_orders', 'receipt_number', 'TEXT');
  await ensureColumn(db, 'job_orders', 'payment_inquiry_status', 'TEXT');
  await db.prepare('UPDATE vendors SET preferred_vendor = 1 WHERE id IN (?, ?)')
    .bind('sparkle', 'porter')
    .run();
  await ensureMobileSyncState(db);
}

async function ensureColumn(db: D1Database, tableName: string, columnName: string, definition: string) {
  const columns = await db.prepare(`PRAGMA table_info(${tableName})`).all<{ name: string }>();
  if (columns.results.some((column) => column.name === columnName)) return;
  await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
}

async function seedDatabase(db: D1Database) {
  const count = await db.prepare('SELECT COUNT(*) as count FROM communities').first<{ count: number }>();
  if ((count?.count ?? 0) > 0) return;
  const stamp = now();

  await db.batch(
    communities.map((community) =>
      db.prepare('INSERT INTO communities (id, name, market, address, property_manager, homes, occupied_homes, plus_enabled, plus_members, service_penetration, net_income_cents, statement_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(community.id, community.name, community.market, community.address, community.manager, community.homes, community.occupied, 1, community.plusMembers, community.servicePenetration, cents(community.netIncome), community.statementStatus, stamp, stamp),
    ),
  );
  await db.batch(
    services.map((service) =>
      db.prepare('INSERT INTO services (id, name, category, mobile_visible, standard_price_cents, plus_price_cents, points_rule, vendor_pool_rule, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(service.id, service.name, service.category, service.mobileVisible ? 1 : 0, cents(service.standardPrice), cents(service.plusPrice), service.pointsRule, service.vendorPoolRule, stamp),
    ),
  );
  await db.batch(
    vendors.map((vendor) =>
      db.prepare('INSERT INTO vendors (id, business_name, primary_contact, email, phone, markets, services, onboarding_stage, compliance_status, board_access, preferred_vendor, insurance_status, license_status, w9_status, flairo_fee_percent, rating, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(vendor.id, vendor.name, vendor.contact, vendor.email, vendor.phone, JSON.stringify(vendor.markets), JSON.stringify(vendor.services), vendor.stage, vendor.status, vendor.boardAccess ? 1 : 0, vendor.preferred ? 1 : 0, vendor.insurance, vendor.license, vendor.w9, vendor.feePercent, vendor.rating, stamp, stamp),
    ),
  );
  await db.batch(
    jobs.map((job) =>
      db.prepare('INSERT INTO resident_requests (id, resident_name, resident_email, resident_phone, community_id, market, unit, home_profile, service_name, preferred_window, board_status, visible_to_vendors, resident_info_released, requested_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(job.id, job.resident, job.email, job.phone, job.communityId, job.market, job.unit, job.homeProfile, job.service, job.preferredWindow, job.boardStatus, job.visibleToVendors ? 1 : 0, job.residentInfoReleased ? 1 : 0, job.requestedAt, stamp),
    ),
  );
  await db.batch(
    jobs.map((job) =>
      db.prepare('INSERT INTO job_orders (id, request_id, vendor_id, task_status, service_date, schedule_confirmed_at, vendor_confirmed_at, claimed_at, schedule_due_at, payment_consult_status, resident_paid_vendor, vendor_payment_confirmed, resident_payment_confirmed, amount_paid_cents, payment_date, receipt_number, payment_inquiry_status, service_amount_cents, flairo_fee_cents, points, invoice_trigger_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(job.id, job.id, job.vendorId, job.boardStatus, job.serviceDate, job.scheduledAt, job.vendorConfirmed ? job.scheduledAt ?? stamp : null, job.claimedAt, job.scheduleDueAt, job.paymentConsult, job.vendorPaymentConfirmed && job.residentPaymentConfirmed ? 1 : 0, job.vendorPaymentConfirmed ? 1 : 0, job.residentPaymentConfirmed ? 1 : 0, job.amountPaid === null ? null : cents(job.amountPaid), job.paymentDate, job.receiptNumber, job.paymentInquiryStatus, cents(job.amount), cents(job.flairoFee), job.points, job.invoiceStatus, stamp, stamp),
    ),
  );
  await db.batch(
    rewards.map((reward) =>
      db.prepare('INSERT INTO reward_ledger_entries (id, resident_name, community_id, request_id, entry_type, status, points, dollar_value_cents, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(reward.id, reward.resident, reward.communityId, reward.source.startsWith('J-') ? reward.source : null, reward.source, reward.status, reward.points, cents(reward.value), reward.note, stamp),
    ),
  );
  await db.batch(
    invoices.map((invoice) =>
      db.prepare('INSERT INTO invoice_triggers (id, job_order_id, vendor_id, amount_cents, status, bluevine_reference, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(invoice.id, invoice.jobId, invoice.vendorId, cents(invoice.amount), invoice.status, invoice.reference, invoice.dueDate, stamp, stamp),
    ),
  );
  await db.batch([
    db.prepare('INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind('A-1', 'FLAIRO employee', 'Vendor claim', 'J-1048', 'Sparkle & Settle claimed J-1048; resident contact released.', stamp),
    db.prepare('INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind('A-2', 'FLAIRO employee', 'Invoice trigger', 'J-1050', 'J-1050 passed service date and entered the Bluevine draft queue.', stamp),
    db.prepare('INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind('A-3', 'FLAIRO employee', 'Mobile catalog', 'touch-up-painting', 'Move-out touch-up painting remains hidden from the resident app.', stamp),
  ]);
}

async function readState(db: D1Database) {
  const communityRows = await db.prepare('SELECT * FROM communities ORDER BY name').all();
  const serviceRows = await db.prepare('SELECT * FROM services ORDER BY category, name').all();
  const vendorRows = await db.prepare('SELECT * FROM vendors ORDER BY business_name').all();
  const jobRows = await db.prepare('SELECT r.*, j.vendor_id, j.task_status, j.service_date, j.schedule_confirmed_at, j.vendor_confirmed_at, j.claimed_at, j.schedule_due_at, j.payment_consult_status, j.resident_paid_vendor, j.vendor_payment_confirmed, j.resident_payment_confirmed, j.amount_paid_cents, j.payment_date, j.receipt_number, j.payment_inquiry_status, j.service_amount_cents, j.flairo_fee_cents, j.points, j.invoice_trigger_status FROM resident_requests r JOIN job_orders j ON j.request_id = r.id ORDER BY r.id DESC').all();
  const rewardRows = await db.prepare('SELECT * FROM reward_ledger_entries ORDER BY created_at DESC, id DESC').all();
  const invoiceRows = await db.prepare('SELECT * FROM invoice_triggers ORDER BY created_at DESC, id DESC').all();
  const auditRows = await db.prepare('SELECT * FROM audit_events ORDER BY created_at DESC, id DESC LIMIT 20').all();
  const mobileSyncRow = await db.prepare('SELECT * FROM mobile_sync_state WHERE id = ?').bind('default').first<Record<string, unknown>>();

  return {
    audit: auditRows.results.map((row) => ({
      action: String(row.action),
      detail: String(row.detail),
      id: String(row.id),
      time: labelTime(String(row.created_at)),
    })),
    communities: communityRows.results.map((row) => ({
      address: String(row.address),
      homes: Number(row.homes),
      id: String(row.id),
      manager: String(row.property_manager),
      market: String(row.market),
      name: String(row.name),
      netIncome: dollarsFromCents(Number(row.net_income_cents)),
      occupied: Number(row.occupied_homes),
      plusMembers: Number(row.plus_members),
      servicePenetration: Number(row.service_penetration),
      statementStatus: String(row.statement_status),
    })),
    invoices: invoiceRows.results.map((row) => ({
      amount: dollarsFromCents(Number(row.amount_cents)),
      dueDate: String(row.due_date),
      id: String(row.id),
      jobId: String(row.job_order_id),
      reference: String(row.bluevine_reference ?? ''),
      status: String(row.status),
      vendorId: String(row.vendor_id),
    })),
    jobs: jobRows.results.map((row) => {
      const legacyPaid = Boolean(row.resident_paid_vendor);
      return {
        amount: dollarsFromCents(Number(row.service_amount_cents)),
        amountPaid: row.amount_paid_cents === null || row.amount_paid_cents === undefined ? null : dollarsFromCents(Number(row.amount_paid_cents)),
        boardStatus: String(row.task_status),
        claimedAt: row.claimed_at ? String(row.claimed_at) : null,
        communityId: String(row.community_id),
        email: String(row.resident_email),
        flairoFee: dollarsFromCents(Number(row.flairo_fee_cents)),
        homeProfile: String(row.home_profile),
        id: String(row.id),
        invoiceStatus: String(row.invoice_trigger_status),
        market: String(row.market),
        paymentConsult: String(row.payment_consult_status),
        paymentDate: row.payment_date ? String(row.payment_date) : null,
        paymentInquiryStatus: row.payment_inquiry_status ? String(row.payment_inquiry_status) : null,
        phone: String(row.resident_phone),
        points: Number(row.points),
        preferredWindow: String(row.preferred_window),
        receiptNumber: row.receipt_number ? String(row.receipt_number) : null,
        requestedAt: String(row.requested_at),
        resident: String(row.resident_name),
        residentInfoReleased: Boolean(row.resident_info_released),
        residentPaymentConfirmed: Boolean(row.resident_payment_confirmed) || legacyPaid,
        scheduleDueAt: row.schedule_due_at ? String(row.schedule_due_at) : null,
        scheduledAt: row.schedule_confirmed_at ? String(row.schedule_confirmed_at) : null,
        service: String(row.service_name),
        serviceDate: String(row.service_date ?? ''),
        unit: String(row.unit),
        vendorConfirmed: Boolean(row.vendor_confirmed_at),
        vendorId: row.vendor_id ? String(row.vendor_id) : null,
        vendorPaymentConfirmed: Boolean(row.vendor_payment_confirmed) || legacyPaid,
        visibleToVendors: Boolean(row.visible_to_vendors),
      };
    }),
    rewards: rewardRows.results.map((row) => ({
      communityId: String(row.community_id),
      id: String(row.id),
      note: String(row.reason),
      points: Number(row.points),
      resident: String(row.resident_name),
      source: String(row.entry_type),
      status: String(row.status),
      value: dollarsFromCents(Number(row.dollar_value_cents)),
    })),
    services: serviceRows.results.map((row) => ({
      category: String(row.category),
      id: String(row.id),
      mobileVisible: Boolean(row.mobile_visible),
      name: String(row.name),
      plusPrice: dollarsFromCents(Number(row.plus_price_cents)),
      pointsRule: String(row.points_rule),
      standardPrice: dollarsFromCents(Number(row.standard_price_cents)),
      vendorPoolRule: String(row.vendor_pool_rule),
    })),
    vendors: vendorRows.results.map((row) => ({
      boardAccess: Boolean(row.board_access),
      contact: String(row.primary_contact),
      email: String(row.email),
      feePercent: Number(row.flairo_fee_percent),
      id: String(row.id),
      insurance: String(row.insurance_status),
      license: String(row.license_status),
      markets: parseJsonArray(String(row.markets)),
      name: String(row.business_name),
      phone: String(row.phone),
      preferred: Boolean(row.preferred_vendor),
      rating: Number(row.rating),
      services: parseJsonArray(String(row.services)),
      stage: String(row.onboarding_stage),
      status: String(row.compliance_status),
      w9: String(row.w9_status),
    })),
    mobileSync: {
      connectionStatus: String(mobileSyncRow?.connection_status ?? 'Live app bridge online'),
      lastCheckedAt: labelDateTime(String(mobileSyncRow?.last_checked_at ?? now())),
      lastPushAt: mobileSyncRow?.last_push_at ? labelDateTime(String(mobileSyncRow.last_push_at)) : 'No mobile app push yet',
      lastPushSummary: String(mobileSyncRow?.last_push_summary ?? 'No mobile app push yet'),
      pendingChanges: Number(mobileSyncRow?.pending_changes ?? 0),
      revision: Number(mobileSyncRow?.revision ?? 0),
    },
  };
}

async function ensureMobileSyncState(db: D1Database) {
  const stamp = now();
  await db.prepare('INSERT OR IGNORE INTO mobile_sync_state (id, connection_status, last_checked_at, last_push_at, pending_changes, revision, last_push_summary, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind('default', 'Live app bridge online', stamp, null, 0, 0, 'No mobile app push yet', stamp)
    .run();
}

async function touchMobileConnection(db: D1Database) {
  const row = await db.prepare('SELECT pending_changes FROM mobile_sync_state WHERE id = ?')
    .bind('default')
    .first<{ pending_changes: number }>();
  const stamp = now();
  const status = (row?.pending_changes ?? 0) > 0
    ? 'Live app bridge online • mobile changes staged'
    : 'Live app bridge online';

  await db.prepare('UPDATE mobile_sync_state SET connection_status = ?, last_checked_at = ?, updated_at = ? WHERE id = ?')
    .bind(status, stamp, stamp, 'default')
    .run();
}

async function stageMobileDraftChange() {
  const stamp = now();
  await env.DB.prepare('UPDATE mobile_sync_state SET pending_changes = pending_changes + 1, revision = revision + 1, connection_status = ?, updated_at = ? WHERE id = ?')
    .bind('Live app bridge online • mobile changes staged', stamp, 'default')
    .run();
}

async function pushMobileUpdate() {
  const stamp = now();
  await env.DB.prepare('UPDATE mobile_sync_state SET pending_changes = 0, revision = revision + 1, connection_status = ?, last_checked_at = ?, last_push_at = ?, last_push_summary = ?, updated_at = ? WHERE id = ?')
    .bind(
      'Live app bridge online • mobile app current',
      stamp,
      stamp,
      'Manual push sent staged catalog, job-board, rewards, vendor, and reporting updates.',
      stamp,
      'default',
    )
    .run();
  await logEvent('Mobile app push', 'mobile-app', 'Manual mobile application update completed from the FLAIRO control center.');
}

async function recordDocumentUpload(vendorId?: string, documentType?: string) {
  if (!vendorId || !documentType) return;
  const stamp = now();
  const column = documentType === 'license' ? 'license_status' : 'insurance_status';
  await env.DB.prepare(`UPDATE vendors SET ${column} = ?, compliance_status = ?, onboarding_stage = ?, updated_at = ? WHERE id = ?`)
    .bind('Under review', 'Review needed', `${documentType} uploaded for review`, stamp, vendorId)
    .run();
  await env.DB.prepare('INSERT INTO vendor_documents (id, vendor_id, document_type, status, storage_key, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(`DOC-${Date.now()}`, vendorId, documentType, 'Under review', `vendor-documents/${vendorId}/${documentType}-${Date.now()}`, stamp)
    .run();
  await logEvent('Vendor document', vendorId, `${documentType} uploaded and placed under review.`);
}

async function approveVendor(vendorId?: string) {
  if (!vendorId) return;
  await env.DB.prepare('UPDATE vendors SET insurance_status = ?, license_status = ?, w9_status = ?, compliance_status = ?, board_access = ?, onboarding_stage = ?, updated_at = ? WHERE id = ?')
    .bind('Verified', 'Verified', 'Verified', 'Compliant', 1, 'Board access active', now(), vendorId)
    .run();
  await logEvent('Vendor approved', vendorId, 'Vendor can now claim matching work from the job board.');
}

async function claimJob(jobId?: string) {
  if (!jobId) return;
  const state = await readState(env.DB);
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return;
  const stamp = now();
  const scheduleDueAt = addHours(stamp, 24);
  const vendor = state.vendors
    .filter(
      (candidate) =>
        candidate.boardAccess &&
        candidate.markets.includes(job.market) &&
        candidate.services.includes(job.service),
    )
    .sort(sortVendorsForBoard)[0];
  if (!vendor) {
    await logEvent('Claim blocked', jobId, 'No compliant vendor matched the request market and service.');
    return;
  }

  await env.DB.batch([
    env.DB.prepare('UPDATE resident_requests SET board_status = ?, visible_to_vendors = ?, resident_info_released = ?, updated_at = ? WHERE id = ?')
      .bind('Claimed', 0, 1, stamp, jobId),
    env.DB.prepare('UPDATE job_orders SET vendor_id = ?, task_status = ?, claimed_at = ?, schedule_due_at = ?, schedule_confirmed_at = ?, vendor_confirmed_at = ?, payment_consult_status = ?, resident_paid_vendor = ?, vendor_payment_confirmed = ?, resident_payment_confirmed = ?, amount_paid_cents = ?, payment_date = ?, receipt_number = ?, payment_inquiry_status = ?, updated_at = ? WHERE id = ?')
      .bind(vendor.id, 'Claimed', stamp, scheduleDueAt, null, null, 'Resident contact released; vendor to schedule and consult on payment', 0, 0, 0, null, null, null, null, stamp, jobId),
  ]);
  await logEvent('Vendor claim', jobId, `${vendor.name} claimed ${jobId}; job removed from vendor board.`);
}

async function confirmSchedule(jobId?: string) {
  if (!jobId) return;
  const stamp = now();
  await env.DB.batch([
    env.DB.prepare('UPDATE resident_requests SET board_status = ?, updated_at = ? WHERE id = ?')
      .bind('Scheduled', stamp, jobId),
    env.DB.prepare('UPDATE job_orders SET task_status = ?, schedule_confirmed_at = ?, vendor_confirmed_at = ?, payment_consult_status = ?, updated_at = ? WHERE id = ?')
      .bind('Scheduled', stamp, stamp, 'Scheduled; direct vendor payment still needs resident and vendor confirmation', stamp, jobId),
  ]);
  await logEvent('Schedule confirmed', jobId, 'Admin confirmed booking schedule and pushed scheduling details to the mobile workflow.');
}

async function completeJob(jobId?: string) {
  if (!jobId) return;
  const state = await readState(env.DB);
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return;
  const stamp = now();
  await env.DB.batch([
    env.DB.prepare('UPDATE resident_requests SET board_status = ?, updated_at = ? WHERE id = ?')
      .bind('Completed', stamp, jobId),
    env.DB.prepare('UPDATE job_orders SET task_status = ?, invoice_trigger_status = ?, payment_consult_status = ?, resident_paid_vendor = ?, vendor_payment_confirmed = ?, resident_payment_confirmed = ?, amount_paid_cents = ?, payment_date = ?, receipt_number = COALESCE(receipt_number, ?), updated_at = ? WHERE id = ?')
      .bind('Completed', 'Ready', 'Admin confirmed job complete and paid; resident survey queued', 1, 1, 1, cents(job.amount), stamp.slice(0, 10), 'Admin override', stamp, jobId),
  ]);
  await env.DB.prepare('INSERT OR IGNORE INTO reward_ledger_entries (id, resident_name, community_id, request_id, entry_type, status, points, dollar_value_cents, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(`R-${Date.now()}`, job.resident, job.communityId, job.id, job.id, 'Available', job.points, cents(job.points / 100), `${job.service} completion verified`, stamp)
    .run();
  await logEvent('Job completed', jobId, 'Job completed, payment confirmed, invoice readiness set, and resident survey queued.');
}

async function reactivateJob(jobId?: string) {
  if (!jobId) return;
  const stamp = now();
  const job = await env.DB.prepare('SELECT vendor_id FROM job_orders WHERE id = ? LIMIT 1')
    .bind(jobId)
    .first<{ vendor_id: string | null }>();
  if (!job?.vendor_id) {
    await logEvent('Reactivation blocked', jobId, 'A claimed vendor is required before releasing a job back to the vendor board.');
    return;
  }

  await env.DB.batch([
    env.DB.prepare('UPDATE resident_requests SET board_status = ?, visible_to_vendors = ?, resident_info_released = ?, updated_at = ? WHERE id = ?')
      .bind('Open', 1, 0, stamp, jobId),
    env.DB.prepare('UPDATE job_orders SET vendor_id = ?, task_status = ?, schedule_confirmed_at = ?, vendor_confirmed_at = ?, claimed_at = ?, schedule_due_at = ?, payment_consult_status = ?, resident_paid_vendor = ?, vendor_payment_confirmed = ?, resident_payment_confirmed = ?, amount_paid_cents = ?, payment_date = ?, receipt_number = ?, payment_inquiry_status = ?, invoice_trigger_status = ?, updated_at = ? WHERE id = ?')
      .bind(null, 'Open', null, null, null, null, 'Re-activated; matching vendors nudged in the mobile app', 0, 0, 0, null, null, null, null, 'Waiting', stamp, jobId),
  ]);
  await logEvent('Request re-activated', jobId, 'Claimed vendor removed; job is visible to matching vendors again and a vendor mobile pickup nudge is queued.');
}

async function confirmVendorPayment(jobId?: string) {
  if (!jobId) return;
  const state = await readState(env.DB);
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return;
  const stamp = now();
  const nextConsult = job.residentPaymentConfirmed
    ? 'Resident and vendor confirmed direct payment'
    : 'Vendor confirmed direct payment; resident confirmation still open';
  await env.DB.prepare('UPDATE job_orders SET vendor_payment_confirmed = ?, resident_paid_vendor = CASE WHEN resident_payment_confirmed = 1 THEN 1 ELSE resident_paid_vendor END, amount_paid_cents = COALESCE(amount_paid_cents, ?), payment_date = COALESCE(payment_date, ?), payment_consult_status = ?, updated_at = ? WHERE id = ?')
    .bind(1, cents(job.amount), stamp.slice(0, 10), nextConsult, stamp, jobId)
    .run();
  await logEvent('Vendor payment confirmed', jobId, 'Payment confirmation recorded from the vendor side.');
}

async function confirmResidentPayment(jobId?: string) {
  if (!jobId) return;
  const state = await readState(env.DB);
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return;
  const stamp = now();
  const nextConsult = job.vendorPaymentConfirmed
    ? 'Resident and vendor confirmed direct payment'
    : 'Resident confirmed direct payment; vendor confirmation still open';
  await env.DB.prepare('UPDATE job_orders SET resident_payment_confirmed = ?, resident_paid_vendor = CASE WHEN vendor_payment_confirmed = 1 THEN 1 ELSE resident_paid_vendor END, amount_paid_cents = COALESCE(amount_paid_cents, ?), payment_date = COALESCE(payment_date, ?), receipt_number = COALESCE(receipt_number, ?), payment_consult_status = ?, updated_at = ? WHERE id = ?')
    .bind(1, cents(job.amount), stamp.slice(0, 10), 'Resident receipt optional', nextConsult, stamp, jobId)
    .run();
  await logEvent('Resident payment confirmed', jobId, 'Payment confirmation recorded from the resident side.');
}

async function submitPaymentInquiry(jobId?: string) {
  if (!jobId) return;
  const stamp = now();
  await env.DB.prepare('UPDATE job_orders SET payment_inquiry_status = ?, payment_consult_status = ?, updated_at = ? WHERE id = ?')
    .bind('Inquiry routed to info@flairo.org', 'Payment discrepancy inquiry routed to FLAIRO Admin', stamp, jobId)
    .run();
  await logEvent('Payment inquiry', jobId, 'Resident payment discrepancy inquiry routed to info@flairo.org.');
}

async function createManualJob(payload: Record<string, string>) {
  const jobId = payload.jobId || `J-${Date.now().toString().slice(-5)}`;
  const community = await env.DB.prepare('SELECT market FROM communities WHERE id = ? LIMIT 1')
    .bind(payload.communityId)
    .first<{ market: string }>();
  const service = await env.DB.prepare('SELECT plus_price_cents FROM services WHERE name = ? LIMIT 1')
    .bind(payload.service)
    .first<{ plus_price_cents: number }>();
  if (!payload.resident || !payload.communityId || !payload.unit || !payload.service || !community) return;

  const stamp = now();
  const amount = Number(payload.amount) || dollarsFromCents(Number(service?.plus_price_cents ?? 0));
  const fee = amount * 0.1;
  await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO resident_requests (id, resident_name, resident_email, resident_phone, community_id, market, unit, home_profile, service_name, preferred_window, board_status, visible_to_vendors, resident_info_released, requested_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(jobId, payload.resident, payload.email || 'resident-email-needed@flairo.org', payload.phone || 'Phone needed', payload.communityId, community.market, payload.unit, payload.homeProfile || 'Profile pending', payload.service, payload.preferredWindow || 'Resident follow-up needed', 'Open', 1, 0, stamp, stamp),
    env.DB.prepare('INSERT OR IGNORE INTO job_orders (id, request_id, vendor_id, task_status, service_date, schedule_confirmed_at, vendor_confirmed_at, claimed_at, schedule_due_at, payment_consult_status, resident_paid_vendor, vendor_payment_confirmed, resident_payment_confirmed, amount_paid_cents, payment_date, receipt_number, payment_inquiry_status, service_amount_cents, flairo_fee_cents, points, invoice_trigger_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(jobId, jobId, null, 'Open', payload.serviceDate || stamp.slice(0, 10), null, null, null, null, 'Manual resident request created by FLAIRO Admin', 0, 0, 0, null, null, null, null, cents(amount), cents(fee), Math.round(amount * 1.5), 'Waiting', stamp, stamp),
  ]);
  await logEvent('Manual job order', jobId, 'FLAIRO Admin created a resident request and released it to the vendor board.');
}

async function triggerInvoice(jobId?: string) {
  if (!jobId) return;
  const state = await readState(env.DB);
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job?.vendorId) {
    await logEvent('Invoice blocked', jobId, 'A claimed vendor is required before creating an invoice trigger.');
    return;
  }
  const stamp = now();
  const invoiceId = `INV-Q-${Date.now().toString().slice(-5)}`;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO invoice_triggers (id, job_order_id, vendor_id, amount_cents, status, bluevine_reference, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(invoiceId, job.id, job.vendorId, cents(job.flairoFee), 'Draft queued', 'Bluevine draft requested', 'Net 7', stamp, stamp),
    env.DB.prepare('UPDATE job_orders SET invoice_trigger_status = ?, updated_at = ? WHERE id = ?')
      .bind('Draft queued', stamp, job.id),
  ]);
  await logEvent('Bluevine invoice trigger', invoiceId, `Invoice draft queued for ${job.id}.`);
}

async function processVendorMonth(vendorId?: string, monthKey?: string) {
  if (!vendorId || !monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return;
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month || month < 1 || month > 12) return;

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const startDate = `${monthKey}-01`;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  const stamp = now();
  const readyRows = await env.DB.prepare(`
    SELECT id, flairo_fee_cents
    FROM job_orders
    WHERE vendor_id = ?
      AND service_date >= ?
      AND service_date < ?
      AND invoice_trigger_status != ?
      AND (invoice_trigger_status IN (?, ?) OR task_status = ?)
  `)
    .bind(vendorId, startDate, endDate, 'Sent', 'Ready', 'Draft queued', 'Completed')
    .all<Record<string, unknown>>();
  const missingInvoiceInserts: D1PreparedStatement[] = [];

  for (const row of readyRows.results) {
    const jobId = String(row.id);
    const existing = await env.DB.prepare('SELECT id FROM invoice_triggers WHERE job_order_id = ? AND vendor_id = ? LIMIT 1')
      .bind(jobId, vendorId)
      .first<{ id: string }>();

    if (!existing) {
      missingInvoiceInserts.push(
        env.DB.prepare('INSERT INTO invoice_triggers (id, job_order_id, vendor_id, amount_cents, status, bluevine_reference, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(`INV-M-${monthKey.replace('-', '')}-${jobId}`, jobId, vendorId, Number(row.flairo_fee_cents), 'Sent', 'Month-end invoice processed', 'Net 7', stamp, stamp),
      );
    }
  }

  if (missingInvoiceInserts.length) {
    await env.DB.batch(missingInvoiceInserts);
  }

  await env.DB.batch([
    env.DB.prepare(`
      UPDATE job_orders
      SET invoice_trigger_status = ?, updated_at = ?
      WHERE vendor_id = ?
        AND service_date >= ?
        AND service_date < ?
        AND invoice_trigger_status != ?
        AND (invoice_trigger_status IN (?, ?) OR task_status = ?)
    `)
      .bind('Sent', stamp, vendorId, startDate, endDate, 'Sent', 'Ready', 'Draft queued', 'Completed'),
    env.DB.prepare(`
      UPDATE invoice_triggers
      SET status = ?, bluevine_reference = ?, updated_at = ?
      WHERE vendor_id = ?
        AND job_order_id IN (
          SELECT id
          FROM job_orders
          WHERE vendor_id = ?
            AND service_date >= ?
            AND service_date < ?
        )
    `)
      .bind('Sent', 'Month-end invoice processed', stamp, vendorId, vendorId, startDate, endDate),
  ]);
  await logEvent('Vendor month processed', vendorId, `Month-end invoice processing completed for ${monthKey}.`);
}

async function logEvent(action: string, subject: string, detail: string) {
  await env.DB.prepare('INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(`A-${Date.now()}-${Math.floor(Math.random() * 1000)}`, 'FLAIRO Administrator', action, subject, detail, now())
    .run();
}

function cents(value: number) {
  return Math.round(value * 100);
}

function dollarsFromCents(value: number) {
  return value / 100;
}

function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function sortVendorsForBoard(a: VendorSeed, b: VendorSeed) {
  if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
  if (a.rating !== b.rating) return b.rating - a.rating;
  return a.name.localeCompare(b.name);
}

function labelTime(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)} hr ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function labelDateTime(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Date(timestamp).toLocaleString('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function readableError(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected FLAIRO data error.';
}
