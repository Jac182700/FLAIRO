'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

type ModuleId =
  | 'command'
  | 'mobile'
  | 'vendors'
  | 'board'
  | 'tasks'
  | 'rewards'
  | 'accounting'
  | 'reports'
  | 'settings';

type AccountingTab =
  | 'vendor-billing'
  | 'partnership-statements'
  | 'reconciliation-queue'
  | 'month-end-close'
  | 'accounting-settings';

type VendorStatus = 'Compliant' | 'Review needed' | 'Pending onboarding';
type DocumentStatus = 'Verified' | 'Under review' | 'Needs upload' | 'Expiring';
type VendorDocumentType = 'insurance' | 'license' | 'w9' | 'contract';
type VendorMetricFilter = 'vendor-active' | 'vendor-review' | 'vendor-rating' | 'vendor-expiring';
type BoardStatus = 'Open' | 'Claimed' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Refunded' | 'Disputed' | 'Reopened' | 'Pending';
type InvoiceStatus = 'Waiting' | 'Ready' | 'Draft queued' | 'Sent' | 'Paid' | 'Hold' | 'Deferred' | 'Disputed' | 'Archived';
type StatementStatus = 'Draft' | 'Ready' | 'Issued';
type RewardStatus = 'Pending' | 'Available' | 'Redeemed' | 'Reversed' | 'Expired';

type VendorComplianceDocument = {
  id: string;
  type: VendorDocumentType;
  status: DocumentStatus;
  storageKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  expiresAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
};

type Service = {
  id: string;
  name: string;
  category: string;
  standardPrice: number;
  plusPrice: number;
  mobileVisible: boolean;
  pointsRule: string;
  vendorPoolRule: string;
};

type Community = {
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
  statementStatus: StatementStatus;
};

type Vendor = {
  id: string;
  name: string;
  dbaName: string;
  contact: string;
  email: string;
  phone: string;
  physicalAddress: string;
  markets: string[];
  serviceLocations: string[];
  services: string[];
  status: VendorStatus;
  boardAccess: boolean;
  insurance: DocumentStatus;
  license: DocumentStatus;
  w9: DocumentStatus;
  contract: DocumentStatus;
  contractExpiresAt: string | null;
  documentCounts: Record<VendorDocumentType, number>;
  documents: VendorComplianceDocument[];
  feePercent: number;
  pricingNotes: string;
  stage: string;
  rating: number;
  preferred: boolean;
};

type Job = {
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
  boardStatus: BoardStatus;
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
  invoiceStatus: InvoiceStatus;
};

type RewardEntry = {
  id: string;
  resident: string;
  communityId: string;
  source: string;
  status: RewardStatus;
  points: number;
  value: number;
  expirationDate: string | null;
  plusMember: boolean;
  alertQueued: boolean;
  redeemedInExpirationWindow: boolean;
  note: string;
};

type RewardSettings = {
  pointValueCents: number;
  redemptionCapPercent: number;
  plusMembershipMonthly: number;
  plusOnlyAccrual: boolean;
  minimumGoldBalance: number;
  expirationMonths: number;
  expirationReminderDays: number;
  adoptionIndexPreviousMonth: number;
  registrationGrowthPercent: number;
  activationRatePercent: number;
  firstServiceConversionPercent: number;
  active30DayRatePercent: number;
  repeatUseRatePercent: number;
  surveyResponseRatePercent: number;
  avgCxRating: number;
};

type CrmAccountSettings = {
  accountMode: string;
  accountingEmail: string;
  billingContact: string;
  defaultPaymentTerms: string;
  documentRequirements: string;
  mobileCatalogOwner: string;
  statementApprover: string;
  supportRouting: string;
  vendorOnboardingOwner: string;
};

type InvoiceTrigger = {
  id: string;
  jobId: string;
  vendorId: string;
  amount: number;
  billingMonth?: string;
  status: InvoiceStatus;
  dueDate: string;
  reference: string;
};

type PartnershipProgram = {
  id: string;
  communityId: string;
  name: string;
  period: string;
  glCode: string;
  income: number;
  status: 'Ready' | 'Review' | 'Deferred';
  adoption: number;
  plusMemberships: number;
  jobsBooked: number;
  popularService: string;
  pointsEarned: number;
  pointsRedeemed: number;
};

type ReconciliationItem = {
  id: string;
  type: string;
  item: string;
  property: string;
  vendor: string;
  partner: string;
  program: string;
  servicePeriod: string;
  billingCandidate: string;
  jobStatus: string;
  paymentStatus: string;
  reconciliationStatus: string;
  ageLabel: string;
  suggestedAction: string;
  amount: number;
};

type AuditEntry = {
  id: string;
  action: string;
  detail: string;
  time: string;
};

type MobileSync = {
  connectionStatus: string;
  lastCheckedAt: string;
  lastPushAt: string;
  lastPushSummary: string;
  pendingChanges: number;
  revision: number;
};

type Metric = {
  id?: string;
  label: string;
  value: string;
  detail: string;
};

type Drilldown = {
  id: string;
  label: string;
  count: string;
  detail: string;
  rows: DrilldownRow[];
};

type DrilldownAction = {
  label: string;
  module: ModuleId;
  recordId: string;
};

type DrilldownRow = {
  id: string;
  cells: string[];
  action: DrilldownAction;
};

type ManualJobDraft = {
  resident: string;
  phone: string;
  email: string;
  communityId: string;
  unit: string;
  homeProfile: string;
  service: string;
  preferredWindow: string;
  serviceDate: string;
  amount: string;
};

type VendorFormDraft = {
  id: string;
  name: string;
  dbaName: string;
  contact: string;
  email: string;
  phone: string;
  physicalAddress: string;
  serviceLocations: string;
  services: string[];
  boardAccess: boolean;
  preferred: boolean;
  feePercent: string;
  pricingNotes: string;
  contractExpiresAt: string;
  contractUploadQueued: boolean;
};

type RewardAdjustmentDraft = {
  resident: string;
  communityId: string;
  status: RewardStatus;
  points: string;
  expirationDate: string;
  note: string;
};

type PartnershipProfileDraft = {
  address: string;
  homes: string;
  manager: string;
  market: string;
  name: string;
  netIncome: string;
  occupied: string;
  plusMembers: string;
  servicePenetration: string;
};

type VendorMonthRow = {
  vendorId: string;
  vendorName: string;
  jobs: Job[];
  residentTotal: number;
  flairoPayout: number;
  readyCount: number;
  waitingCount: number;
  services: string;
};

type OpenVendorStatement = {
  amount: number;
  dueLabel: string;
  invoices: InvoiceTrigger[];
  jobCount: number;
  jobs: Job[];
  monthKey: string;
  status: string;
  vendor: Vendor;
};

type FlairoState = {
  audit: AuditEntry[];
  communities: Community[];
  crmAccountSettings: CrmAccountSettings;
  invoices: InvoiceTrigger[];
  jobs: Job[];
  mobileSync: MobileSync;
  rewards: RewardEntry[];
  rewardSettings: RewardSettings;
  services: Service[];
  vendors: Vendor[];
};

const navSections: Array<{ id: ModuleId; label: string }> = [
  { id: 'command', label: 'Command' },
  { id: 'mobile', label: 'Mobile Controls' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'board', label: 'Job Board' },
  { id: 'tasks', label: 'Open Tasks' },
  { id: 'rewards', label: 'Plume Points' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'reports', label: 'Reporting' },
  { id: 'settings', label: 'Settings' },
];

const accountingTabs: Array<{ id: AccountingTab; label: string }> = [
  { id: 'vendor-billing', label: 'Vendor Billing' },
  { id: 'partnership-statements', label: 'Partnership Statements' },
  { id: 'reconciliation-queue', label: 'Reconciliation Queue' },
  { id: 'month-end-close', label: 'Month-End Close' },
  { id: 'accounting-settings', label: 'Accounting Settings' },
];

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const vendorDocumentLabels: Record<VendorDocumentType, string> = {
  contract: 'FLAIRO contract',
  insurance: 'Insurance',
  license: 'Business license',
  w9: 'W-9',
};
const vendorDocumentOrder: VendorDocumentType[] = ['insurance', 'license', 'w9', 'contract'];

function relativeIso(hoursOffset: number) {
  return new Date(Date.now() + hoursOffset * HOUR_MS).toISOString();
}

const initialServices: Service[] = [
  {
    id: 'recurring-housekeeping',
    name: 'Recurring housekeeping',
    category: 'Home Care',
    standardPrice: 185,
    plusPrice: 149,
    mobileVisible: true,
    pointsRule: 'PLUS members earn 200 Plume Points per completion',
    vendorPoolRule: 'Compliant cleaning vendors by market',
  },
  {
    id: 'move-out-deep-cleaning',
    name: 'Move-out deep cleaning',
    category: 'Move-out',
    standardPrice: 245,
    plusPrice: 215,
    mobileVisible: true,
    pointsRule: 'PLUS members earn 250 Plume Points per completion',
    vendorPoolRule: 'Cleaning vendors with turnover access',
  },
  {
    id: 'pet-care',
    name: 'Dog walking and drop-ins',
    category: 'Pet Care',
    standardPrice: 32,
    plusPrice: 27,
    mobileVisible: true,
    pointsRule: 'PLUS members earn recurring Plume Points on eligible visits',
    vendorPoolRule: 'Pet vendors with active license',
  },
  {
    id: 'preferred-movers',
    name: 'Preferred movers',
    category: 'Moving',
    standardPrice: 325,
    plusPrice: 299,
    mobileVisible: true,
    pointsRule: 'PLUS members earn 300 Plume Points per completion',
    vendorPoolRule: 'Moving vendors by ZIP and availability',
  },
  {
    id: 'handyman-work',
    name: 'Handyman work',
    category: 'Home Care',
    standardPrice: 125,
    plusPrice: 110,
    mobileVisible: true,
    pointsRule: 'PLUS members earn 100 Plume Points per completion',
    vendorPoolRule: 'Home services vendors by task type',
  },
  {
    id: 'touch-up-painting',
    name: 'Move-out touch-up painting',
    category: 'Move-out',
    standardPrice: 225,
    plusPrice: 195,
    mobileVisible: false,
    pointsRule: 'PLUS members earn 200 Plume Points per completion',
    vendorPoolRule: 'Paint vendors with estimate approval',
  },
];

const initialCommunities: Community[] = [
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

const initialVendors: Vendor[] = [
  {
    id: 'sparkle',
    name: 'Sparkle & Settle Cleaning Co.',
    dbaName: 'Sparkle & Settle',
    contact: 'Elena Martinez',
    email: 'operations@sparklesettle.example',
    phone: '(305) 555-0181',
    physicalAddress: '420 Las Olas Blvd, Fort Lauderdale, FL 33301',
    markets: ['Fort Lauderdale, FL', 'Sunrise, FL'],
    serviceLocations: ['33301', '33304', '33322', 'Sunrise, FL'],
    services: ['Recurring housekeeping', 'Move-out deep cleaning'],
    status: 'Compliant',
    boardAccess: true,
    insurance: 'Verified',
    license: 'Verified',
    w9: 'Verified',
    contract: 'Verified',
    contractExpiresAt: '2027-08-31',
    documentCounts: { contract: 1, insurance: 1, license: 1, w9: 1 },
    documents: [],
    feePercent: 10,
    pricingNotes: 'Housekeeping priced by home size; vendor consults resident for recurring cadence.',
    stage: 'Board access active',
    rating: 4.8,
    preferred: true,
  },
  {
    id: 'pink-palm',
    name: 'Pink Palm Pet Care',
    dbaName: 'Pink Palm',
    contact: 'Jordan Ellis',
    email: 'hello@pinkpalmpet.example',
    phone: '(954) 555-0174',
    physicalAddress: '1120 NE 4th Ave, Fort Lauderdale, FL 33304',
    markets: ['Fort Lauderdale, FL'],
    serviceLocations: ['33301', '33304', '33305'],
    services: ['Dog walking and drop-ins'],
    status: 'Review needed',
    boardAccess: false,
    insurance: 'Expiring',
    license: 'Verified',
    w9: 'Verified',
    contract: 'Verified',
    contractExpiresAt: '2026-10-15',
    documentCounts: { contract: 1, insurance: 1, license: 1, w9: 1 },
    documents: [],
    feePercent: 10,
    pricingNotes: 'Resident pays vendor directly at visit completion.',
    stage: 'Insurance renewal review',
    rating: 4.7,
    preferred: false,
  },
  {
    id: 'porter',
    name: 'Porter Preferred Movers',
    dbaName: 'Porter Preferred',
    contact: 'Andre Collins',
    email: 'dispatch@porterpreferred.example',
    phone: '(786) 555-0142',
    physicalAddress: '9900 NW 21st St, Doral, FL 33172',
    markets: ['Miami, FL', 'Sunrise, FL'],
    serviceLocations: ['33132', '33137', '33323', '33351'],
    services: ['Preferred movers'],
    status: 'Pending onboarding',
    boardAccess: false,
    insurance: 'Under review',
    license: 'Needs upload',
    w9: 'Verified',
    contract: 'Under review',
    contractExpiresAt: '2027-01-31',
    documentCounts: { contract: 1, insurance: 1, license: 0, w9: 1 },
    documents: [],
    feePercent: 10,
    pricingNotes: 'Moving estimates handled directly with resident after claim.',
    stage: 'License upload needed',
    rating: 4.5,
    preferred: true,
  },
  {
    id: 'hex-key',
    name: 'Hex Key Home Services',
    dbaName: 'Hex Key',
    contact: 'Nina Patel',
    email: 'jobs@hexkeyhome.example',
    phone: '(561) 555-0126',
    physicalAddress: '7800 Biscayne Blvd, Miami, FL 33138',
    markets: ['Miami, FL', 'Fort Lauderdale, FL'],
    serviceLocations: ['33138', '33137', '33301', '33308'],
    services: ['Handyman work', 'Move-out touch-up painting'],
    status: 'Compliant',
    boardAccess: true,
    insurance: 'Verified',
    license: 'Verified',
    w9: 'Verified',
    contract: 'Verified',
    contractExpiresAt: '2027-05-31',
    documentCounts: { contract: 2, insurance: 1, license: 1, w9: 1 },
    documents: [],
    feePercent: 10,
    pricingNotes: 'Admin may set a service price, otherwise vendor confirms project scope with resident.',
    stage: 'Board access active',
    rating: 4.6,
    preferred: false,
  },
];

const initialJobs: Job[] = [
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

const initialRewards: RewardEntry[] = [
  {
    id: 'R-8801',
    resident: 'Maya Chen',
    communityId: 'arbor',
    source: 'J-1048',
    status: 'Pending',
    points: 498,
    value: 4.98,
    expirationDate: '2026-09-30',
    plusMember: true,
    alertQueued: false,
    redeemedInExpirationWindow: false,
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
    expirationDate: '2026-08-31',
    plusMember: true,
    alertQueued: true,
    redeemedInExpirationWindow: false,
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
    expirationDate: '2026-12-31',
    plusMember: true,
    alertQueued: false,
    redeemedInExpirationWindow: false,
    note: 'Launch Plume Point liability',
  },
  {
    id: 'R-8700',
    resident: 'Jordan Lee',
    communityId: 'solara',
    source: 'Reward credit',
    status: 'Redeemed',
    points: -500,
    value: -5,
    expirationDate: '2026-08-31',
    plusMember: true,
    alertQueued: true,
    redeemedInExpirationWindow: true,
    note: 'Applied to move-out cleaning',
  },
];

const initialRewardSettings: RewardSettings = {
  activationRatePercent: 46,
  active30DayRatePercent: 37,
  adoptionIndexPreviousMonth: 69,
  avgCxRating: 4.6,
  expirationMonths: 12,
  expirationReminderDays: 7,
  firstServiceConversionPercent: 28,
  minimumGoldBalance: 500,
  plusMembershipMonthly: 5,
  plusOnlyAccrual: true,
  pointValueCents: 1,
  redemptionCapPercent: 10,
  registrationGrowthPercent: 12,
  repeatUseRatePercent: 31,
  surveyResponseRatePercent: 38,
};

const initialCrmAccountSettings: CrmAccountSettings = {
  accountMode: 'Live operations',
  accountingEmail: 'accounting@flairo.org',
  billingContact: 'FLAIRO Admin',
  defaultPaymentTerms: 'Net 7',
  documentRequirements: 'Insurance, business license, W-9, contract',
  mobileCatalogOwner: 'Resident Experience',
  statementApprover: 'Partnership Accounting',
  supportRouting: 'info@flairo.org',
  vendorOnboardingOwner: 'Vendor Operations',
};

const initialInvoices: InvoiceTrigger[] = [
  {
    id: 'INV-Q-2208',
    jobId: 'J-1050',
    vendorId: 'pink-palm',
    amount: 2.7,
    billingMonth: '2026-09',
    status: 'Ready',
    dueDate: '2026-09-07',
    reference: 'Ready for monthly vendor statement',
  },
  {
    id: 'INV-Q-2209',
    jobId: 'J-1038',
    vendorId: 'sparkle',
    amount: 118.4,
    billingMonth: '2026-09',
    status: 'Draft queued',
    dueDate: '2026-09-05',
    reference: 'Added to vendor monthly statement',
  },
];

const partnershipPrograms: PartnershipProgram[] = [
  {
    id: 'arbor-flairo-plus-2026-09',
    communityId: 'arbor',
    name: 'FLAIRO PLUS',
    period: '2026-09',
    glCode: '40950',
    income: 1825,
    status: 'Ready',
    adoption: 36,
    plusMemberships: 48,
    jobsBooked: 21,
    popularService: 'Recurring housekeeping',
    pointsEarned: 8120,
    pointsRedeemed: 2100,
  },
  {
    id: 'arbor-resort-pass-2026-09',
    communityId: 'arbor',
    name: 'Resort Pass',
    period: '2026-09',
    glCode: '40970',
    income: 760,
    status: 'Ready',
    adoption: 18,
    plusMemberships: 48,
    jobsBooked: 9,
    popularService: 'Pool day pass',
    pointsEarned: 0,
    pointsRedeemed: 0,
  },
  {
    id: 'arbor-pestshare-2026-09',
    communityId: 'arbor',
    name: 'PestShare',
    period: '2026-09',
    glCode: '40980',
    income: 1188,
    status: 'Review',
    adoption: 24,
    plusMemberships: 48,
    jobsBooked: 14,
    popularService: 'Recurring service',
    pointsEarned: 0,
    pointsRedeemed: 0,
  },
  {
    id: 'solara-flairo-plus-2026-09',
    communityId: 'solara',
    name: 'FLAIRO PLUS',
    period: '2026-09',
    glCode: '40950',
    income: 2265,
    status: 'Ready',
    adoption: 31,
    plusMemberships: 61,
    jobsBooked: 28,
    popularService: 'Move-out deep cleaning',
    pointsEarned: 9340,
    pointsRedeemed: 2700,
  },
  {
    id: 'solara-peerspace-2026-09',
    communityId: 'solara',
    name: 'PeerSpace',
    period: '2026-09',
    glCode: '40972',
    income: 910,
    status: 'Ready',
    adoption: 14,
    plusMemberships: 61,
    jobsBooked: 6,
    popularService: 'Amenity reservation',
    pointsEarned: 0,
    pointsRedeemed: 0,
  },
  {
    id: 'sawgrass-flairo-plus-2026-09',
    communityId: 'sawgrass',
    name: 'FLAIRO PLUS',
    period: '2026-09',
    glCode: '40950',
    income: 2659.76,
    status: 'Ready',
    adoption: 44,
    plusMemberships: 73,
    jobsBooked: 33,
    popularService: 'Preferred movers',
    pointsEarned: 11240,
    pointsRedeemed: 3600,
  },
  {
    id: 'sawgrass-wag-2026-09',
    communityId: 'sawgrass',
    name: 'Wag',
    period: '2026-09',
    glCode: '40990',
    income: 540,
    status: 'Review',
    adoption: 12,
    plusMemberships: 73,
    jobsBooked: 11,
    popularService: 'Dog walking and drop-ins',
    pointsEarned: 0,
    pointsRedeemed: 0,
  },
];

const initialAudit: AuditEntry[] = [
  {
    id: 'A-1',
    action: 'Vendor claim',
    detail: 'Sparkle & Settle claimed J-1048; resident contact released.',
    time: 'Today 10:42 AM',
  },
  {
    id: 'A-2',
    action: 'Invoice trigger',
    detail: 'J-1050 passed service date and entered the monthly vendor statement queue.',
    time: 'Today 9:18 AM',
  },
  {
    id: 'A-3',
    action: 'Mobile catalog',
    detail: 'Move-out touch-up painting remains hidden from the resident app.',
    time: 'Yesterday 4:06 PM',
  },
];

const initialMobileSync: MobileSync = {
  connectionStatus: 'Checking live app bridge',
  lastCheckedAt: 'Checking now',
  lastPushAt: 'No mobile app push yet',
  lastPushSummary: 'Autosaved control-center changes wait here until an administrator pushes them to the mobile app.',
  pendingChanges: 0,
  revision: 0,
};

function dollars(value: number) {
  return value.toLocaleString('en-US', {
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    style: 'currency',
  });
}

function plumePointValue(points: number, settings: RewardSettings) {
  return Math.abs(points) * (settings.pointValueCents / 100);
}

function percent(value: number) {
  return `${value.toFixed(0)}%`;
}

function localDateTime(value = new Date()) {
  return value.toLocaleString('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function readFilePayload(file: File) {
  return new Promise<Record<string, string | number>>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      resolve({
        fileData: String(reader.result ?? ''),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
      });
    });
    reader.addEventListener('error', () => reject(reader.error ?? new Error('File could not be read')));
    reader.readAsDataURL(file);
  });
}

export default function ControlCenter({
  authToken,
  onAccessRejected,
  onSignOut,
  viewerEmail,
  viewerName,
}: {
  authToken: string;
  onAccessRejected?: () => void;
  onSignOut?: () => void;
  viewerEmail: string;
  viewerName: string;
}) {
  const [activeModule, setActiveModule] = useState<ModuleId>('command');
  const [focusTarget, setFocusTarget] = useState<{ module: ModuleId; recordId: string } | null>(null);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [rewards, setRewards] = useState<RewardEntry[]>(initialRewards);
  const [rewardSettings, setRewardSettings] = useState<RewardSettings>(initialRewardSettings);
  const [crmAccountSettings, setCrmAccountSettings] = useState<CrmAccountSettings>(initialCrmAccountSettings);
  const [invoices, setInvoices] = useState<InvoiceTrigger[]>(initialInvoices);
  const [communities, setCommunities] = useState<Community[]>(initialCommunities);
  const [audit, setAudit] = useState<AuditEntry[]>(initialAudit);
  const [mobileSync, setMobileSync] = useState<MobileSync>(initialMobileSync);
  const [syncStatus, setSyncStatus] = useState('Checking live app bridge');
  const [mobilePushStatus, setMobilePushStatus] = useState('Push to mobile app');
  const [clock, setClock] = useState(() => Date.now());
  const [showManualJobForm, setShowManualJobForm] = useState(false);
  const [manualJobDraft, setManualJobDraft] = useState<ManualJobDraft>({
    amount: String(initialServices[0]?.plusPrice ?? ''),
    communityId: initialCommunities[0]?.id ?? '',
    email: '',
    homeProfile: '',
    phone: '',
    preferredWindow: '',
    resident: '',
    service: initialServices[0]?.name ?? '',
    serviceDate: '',
    unit: '',
  });

  const applyServerState = (state: Partial<FlairoState>) => {
    if (state.audit) setAudit(state.audit);
    if (state.communities) setCommunities(state.communities);
    if (state.crmAccountSettings) setCrmAccountSettings(state.crmAccountSettings);
    if (state.invoices) setInvoices(state.invoices);
    if (state.jobs) setJobs(state.jobs);
    if (state.mobileSync) setMobileSync(state.mobileSync);
    if (state.rewards) setRewards(state.rewards);
    if (state.rewardSettings) setRewardSettings(state.rewardSettings);
    if (state.services) setServices(state.services);
    if (state.vendors) setVendors(state.vendors);
  };

  const authorizedHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${authToken}`,
    }),
    [authToken],
  );

  useEffect(() => {
    let active = true;

    const loadState = () => {
      fetch('/api/flairo', { headers: authorizedHeaders })
        .then((response) => {
          if (response.status === 401 || response.status === 403) {
            onAccessRejected?.();
          }
          if (!response.ok) throw new Error('FLAIRO data unavailable');
          return response.json() as Promise<FlairoState>;
        })
        .then((state) => {
          if (!active) return;
          applyServerState(state);
          setSyncStatus(state.mobileSync?.connectionStatus ?? 'Live app bridge online');
        })
        .catch(() => {
          if (!active) return;
          setSyncStatus('Live app bridge unavailable');
          setMobileSync((current) => ({
            ...current,
            connectionStatus: 'Live app bridge unavailable',
            lastCheckedAt: localDateTime(),
          }));
        });
    };

    loadState();
    const timer = setInterval(loadState, 15000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [authorizedHeaders, onAccessRejected]);

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), MINUTE_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!focusTarget || activeModule !== focusTarget.module) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-record-id="${focusTarget.recordId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeModule, focusTarget]);

  const selectModule = (module: ModuleId) => {
    setFocusTarget(null);
    setActiveModule(module);
  };

  const openModuleRecord = (module: ModuleId, recordId: string) => {
    setFocusTarget({ module, recordId });
    setActiveModule(module);
  };

  const persistAction = async (action: string, payload: Record<string, string | number | boolean | null>) => {
    setSyncStatus('Autosaving to control center');
    try {
      const response = await fetch('/api/flairo', {
        body: JSON.stringify({ action, payload }),
        headers: { ...authorizedHeaders, 'content-type': 'application/json' },
        method: 'POST',
      });
      if (response.status === 401 || response.status === 403) {
        onAccessRejected?.();
      }
      if (!response.ok) throw new Error('Save failed');
      const state = await response.json() as FlairoState;
      applyServerState(state);
      setSyncStatus(state.mobileSync?.connectionStatus ?? 'Autosaved; mobile push pending');
    } catch {
      setSyncStatus('Autosaved locally; mobile push pending');
      setMobileSync((current) => ({
        ...current,
        connectionStatus: 'Local changes staged for mobile',
        lastCheckedAt: localDateTime(),
        pendingChanges: current.pendingChanges + 1,
      }));
    }
  };

  const metrics = useMemo(() => {
    const openBoard = jobs.filter((job) => job.visibleToVendors).length;
    const controlledTasks = jobs.filter((job) => job.boardStatus !== 'Open').length;
    const compliant = vendors.filter((vendor) => vendor.boardAccess).length;
    const rewardLiability = rewards
      .filter((entry) => entry.status === 'Pending')
      .reduce((sum, entry) => sum + plumePointValue(entry.points, rewardSettings), 0);
    const accountingQueue = buildReconciliationItems(jobs, invoices, communities, vendors).length;

    return [
      { id: 'metric-board-jobs', label: 'Vendor-visible jobs', value: String(openBoard), detail: 'Open resident requests' },
      { id: 'metric-controlled-tasks', label: 'FLAIRO controlled tasks', value: String(controlledTasks), detail: 'Claimed, scheduled, or complete' },
      { id: 'metric-compliant-vendors', label: 'Compliant vendors', value: `${compliant}/${vendors.length}`, detail: 'Board access eligible' },
      { id: 'metric-reward-liability', label: 'Plume Point liability', value: dollars(rewardLiability), detail: 'Pending redemption value' },
      { id: 'metric-invoice-queue', label: 'Reconciliation queue', value: String(accountingQueue), detail: 'Open accounting items remain visible until resolved' },
      { id: 'metric-plus-memberships', label: 'PLUS memberships', value: '182', detail: 'Across active communities' },
    ];
  }, [communities, invoices, jobs, rewardSettings, rewards, vendors]);

  const addAudit = (action: string, detail: string) => {
    setAudit((current) => [
      {
        id: `A-${Date.now()}`,
        action,
        detail,
        time: 'Just now',
      },
      ...current,
    ]);
  };

  const toggleServiceVisibility = (serviceId: string) => {
    setServices((current) =>
      current.map((service) =>
        service.id === serviceId
          ? { ...service, mobileVisible: !service.mobileVisible }
          : service,
      ),
    );
    addAudit('Mobile catalog', 'Employee changed a resident-facing service visibility setting.');
    void persistAction('toggle_service_visibility', { serviceId });
  };

  const markDocumentUploaded = (vendorId: string, document: VendorDocumentType, file?: File | null) => {
    const documentLabels: Record<VendorDocumentType, string> = {
      contract: 'FLAIRO contract',
      insurance: 'Insurance',
      license: 'Business license',
      w9: 'W-9',
    };
    const createdAt = new Date().toISOString();

    setVendors((current) =>
      current.map((vendor) =>
        vendor.id === vendorId
          ? {
              ...vendor,
              [document]: 'Under review',
              documentCounts: {
                ...vendor.documentCounts,
                [document]: (vendor.documentCounts[document] ?? 0) + 1,
              },
              documents: [
                {
                  createdAt,
                  expiresAt: document === 'contract' ? vendor.contractExpiresAt : null,
                  fileName: file?.name ?? `${documentLabels[document]} upload`,
                  fileSize: file?.size ?? 0,
                  fileType: file?.type ?? '',
                  id: `local-${createdAt}-${document}`,
                  reviewedAt: null,
                  reviewedBy: null,
                  status: 'Under review',
                  storageKey: '',
                  type: document,
                },
                ...vendor.documents,
              ],
              stage: `${documentLabels[document]} uploaded for review`,
              status: 'Review needed',
            }
          : vendor,
      ),
    );
    addAudit('Vendor document', `Compliance document uploaded for ${vendorName(vendorId, vendors)}.`);
    void persistVendorDocumentUpload(vendorId, document, file ?? null);
  };

  const persistVendorDocumentUpload = async (vendorId: string, document: VendorDocumentType, file: File | null) => {
    const filePayload = file ? await readFilePayload(file) : {};
    await persistAction('upload_document', { documentType: document, vendorId, ...filePayload });
  };

  const openVendorDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/flairo?documentId=${encodeURIComponent(documentId)}`, {
        headers: authorizedHeaders,
      });
      if (response.status === 401 || response.status === 403) {
        onAccessRejected?.();
      }
      if (!response.ok) throw new Error('Document unavailable');
      const blob = await response.blob();
      const documentUrl = window.URL.createObjectURL(blob);
      window.open(documentUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(documentUrl), 60000);
    } catch {
      setSyncStatus('Document record found, but the uploaded file is not available to open.');
    }
  };

  const reviewVendorDocument = (vendorId: string, document: VendorDocumentType, status: DocumentStatus) => {
    const documentLabels: Record<VendorDocumentType, string> = {
      contract: 'FLAIRO contract',
      insurance: 'Insurance',
      license: 'Business license',
      w9: 'W-9',
    };

    setVendors((current) =>
      current.map((vendor) => {
        if (vendor.id !== vendorId) return vendor;
        const updated = {
          ...vendor,
          [document]: status,
          documents: vendor.documents.map((item) =>
            item.type === document
              ? {
                  ...item,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: 'FLAIRO ADMIN',
                  status,
                }
              : item,
          ),
          stage: `${documentLabels[document]} marked ${status}`,
        };
        const coreDocuments: DocumentStatus[] = [updated.insurance, updated.license, updated.w9, updated.contract];
        return {
          ...updated,
          status: coreDocuments.every((item) => item === 'Verified') ? 'Compliant' : 'Review needed',
        };
      }),
    );
    addAudit('Document review', `${documentLabels[document]} marked ${status} for ${vendorName(vendorId, vendors)}.`);
    void persistAction('review_document', { documentType: document, status, vendorId });
  };

  const saveVendorProfile = (draft: VendorFormDraft) => {
    const name = draft.name.trim();
    const contact = draft.contact.trim();
    const email = draft.email.trim();
    const phone = draft.phone.trim();
    const serviceLocations = splitListInput(draft.serviceLocations);
    const markets = serviceLocations.length ? serviceLocations : ['Market pending'];
    const feePercent = Math.max(0, Number(draft.feePercent) || 0);
    const vendorId = draft.id || vendorIdFromName(name);
    const existingVendor = vendors.find((vendor) => vendor.id === vendorId);
    const contractStatus: DocumentStatus = draft.contractUploadQueued
      ? 'Under review'
      : existingVendor?.contract ?? 'Needs upload';
    const documentCounts = existingVendor?.documentCounts ?? { contract: 0, insurance: 0, license: 0, w9: 0 };

    if (!name || !contact || !email || !phone) return false;

    const savedVendor: Vendor = {
      boardAccess: draft.boardAccess,
      contact,
      contract: contractStatus,
      contractExpiresAt: draft.contractExpiresAt || (existingVendor?.contractExpiresAt ?? null),
      dbaName: draft.dbaName.trim(),
      documentCounts: {
        ...documentCounts,
        contract: draft.contractUploadQueued ? documentCounts.contract + 1 : documentCounts.contract,
      },
      documents: existingVendor?.documents ?? [],
      email,
      feePercent,
      id: vendorId,
      insurance: existingVendor?.insurance ?? 'Needs upload',
      license: existingVendor?.license ?? 'Needs upload',
      markets,
      name,
      phone,
      physicalAddress: draft.physicalAddress.trim(),
      preferred: draft.preferred,
      pricingNotes: draft.pricingNotes.trim(),
      rating: existingVendor?.rating ?? 0,
      serviceLocations,
      services: draft.services,
      stage: existingVendor ? 'Profile updated by FLAIRO Admin' : 'Profile created by FLAIRO Admin',
      status: draft.boardAccess ? 'Compliant' : existingVendor?.status ?? 'Pending onboarding',
      w9: existingVendor?.w9 ?? 'Needs upload',
    };

    setVendors((current) => {
      const exists = current.some((vendor) => vendor.id === vendorId);
      if (exists) return current.map((vendor) => (vendor.id === vendorId ? savedVendor : vendor));
      return [savedVendor, ...current];
    });
    addAudit('Vendor profile', `${savedVendor.name} profile saved and staged for the next mobile app push.`);
    void persistAction('upsert_vendor', {
      boardAccess: savedVendor.boardAccess,
      contractExpiresAt: savedVendor.contractExpiresAt,
      contractUploadQueued: draft.contractUploadQueued,
      dbaName: savedVendor.dbaName,
      email: savedVendor.email,
      feePercent: savedVendor.feePercent,
      marketsJson: JSON.stringify(savedVendor.markets),
      name: savedVendor.name,
      phone: savedVendor.phone,
      physicalAddress: savedVendor.physicalAddress,
      preferred: savedVendor.preferred,
      pricingNotes: savedVendor.pricingNotes,
      serviceLocationsJson: JSON.stringify(savedVendor.serviceLocations),
      servicesJson: JSON.stringify(savedVendor.services),
      contact: savedVendor.contact,
      vendorId,
    });
    return true;
  };

  const approveVendor = (vendorId: string) => {
    setVendors((current) =>
      current.map((vendor) =>
        vendor.id === vendorId
          ? {
              ...vendor,
              insurance: 'Verified',
              license: 'Verified',
              w9: 'Verified',
              status: 'Compliant',
              boardAccess: true,
              stage: 'Board access active',
            }
          : vendor,
      ),
    );
    addAudit('Vendor approved', `${vendorName(vendorId, vendors)} can now claim matching work.`);
    void persistAction('approve_vendor', { vendorId });
  };

  const claimJob = (jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;
    const claimedAt = new Date().toISOString();
    const scheduleDueAt = addHours(claimedAt, 24);
    const match = vendors
      .filter(
        (vendor) =>
          vendor.boardAccess &&
          vendor.markets.includes(job.market) &&
          vendor.services.includes(job.service),
      )
      .sort(sortVendorsForBoard)[0];
    if (!match) {
      addAudit('Claim blocked', `${jobId} has no compliant vendor in the matching market.`);
      return;
    }

    setJobs((current) =>
      current.map((item) =>
        item.id === jobId
          ? {
              ...item,
              vendorId: match.id,
              boardStatus: 'Claimed',
              claimedAt,
              scheduleDueAt,
              visibleToVendors: false,
              residentInfoReleased: true,
              vendorPaymentConfirmed: false,
              residentPaymentConfirmed: false,
              amountPaid: null,
              paymentDate: null,
              receiptNumber: null,
              paymentInquiryStatus: null,
              paymentConsult: 'Resident contact released; vendor to schedule and consult on payment',
            }
          : item,
      ),
    );
    addAudit('Vendor claim', `${match.name} claimed ${jobId}; job removed from vendor board.`);
    void persistAction('claim_job', { jobId });
  };

  const confirmSchedule = (jobId: string) => {
    const scheduledAt = new Date().toISOString();
    setJobs((current) =>
      current.map((job) =>
        job.id === jobId
          ? {
              ...job,
              boardStatus: 'Scheduled',
              scheduledAt,
              vendorConfirmed: true,
              paymentConsult: 'Scheduled; direct vendor payment still needs resident and vendor confirmation',
            }
          : job,
      ),
    );
    addAudit('Schedule confirmed', `${jobId} now has vendor confirmation in the open task portal.`);
    void persistAction('confirm_schedule', { jobId });
  };

  const completeJob = (jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);
    setJobs((current) =>
      current.map((item) =>
        item.id === jobId
          ? {
              ...item,
              boardStatus: 'Completed',
              invoiceStatus: 'Ready',
              vendorPaymentConfirmed: true,
              residentPaymentConfirmed: true,
              amountPaid: item.amount,
              paymentDate: todayInputDate(),
              receiptNumber: item.receiptNumber ?? 'Admin override',
              paymentConsult: 'Admin confirmed job complete and paid; resident survey queued',
            }
          : item,
      ),
    );
    if (job) {
      setRewards((current) => [
        {
          id: `R-${Date.now()}`,
          resident: job.resident,
          communityId: job.communityId,
          source: job.id,
          status: 'Available',
          points: job.points,
          value: plumePointValue(job.points, rewardSettings),
          expirationDate: addMonthsInputDate(todayInputDate(), rewardSettings.expirationMonths),
          plusMember: true,
          alertQueued: false,
          redeemedInExpirationWindow: false,
          note: `${job.service} completion verified`,
        },
        ...current,
      ]);
    }
    addAudit('Job completed', `${jobId} completed, payment confirmed, and resident survey queued.`);
    void persistAction('complete_job', { jobId });
  };

  const triggerInvoice = (jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job || !job.vendorId) {
      addAudit('Invoice blocked', `${jobId} needs a claimed vendor before invoice creation.`);
      return;
    }

    const existingInvoice = invoices.find(
      (invoice) => invoice.jobId === job.id && invoice.status !== 'Hold' && invoice.status !== 'Paid',
    );
    if (existingInvoice) {
      addAudit(
        'Invoice already queued',
        `${existingInvoice.id} is already on ${vendorName(existingInvoice.vendorId, vendors)} monthly statement.`,
      );
      openModuleRecord('accounting', `vendor-month-${existingInvoice.vendorId}`);
      return;
    }

    const invoiceId = `INV-Q-${Date.now().toString().slice(-5)}`;
    setInvoices((current) => [
      {
        id: invoiceId,
        jobId: job.id,
        vendorId: job.vendorId,
        amount: job.flairoFee,
        status: 'Draft queued',
        dueDate: 'Net 7',
        reference: 'Added to vendor monthly statement',
      },
      ...current,
    ]);
    setJobs((current) =>
      current.map((item) =>
        item.id === jobId ? { ...item, invoiceStatus: 'Draft queued' } : item,
      ),
    );
    addAudit('Invoice statement item', `${invoiceId} added ${job.id} to ${vendorName(job.vendorId, vendors)} monthly statement.`);
    openModuleRecord('accounting', `vendor-month-${job.vendorId}`);
    void persistAction('trigger_invoice', { jobId });
  };

  const finalizeVendorInvoice = (vendorId: string, monthKey: string, jobIds: string[], reviewAcknowledged: boolean) => {
    const selectedIds = new Set(jobIds);
    const selectedJobs = jobs.filter((job) => selectedIds.has(job.id) && job.vendorId === vendorId);
    if (!selectedJobs.length) {
      addAudit('Vendor invoice waiting', `${vendorName(vendorId, vendors)} needs at least one selected job before finalizing.`);
      return;
    }

    const activeInvoiceJobIds = new Set(
      invoices
        .filter((invoice) => invoice.status !== 'Hold' && invoice.status !== 'Paid')
        .map((invoice) => invoice.jobId),
    );
    const invoiceNumberPrefix = `INV-M-${monthKey.replace('-', '')}`;
    const selectedJobIds = new Set(selectedJobs.map((job) => job.id));

    setInvoices((current) => {
      const currentActiveJobIds = new Set(
        current
          .filter((invoice) => invoice.status !== 'Hold' && invoice.status !== 'Paid')
          .map((invoice) => invoice.jobId),
      );
      const additions = selectedJobs
        .filter((job) => !currentActiveJobIds.has(job.id))
        .map((job) => ({
          amount: job.flairoFee,
          billingMonth: monthKey,
          dueDate: 'Net 7',
          id: `${invoiceNumberPrefix}-${job.id}`,
          jobId: job.id,
          reference: reviewAcknowledged && !jobRecommendedForReconciliation(job)
            ? 'Included on vendor invoice with admin review acknowledgement'
            : 'Included on vendor invoice',
          status: 'Sent' as InvoiceStatus,
          vendorId,
        }));

      return [
        ...additions,
        ...current.map((invoice) =>
          selectedJobIds.has(invoice.jobId) && invoice.status !== 'Paid' && invoice.status !== 'Hold'
            ? {
                ...invoice,
                billingMonth: monthKey,
                reference: reviewAcknowledged
                  ? 'Included on vendor invoice with admin review acknowledgement'
                  : 'Included on vendor invoice',
                status: 'Sent' as InvoiceStatus,
              }
            : invoice,
        ),
      ];
    });

    setJobs((current) =>
      current.map((job) =>
        selectedJobIds.has(job.id) ? { ...job, invoiceStatus: 'Sent' } : job,
      ),
    );

    const newlyAttached = selectedJobs.filter((job) => !activeInvoiceJobIds.has(job.id)).length;
    const reviewCount = selectedJobs.filter((job) => !jobRecommendedForReconciliation(job)).length;
    addAudit(
      'Vendor invoice finalized',
      `${vendorName(vendorId, vendors)} ${labelMonth(monthKey)} invoice finalized with ${selectedJobs.length} selected job${selectedJobs.length === 1 ? '' : 's'}; ${reviewCount} required review and unselected jobs remain in Reconciliation Queue.`,
    );
    openModuleRecord('accounting', `vendor-month-${vendorId}`);
    void persistAction('finalize_vendor_invoice', {
      jobIdsJson: JSON.stringify(jobIds),
      monthKey,
      reviewAcknowledged,
      vendorId,
    });

    if (!newlyAttached) {
      setSyncStatus('Existing invoice records updated for selected jobs');
    }
  };

  const reactivateJob = (jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job?.vendorId) {
      addAudit('Reactivation blocked', `${jobId} needs a claimed vendor before it can be released.`);
      return;
    }
    const releasedVendor = vendorName(job.vendorId, vendors);

    setJobs((current) =>
      current.map((item) =>
        item.id === jobId
          ? {
              ...item,
              boardStatus: 'Open',
              claimedAt: null,
              scheduleDueAt: null,
              scheduledAt: null,
              vendorId: null,
              visibleToVendors: true,
              residentInfoReleased: false,
              vendorConfirmed: false,
              vendorPaymentConfirmed: false,
              residentPaymentConfirmed: false,
              amountPaid: null,
              paymentDate: null,
              receiptNumber: null,
              paymentInquiryStatus: null,
              paymentConsult: 'Re-activated; matching vendors nudged in the mobile app',
              invoiceStatus: 'Waiting',
            }
          : item,
      ),
    );
    addAudit('Request re-activated', `${jobId} released from ${releasedVendor}; matching vendors should receive a mobile pickup nudge.`);
    setActiveModule('board');
    void persistAction('reactivate_job', { jobId });
  };

  const confirmVendorPayment = (jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;
    setJobs((current) =>
      current.map((item) =>
        item.id === jobId
          ? {
              ...item,
              vendorPaymentConfirmed: true,
              amountPaid: item.amountPaid ?? item.amount,
              paymentDate: item.paymentDate ?? todayInputDate(),
              paymentConsult: item.residentPaymentConfirmed
                ? 'Resident and vendor confirmed direct payment'
                : 'Vendor confirmed direct payment; resident confirmation still open',
            }
          : item,
      ),
    );
    addAudit('Vendor payment confirmed', `${jobId} payment was confirmed from the vendor side.`);
    void persistAction('confirm_vendor_payment', { jobId });
  };

  const confirmResidentPayment = (jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;
    setJobs((current) =>
      current.map((item) =>
        item.id === jobId
          ? {
              ...item,
              residentPaymentConfirmed: true,
              amountPaid: item.amountPaid ?? item.amount,
              paymentDate: item.paymentDate ?? todayInputDate(),
              receiptNumber: item.receiptNumber ?? 'Resident receipt optional',
              paymentConsult: item.vendorPaymentConfirmed
                ? 'Resident and vendor confirmed direct payment'
                : 'Resident confirmed direct payment; vendor confirmation still open',
            }
          : item,
      ),
    );
    addAudit('Resident payment confirmed', `${jobId} payment was confirmed from the resident side.`);
    void persistAction('confirm_resident_payment', { jobId });
  };

  const submitPaymentInquiry = (jobId: string) => {
    setJobs((current) =>
      current.map((job) =>
        job.id === jobId
          ? {
              ...job,
              paymentInquiryStatus: 'Inquiry routed to info@flairo.org',
              paymentConsult: 'Payment discrepancy inquiry routed to FLAIRO Admin',
            }
          : job,
      ),
    );
    addAudit('Payment inquiry', `${jobId} discrepancy inquiry routed to info@flairo.org.`);
    void persistAction('submit_payment_inquiry', { jobId });
  };

  const updateManualJobDraft = (field: keyof ManualJobDraft, value: string) => {
    setManualJobDraft((current) => ({ ...current, [field]: value }));
  };

  const createManualJobOrder = () => {
    const community = communities.find((item) => item.id === manualJobDraft.communityId) ?? communities[0];
    const service = services.find((item) => item.name === manualJobDraft.service) ?? services[0];
    if (!community || !service || !manualJobDraft.resident.trim() || !manualJobDraft.unit.trim()) {
      addAudit('Manual job blocked', 'Resident, community, unit, and service are required before creating a job order.');
      return;
    }

    const nextNumber = jobs.reduce((max, job) => {
      const numericId = Number(job.id.replace(/\D/g, ''));
      return Number.isNaN(numericId) ? max : Math.max(max, numericId);
    }, 1051) + 1;
    const amount = Number(manualJobDraft.amount) || service.plusPrice;
    const jobId = `J-${nextNumber}`;
    const newJob: Job = {
      amount,
      amountPaid: null,
      boardStatus: 'Open',
      claimedAt: null,
      communityId: community.id,
      email: manualJobDraft.email.trim() || 'resident-email-needed@flairo.org',
      flairoFee: amount * 0.1,
      homeProfile: manualJobDraft.homeProfile.trim() || 'Profile pending',
      id: jobId,
      invoiceStatus: 'Waiting',
      market: community.market,
      paymentConsult: 'Manual resident request created by FLAIRO Admin',
      paymentDate: null,
      paymentInquiryStatus: null,
      phone: manualJobDraft.phone.trim() || 'Phone needed',
      points: Math.round(amount * 1.5),
      preferredWindow: manualJobDraft.preferredWindow.trim() || 'Resident follow-up needed',
      receiptNumber: null,
      requestedAt: new Date().toISOString(),
      resident: manualJobDraft.resident.trim(),
      residentInfoReleased: false,
      residentPaymentConfirmed: false,
      scheduleDueAt: null,
      scheduledAt: null,
      service: service.name,
      serviceDate: manualJobDraft.serviceDate || todayInputDate(),
      unit: manualJobDraft.unit.trim(),
      vendorConfirmed: false,
      vendorId: null,
      vendorPaymentConfirmed: false,
      visibleToVendors: true,
    };

    setJobs((current) => [newJob, ...current]);
    setManualJobDraft({
      amount: String(service.plusPrice),
      communityId: community.id,
      email: '',
      homeProfile: '',
      phone: '',
      preferredWindow: '',
      resident: '',
      service: service.name,
      serviceDate: '',
      unit: '',
    });
    setShowManualJobForm(false);
    setActiveModule('board');
    addAudit('Manual job order', `${jobId} created by FLAIRO Admin and released to the vendor board.`);
    void persistAction('create_manual_job', {
      amount: String(amount),
      communityId: community.id,
      email: newJob.email,
      homeProfile: newJob.homeProfile,
      jobId,
      phone: newJob.phone,
      preferredWindow: newJob.preferredWindow,
      resident: newJob.resident,
      service: service.name,
      serviceDate: newJob.serviceDate,
      unit: newJob.unit,
    });
  };

  const saveRewardSettings = (settings: RewardSettings) => {
    setRewardSettings(settings);
    addAudit('Plume Point rules', 'Reward program controls saved and staged for the next mobile app push.');
    void persistAction('update_reward_settings', {
      activationRatePercent: settings.activationRatePercent,
      active30DayRatePercent: settings.active30DayRatePercent,
      adoptionIndexPreviousMonth: settings.adoptionIndexPreviousMonth,
      avgCxRating: settings.avgCxRating,
      expirationMonths: settings.expirationMonths,
      expirationReminderDays: settings.expirationReminderDays,
      firstServiceConversionPercent: settings.firstServiceConversionPercent,
      minimumGoldBalance: settings.minimumGoldBalance,
      plusMembershipMonthly: settings.plusMembershipMonthly,
      plusOnlyAccrual: settings.plusOnlyAccrual,
      pointValueCents: settings.pointValueCents,
      redemptionCapPercent: settings.redemptionCapPercent,
      registrationGrowthPercent: settings.registrationGrowthPercent,
      repeatUseRatePercent: settings.repeatUseRatePercent,
      surveyResponseRatePercent: settings.surveyResponseRatePercent,
    });
  };

  const createPartnershipProfile = (draft: PartnershipProfileDraft) => {
    const name = draft.name.trim();
    const market = draft.market.trim();
    const address = draft.address.trim();
    const manager = draft.manager.trim();
    if (!name || !market || !address || !manager) {
      addAudit('Partnership profile waiting', 'Partnership name, market, address, and account owner are required.');
      return false;
    }

    const baseId = profileIdFromName(name);
    const profileId = communities.some((community) => community.id === baseId)
      ? `${baseId}-${Date.now().toString().slice(-4)}`
      : baseId;
    const homes = Math.max(0, Math.round(Number(draft.homes) || 0));
    const occupied = Math.max(0, Math.round(Number(draft.occupied) || homes));
    const plusMembers = Math.max(0, Math.round(Number(draft.plusMembers) || 0));
    const servicePenetration = Math.max(0, Math.min(100, Number(draft.servicePenetration) || 0));
    const netIncome = Math.max(0, Number(draft.netIncome) || 0);
    const profile: Community = {
      address,
      homes,
      id: profileId,
      manager,
      market,
      name,
      netIncome,
      occupied,
      plusMembers,
      servicePenetration,
      statementStatus: 'Draft',
    };

    setCommunities((current) => [profile, ...current]);
    addAudit('Partnership profile', `${name} added to FLAIRO CRM setup with statement defaults in Draft.`);
    void persistAction('create_partnership_profile', {
      address,
      homes,
      manager,
      market,
      name,
      netIncome,
      occupied,
      plusMembers,
      profileId,
      servicePenetration,
    });
    return true;
  };

  const saveCrmAccountSettings = (settings: CrmAccountSettings) => {
    setCrmAccountSettings(settings);
    addAudit('CRM account settings', 'Platform account defaults saved for partnerships, billing, onboarding, and mobile catalog control.');
    void persistAction('update_crm_account_settings', {
      accountMode: settings.accountMode,
      accountingEmail: settings.accountingEmail,
      billingContact: settings.billingContact,
      defaultPaymentTerms: settings.defaultPaymentTerms,
      documentRequirements: settings.documentRequirements,
      mobileCatalogOwner: settings.mobileCatalogOwner,
      statementApprover: settings.statementApprover,
      supportRouting: settings.supportRouting,
      vendorOnboardingOwner: settings.vendorOnboardingOwner,
    });
  };

  const updatePartnershipProfile = (profileId: string, draft: PartnershipProfileDraft) => {
    const name = draft.name.trim();
    const market = draft.market.trim();
    const address = draft.address.trim();
    const manager = draft.manager.trim();
    if (!profileId || !name || !market || !address || !manager) {
      addAudit('Partnership profile waiting', 'Partnership name, market, address, and account owner are required.');
      return false;
    }

    const homes = Math.max(0, Math.round(Number(draft.homes) || 0));
    const occupied = Math.max(0, Math.round(Number(draft.occupied) || homes));
    const plusMembers = Math.max(0, Math.round(Number(draft.plusMembers) || 0));
    const servicePenetration = Math.max(0, Math.min(100, Number(draft.servicePenetration) || 0));
    const netIncome = Math.max(0, Number(draft.netIncome) || 0);

    setCommunities((current) =>
      current.map((community) =>
        community.id === profileId
          ? {
              ...community,
              address,
              homes,
              manager,
              market,
              name,
              netIncome,
              occupied,
              plusMembers,
              servicePenetration,
            }
          : community,
      ),
    );
    addAudit('Partnership profile', `${name} updated in FLAIRO CRM setup.`);
    void persistAction('update_partnership_profile', {
      address,
      homes,
      manager,
      market,
      name,
      netIncome,
      occupied,
      plusMembers,
      profileId,
      servicePenetration,
    });
    return true;
  };

  const deletePartnershipProfile = (profileId: string) => {
    const profile = communities.find((community) => community.id === profileId);
    if (!profile) return;
    setCommunities((current) => current.filter((community) => community.id !== profileId));
    addAudit('Partnership profile deleted', `${profile.name} removed from FLAIRO CRM setup.`);
    void persistAction('delete_partnership_profile', {
      name: profile.name,
      profileId,
    });
  };

  const adminAdjustPlumePoints = (draft: RewardAdjustmentDraft) => {
    const points = Math.round(Number(draft.points));
    if (!draft.resident.trim() || !points || !draft.communityId) {
      addAudit('Plume Point adjustment blocked', 'Resident, community, and Plume Point amount are required.');
      return;
    }

    const storedPoints = draft.status === 'Available' ? Math.abs(points) : -Math.abs(points);
    const entry: RewardEntry = {
      alertQueued: false,
      communityId: draft.communityId,
      expirationDate: draft.expirationDate || addMonthsInputDate(todayInputDate(), rewardSettings.expirationMonths),
      id: `R-${Date.now()}`,
      note: draft.note.trim() || `${draft.status} by FLAIRO ADMIN`,
      plusMember: true,
      points: storedPoints,
      redeemedInExpirationWindow: false,
      resident: draft.resident.trim(),
      source: 'Admin',
      status: draft.status,
      value: storedPoints < 0 ? -plumePointValue(storedPoints, rewardSettings) : plumePointValue(storedPoints, rewardSettings),
    };

    setRewards((current) => [entry, ...current]);
    addAudit('Plume Point adjustment', `${entry.resident} ledger updated by ${storedPoints.toLocaleString()} Plume Points.`);
    void persistAction('admin_adjust_plume_points', {
      communityId: entry.communityId,
      expirationDate: entry.expirationDate,
      note: entry.note,
      points: entry.points,
      resident: entry.resident,
      status: entry.status,
    });
  };

  const runExpirationBatch = () => {
    const reminderDays = rewardSettings.expirationReminderDays;
    const today = new Date(`${todayInputDate()}T00:00:00`).getTime();
    let alertCount = 0;
    let expiredCount = 0;

    const updatedRewards = rewards.map((entry) => {
      if (!entry.expirationDate || (entry.status !== 'Available' && entry.status !== 'Pending')) return entry;
      const expiresAt = new Date(`${entry.expirationDate}T00:00:00`).getTime();
      if (Number.isNaN(expiresAt)) return entry;
      const daysUntilExpiration = Math.ceil((expiresAt - today) / (24 * HOUR_MS));

      if (daysUntilExpiration <= 0) {
        expiredCount += 1;
        return {
          ...entry,
          alertQueued: true,
          status: 'Expired',
          value: -plumePointValue(entry.points, rewardSettings),
        };
      }

      if (daysUntilExpiration <= reminderDays && !entry.alertQueued) {
        alertCount += 1;
        return { ...entry, alertQueued: true };
      }

      return entry;
    });

    setRewards(updatedRewards);

    addAudit(
      'Expiration batch',
      `${alertCount} seven-day Plume Point alerts queued and ${expiredCount} balances moved to expired value for statements.`,
    );
    void persistAction('run_expiration_batch', { reminderDays });
  };

  const markVendorStatementPaid = (vendorId: string, monthKey: string) => {
    const statementInvoices = invoices.filter(
      (invoice) =>
        invoice.vendorId === vendorId &&
        invoice.status !== 'Paid' &&
        invoice.status !== 'Hold' &&
        invoiceStatementMonth(invoice, jobs) === monthKey,
    );
    if (!statementInvoices.length) {
      addAudit('Statement payment waiting', `${vendorName(vendorId, vendors)} has no open unpaid statement for ${labelMonth(monthKey)}.`);
      return;
    }

    const invoiceIds = new Set(statementInvoices.map((invoice) => invoice.id));
    const statementJobIds = new Set(statementInvoices.map((invoice) => invoice.jobId));
    setInvoices((current) =>
      current.map((invoice) =>
        invoiceIds.has(invoice.id)
          ? { ...invoice, status: 'Paid', reference: 'Manual vendor statement payment recorded' }
          : invoice,
      ),
    );
    setJobs((current) =>
      current.map((job) =>
        statementJobIds.has(job.id) ? { ...job, invoiceStatus: 'Paid' } : job,
      ),
    );
    addAudit('Vendor statement paid', `${vendorName(vendorId, vendors)} ${labelMonth(monthKey)} statement marked paid manually.`);
    void persistAction('mark_vendor_statement_paid', { monthKey, vendorId });
  };

  const finalizePartnershipStatement = (communityId: string, monthKey: string, programIds: string[], reviewAcknowledged: boolean) => {
    if (!programIds.length) {
      addAudit('Partnership statement waiting', `${communityName(communityId, communities)} needs at least one selected program before issuing.`);
      return;
    }
    setCommunities((current) =>
      current.map((community) =>
        community.id === communityId ? { ...community, statementStatus: 'Issued' } : community,
      ),
    );
    const reviewPrograms = partnershipPrograms.filter((program) => programIds.includes(program.id) && program.status !== 'Ready').length;
    addAudit(
      'Partnership statement issued',
      `${communityName(communityId, communities)} ${labelMonth(monthKey)} statement issued with ${programIds.length} selected program${programIds.length === 1 ? '' : 's'}; ${reviewPrograms} required review and excluded items remain in Reconciliation Queue.`,
    );
    void persistAction('finalize_partnership_statement', {
      communityId,
      monthKey,
      programIdsJson: JSON.stringify(programIds),
      reviewAcknowledged,
    });
  };

  const pushMobileUpdate = async () => {
    setMobilePushStatus('Pushing updates');
    setSyncStatus('Pushing staged updates to mobile app');
    try {
      const response = await fetch('/api/flairo', {
        body: JSON.stringify({ action: 'push_mobile_update', payload: {} }),
        headers: { ...authorizedHeaders, 'content-type': 'application/json' },
        method: 'POST',
      });
      if (response.status === 401 || response.status === 403) {
        onAccessRejected?.();
      }
      if (!response.ok) throw new Error('Mobile push failed');
      const state = await response.json() as FlairoState;
      applyServerState(state);
      setSyncStatus(state.mobileSync?.connectionStatus ?? 'Mobile app current');
      setMobilePushStatus('Push to mobile app');
    } catch {
      setSyncStatus('Mobile app push needs retry');
      setMobilePushStatus('Retry mobile push');
      setMobileSync((current) => ({
        ...current,
        connectionStatus: 'Mobile app push needs retry',
        lastCheckedAt: localDateTime(),
      }));
    }
  };

  const pendingMobileCopy = mobileSync.pendingChanges === 1
    ? '1 autosaved change waiting'
    : `${mobileSync.pendingChanges} autosaved changes waiting`;

  return (
    <main className="app-shell">
      <aside className="side-nav" aria-label="FLAIRO employee navigation">
        <div className="brand-block">
          <img src="/flairo-assets/flairo-app-icon-gold.png" alt="" className="brand-mark" />
          <div>
            <p className="brand-name">Flairo</p>
            <p className="brand-subtitle">Employee control</p>
          </div>
        </div>

        <nav className="nav-list">
          {navSections.map((section) => (
            <button
              aria-pressed={activeModule === section.id}
              className={`nav-link ${activeModule === section.id ? 'active' : ''}`}
              key={section.id}
              onClick={() => selectModule(section.id)}
              type="button"
            >
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <div className="side-card">
          <p className="eyebrow">Operating rule</p>
          <p>
            A vendor sees only open jobs in approved markets. After claim, the job leaves the board and stays in FLAIRO task control.
          </p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Resident Benefit Program Operations</p>
            <h1>{moduleTitle(activeModule)}</h1>
          </div>
          <div className="topbar-actions">
            <div className="sync-panel live-panel">
              <span>Live app connection</span>
              <strong>{syncStatus}</strong>
              <em>Checked {mobileSync.lastCheckedAt}</em>
            </div>
            <div className="sync-panel mobile-push-panel">
              <span>Last mobile update</span>
              <strong>{mobileSync.lastPushAt}</strong>
              <em>{pendingMobileCopy}</em>
            </div>
            <button className="mobile-push-button" onClick={pushMobileUpdate} type="button">
              {mobilePushStatus}
            </button>
            <div className="user-panel">
              <span>{viewerName}</span>
              <strong>{viewerEmail}</strong>
              {onSignOut && (
                <button className="sign-out-button" onClick={onSignOut} type="button">
                  Sign out
                </button>
              )}
            </div>
          </div>
        </header>

        {activeModule === 'command' && (
          <CommandModule
            communities={communities}
            invoices={invoices}
            jobs={jobs}
            clock={clock}
            metrics={metrics}
            onOpenRecord={openModuleRecord}
            rewards={rewards}
            vendors={vendors}
          />
        )}

        {activeModule === 'mobile' && (
          <MobileControlsModule
            communities={communities}
            services={services}
            toggleServiceVisibility={toggleServiceVisibility}
          />
        )}

        {activeModule === 'vendors' && (
          <VendorsModule
            approveVendor={approveVendor}
            highlightRecordId={activeModule === 'vendors' ? focusTarget?.recordId : null}
            jobs={jobs}
            markDocumentUploaded={markDocumentUploaded}
            openVendorDocument={openVendorDocument}
            reviewVendorDocument={reviewVendorDocument}
            saveVendorProfile={saveVendorProfile}
            services={services}
            vendors={vendors}
          />
        )}

        {activeModule === 'board' && (
          <JobBoardModule
            claimJob={claimJob}
            communities={communities}
            clock={clock}
            highlightRecordId={activeModule === 'board' ? focusTarget?.recordId : null}
            jobs={jobs}
            vendors={vendors}
          />
        )}

        {activeModule === 'tasks' && (
          <OpenTasksModule
            communities={communities}
            completeJob={completeJob}
            confirmResidentPayment={confirmResidentPayment}
            confirmSchedule={confirmSchedule}
            confirmVendorPayment={confirmVendorPayment}
            createManualJobOrder={createManualJobOrder}
            clock={clock}
            highlightRecordId={activeModule === 'tasks' ? focusTarget?.recordId : null}
            jobs={jobs}
            manualJobDraft={manualJobDraft}
            reactivateJob={reactivateJob}
            services={services}
            setShowManualJobForm={setShowManualJobForm}
            showManualJobForm={showManualJobForm}
            submitPaymentInquiry={submitPaymentInquiry}
            triggerInvoice={triggerInvoice}
            updateManualJobDraft={updateManualJobDraft}
            vendors={vendors}
          />
        )}

        {activeModule === 'rewards' && (
          <RewardsModule
            adminAdjustPlumePoints={adminAdjustPlumePoints}
            communities={communities}
            rewardSettings={rewardSettings}
            rewards={rewards}
            highlightRecordId={activeModule === 'rewards' ? focusTarget?.recordId : null}
            runExpirationBatch={runExpirationBatch}
            saveRewardSettings={saveRewardSettings}
          />
        )}

        {activeModule === 'accounting' && (
          <AccountingModule
            communities={communities}
            finalizePartnershipStatement={finalizePartnershipStatement}
            finalizeVendorInvoice={finalizeVendorInvoice}
            invoices={invoices}
            jobs={jobs}
            highlightRecordId={activeModule === 'accounting' ? focusTarget?.recordId : null}
            markVendorStatementPaid={markVendorStatementPaid}
            rewards={rewards}
            vendors={vendors}
          />
        )}

        {activeModule === 'reports' && (
          <ReportsModule
            communities={communities}
            jobs={jobs}
            rewards={rewards}
            vendors={vendors}
          />
        )}

        {activeModule === 'settings' && (
          <SettingsModule
            audit={audit}
            communities={communities}
            createPartnershipProfile={createPartnershipProfile}
            crmAccountSettings={crmAccountSettings}
            deletePartnershipProfile={deletePartnershipProfile}
            saveCrmAccountSettings={saveCrmAccountSettings}
            services={services}
            updatePartnershipProfile={updatePartnershipProfile}
            vendors={vendors}
          />
        )}
      </section>
    </main>
  );
}

function CommandModule({
  clock,
  communities,
  invoices,
  jobs,
  metrics,
  onOpenRecord,
  rewards,
  vendors,
}: {
  clock: number;
  communities: Community[];
  invoices: InvoiceTrigger[];
  jobs: Job[];
  metrics: Metric[];
  onOpenRecord: (module: ModuleId, recordId: string) => void;
  rewards: RewardEntry[];
  vendors: Vendor[];
}) {
  const [activeDrilldown, setActiveDrilldown] = useState('priority-compliance');
  const reviewVendors = vendors.filter((vendor) => vendor.status !== 'Compliant');
  const boardJobs = jobs.filter((job) => job.visibleToVendors);
  const controlledJobs = jobs.filter((job) => job.boardStatus !== 'Open');
  const readyStatements = communities.filter((community) => community.statementStatus === 'Ready');
  const invoiceQueue = invoices.filter((invoice) => invoice.status === 'Ready' || invoice.status === 'Draft queued');
  const queuedInvoiceJobIds = new Set(invoiceQueue.map((invoice) => invoice.jobId));
  const reconciliationItems = buildReconciliationItems(jobs, invoices, communities, vendors);
  const readyInvoiceJobs = jobs.filter(
    (job) =>
      job.vendorId &&
      job.invoiceStatus !== 'Sent' &&
      job.invoiceStatus !== 'Paid' &&
      jobRecommendedForReconciliation(job) &&
      !queuedInvoiceJobIds.has(job.id),
  );
  const activeRewardEntries = rewards.filter((entry) => entry.status === 'Available' || entry.status === 'Pending');
  const priorityComplianceRows: DrilldownRow[] = reviewVendors.map((vendor) => ({
    action: { label: 'Review vendor', module: 'vendors', recordId: `vendor-${vendor.id}` },
    cells: [
      vendor.name,
      vendor.stage,
      `Insurance: ${vendor.insurance}`,
      `License: ${vendor.license}`,
    ],
    id: `vendor-${vendor.id}`,
  }));
  const priorityBoardRows: DrilldownRow[] = boardJobs.map((job) => ({
    action: { label: 'Open job', module: 'board', recordId: `job-${job.id}` },
    cells: [
      job.id,
      job.service,
      `${communityName(job.communityId, communities)} / ${job.market}`,
      `${getJobTimer(job, clock).value} unclaimed / ${job.preferredWindow}`,
    ],
    id: `board-${job.id}`,
  }));
  const priorityStatementRows: DrilldownRow[] = readyStatements.map((community) => ({
    action: { label: 'Open accounting', module: 'accounting', recordId: `statement-${community.id}` },
    cells: [
      community.name,
      community.manager,
      `${community.plusMembers} PLUS members`,
      dollars(community.netIncome),
    ],
    id: `statement-${community.id}`,
  }));
  const priorityInvoiceRows: DrilldownRow[] = [
    ...readyInvoiceJobs.map((job) => ({
      action: { label: 'Review', module: 'accounting' as ModuleId, recordId: `vendor-month-${job.vendorId}` },
      cells: [
        job.id,
        job.vendorId ? vendorName(job.vendorId, vendors) : 'Vendor needed',
        'Recommended: completed + paid',
        dollars(job.flairoFee),
      ],
      id: `invoice-ready-${job.id}`,
    })),
    ...invoiceQueue.map((invoice) => ({
      action: { label: 'Open invoice', module: 'accounting' as ModuleId, recordId: `vendor-month-${invoice.vendorId}` },
      cells: [
        invoice.id,
        vendorName(invoice.vendorId, vendors),
        invoice.status,
        dollars(invoice.amount),
      ],
      id: `invoice-${invoice.id}`,
    })),
  ];

  const priorityDrilldowns: Drilldown[] = [
    {
      id: 'priority-compliance',
      label: 'Compliance review',
      count: String(priorityComplianceRows.length),
      detail: 'Vendors that need a document upload, review, or board-access decision today.',
      rows: priorityComplianceRows,
    },
    {
      id: 'priority-board',
      label: 'Vendor job board',
      count: String(priorityBoardRows.length),
      detail: 'Resident requests still visible for compliant vendors to claim by market and service.',
      rows: priorityBoardRows,
    },
    {
      id: 'priority-statements',
      label: 'Partner statements',
      count: String(priorityStatementRows.length),
      detail: 'Partnership income statements ready for Accounting review.',
      rows: priorityStatementRows,
    },
    {
      id: 'priority-invoices',
      label: 'Vendor billing',
      count: String(priorityInvoiceRows.length),
      detail: 'Recommended jobs and invoice records waiting for vendor billing review.',
      rows: priorityInvoiceRows,
    },
  ];

  const metricDrilldowns: Drilldown[] = [
    {
      id: 'metric-board-jobs',
      label: 'Vendor-visible jobs',
      count: String(boardJobs.length),
      detail: 'The open requests still available to the vendor pool.',
      rows: boardJobs.map((job) => ({
        action: { label: 'Open job', module: 'board', recordId: `job-${job.id}` },
        cells: [
          job.id,
          job.service,
          communityName(job.communityId, communities),
          `${job.market} / ${job.preferredWindow}`,
        ],
        id: `metric-board-${job.id}`,
      })),
    },
    {
      id: 'metric-controlled-tasks',
      label: 'FLAIRO controlled tasks',
      count: String(controlledJobs.length),
      detail: 'Claimed, scheduled, and completed work that employees can still manage.',
      rows: controlledJobs.map((job) => ({
        action: { label: 'Open task', module: 'tasks', recordId: `task-${job.id}` },
        cells: [
          job.id,
          job.boardStatus,
          job.vendorId ? vendorName(job.vendorId, vendors) : 'Unclaimed',
          `${getJobTimer(job, clock).label}: ${getJobTimer(job, clock).value}`,
        ],
        id: `metric-task-${job.id}`,
      })),
    },
    {
      id: 'metric-compliant-vendors',
      label: 'Compliant vendors',
      count: `${vendors.filter((vendor) => vendor.boardAccess).length}/${vendors.length}`,
      detail: 'Vendors allowed to claim work after compliance approval.',
      rows: vendors.map((vendor) => ({
        action: { label: 'Open vendor', module: 'vendors', recordId: `vendor-${vendor.id}` },
        cells: [
          vendor.name,
          vendor.status,
          vendor.boardAccess ? 'Board access on' : 'Board access off',
          vendor.markets.join(', '),
        ],
        id: `metric-vendor-${vendor.id}`,
      })),
    },
    {
      id: 'metric-reward-liability',
      label: 'Plume Point liability',
      count: dollars(activeRewardEntries.reduce((sum, entry) => sum + entry.value, 0)),
      detail: 'Pending and available resident Plume Points that still carry value.',
      rows: activeRewardEntries.map((entry) => ({
        action: { label: 'Open ledger', module: 'rewards', recordId: `reward-${entry.id}` },
        cells: [
          entry.resident,
          entry.status,
          `${entry.points.toLocaleString()} Plume Points`,
          dollars(entry.value),
        ],
        id: `metric-reward-${entry.id}`,
      })),
    },
    {
      id: 'metric-invoice-queue',
      label: 'Reconciliation queue',
      count: String(reconciliationItems.length),
      detail: 'Vendor fee records waiting for Accounting review or payment matching.',
      rows: reconciliationItems.map((item) => ({
        action: { label: 'Open queue', module: 'accounting', recordId: item.id },
        cells: [
          item.item,
          item.type,
          item.reconciliationStatus,
          item.suggestedAction,
        ],
        id: item.id,
      })),
    },
    {
      id: 'metric-plus-memberships',
      label: 'PLUS memberships',
      count: String(communities.reduce((sum, community) => sum + community.plusMembers, 0)),
      detail: 'Paid recurring FLAIRO PLUS memberships by community.',
      rows: communities.map((community) => ({
        action: { label: 'Open reporting', module: 'reports', recordId: `report-${community.id}` },
        cells: [
          community.name,
          `${community.plusMembers} PLUS members`,
          `${community.occupied} occupied homes`,
          `${percent(community.servicePenetration)} penetration`,
        ],
        id: `metric-community-${community.id}`,
      })),
    },
  ];

  const drilldowns = [...priorityDrilldowns, ...metricDrilldowns];
  const selectedDrilldown = drilldowns.find((item) => item.id === activeDrilldown) ?? priorityDrilldowns[0];

  return (
    <>
      <section className="hero-grid" id="command">
        <div className="command-panel attention-panel">
          <div className="section-heading tight">
            <div>
              <p className="eyebrow gold">Needs attention today</p>
              <h2>{selectedDrilldown.label}</h2>
            </div>
            <strong className="drilldown-count">{selectedDrilldown.count}</strong>
          </div>
          <p className="drilldown-summary">{selectedDrilldown.detail}</p>
          <div className="drilldown-list">
            {selectedDrilldown.rows.length ? selectedDrilldown.rows.slice(0, 6).map((row) => (
              <div className="drilldown-row" key={row.id}>
                {row.cells.map((cell, index) => (
                  <span key={`${row.id}-${index}`}>{cell}</span>
                ))}
                <button
                  className="row-action-button"
                  onClick={() => onOpenRecord(row.action.module, row.action.recordId)}
                  type="button"
                >
                  {row.action.label}
                </button>
              </div>
            )) : (
              <div className="drilldown-empty">Nothing needs attention in this queue.</div>
            )}
          </div>
        </div>

        <div className="queue-panel">
          <p className="eyebrow">Priority queues</p>
          {priorityDrilldowns.map((item) => (
            <QueueRow
              active={activeDrilldown === item.id}
              count={Number(item.count.replace(/[^0-9]/g, '')) || item.rows.length}
              detail={item.detail}
              key={item.id}
              label={item.label}
              onSelect={() => setActiveDrilldown(item.id)}
              tone={item.id === 'priority-board' ? 'live' : item.id === 'priority-statements' ? 'finance' : item.id === 'priority-invoices' ? 'active' : 'review'}
            />
          ))}
        </div>
      </section>

      <MetricGrid
        activeMetricId={activeDrilldown}
        metrics={metrics}
        onSelectMetric={(metricId) => setActiveDrilldown(metricId)}
      />

      <VendorMonthCloseoutPanel
        jobs={jobs}
        onOpenInvoices={() => onOpenRecord('accounting', 'vendor-month-panel')}
        vendors={vendors}
      />
    </>
  );
}

function MobileControlsModule({
  communities,
  services,
  toggleServiceVisibility,
}: {
  communities: Community[];
  services: Service[];
  toggleServiceVisibility: (serviceId: string) => void;
}) {
  return (
    <>
      <section className="section-band">
        <div>
          <p className="eyebrow">Resident app control layer</p>
          <h2>Manage booking options without altering the mobile app build.</h2>
        </div>
        <div className="integration-strip">
          <StatusPill label="Catalog sync" status="Configured" />
          <StatusPill label="PLUS pricing" status="Active" />
          <StatusPill label="Plume Point rules" status="Tracked" />
        </div>
      </section>

      <section className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Service catalog</p>
            <h2>Resident-facing services and rules</h2>
          </div>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service.id}>
              <div>
                <span className={service.mobileVisible ? 'status good' : 'status hold'}>
                  {service.mobileVisible ? 'Visible in app' : 'Hidden from app'}
                </span>
                <h3>{service.name}</h3>
                <p>{service.category}</p>
              </div>
              <div className="price-pair">
                <span>Standard {dollars(service.standardPrice)}</span>
                <span>PLUS {dollars(service.plusPrice)}</span>
              </div>
              <p className="muted">{service.pointsRule}</p>
              <p className="muted">{service.vendorPoolRule}</p>
              <button type="button" onClick={() => toggleServiceVisibility(service.id)}>
                {service.mobileVisible ? 'Hide from app' : 'Publish to app'}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Locations</p>
            <h2>Community app availability</h2>
          </div>
        </div>
        <div className="compact-table">
          <div className="compact-row header">
            <span>Community</span>
            <span>PLUS</span>
            <span>Penetration</span>
            <span>Net income</span>
          </div>
          {communities.map((community) => (
            <div className="compact-row" key={community.id}>
              <span>{community.name}</span>
              <span>{community.plusMembers} members</span>
              <span>{percent(community.servicePenetration)}</span>
              <span>{dollars(community.netIncome)}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function VendorsModule({
  approveVendor,
  highlightRecordId,
  jobs,
  markDocumentUploaded,
  openVendorDocument,
  reviewVendorDocument,
  saveVendorProfile,
  services,
  vendors,
}: {
  approveVendor: (vendorId: string) => void;
  highlightRecordId?: string | null;
  jobs: Job[];
  markDocumentUploaded: (vendorId: string, document: VendorDocumentType, file?: File | null) => void;
  openVendorDocument: (documentId: string) => Promise<void>;
  reviewVendorDocument: (vendorId: string, document: VendorDocumentType, status: DocumentStatus) => void;
  saveVendorProfile: (draft: VendorFormDraft) => boolean;
  services: Service[];
  vendors: Vendor[];
}) {
  const [vendorDialog, setVendorDialog] = useState<{ mode: 'add' | 'edit'; draft: VendorFormDraft } | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<VendorFormDraft | null>(null);
  const [activeVendorMetric, setActiveVendorMetric] = useState<VendorMetricFilter>('vendor-active');

  const updateVendorDraft = <K extends keyof VendorFormDraft>(field: K, value: VendorFormDraft[K]) => {
    setVendorDialog((current) =>
      current
        ? {
            ...current,
            draft: {
              ...current.draft,
              [field]: value,
            },
          }
        : current,
    );
  };

  const toggleDraftService = (serviceName: string) => {
    setVendorDialog((current) => {
      if (!current) return current;
      const servicesForVendor = current.draft.services.includes(serviceName)
        ? current.draft.services.filter((service) => service !== serviceName)
        : [...current.draft.services, serviceName];
      return {
        ...current,
        draft: {
          ...current.draft,
          services: servicesForVendor,
        },
      };
    });
  };

  const updateProfileDraft = <K extends keyof VendorFormDraft>(field: K, value: VendorFormDraft[K]) => {
    setProfileDraft((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  };

  const toggleProfileService = (serviceName: string) => {
    setProfileDraft((current) => {
      if (!current) return current;
      const servicesForVendor = current.services.includes(serviceName)
        ? current.services.filter((service) => service !== serviceName)
        : [...current.services, serviceName];
      return {
        ...current,
        services: servicesForVendor,
      };
    });
  };

  const openVendorProfile = (vendor: Vendor) => {
    setSelectedVendorId(vendor.id);
    setProfileDraft(vendorToDraft(vendor));
  };

  const submitVendorProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (vendorDialog && saveVendorProfile(vendorDialog.draft)) setVendorDialog(null);
  };

  const submitProfilePage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (profileDraft && saveVendorProfile(profileDraft)) {
      setProfileDraft({
        ...profileDraft,
        contractUploadQueued: false,
      });
    }
  };

  const averageVendorRating = averageRating(vendors);
  const expiringVendors = vendors.filter(vendorHasExpiringUpdate);
  const vendorMetrics: Metric[] = [
    {
      detail: 'Can claim work now',
      id: 'vendor-active',
      label: 'Active vendor pool',
      value: String(vendors.filter((vendor) => vendor.boardAccess).length),
    },
    {
      detail: 'Needs document or approval',
      id: 'vendor-review',
      label: 'Compliance review',
      value: String(vendors.filter((vendor) => vendor.status !== 'Compliant').length),
    },
    {
      detail: 'All vendors blended satisfaction',
      id: 'vendor-rating',
      label: 'Avg. vendor rating',
      value: averageVendorRating.toFixed(1),
    },
    {
      detail: 'Contracts or insurance in next 60 days',
      id: 'vendor-expiring',
      label: 'Vendor updates due',
      value: String(expiringVendors.length),
    },
  ];

  const filteredVendors = vendors
    .filter((vendor) => {
      if (activeVendorMetric === 'vendor-active') return vendor.boardAccess;
      if (activeVendorMetric === 'vendor-review') return vendor.status !== 'Compliant';
      if (activeVendorMetric === 'vendor-expiring') return vendorHasExpiringUpdate(vendor);
      return true;
    })
    .sort((a, b) => {
      if (activeVendorMetric === 'vendor-rating') return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });
  const activeVendorMetricLabel = vendorMetrics.find((metric) => metric.id === activeVendorMetric)?.label ?? 'Vendors';
  const selectedVendor = selectedVendorId ? vendors.find((vendor) => vendor.id === selectedVendorId) ?? null : null;

  if (selectedVendor && profileDraft) {
    return (
      <VendorProfilePage
        draft={profileDraft}
        jobs={jobs}
        markDocumentUploaded={markDocumentUploaded}
        onBack={() => {
          setSelectedVendorId(null);
          setProfileDraft(null);
        }}
        onOpenDocument={openVendorDocument}
        onReviewDocument={reviewVendorDocument}
        onSave={submitProfilePage}
        onToggleService={toggleProfileService}
        onUpdateDraft={updateProfileDraft}
        services={services}
        vendor={selectedVendor}
      />
    );
  }

  return (
    <>
      <MetricGrid
        activeMetricId={activeVendorMetric}
        metrics={vendorMetrics}
        onSelectMetric={(metricId) => setActiveVendorMetric(metricId as VendorMetricFilter)}
      />

      <section className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vendor CRM and compliance</p>
            <h2>Onboarding, documents, and job-board access</h2>
            <p className="section-subtitle">Showing {filteredVendors.length} in {activeVendorMetricLabel}</p>
          </div>
          <div className="section-actions">
            <button type="button" onClick={() => setVendorDialog({ mode: 'add', draft: blankVendorDraft() })}>
              Add vendor
            </button>
            <button className="secondary-action" type="button">Invite vendor</button>
          </div>
        </div>
        <div className="vendor-list">
          {filteredVendors.map((vendor) => (
            <article
              className={`vendor-card${highlightRecordId === `vendor-${vendor.id}` ? ' record-highlight' : ''}`}
              data-record-id={`vendor-${vendor.id}`}
              key={vendor.id}
            >
              <div className="vendor-head">
                <div>
                  <span className={vendor.status === 'Compliant' ? 'status good' : 'status review'}>
                    {vendor.status}
                  </span>
                  <h3 className={`vendor-name ${vendorVisibilityClass(vendor)}`}>{vendor.name}</h3>
                  <p>{vendor.contact} / {vendor.email} / {vendor.phone}</p>
                  {vendor.dbaName && <p className="vendor-subline">DBA {vendor.dbaName}</p>}
                </div>
                <div className="vendor-head-actions">
                  <strong>{vendor.boardAccess ? 'Board access on' : 'No board access'}</strong>
                  <button
                    className="secondary-action"
                    onClick={() => openVendorProfile(vendor)}
                    type="button"
                  >
                    Edit vendor
                  </button>
                </div>
              </div>

              <div className="vendor-meta">
                <span>{vendor.markets.join(', ')}</span>
                <span>{vendor.services.join(', ')}</span>
                <span>FLAIRO fee {vendor.feePercent}%</span>
                <span className="vendor-rating-pill">Vendor rating {vendor.rating.toFixed(1)}</span>
              </div>

              <div className="vendor-profile-grid">
                <div className="vendor-detail">
                  <span>Office address</span>
                  <strong>{vendor.physicalAddress || 'Address needed'}</strong>
                </div>
                <div className="vendor-detail">
                  <span>Service areas</span>
                  <strong>{vendor.serviceLocations.length ? vendor.serviceLocations.join(', ') : 'Same as office market'}</strong>
                </div>
                <div className="vendor-detail">
                  <span>Pricing</span>
                  <strong>{vendor.pricingNotes || 'Vendor discusses pricing directly with resident'}</strong>
                </div>
                <div className="vendor-detail">
                  <span>FLAIRO contract</span>
                  <strong>{vendor.contractExpiresAt ? `Expires ${labelInputDate(vendor.contractExpiresAt)}` : 'Expiration date needed'}</strong>
                </div>
              </div>

              <div className="vendor-document-summary">
                <span>{documentTotal(vendor)} documents saved</span>
                <span>{vendor.documentCounts.contract} contract record{vendor.documentCounts.contract === 1 ? '' : 's'}</span>
              </div>

              <div className="doc-grid">
                <DocumentTile count={vendor.documentCounts.insurance} label="Insurance" status={vendor.insurance} />
                <DocumentTile count={vendor.documentCounts.license} label="Business license" status={vendor.license} />
                <DocumentTile count={vendor.documentCounts.w9} label="W-9" status={vendor.w9} />
                <DocumentTile count={vendor.documentCounts.contract} expiresAt={vendor.contractExpiresAt} label="FLAIRO contract" status={vendor.contract} />
              </div>

              <div className="action-row">
                <label className="file-upload">
                  <input
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(event) => markDocumentUploaded(vendor.id, 'insurance', event.target.files?.[0] ?? null)}
                    type="file"
                  />
                  Upload insurance
                </label>
                <label className="file-upload secondary">
                  <input
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(event) => markDocumentUploaded(vendor.id, 'license', event.target.files?.[0] ?? null)}
                    type="file"
                  />
                  Upload license
                </label>
                <label className="file-upload">
                  <input
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(event) => markDocumentUploaded(vendor.id, 'w9', event.target.files?.[0] ?? null)}
                    type="file"
                  />
                  Upload W-9
                </label>
                <label className="file-upload secondary">
                  <input
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(event) => markDocumentUploaded(vendor.id, 'contract', event.target.files?.[0] ?? null)}
                    type="file"
                  />
                  Upload contract
                </label>
                <button className="gold-action sparkle-action" type="button" onClick={() => approveVendor(vendor.id)}>
                  Flamingo a GO
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {vendorDialog && (
        <div className="modal-backdrop">
          <section
            aria-labelledby="vendor-dialog-title"
            aria-modal="true"
            className="vendor-modal"
            role="dialog"
          >
            <form onSubmit={submitVendorProfile}>
              <div className="modal-head">
                <div>
                  <p className="eyebrow">Vendor profile</p>
                  <h2 id="vendor-dialog-title">{vendorDialog.mode === 'add' ? 'Add vendor' : 'Edit vendor'}</h2>
                </div>
                <button className="secondary-action" onClick={() => setVendorDialog(null)} type="button">
                  Close
                </button>
              </div>

              <div className="form-grid two">
                <label>
                  Vendor name
                  <input
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateVendorDraft('name', event.target.value)}
                    required
                    value={vendorDialog.draft.name}
                  />
                </label>
                <label>
                  DBA name
                  <input
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateVendorDraft('dbaName', event.target.value)}
                    value={vendorDialog.draft.dbaName}
                  />
                </label>
                <label>
                  Point of contact
                  <input
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateVendorDraft('contact', event.target.value)}
                    required
                    value={vendorDialog.draft.contact}
                  />
                </label>
                <label>
                  Email
                  <input
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateVendorDraft('email', event.target.value)}
                    required
                    type="email"
                    value={vendorDialog.draft.email}
                  />
                </label>
                <label>
                  Phone
                  <input
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateVendorDraft('phone', event.target.value)}
                    required
                    value={vendorDialog.draft.phone}
                  />
                </label>
                <label>
                  FLAIRO fee %
                  <input
                    min="0"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateVendorDraft('feePercent', event.target.value)}
                    step="0.25"
                    type="number"
                    value={vendorDialog.draft.feePercent}
                  />
                </label>
              </div>

              <label>
                Physical address
                <textarea
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateVendorDraft('physicalAddress', event.target.value)}
                  rows={2}
                  value={vendorDialog.draft.physicalAddress}
                />
              </label>

              <label>
                Service areas, cities, ZIPs
                <textarea
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateVendorDraft('serviceLocations', event.target.value)}
                  rows={3}
                  value={vendorDialog.draft.serviceLocations}
                />
              </label>

              <fieldset className="service-check-grid">
                <legend>Eligible services</legend>
                {services.map((service) => (
                  <label className="check-control" key={service.id}>
                    <input
                      checked={vendorDialog.draft.services.includes(service.name)}
                      onChange={() => toggleDraftService(service.name)}
                      type="checkbox"
                    />
                    <span>{service.name}</span>
                  </label>
                ))}
              </fieldset>

              <div className="form-grid two">
                <label>
                  Service pricing
                  <textarea
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateVendorDraft('pricingNotes', event.target.value)}
                    rows={3}
                    value={vendorDialog.draft.pricingNotes}
                  />
                </label>
                <label>
                  Contract expiration
                  <input
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateVendorDraft('contractExpiresAt', event.target.value)}
                    type="date"
                    value={vendorDialog.draft.contractExpiresAt}
                  />
                </label>
              </div>

              <div className="vendor-modal-controls">
                <label className="check-control">
                  <input
                    checked={vendorDialog.draft.boardAccess}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateVendorDraft('boardAccess', event.target.checked)}
                    type="checkbox"
                  />
                  <span>Board access</span>
                </label>
                <label className="check-control">
                  <input
                    checked={vendorDialog.draft.preferred}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateVendorDraft('preferred', event.target.checked)}
                    type="checkbox"
                  />
                  <span>Preferred vendor</span>
                </label>
                <label className="file-upload secondary inline-upload">
                  <input
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={() => updateVendorDraft('contractUploadQueued', true)}
                    type="file"
                  />
                  {vendorDialog.draft.contractUploadQueued ? 'Contract selected' : 'Upload contract'}
                </label>
              </div>

              <div className="modal-actions">
                <button className="secondary-action" onClick={() => setVendorDialog(null)} type="button">
                  Cancel
                </button>
                <button type="submit">Save vendor</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

function VendorProfilePage({
  draft,
  jobs,
  markDocumentUploaded,
  onBack,
  onOpenDocument,
  onReviewDocument,
  onSave,
  onToggleService,
  onUpdateDraft,
  services,
  vendor,
}: {
  draft: VendorFormDraft;
  jobs: Job[];
  markDocumentUploaded: (vendorId: string, document: VendorDocumentType, file?: File | null) => void;
  onBack: () => void;
  onOpenDocument: (documentId: string) => Promise<void>;
  onReviewDocument: (vendorId: string, document: VendorDocumentType, status: DocumentStatus) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onToggleService: (serviceName: string) => void;
  onUpdateDraft: <K extends keyof VendorFormDraft>(field: K, value: VendorFormDraft[K]) => void;
  services: Service[];
  vendor: Vendor;
}) {
  const [historySearch, setHistorySearch] = useState('');
  const vendorJobs = useMemo(
    () => jobs.filter((job) => job.vendorId === vendor.id).sort((a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt)),
    [jobs, vendor.id],
  );
  const currentMonth = todayInputDate().slice(0, 7);
  const currentMonthJobs = vendorJobs.filter((job) => job.serviceDate.startsWith(currentMonth));
  const openPaymentJobs = vendorJobs.filter((job) => !job.vendorPaymentConfirmed || !job.residentPaymentConfirmed);
  const readyInvoiceJobs = vendorJobs.filter((job) => job.invoiceStatus === 'Ready' || job.invoiceStatus === 'Draft queued');
  const filteredJobs = vendorJobs.filter((job) => {
    const search = historySearch.trim().toLowerCase();
    if (!search) return true;
    return [
      job.id,
      job.resident,
      job.service,
      job.market,
      job.unit,
      job.boardStatus,
      job.invoiceStatus,
      paymentSummary(job),
    ].join(' ').toLowerCase().includes(search);
  });
  const documentTypes = vendorDocumentOrder;

  return (
    <section className="vendor-profile-page">
      <section className="table-panel vendor-profile-hero">
        <div className="profile-heading">
          <div>
            <p className="eyebrow">Vendor profile</p>
            <h2 className={`vendor-name ${vendorVisibilityClass(vendor)}`}>{vendor.name}</h2>
            <p>{vendor.contact} / {vendor.email} / {vendor.phone}</p>
          </div>
          <div className="section-actions">
            <button className="secondary-action" onClick={onBack} type="button">
              Back to vendors
            </button>
            <button form="vendor-profile-form" type="submit">
              Save profile
            </button>
          </div>
        </div>
        <div className="profile-summary-grid">
          <InfoTile label="Board status" value={vendor.boardAccess ? 'Board access on' : 'No board access'} />
          <InfoTile label="Vendor rating" value={vendor.rating ? vendor.rating.toFixed(1) : 'No rating yet'} />
          <InfoTile label="This month" value={`${currentMonthJobs.length} job${currentMonthJobs.length === 1 ? '' : 's'}`} />
          <InfoTile label="Resident total" value={dollars(currentMonthJobs.reduce((sum, job) => sum + job.amount, 0))} />
          <InfoTile label="FLAIRO payout" value={dollars(currentMonthJobs.reduce((sum, job) => sum + job.flairoFee, 0))} />
          <InfoTile label="Payment checks" value={`${openPaymentJobs.length} open`} />
          <InfoTile label="Invoice queue" value={`${readyInvoiceJobs.length} ready`} />
          <InfoTile label="Documents" value={`${documentTotal(vendor)} saved`} />
        </div>
      </section>

      <form className="table-panel vendor-profile-form" id="vendor-profile-form" onSubmit={onSave}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Profile controls</p>
            <h2>Vendor details and eligibility</h2>
          </div>
        </div>

        <div className="form-grid three">
          <label>
            Vendor name
            <input
              onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateDraft('name', event.target.value)}
              required
              value={draft.name}
            />
          </label>
          <label>
            DBA name
            <input
              onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateDraft('dbaName', event.target.value)}
              value={draft.dbaName}
            />
          </label>
          <label>
            Point of contact
            <input
              onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateDraft('contact', event.target.value)}
              required
              value={draft.contact}
            />
          </label>
          <label>
            Email
            <input
              onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateDraft('email', event.target.value)}
              required
              type="email"
              value={draft.email}
            />
          </label>
          <label>
            Phone
            <input
              onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateDraft('phone', event.target.value)}
              required
              value={draft.phone}
            />
          </label>
          <label>
            FLAIRO fee %
            <input
              min="0"
              onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateDraft('feePercent', event.target.value)}
              step="0.25"
              type="number"
              value={draft.feePercent}
            />
          </label>
        </div>

        <div className="form-grid two">
          <label>
            Physical address
            <textarea
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onUpdateDraft('physicalAddress', event.target.value)}
              rows={3}
              value={draft.physicalAddress}
            />
          </label>
          <label>
            Service areas, cities, ZIPs
            <textarea
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onUpdateDraft('serviceLocations', event.target.value)}
              rows={3}
              value={draft.serviceLocations}
            />
          </label>
        </div>

        <fieldset className="service-check-grid">
          <legend>Eligible services</legend>
          {services.map((service) => (
            <label className="check-control" key={service.id}>
              <input
                checked={draft.services.includes(service.name)}
                onChange={() => onToggleService(service.name)}
                type="checkbox"
              />
              <span>{service.name}</span>
            </label>
          ))}
        </fieldset>

        <div className="form-grid two">
          <label>
            Service pricing
            <textarea
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onUpdateDraft('pricingNotes', event.target.value)}
              rows={3}
              value={draft.pricingNotes}
            />
          </label>
          <label>
            Contract expiration
            <input
              onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateDraft('contractExpiresAt', event.target.value)}
              type="date"
              value={draft.contractExpiresAt}
            />
          </label>
        </div>

        <div className="vendor-modal-controls">
          <label className="check-control">
            <input
              checked={draft.boardAccess}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateDraft('boardAccess', event.target.checked)}
              type="checkbox"
            />
            <span>Board access</span>
          </label>
          <label className="check-control">
            <input
              checked={draft.preferred}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateDraft('preferred', event.target.checked)}
              type="checkbox"
            />
            <span>Preferred vendor</span>
          </label>
          <label className="file-upload secondary inline-upload">
            <input
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(event) => {
                onUpdateDraft('contractUploadQueued', true);
                markDocumentUploaded(vendor.id, 'contract', event.target.files?.[0] ?? null);
              }}
              type="file"
            />
            {draft.contractUploadQueued ? 'Contract selected' : 'Upload contract'}
          </label>
        </div>
      </form>

      <section className="table-panel document-workflow-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Compliance documents</p>
            <h2>Review and approval workflow</h2>
          </div>
        </div>
        <div className="document-workflow-list">
          {documentTypes.map((documentType) => {
            const documents = vendor.documents
              .filter((document) => document.type === documentType)
              .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
            const latestDocument = documents[0];
            const status = vendor[documentType];

            return (
              <article className="document-workflow-card" key={documentType}>
                <div className="document-workflow-head">
                  <div>
                    <h3>{vendorDocumentLabels[documentType]}</h3>
                    <p>{documents.length ? `${documents.length} saved on this vendor profile` : 'No document saved yet'}</p>
                  </div>
                  <strong className={status === 'Verified' ? 'good-text' : 'review-text'}>{status}</strong>
                </div>
                {latestDocument && (
                  <div className="document-latest">
                    <span>Latest upload</span>
                    <strong>{latestDocument.fileName || 'Compliance document'}</strong>
                    <em>
                      {labelDateTimeShort(latestDocument.createdAt)}
                      {latestDocument.fileSize ? ` / ${formatFileSize(latestDocument.fileSize)}` : ''}
                    </em>
                  </div>
                )}
                <div className="document-actions">
                  <label className="file-upload">
                    <input
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(event) => markDocumentUploaded(vendor.id, documentType, event.target.files?.[0] ?? null)}
                      type="file"
                    />
                    Upload new
                  </label>
                  <button
                    className="secondary-action"
                    disabled={!latestDocument || latestDocument.id.startsWith('local-')}
                    onClick={() => latestDocument && void onOpenDocument(latestDocument.id)}
                    type="button"
                  >
                    Open latest
                  </button>
                  <button onClick={() => onReviewDocument(vendor.id, documentType, 'Verified')} type="button">
                    Approve
                  </button>
                  <button className="secondary-action" onClick={() => onReviewDocument(vendor.id, documentType, 'Expiring')} type="button">
                    Mark expiring
                  </button>
                  <button className="danger-action" onClick={() => onReviewDocument(vendor.id, documentType, 'Needs upload')} type="button">
                    Request update
                  </button>
                </div>
                {documents.length > 0 && (
                  <div className="document-archive">
                    {documents.slice(0, 4).map((document) => (
                      <div className="document-archive-row" key={document.id}>
                        <span>{document.fileName || 'Compliance document'}</span>
                        <strong className={document.status === 'Verified' ? 'good-text' : 'review-text'}>{document.status}</strong>
                        <em>{labelDateTimeShort(document.createdAt)}</em>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="table-panel vendor-history-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vendor job history</p>
            <h2>{vendor.name} work ledger</h2>
          </div>
          <label className="compact-search">
            Search
            <input
              onChange={(event: ChangeEvent<HTMLInputElement>) => setHistorySearch(event.target.value)}
              placeholder="Job, resident, service, status"
              value={historySearch}
            />
          </label>
        </div>
        <div className="vendor-history-list">
          {filteredJobs.length === 0 && (
            <p className="table-empty">No job history matches this vendor view yet.</p>
          )}
          {filteredJobs.map((job) => (
            <article className="vendor-history-card" key={job.id}>
              <div>
                <span className={job.boardStatus === 'Completed' ? 'status good' : 'status review'}>{job.boardStatus}</span>
                <h3>{job.id} / {job.service}</h3>
                <p>{job.resident} / {job.market} / Unit {job.unit}</p>
              </div>
              <div className="vendor-history-facts">
                <InfoTile label="Service date" value={job.serviceDate || 'Not scheduled'} />
                <InfoTile label="Resident total" value={dollars(job.amount)} />
                <InfoTile label="FLAIRO payout" value={dollars(job.flairoFee)} />
                <InfoTile label="Payment" value={paymentSummary(job)} />
                <InfoTile label="Invoice" value={job.invoiceStatus} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function JobBoardModule({
  claimJob,
  clock,
  communities,
  highlightRecordId,
  jobs,
  vendors,
}: {
  claimJob: (jobId: string) => void;
  clock: number;
  communities: Community[];
  highlightRecordId?: string | null;
  jobs: Job[];
  vendors: Vendor[];
}) {
  const boardJobs = jobs.filter((job) => job.visibleToVendors);

  return (
    <>
      <section className="section-band">
        <div>
          <p className="eyebrow">Vendor job board</p>
          <h2>Only compliant, location-matched vendors can see and claim these requests.</h2>
        </div>
        <div className="integration-strip">
          <StatusPill label="Claim lock" status="Exclusive" />
          <StatusPill label="Resident contact" status="Hidden until claim" />
          <StatusPill label="FLAIRO task copy" status="Always visible" />
        </div>
      </section>

      <section className="job-grid">
        {boardJobs.map((job) => {
          const timer = getJobTimer(job, clock);
          const matches = vendors.filter(
            (vendor) =>
              vendor.boardAccess &&
              vendor.markets.includes(job.market) &&
              vendor.services.includes(job.service),
          );

          return (
            <article
              className={`job-card${highlightRecordId === `job-${job.id}` ? ' record-highlight' : ''}`}
              data-record-id={`job-${job.id}`}
              key={job.id}
            >
              <div className="job-head">
                <span className="status good">Vendor visible</span>
                <strong>{job.id}</strong>
              </div>
              <h3>{job.service}</h3>
              <p>{communityName(job.communityId, communities)} / Unit {job.unit} / {job.homeProfile}</p>
              <div className="job-facts">
                <span>{job.preferredWindow}</span>
                <span>{dollars(job.amount)}</span>
                <span>{job.points} Plume Points</span>
              </div>
              <JobTimer timer={timer} />
              <div className="matched-vendors">
                <p className="eyebrow">Eligible vendors</p>
                {matches.length ? matches
                  .sort(sortVendorsForBoard)
                  .map((vendor) => <span className={vendorVisibilityClass(vendor)} key={vendor.id}>{vendor.name}</span>) : <span>No compliant match</span>}
              </div>
              <button type="button" onClick={() => claimJob(job.id)}>
                Claim with matched vendor
              </button>
            </article>
          );
        })}
      </section>
    </>
  );
}

function OpenTasksModule({
  clock,
  communities,
  confirmResidentPayment,
  completeJob,
  confirmSchedule,
  confirmVendorPayment,
  createManualJobOrder,
  highlightRecordId,
  jobs,
  manualJobDraft,
  reactivateJob,
  services,
  setShowManualJobForm,
  showManualJobForm,
  submitPaymentInquiry,
  triggerInvoice,
  updateManualJobDraft,
  vendors,
}: {
  clock: number;
  communities: Community[];
  confirmResidentPayment: (jobId: string) => void;
  completeJob: (jobId: string) => void;
  confirmSchedule: (jobId: string) => void;
  confirmVendorPayment: (jobId: string) => void;
  createManualJobOrder: () => void;
  highlightRecordId?: string | null;
  jobs: Job[];
  manualJobDraft: ManualJobDraft;
  reactivateJob: (jobId: string) => void;
  services: Service[];
  setShowManualJobForm: (show: boolean) => void;
  showManualJobForm: boolean;
  submitPaymentInquiry: (jobId: string) => void;
  triggerInvoice: (jobId: string) => void;
  updateManualJobDraft: (field: keyof ManualJobDraft, value: string) => void;
  vendors: Vendor[];
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All claimed work');
  const claimedJobs = jobs.filter((job) => job.vendorId && !job.visibleToVendors && job.boardStatus !== 'Open');
  const filteredJobs = claimedJobs.filter((job) => {
    const vendor = job.vendorId ? vendors.find((item) => item.id === job.vendorId) : undefined;
    const payment = paymentSummary(job);
    const haystack = [
      job.id,
      job.resident,
      job.phone,
      job.email,
      job.market,
      job.unit,
      job.homeProfile,
      job.service,
      job.preferredWindow,
      job.boardStatus,
      job.invoiceStatus,
      payment,
      communityName(job.communityId, communities),
      vendor?.name,
      vendor?.contact,
      vendor?.email,
      vendor?.phone,
    ].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
    const matchesStatus = statusFilter === 'All claimed work' || job.boardStatus === statusFilter || job.invoiceStatus === statusFilter || payment === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <section className="table-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Open task page</p>
          <h2>Claimed work requiring FLAIRO control</h2>
        </div>
        <button type="button" onClick={() => setShowManualJobForm(true)}>Create job order</button>
      </div>

      {showManualJobForm && (
        <div className="manual-job-form">
          <div>
            <p className="eyebrow gold">Admin manual intake</p>
            <h3>Create resident request for the vendor board</h3>
          </div>
          <label>
            Resident
            <input value={manualJobDraft.resident} onChange={(event) => updateManualJobDraft('resident', event.target.value)} />
          </label>
          <label>
            Phone
            <input value={manualJobDraft.phone} onChange={(event) => updateManualJobDraft('phone', event.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={manualJobDraft.email} onChange={(event) => updateManualJobDraft('email', event.target.value)} />
          </label>
          <label>
            Community
            <select value={manualJobDraft.communityId} onChange={(event) => updateManualJobDraft('communityId', event.target.value)}>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>{community.name}</option>
              ))}
            </select>
          </label>
          <label>
            Unit
            <input value={manualJobDraft.unit} onChange={(event) => updateManualJobDraft('unit', event.target.value)} />
          </label>
          <label>
            Home profile
            <input value={manualJobDraft.homeProfile} onChange={(event) => updateManualJobDraft('homeProfile', event.target.value)} />
          </label>
          <label>
            Service
            <select value={manualJobDraft.service} onChange={(event) => {
              const nextService = services.find((service) => service.name === event.target.value);
              updateManualJobDraft('service', event.target.value);
              updateManualJobDraft('amount', String(nextService?.plusPrice ?? manualJobDraft.amount));
            }}>
              {services.map((service) => (
                <option key={service.id} value={service.name}>{service.name}</option>
              ))}
            </select>
          </label>
          <label>
            Preferred window
            <input value={manualJobDraft.preferredWindow} onChange={(event) => updateManualJobDraft('preferredWindow', event.target.value)} />
          </label>
          <label>
            Service date
            <input type="date" value={manualJobDraft.serviceDate} onChange={(event) => updateManualJobDraft('serviceDate', event.target.value)} />
          </label>
          <label>
            Resident service total
            <input min="0" step="0.01" type="number" value={manualJobDraft.amount} onChange={(event) => updateManualJobDraft('amount', event.target.value)} />
          </label>
          <div className="manual-job-actions">
            <button type="button" onClick={createManualJobOrder}>Create request</button>
            <button className="secondary-action" type="button" onClick={() => setShowManualJobForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="task-search-bar">
        <label>
          Search open tasks
          <input
            placeholder="Resident, vendor, job, service, community, payment, or invoice"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          Filter
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All claimed work</option>
            <option>Claimed</option>
            <option>Scheduled</option>
            <option>Completed</option>
            <option>Waiting</option>
            <option>Ready</option>
            <option>Draft queued</option>
            <option>Paid by both sides</option>
            <option>Open payment confirmation</option>
          </select>
        </label>
        <div className="task-search-count">
          <span>{filteredJobs.length}</span>
          <strong>{filteredJobs.length === 1 ? 'claimed task visible' : 'claimed tasks visible'}</strong>
        </div>
      </div>

      <div className="task-stack">
        {filteredJobs.length ? filteredJobs.map((job) => {
          const timer = getJobTimer(job, clock);
          const vendor = job.vendorId ? vendors.find((item) => item.id === job.vendorId) : undefined;
          return (
          <article
            className={`task-card${highlightRecordId === `task-${job.id}` ? ' record-highlight' : ''}`}
            data-record-id={`task-${job.id}`}
            key={job.id}
          >
            <div className="task-main">
              <div>
                <span className="status hold">Board hidden</span>
                <h3>{job.id} / {job.service}</h3>
                <p>{communityName(job.communityId, communities)} / Unit {job.unit} / {job.preferredWindow}</p>
              </div>
              <div className="task-amount">
                <strong>{dollars(job.amount)}</strong>
                <span>FLAIRO fee {dollars(job.flairoFee)}</span>
              </div>
            </div>

            <div className="task-grid">
              <InfoTile label={timer.label} value={`${timer.value} / ${timer.detail}`} />
              <VendorTile vendor={vendor} />
              <InfoTile label="Resident contact" value={job.residentInfoReleased ? `${job.resident} / ${job.phone}` : 'Hidden until claim'} />
              <InfoTile label="Scheduled date/time" value={job.scheduledAt ? labelDateTimeShort(job.scheduledAt) : `Needed by vendor / ${job.preferredWindow}`} />
              <InfoTile label="Task status" value={job.boardStatus} />
              <InfoTile label="Vendor confirmation" value={job.vendorConfirmed ? 'Confirmed' : 'Needed'} />
              <InfoTile label="Payment" value={`${paymentSummary(job)} / ${paymentDetail(job)}`} />
              <InfoTile label="Invoice" value={job.invoiceStatus} />
            </div>

            <div className="action-row">
              <button type="button" onClick={() => confirmSchedule(job.id)}>
                Admin Confirm Booking
              </button>
              <button type="button" onClick={() => completeJob(job.id)}>
                Job Complete
              </button>
              <button type="button" onClick={() => triggerInvoice(job.id)}>
                Trigger invoice
              </button>
              <button className="danger-action" type="button" onClick={() => reactivateJob(job.id)}>
                Re-activate Request
              </button>
              <button className="secondary-action" type="button" onClick={() => confirmVendorPayment(job.id)}>
                Vendor paid
              </button>
              <button className="secondary-action" type="button" onClick={() => confirmResidentPayment(job.id)}>
                Resident paid
              </button>
              <button className="secondary-action" type="button" onClick={() => submitPaymentInquiry(job.id)}>
                Payment inquiry
              </button>
            </div>
          </article>
          );
        }) : (
          <div className="empty-note task-empty">No claimed jobs match this view. Unclaimed and re-activated requests live on the Job Board.</div>
        )}
      </div>
    </section>
  );
}

function RewardsModule({
  adminAdjustPlumePoints,
  communities,
  highlightRecordId,
  rewardSettings,
  rewards,
  runExpirationBatch,
  saveRewardSettings,
}: {
  adminAdjustPlumePoints: (draft: RewardAdjustmentDraft) => void;
  communities: Community[];
  highlightRecordId?: string | null;
  rewardSettings: RewardSettings;
  rewards: RewardEntry[];
  runExpirationBatch: () => void;
  saveRewardSettings: (settings: RewardSettings) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [communityFilter, setCommunityFilter] = useState('All');
  const [pointFilter, setPointFilter] = useState('All');
  const [expirationFilter, setExpirationFilter] = useState('');
  const [settingsDraft, setSettingsDraft] = useState<RewardSettings>(rewardSettings);
  const [adjustmentDraft, setAdjustmentDraft] = useState<RewardAdjustmentDraft>({
    communityId: communities[0]?.id ?? '',
    expirationDate: addMonthsInputDate(todayInputDate(), rewardSettings.expirationMonths),
    note: '',
    points: '',
    resident: '',
    status: 'Available',
  });

  useEffect(() => {
    const timer = setTimeout(() => setSettingsDraft(rewardSettings), 0);
    return () => clearTimeout(timer);
  }, [rewardSettings]);

  const filteredRewards = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return rewards.filter((entry) => {
      const searchable = [
        entry.resident,
        communityName(entry.communityId, communities),
        entry.source,
        entry.status,
        entry.note,
        entry.expirationDate ?? '',
        String(entry.points),
      ].join(' ').toLowerCase();
      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesStatus = statusFilter === 'All' || entry.status === statusFilter;
      const matchesCommunity = communityFilter === 'All' || entry.communityId === communityFilter;
      const matchesExpiration = !expirationFilter || entry.expirationDate === expirationFilter;
      const absolutePoints = Math.abs(entry.points);
      const matchesPoints =
        pointFilter === 'All' ||
        (pointFilter === 'Under 500' && absolutePoints < 500) ||
        (pointFilter === '500 or more' && absolutePoints >= 500) ||
        (pointFilter === '1,000 or more' && absolutePoints >= 1000);

      return matchesSearch && matchesStatus && matchesCommunity && matchesExpiration && matchesPoints;
    });
  }, [communities, communityFilter, expirationFilter, pointFilter, rewards, search, statusFilter]);

  const pendingPlumePoints = filteredRewards
    .filter((entry) => entry.status === 'Pending')
    .reduce((sum, entry) => sum + Math.abs(entry.points), 0);
  const pendingValue = plumePointValue(pendingPlumePoints, settingsDraft);
  const currentMonth = todayInputDate().slice(0, 7);
  const expiringEntries = filteredRewards.filter(
    (entry) =>
      (entry.status === 'Available' || entry.status === 'Pending') &&
      entry.expirationDate?.startsWith(currentMonth),
  );
  const expiringPlumePoints = expiringEntries.reduce((sum, entry) => sum + Math.abs(entry.points), 0);
  const alertWindowResidents = new Set(
    filteredRewards
      .filter((entry) => entry.redeemedInExpirationWindow)
      .map((entry) => entry.resident),
  ).size;
  const adoptionIndex = calculateAdoptionVelocityIndex(settingsDraft);
  const adoptionTrend = adoptionIndex - settingsDraft.adoptionIndexPreviousMonth;
  const expirationRisk = calculateExpirationRisk(filteredRewards);
  const recommendation = rewardProgramRecommendation(settingsDraft, expirationRisk, adoptionIndex);
  const plusEntries = filteredRewards.filter((entry) => entry.plusMember).length;

  const updateSettingsDraft = <K extends keyof RewardSettings>(field: K, value: RewardSettings[K]) => {
    setSettingsDraft((current) => ({ ...current, [field]: value }));
  };

  const updateAdjustmentDraft = <K extends keyof RewardAdjustmentDraft>(field: K, value: RewardAdjustmentDraft[K]) => {
    setAdjustmentDraft((current) => ({ ...current, [field]: value }));
  };

  const submitAdjustment = () => {
    adminAdjustPlumePoints(adjustmentDraft);
    setAdjustmentDraft({
      communityId: adjustmentDraft.communityId,
      expirationDate: addMonthsInputDate(todayInputDate(), settingsDraft.expirationMonths),
      note: '',
      points: '',
      resident: '',
      status: 'Available',
    });
  };

  return (
    <>
      <MetricGrid
        metrics={[
          { label: 'Pending redemption value', value: dollars(pendingValue), detail: `${pendingPlumePoints.toLocaleString()} pending Plume Points` },
          { label: 'Pending Plume Points', value: pendingPlumePoints.toLocaleString(), detail: 'Selected on current active jobs' },
          { label: 'Expiring this month', value: expiringPlumePoints.toLocaleString(), detail: `${dollars(plumePointValue(expiringPlumePoints, settingsDraft))} potential statement value` },
          { label: '7-day alert redemptions', value: String(alertWindowResidents), detail: 'Residents who redeemed after expiration nudge' },
          { label: 'Adoption Velocity Index', value: `${adoptionIndex}`, detail: `${adoptionTrend >= 0 ? '+' : ''}${adoptionTrend} MoM / ${recommendation}` },
          { label: 'PLUS accrual eligibility', value: `${plusEntries}/${filteredRewards.length || rewards.length}`, detail: 'Only FLAIRO Plus members earn Plume Points' },
        ]}
      />

      <section className="table-panel reward-workspace">
        <div>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Resident Plume Point monitor</p>
              <h2>Plume Points ledger</h2>
            </div>
            <button type="button" onClick={runExpirationBatch}>
              Run expiration batch
            </button>
          </div>

          <div className="reward-filter-bar">
            <label>
              Search
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Resident, source, note, date, or Plume Points"
                type="search"
                value={search}
              />
            </label>
            <label>
              Status
              <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                <option>All</option>
                <option>Pending</option>
                <option>Available</option>
                <option>Redeemed</option>
                <option>Reversed</option>
                <option>Expired</option>
              </select>
            </label>
            <label>
              Community
              <select onChange={(event) => setCommunityFilter(event.target.value)} value={communityFilter}>
                <option value="All">All</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>{community.name}</option>
                ))}
              </select>
            </label>
            <label>
              Plume Points
              <select onChange={(event) => setPointFilter(event.target.value)} value={pointFilter}>
                <option>All</option>
                <option>Under 500</option>
                <option>500 or more</option>
                <option>1,000 or more</option>
              </select>
            </label>
            <label>
              Expiration date
              <input onChange={(event) => setExpirationFilter(event.target.value)} type="date" value={expirationFilter} />
            </label>
          </div>

          <div className="compact-table ledger-table">
            <div className="compact-row header seven">
              <span>Resident</span>
              <span>Community</span>
              <span>Source</span>
              <span>Status</span>
              <span>Plume Points</span>
              <span>Expiration</span>
              <span>Value</span>
            </div>
            {filteredRewards.length ? filteredRewards.map((entry) => (
              <div
                className={`compact-row seven${highlightRecordId === `reward-${entry.id}` ? ' record-highlight' : ''}`}
                data-record-id={`reward-${entry.id}`}
                key={entry.id}
              >
                <span>{entry.resident}</span>
                <span>{communityName(entry.communityId, communities)}</span>
                <span>{entry.source}</span>
                <span>{entry.status}{entry.alertQueued ? ' / alert queued' : ''}</span>
                <span>{entry.points.toLocaleString()}</span>
                <span>{entry.expirationDate ?? 'No expiration set'}</span>
                <span>{dollars(entry.value)}</span>
              </div>
            )) : (
              <div className="empty-note table-empty">No Plume Point ledger entries match those filters.</div>
            )}
          </div>
        </div>

        <div className="gold-divider" />

        <div className="reward-control-grid">
          <section className="sub-panel">
            <div>
              <p className="eyebrow">Plume Point controls</p>
              <h2>Program rules</h2>
            </div>
            <div className="form-grid three">
              <label>
                Plume Point value
                <input
                  min="1"
                  onChange={(event) => updateSettingsDraft('pointValueCents', Number(event.target.value) || 0)}
                  type="number"
                  value={settingsDraft.pointValueCents}
                />
              </label>
              <label>
                Redemption cap %
                <input
                  min="0"
                  onChange={(event) => updateSettingsDraft('redemptionCapPercent', Number(event.target.value) || 0)}
                  type="number"
                  value={settingsDraft.redemptionCapPercent}
                />
              </label>
              <label>
                PLUS membership $
                <input
                  min="0"
                  onChange={(event) => updateSettingsDraft('plusMembershipMonthly', Number(event.target.value) || 0)}
                  type="number"
                  value={settingsDraft.plusMembershipMonthly}
                />
              </label>
              <label>
                Gold balance threshold
                <input
                  min="0"
                  onChange={(event) => updateSettingsDraft('minimumGoldBalance', Number(event.target.value) || 0)}
                  type="number"
                  value={settingsDraft.minimumGoldBalance}
                />
              </label>
              <label>
                Expiration months
                <input
                  min="1"
                  onChange={(event) => updateSettingsDraft('expirationMonths', Number(event.target.value) || 1)}
                  type="number"
                  value={settingsDraft.expirationMonths}
                />
              </label>
              <label>
                Reminder days
                <input
                  min="1"
                  onChange={(event) => updateSettingsDraft('expirationReminderDays', Number(event.target.value) || 1)}
                  type="number"
                  value={settingsDraft.expirationReminderDays}
                />
              </label>
            </div>
            <label className="check-control">
              <input
                checked={settingsDraft.plusOnlyAccrual}
                onChange={(event) => updateSettingsDraft('plusOnlyAccrual', event.target.checked)}
                type="checkbox"
              />
              <span>Only FLAIRO Plus members accrue Plume Points</span>
            </label>
            <button type="button" onClick={() => saveRewardSettings(settingsDraft)}>
              Save Plume controls
            </button>
          </section>

          <section className="sub-panel">
            <div>
              <p className="eyebrow">Administrator adjustment</p>
              <h2>Resident Plume Points</h2>
            </div>
            <div className="form-grid two">
              <label>
                Resident
                <input
                  onChange={(event) => updateAdjustmentDraft('resident', event.target.value)}
                  placeholder="Resident name"
                  value={adjustmentDraft.resident}
                />
              </label>
              <label>
                Community
                <select
                  onChange={(event) => updateAdjustmentDraft('communityId', event.target.value)}
                  value={adjustmentDraft.communityId}
                >
                  {communities.map((community) => (
                    <option key={community.id} value={community.id}>{community.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Action
                <select
                  onChange={(event) => updateAdjustmentDraft('status', event.target.value as RewardStatus)}
                  value={adjustmentDraft.status}
                >
                  <option value="Available">Add available</option>
                  <option value="Expired">Manually expire</option>
                  <option value="Reversed">Reverse or adjust down</option>
                </select>
              </label>
              <label>
                Plume Points
                <input
                  min="1"
                  onChange={(event) => updateAdjustmentDraft('points', event.target.value)}
                  placeholder="500"
                  type="number"
                  value={adjustmentDraft.points}
                />
              </label>
              <label>
                Expiration date
                <input
                  onChange={(event) => updateAdjustmentDraft('expirationDate', event.target.value)}
                  type="date"
                  value={adjustmentDraft.expirationDate}
                />
              </label>
              <label>
                Note
                <input
                  onChange={(event) => updateAdjustmentDraft('note', event.target.value)}
                  placeholder="Reason for adjustment"
                  value={adjustmentDraft.note}
                />
              </label>
            </div>
            <button type="button" onClick={submitAdjustment}>
              Update resident balance
            </button>
          </section>
        </div>
      </section>
    </>
  );
}

function AccountingModule({
  communities,
  finalizePartnershipStatement,
  finalizeVendorInvoice,
  highlightRecordId,
  invoices,
  jobs,
  markVendorStatementPaid,
  rewards,
  vendors,
}: {
  communities: Community[];
  finalizePartnershipStatement: (communityId: string, monthKey: string, programIds: string[], reviewAcknowledged: boolean) => void;
  finalizeVendorInvoice: (vendorId: string, monthKey: string, jobIds: string[], reviewAcknowledged: boolean) => void;
  highlightRecordId?: string | null;
  invoices: InvoiceTrigger[];
  jobs: Job[];
  markVendorStatementPaid: (vendorId: string, monthKey: string) => void;
  rewards: RewardEntry[];
  vendors: Vendor[];
}) {
  const [activeTab, setActiveTab] = useState<AccountingTab>(() => accountingTabFromHighlight(highlightRecordId));
  const reconciliationItems = buildReconciliationItems(jobs, invoices, communities, vendors);
  const openStatements = buildOpenVendorStatements(invoices, jobs, vendors);
  const recommendedJobs = jobs.filter(jobRecommendedForReconciliation).length;
  const reviewJobs = jobs.filter((job) => job.vendorId && !jobRecommendedForReconciliation(job) && job.invoiceStatus !== 'Paid').length;

  return (
    <>
      <section className="section-band">
        <div>
          <p className="eyebrow">Accounting</p>
          <h2>Vendor billing, partner statements, reconciliation, and month-end close.</h2>
        </div>
        <div className="integration-strip">
          <StatusPill label="Recommendation" status="Completed + Resident Paid" />
          <StatusPill label="Selection" status="Admin controlled" />
          <StatusPill label="Open items" status="Never auto-archived" />
        </div>
      </section>

      <MetricGrid
        metrics={[
          { label: 'Recommended jobs', value: String(recommendedJobs), detail: 'Completed + Resident Paid' },
          { label: 'Requires review', value: String(reviewJobs), detail: 'Available with acknowledgement' },
          { label: 'Open reconciliation', value: String(reconciliationItems.length), detail: 'Visible until resolved' },
          { label: 'Open invoices', value: String(openStatements.length), detail: 'Vendor billing in progress' },
          { label: 'Partner programs', value: String(partnershipPrograms.length), detail: 'Configured statement lines' },
          { label: 'Reward ledger', value: String(rewards.length), detail: 'Plume Point activity' },
        ]}
      />

      <div className="accounting-tabs" role="tablist" aria-label="Accounting sections">
        {accountingTabs.map((tab) => (
          <button
            aria-pressed={activeTab === tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'vendor-billing' && (
        <VendorBillingWorkflow
          communities={communities}
          finalizeVendorInvoice={finalizeVendorInvoice}
          highlightRecordId={highlightRecordId}
          invoices={invoices}
          jobs={jobs}
          markVendorStatementPaid={markVendorStatementPaid}
          openStatements={openStatements}
          vendors={vendors}
        />
      )}

      {activeTab === 'partnership-statements' && (
        <PartnershipStatementsWorkflow
          communities={communities}
          finalizePartnershipStatement={finalizePartnershipStatement}
          highlightRecordId={highlightRecordId}
        />
      )}

      {activeTab === 'reconciliation-queue' && (
        <ReconciliationQueueWorkspace
          items={reconciliationItems}
          vendors={vendors}
        />
      )}

      {activeTab === 'month-end-close' && (
        <MonthEndCloseWorkspace
          communities={communities}
          invoices={invoices}
          items={reconciliationItems}
          jobs={jobs}
          vendors={vendors}
        />
      )}

      {activeTab === 'accounting-settings' && (
        <AccountingSettingsWorkspace communities={communities} vendors={vendors} />
      )}
    </>
  );
}

function VendorBillingWorkflow({
  communities,
  finalizeVendorInvoice,
  highlightRecordId,
  invoices,
  jobs,
  markVendorStatementPaid,
  openStatements,
  vendors,
}: {
  communities: Community[];
  finalizeVendorInvoice: (vendorId: string, monthKey: string, jobIds: string[], reviewAcknowledged: boolean) => void;
  highlightRecordId?: string | null;
  invoices: InvoiceTrigger[];
  jobs: Job[];
  markVendorStatementPaid: (vendorId: string, monthKey: string) => void;
  openStatements: OpenVendorStatement[];
  vendors: Vendor[];
}) {
  const activeVendors = vendors.filter((vendor) => vendor.boardAccess || vendor.preferred || jobs.some((job) => job.vendorId === vendor.id));
  const [vendorId, setVendorId] = useState(() => vendorIdFromHighlight(highlightRecordId, vendors, activeVendors[0]?.id ?? vendors[0]?.id ?? ''));
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [jobSelection, setJobSelection] = useState<{ ids: string[]; key: string }>({ ids: [], key: '' });
  const monthChoices = accountingMonthChoices(jobs, invoices);
  const selectionKey = `${vendorId}-${monthKey}`;
  const selectedJobIds = jobSelection.key === selectionKey ? jobSelection.ids : [];

  const candidateJobs = useMemo(
    () => buildVendorBillingCandidates(jobs, invoices, vendorId, monthKey),
    [invoices, jobs, monthKey, vendorId],
  );
  const recommendedJobs = candidateJobs.filter(jobRecommendedForReconciliation);
  const selectedJobs = candidateJobs.filter((job) => selectedJobIds.includes(job.id));
  const reviewSelectedJobs = selectedJobs.filter((job) => !jobRecommendedForReconciliation(job));
  const grossTotal = selectedJobs.reduce((sum, job) => sum + job.amount, 0);
  const flairoDue = selectedJobs.reduce((sum, job) => sum + job.flairoFee, 0);
  const selectedVendor = vendors.find((vendor) => vendor.id === vendorId);

  const setSelection = (jobId: string, checked: boolean) => {
    setJobSelection((current) => {
      const next = new Set(current.key === selectionKey ? current.ids : []);
      if (checked) next.add(jobId);
      else next.delete(jobId);
      return { ids: Array.from(next), key: selectionKey };
    });
  };

  const replaceSelection = (ids: string[]) => setJobSelection({ ids, key: selectionKey });

  const finalizeSelection = () => {
    if (reviewSelectedJobs.length) {
      const confirmed = window.confirm('Some selected jobs are outside the Completed + Resident Paid recommendation. Finalize with admin acknowledgement?');
      if (!confirmed) return;
    }
    finalizeVendorInvoice(vendorId, monthKey, selectedJobIds, reviewSelectedJobs.length > 0);
    replaceSelection([]);
  };

  return (
    <section className="accounting-workflow">
      <div className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vendor Billing</p>
            <h2>Build vendor invoices from selected job records.</h2>
          </div>
          <div className="accounting-preview-total">
            <span>Invoice total</span>
            <strong>{dollars(flairoDue)}</strong>
          </div>
        </div>

        <div className="accounting-control-grid">
          <label>
            Vendor
            <select value={vendorId} onChange={(event) => setVendorId(event.target.value)}>
              {activeVendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
          </label>
          <label>
            Billing month
            <select value={monthKey} onChange={(event) => setMonthKey(event.target.value)}>
              {monthChoices.map((choice) => (
                <option key={choice} value={choice}>{labelMonth(choice)}</option>
              ))}
            </select>
          </label>
          <div className="accounting-alert">
            Recommended for reconciliation: Completed + Resident Paid jobs.
          </div>
        </div>

        <div className="accounting-action-row">
          <button type="button" onClick={() => replaceSelection(recommendedJobs.map((job) => job.id))}>
            Select All Recommended
          </button>
          <button className="secondary-action" type="button" onClick={() => replaceSelection(candidateJobs.map((job) => job.id))}>
            Select All
          </button>
          <button className="secondary-action" type="button" onClick={() => replaceSelection([])}>
            Clear Selection
          </button>
        </div>

        <div className="accounting-job-table" role="table" aria-label="vendor billing reconciliation">
          <div className="accounting-job-row header" role="row">
            <span>Include</span>
            <span>Job</span>
            <span>Property / Resident</span>
            <span>Service</span>
            <span>Periods</span>
            <span>Job Cost</span>
            <span>FLAIRO Due</span>
            <span>Status</span>
            <span>Payment</span>
            <span>Verification</span>
            <span>Billing</span>
          </div>
          {candidateJobs.length ? candidateJobs.map((job) => {
            const recommended = jobRecommendedForReconciliation(job);
            const invoice = invoices.find((item) => item.jobId === job.id && item.status !== 'Hold' && item.status !== 'Paid');
            return (
              <div
                className={`accounting-job-row${highlightRecordId === `invoice-ready-${job.id}` || highlightRecordId === `statement-job-${job.id}` ? ' record-highlight' : ''}`}
                data-record-id={`accounting-job-${job.id}`}
                key={job.id}
                role="row"
              >
                <label className="check-control accounting-checkbox">
                  <input
                    checked={selectedJobIds.includes(job.id)}
                    onChange={(event) => setSelection(job.id, event.target.checked)}
                    type="checkbox"
                  />
                  <span>{recommended ? 'Recommended' : 'Review'}</span>
                </label>
                <strong>{job.id}<em>Unit {job.unit}</em></strong>
                <span>{communityName(job.communityId, communities)}<em>{job.resident}</em></span>
                <span>{job.service}<em>{selectedVendor?.feePercent ?? 0}% contract</em></span>
                <span>Service {labelMonth(job.serviceDate.slice(0, 7))}<em>Billing {labelMonth(monthKey)}</em></span>
                <span>{dollars(job.amount)}</span>
                <span>{dollars(job.flairoFee)}</span>
                <span><b className={`status ${recommended ? 'good' : 'review'}`}>{recommended ? 'Recommended' : 'Requires Review'}</b><em>{job.boardStatus}</em></span>
                <span>{paymentSummary(job)}<em>{paymentDetail(job)}</em></span>
                <span>{paymentVerificationSource(job)}</span>
                <span>{jobVendorBillingStatus(job, invoice)}</span>
              </div>
            );
          }) : (
            <div className="empty-note table-empty">No vendor jobs match this billing period.</div>
          )}
        </div>
      </div>

      <section className="split-grid">
        <div className="table-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Invoice Preview</p>
              <h2>{selectedVendor?.name ?? 'Vendor'} / {labelMonth(monthKey)}</h2>
            </div>
            <button disabled={!selectedJobIds.length} type="button" onClick={finalizeSelection}>
              Finalize Vendor Invoice
            </button>
          </div>
          <div className="open-statement-facts">
            <InfoTile label="Selected jobs" value={String(selectedJobs.length)} />
            <InfoTile label="Gross job value" value={dollars(grossTotal)} />
            <InfoTile label="FLAIRO amount due" value={dollars(flairoDue)} />
          </div>
          <div className="accounting-note-grid">
            <span>Adjustments</span>
            <strong>$0</strong>
            <span>Memo</span>
            <strong>Admin-selected job set</strong>
            <span>Requires acknowledgement</span>
            <strong>{reviewSelectedJobs.length ? `${reviewSelectedJobs.length} job${reviewSelectedJobs.length === 1 ? '' : 's'}` : 'None'}</strong>
          </div>
        </div>

        <div className="table-panel open-statement-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Open Vendor Invoices</p>
              <h2>Payment tracking</h2>
            </div>
          </div>
          <div className="open-statement-stack">
            {openStatements.length ? openStatements.map((statement) => (
              <article
                className={`open-statement-card${highlightRecordId === `vendor-month-${statement.vendor.id}` ? ' record-highlight' : ''}`}
                data-record-id={`open-statement-${statement.vendor.id}-${statement.monthKey}`}
                key={`${statement.vendor.id}-${statement.monthKey}`}
              >
                <div className="open-statement-head">
                  <div>
                    <h3>{statement.vendor.name}</h3>
                    <p>{labelMonth(statement.monthKey)} billing / {statement.jobCount} job record{statement.jobCount === 1 ? '' : 's'}</p>
                  </div>
                  <strong>{dollars(statement.amount)}</strong>
                </div>
                <div className="open-statement-facts">
                  <InfoTile label="Invoice status" value={statement.status} />
                  <InfoTile label="Due / follow-up" value={statement.dueLabel} />
                  <InfoTile label="Payment tracking" value="Manual until connected" />
                </div>
                <div className="open-statement-items" aria-label={`${statement.vendor.name} unpaid invoice job records`}>
                  <div className="open-statement-item header">
                    <span>Invoice</span>
                    <span>Job</span>
                    <span>Service Period</span>
                    <span>FLAIRO due</span>
                  </div>
                  {statement.invoices.map((invoice) => {
                    const job = jobs.find((item) => item.id === invoice.jobId);
                    return (
                      <div
                        className={`open-statement-item${highlightRecordId === `invoice-${invoice.id}` ? ' record-highlight' : ''}`}
                        data-record-id={`invoice-${invoice.id}`}
                        key={invoice.id}
                      >
                        <span>{invoice.id}</span>
                        <span>{invoice.jobId}</span>
                        <span>{job ? labelMonth(job.serviceDate.slice(0, 7)) : invoice.reference}</span>
                        <strong>{dollars(invoice.amount)}</strong>
                      </div>
                    );
                  })}
                </div>
                <button type="button" onClick={() => markVendorStatementPaid(statement.vendor.id, statement.monthKey)}>
                  Mark paid manually
                </button>
              </article>
            )) : <p className="empty-note">No open unpaid vendor invoices right now.</p>}
          </div>
        </div>
      </section>
    </section>
  );
}

function PartnershipStatementsWorkflow({
  communities,
  finalizePartnershipStatement,
  highlightRecordId,
}: {
  communities: Community[];
  finalizePartnershipStatement: (communityId: string, monthKey: string, programIds: string[], reviewAcknowledged: boolean) => void;
  highlightRecordId?: string | null;
}) {
  const [communityId, setCommunityId] = useState(() => communityIdFromHighlight(highlightRecordId, communities, communities[0]?.id ?? ''));
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [programSelection, setProgramSelection] = useState<{ ids: string[]; key: string }>({ ids: [], key: '' });
  const [glOverrides, setGlOverrides] = useState<Record<string, string>>({});
  const selectionKey = `${communityId}-${monthKey}`;
  const selectedProgramIds = programSelection.key === selectionKey ? programSelection.ids : [];
  const monthChoices = accountingMonthChoices([], []).concat(
    partnershipPrograms
      .map((program) => program.period)
      .filter((period, index, periods) => periods.indexOf(period) === index),
  ).filter((period, index, periods) => periods.indexOf(period) === index);

  const programs = partnershipPrograms.filter((program) => program.communityId === communityId && program.period === monthKey);
  const readyPrograms = programs.filter((program) => program.status === 'Ready');
  const selectedPrograms = programs.filter((program) => selectedProgramIds.includes(program.id));
  const reviewPrograms = selectedPrograms.filter((program) => program.status !== 'Ready');
  const selectedIncome = selectedPrograms.reduce((sum, program) => sum + program.income, 0);
  const community = communities.find((item) => item.id === communityId);

  const toggleProgramSelection = (programId: string, checked: boolean) => {
    setProgramSelection((current) => {
      const next = new Set(current.key === selectionKey ? current.ids : []);
      if (checked) next.add(programId);
      else next.delete(programId);
      return { ids: Array.from(next), key: selectionKey };
    });
  };

  const replaceProgramSelection = (ids: string[]) => setProgramSelection({ ids, key: selectionKey });

  const finalizeStatement = () => {
    if (reviewPrograms.length) {
      const confirmed = window.confirm('Some selected programs require review. Issue the partnership statement with admin acknowledgement?');
      if (!confirmed) return;
    }
    finalizePartnershipStatement(communityId, monthKey, selectedProgramIds, reviewPrograms.length > 0);
    replaceProgramSelection([]);
  };

  return (
    <section className="accounting-workflow">
      <div className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Partnership Statements</p>
            <h2>Program income statement processing.</h2>
          </div>
          <div className="accounting-preview-total">
            <span>Total payout</span>
            <strong>{dollars(selectedIncome)}</strong>
          </div>
        </div>

        <div className="accounting-control-grid">
          <label>
            Community
            <select value={communityId} onChange={(event) => setCommunityId(event.target.value)}>
              {communities.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Statement month
            <select value={monthKey} onChange={(event) => setMonthKey(event.target.value)}>
              {monthChoices.map((choice) => (
                <option key={choice} value={choice}>{labelMonth(choice)}</option>
              ))}
            </select>
          </label>
          <div className="accounting-alert">
            Preferred vendor referral fees stay in Vendor Billing.
          </div>
        </div>

        <div className="accounting-action-row">
          <button type="button" onClick={() => replaceProgramSelection(readyPrograms.map((program) => program.id))}>
            Select Ready Programs
          </button>
          <button className="secondary-action" type="button" onClick={() => replaceProgramSelection(programs.map((program) => program.id))}>
            Select All
          </button>
          <button className="secondary-action" type="button" onClick={() => replaceProgramSelection([])}>
            Clear Selection
          </button>
        </div>

        <div className="partnership-table" role="table" aria-label="partnership statement programs">
          <div className="partnership-row header" role="row">
            <span>Include</span>
            <span>Program</span>
            <span>Period</span>
            <span>GL Code</span>
            <span>Income</span>
            <span>Status</span>
            <span>Activity</span>
          </div>
          {programs.length ? programs.map((program) => (
            <div
              className={`partnership-row${highlightRecordId === `program-${program.id}` ? ' record-highlight' : ''}`}
              data-record-id={`program-${program.id}`}
              key={program.id}
              role="row"
            >
              <label className="check-control accounting-checkbox">
                <input
                  checked={selectedProgramIds.includes(program.id)}
                  onChange={(event) => toggleProgramSelection(program.id, event.target.checked)}
                  type="checkbox"
                />
                <span>{program.status}</span>
              </label>
              <strong>{program.name}</strong>
              <span>{labelMonth(program.period)}</span>
              <input
                aria-label={`${program.name} GL code`}
                onChange={(event) => setGlOverrides((current) => ({ ...current, [program.id]: event.target.value }))}
                value={glOverrides[program.id] ?? program.glCode}
              />
              <span>{dollars(program.income)}</span>
              <span><b className={`status ${program.status === 'Ready' ? 'good' : 'review'}`}>{program.status}</b></span>
              <span>{program.jobsBooked} activities<em>{program.popularService}</em></span>
            </div>
          )) : (
            <div className="empty-note table-empty">No program income lines match this statement month.</div>
          )}
        </div>
      </div>

      <section className="split-grid">
        <div className="table-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Statement Preview</p>
              <h2>{community?.name ?? 'Community'} / {labelMonth(monthKey)}</h2>
            </div>
            <button disabled={!selectedProgramIds.length} type="button" onClick={finalizeStatement}>
              Issue Partnership Statement
            </button>
          </div>
          <div className="open-statement-facts">
            <InfoTile label="Programs selected" value={String(selectedPrograms.length)} />
            <InfoTile label="Total payout" value={dollars(selectedIncome)} />
            <InfoTile label="Review lines" value={String(reviewPrograms.length)} />
          </div>
          <div className="accounting-note-grid">
            <span>RBP participation</span>
            <strong>{percent(community?.servicePenetration ?? 0)}</strong>
            <span>FLAIRO PLUS memberships</span>
            <strong>{String(community?.plusMembers ?? 0)}</strong>
            <span>Points earned / redeemed</span>
            <strong>{selectedPrograms.reduce((sum, program) => sum + program.pointsEarned, 0).toLocaleString()} / {selectedPrograms.reduce((sum, program) => sum + program.pointsRedeemed, 0).toLocaleString()}</strong>
          </div>
        </div>

        <div className="table-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Partnership Profile</p>
              <h2>{community?.manager ?? 'Ownership partner'}</h2>
            </div>
          </div>
          <div className="rule-list">
            <InfoTile label="Statement recipient" value="Accounting POC on partnership profile" />
            <InfoTile label="Payment instructions" value="Profile default" />
            <InfoTile label="Default GL handling" value="Program configuration with override audit" />
            <InfoTile label="Financial documents" value="Statement history and payment history retained" />
          </div>
        </div>
      </section>
    </section>
  );
}

function ReconciliationQueueWorkspace({
  items,
  vendors,
}: {
  items: ReconciliationItem[];
  vendors: Vendor[];
}) {
  const [typeFilter, setTypeFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const monthChoices = Array.from(new Set(items.map((item) => item.servicePeriod))).sort().reverse();
  const filteredItems = items.filter((item) =>
    (typeFilter === 'All' || item.type === typeFilter) &&
    (vendorFilter === 'All' || item.vendor === vendorFilter) &&
    (statusFilter === 'All' || item.reconciliationStatus === statusFilter) &&
    (monthFilter === 'All' || item.servicePeriod === monthFilter),
  );

  return (
    <section className="table-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reconciliation Queue</p>
          <h2>Outstanding jobs and financial items.</h2>
        </div>
        <div className="accounting-preview-total">
          <span>Visible items</span>
          <strong>{filteredItems.length}</strong>
        </div>
      </div>

      <div className="queue-filter-bar">
        <label>
          Type
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option>All</option>
            <option>Vendor Billing</option>
            <option>Partnership Statements</option>
            <option>Payment Matching</option>
            <option>Prior-Period Adjustments</option>
          </select>
        </label>
        <label>
          Vendor
          <select value={vendorFilter} onChange={(event) => setVendorFilter(event.target.value)}>
            <option>All</option>
            {vendors.map((vendor) => (
              <option key={vendor.id}>{vendor.name}</option>
            ))}
          </select>
        </label>
        <label>
          Service period
          <select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
            <option>All</option>
            {monthChoices.map((choice) => (
              <option key={choice}>{choice}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All</option>
            <option>Open</option>
            <option>Deferred</option>
            <option>Exception</option>
            <option>Reconciled</option>
          </select>
        </label>
      </div>

      <div className="reconciliation-table" role="table" aria-label="reconciliation queue">
        <div className="reconciliation-row header" role="row">
          <span>Type</span>
          <span>Item</span>
          <span>Property</span>
          <span>Vendor / Partner</span>
          <span>Service Period</span>
          <span>Billing Candidate</span>
          <span>Status</span>
          <span>Age</span>
          <span>Suggested Action</span>
        </div>
        {filteredItems.length ? filteredItems.map((item) => (
          <div className="reconciliation-row" key={item.id} role="row">
            <span>{item.type}</span>
            <strong>{item.item}</strong>
            <span>{item.property}</span>
            <span>{item.vendor || item.partner}</span>
            <span>{item.servicePeriod}</span>
            <span>{item.billingCandidate}</span>
            <span><b className={`status ${statusTone(item.reconciliationStatus)}`}>{item.reconciliationStatus}</b><em>{item.jobStatus}</em></span>
            <span>{item.ageLabel}</span>
            <span>{item.suggestedAction}</span>
          </div>
        )) : (
          <div className="empty-note table-empty">No reconciliation items match those filters.</div>
        )}
      </div>
    </section>
  );
}

function MonthEndCloseWorkspace({
  communities,
  invoices,
  items,
  jobs,
  vendors,
}: {
  communities: Community[];
  invoices: InvoiceTrigger[];
  items: ReconciliationItem[];
  jobs: Job[];
  vendors: Vendor[];
}) {
  const months = accountingMonthChoices(jobs, invoices).slice(0, 4);

  return (
    <section className="month-close-grid">
      {months.map((monthKey) => {
        const expectedVendorIds = new Set(
          jobs
            .filter((job) => job.vendorId && job.serviceDate.startsWith(monthKey))
            .map((job) => job.vendorId),
        );
        const monthInvoices = invoices.filter((invoice) => invoiceStatementMonth(invoice, jobs) === monthKey);
        const paidInvoices = monthInvoices.filter((invoice) => invoice.status === 'Paid');
        const monthPrograms = partnershipPrograms.filter((program) => program.period === monthKey);
        const monthQueueItems = items.filter((item) => item.servicePeriod === labelMonth(monthKey) || item.billingCandidate === labelMonth(monthKey));

        return (
          <article className="table-panel month-close-card" key={monthKey}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Month-End Close</p>
                <h2>{labelMonth(monthKey)}</h2>
              </div>
              <span className="status review">{monthQueueItems.length ? 'Open items' : 'Ready'}</span>
            </div>
            <div className="month-close-section">
              <h3>Vendor Billing</h3>
              <div className="open-statement-facts">
                <InfoTile label="Expected vendors" value={String(expectedVendorIds.size || vendors.length)} />
                <InfoTile label="Invoices created" value={String(monthInvoices.length)} />
                <InfoTile label="Paid" value={String(paidInvoices.length)} />
              </div>
            </div>
            <div className="month-close-section">
              <h3>Partnership Statements</h3>
              <div className="open-statement-facts">
                <InfoTile label="Expected statements" value={String(communities.length)} />
                <InfoTile label="Program lines" value={String(monthPrograms.length)} />
                <InfoTile label="Issued" value={String(communities.filter((community) => community.statementStatus === 'Issued').length)} />
              </div>
            </div>
            <div className="month-close-section">
              <h3>Reconciliation</h3>
              <div className="open-statement-facts">
                <InfoTile label="Unassigned jobs" value={String(monthQueueItems.filter((item) => item.type === 'Vendor Billing').length)} />
                <InfoTile label="Payment exceptions" value={String(monthQueueItems.filter((item) => item.type === 'Payment Matching').length)} />
                <InfoTile label="Prior periods" value={String(monthQueueItems.filter((item) => item.type === 'Prior-Period Adjustments').length)} />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function AccountingSettingsWorkspace({
  communities,
  vendors,
}: {
  communities: Community[];
  vendors: Vendor[];
}) {
  const preferredVendors = vendors.filter((vendor) => vendor.preferred);

  return (
    <section className="split-grid">
      <div className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Accounting Settings</p>
            <h2>Vendor billing rules</h2>
          </div>
        </div>
        <div className="rule-list">
          {vendors.map((vendor) => (
            <InfoTile
              key={vendor.id}
              label={vendor.name}
              value={`${vendor.feePercent}% default / ${vendor.preferred ? 'Preferred vendor' : 'Standard vendor'}`}
            />
          ))}
          <InfoTile label="Supported fee rules" value="Percentage, fixed amount, service-specific, tiered, custom commercial rule" />
          <InfoTile label="Payment terms" value="Net 7 default with Stripe link when enabled" />
        </div>
      </div>

      <div className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Partnership Profiles</p>
            <h2>Program defaults</h2>
          </div>
        </div>
        <div className="rule-list">
          {communities.map((community) => (
            <InfoTile
              key={community.id}
              label={community.name}
              value={`${community.manager} / ${community.plusMembers} PLUS members / GL defaults active`}
            />
          ))}
          <InfoTile label="Preferred vendors" value={`${preferredVendors.length} profiles marked preferred`} />
          <InfoTile label="Archive control" value="Admin-only, reason required for financial records" />
        </div>
      </div>
    </section>
  );
}

function ReportsModule({
  communities,
  jobs,
  rewards,
  vendors,
}: {
  communities: Community[];
  jobs: Job[];
  rewards: RewardEntry[];
  vendors: Vendor[];
}) {
  const totalUsage = jobs.length;
  const completedJobs = jobs.filter((job) => job.boardStatus === 'Completed').length;
  const activeRewards = rewards.filter((reward) => reward.status === 'Available' || reward.status === 'Pending');
  const serviceMix = Array.from(new Set(jobs.map((job) => job.service))).map((service) => ({
    count: jobs.filter((job) => job.service === service).length,
    revenue: jobs.filter((job) => job.service === service).reduce((sum, job) => sum + job.amount, 0),
    service,
  })).sort((a, b) => b.count - a.count);

  return (
    <>
      <MetricGrid
        metrics={[
          { label: 'Serviced communities', value: String(communities.length), detail: 'Active reporting locations' },
          { label: 'Service usage', value: String(totalUsage), detail: 'Resident benefit jobs tracked' },
          { label: 'Completion rate', value: percent(totalUsage ? (completedJobs / totalUsage) * 100 : 0), detail: 'Operational performance' },
          { label: 'Avg. penetration', value: percent(communities.reduce((sum, community) => sum + community.servicePenetration, 0) / communities.length), detail: 'Adoption by community' },
          { label: 'Reward activity', value: String(activeRewards.length), detail: 'Active Plume Point entries' },
          { label: 'Vendor pool', value: String(vendors.length), detail: 'Profiles in reporting scope' },
        ]}
      />

      <section className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Reporting</p>
            <h2>Dashboards, adoption, service usage, and revenue insights.</h2>
          </div>
          <button type="button">Export dashboard</button>
        </div>
        <div className="reporting-grid">
          {communities.map((community) => (
            <article className="statement-card" data-record-id={`report-${community.id}`} key={community.id}>
              <div>
                <span className="status good">Dashboard</span>
                <h3>{community.name}</h3>
                <p>{community.address} / {community.market}</p>
              </div>
              <div className="statement-numbers">
                <InfoTile label="Homes / occupied" value={`${community.homes} / ${community.occupied}`} />
                <InfoTile label="Program penetration" value={percent(community.servicePenetration)} />
                <InfoTile label="PLUS members" value={String(community.plusMembers)} />
                <InfoTile label="Revenue insight" value={dollars(community.netIncome)} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="split-grid">
        <div className="table-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Service Usage</p>
              <h2>Program performance drill-down</h2>
            </div>
          </div>
          <div className="compact-table service-report-table">
            <div className="compact-row header">
              <span>Service</span>
              <span>Jobs</span>
              <span>Revenue</span>
              <span>Adoption Signal</span>
              <span>Trend</span>
            </div>
            {serviceMix.map((row) => (
              <div className="compact-row" key={row.service}>
                <span>{row.service}</span>
                <span>{row.count}</span>
                <span>{dollars(row.revenue)}</span>
                <span>{row.count > 1 ? 'Repeatable' : 'Emerging'}</span>
                <span>{row.count > 1 ? 'Growing' : 'Watch'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="table-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Revenue Insights</p>
              <h2>Read-only finance lens</h2>
            </div>
          </div>
          <div className="rule-list">
            <InfoTile label="Program revenue" value={dollars(communities.reduce((sum, community) => sum + community.netIncome, 0))} />
            <InfoTile label="Vendor service value" value={dollars(jobs.reduce((sum, job) => sum + job.amount, 0))} />
            <InfoTile label="Potential FLAIRO fee" value={dollars(jobs.reduce((sum, job) => sum + job.flairoFee, 0))} />
            <InfoTile label="Accounting handoff" value="Financial processing lives in Accounting" />
          </div>
        </div>
      </section>
    </>
  );
}

function SettingsModule({
  audit,
  communities,
  createPartnershipProfile,
  crmAccountSettings,
  deletePartnershipProfile,
  saveCrmAccountSettings,
  services,
  updatePartnershipProfile,
  vendors,
}: {
  audit: AuditEntry[];
  communities: Community[];
  createPartnershipProfile: (draft: PartnershipProfileDraft) => boolean;
  crmAccountSettings: CrmAccountSettings;
  deletePartnershipProfile: (profileId: string) => void;
  saveCrmAccountSettings: (settings: CrmAccountSettings) => void;
  services: Service[];
  updatePartnershipProfile: (profileId: string, draft: PartnershipProfileDraft) => boolean;
  vendors: Vendor[];
}) {
  const [auditExpanded, setAuditExpanded] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<PartnershipProfileDraft>({
    address: '',
    homes: '',
    manager: 'RISE Residential Management',
    market: '',
    name: '',
    netIncome: '',
    occupied: '',
    plusMembers: '',
    servicePenetration: '',
  });
  const [settingsDraft, setSettingsDraft] = useState<CrmAccountSettings>(crmAccountSettings);

  useEffect(() => {
    const timer = setTimeout(() => setSettingsDraft(crmAccountSettings), 0);
    return () => clearTimeout(timer);
  }, [crmAccountSettings]);

  const latestAudit = audit[0];
  const readyPartnerships = communities.filter((community) => community.statementStatus === 'Ready').length;
  const updateProfileDraft = (field: keyof PartnershipProfileDraft, value: string) => {
    setProfileDraft((current) => ({ ...current, [field]: value }));
  };
  const updateSettingsDraft = (field: keyof CrmAccountSettings, value: string) => {
    setSettingsDraft((current) => ({ ...current, [field]: value }));
  };
  const resetProfileDraft = (manager = profileDraft.manager || 'RISE Residential Management') => {
    setEditingProfileId(null);
    setProfileDraft({
      address: '',
      homes: '',
      manager,
      market: '',
      name: '',
      netIncome: '',
      occupied: '',
      plusMembers: '',
      servicePenetration: '',
    });
  };
  const startProfileEdit = (community: Community) => {
    setEditingProfileId(community.id);
    setProfileDraft({
      address: community.address,
      homes: String(community.homes),
      manager: community.manager,
      market: community.market,
      name: community.name,
      netIncome: String(community.netIncome),
      occupied: String(community.occupied),
      plusMembers: String(community.plusMembers),
      servicePenetration: String(community.servicePenetration),
    });
  };
  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const profileSaved = editingProfileId
      ? updatePartnershipProfile(editingProfileId, profileDraft)
      : createPartnershipProfile(profileDraft);
    if (!profileSaved) return;
    resetProfileDraft();
  };
  const deleteProfile = (community: Community) => {
    const confirmed = window.confirm(`Delete ${community.name} from partnership profiles?`);
    if (!confirmed) return;
    deletePartnershipProfile(community.id);
    if (editingProfileId === community.id) resetProfileDraft();
  };

  return (
    <section className="settings-stack">
      <div className="table-panel setup-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Setup</p>
            <h2>Partnership and CRM account controls</h2>
            <p className="section-subtitle">Create partnership profiles and maintain the defaults that drive billing, onboarding, mobile catalog ownership, and support routing.</p>
          </div>
        </div>

        <div className="setup-overview-grid">
          <InfoTile label="Partnership profiles" value={`${communities.length} active / ${readyPartnerships} ready for statements`} />
          <InfoTile label="Vendor CRM" value={`${vendors.length} vendors / ${services.length} service lines`} />
          <InfoTile label="Default terms" value={crmAccountSettings.defaultPaymentTerms} />
          <InfoTile label="Platform mode" value={crmAccountSettings.accountMode} />
        </div>

        <div className="setup-control-grid">
          <form className="setup-form" onSubmit={submitProfile}>
            <div>
              <p className="eyebrow">Partnership profiles</p>
              <h3>{editingProfileId ? 'Edit profile' : 'Add profile'}</h3>
            </div>
            <div className="form-grid two">
              <label>
                Partnership name
                <input value={profileDraft.name} onChange={(event) => updateProfileDraft('name', event.target.value)} placeholder="Community or account name" />
              </label>
              <label>
                Market
                <input value={profileDraft.market} onChange={(event) => updateProfileDraft('market', event.target.value)} placeholder="City, ST" />
              </label>
              <label>
                Address
                <input value={profileDraft.address} onChange={(event) => updateProfileDraft('address', event.target.value)} placeholder="Primary property address" />
              </label>
              <label>
                Account owner
                <input value={profileDraft.manager} onChange={(event) => updateProfileDraft('manager', event.target.value)} placeholder="Ownership or management contact" />
              </label>
            </div>
            <div className="form-grid four">
              <label>
                Homes
                <input inputMode="numeric" value={profileDraft.homes} onChange={(event) => updateProfileDraft('homes', event.target.value)} placeholder="0" />
              </label>
              <label>
                Occupied
                <input inputMode="numeric" value={profileDraft.occupied} onChange={(event) => updateProfileDraft('occupied', event.target.value)} placeholder="0" />
              </label>
              <label>
                PLUS members
                <input inputMode="numeric" value={profileDraft.plusMembers} onChange={(event) => updateProfileDraft('plusMembers', event.target.value)} placeholder="0" />
              </label>
              <label>
                Monthly revenue
                <input inputMode="decimal" value={profileDraft.netIncome} onChange={(event) => updateProfileDraft('netIncome', event.target.value)} placeholder="0" />
              </label>
            </div>
            <label>
              Service penetration
              <input inputMode="decimal" value={profileDraft.servicePenetration} onChange={(event) => updateProfileDraft('servicePenetration', event.target.value)} placeholder="0 to 100" />
            </label>
            <div className="setup-form-actions">
              <button type="submit">{editingProfileId ? 'Save partnership profile' : 'Add partnership profile'}</button>
              {editingProfileId && (
                <button className="secondary-action" onClick={() => resetProfileDraft()} type="button">
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <form
            className="setup-form"
            onSubmit={(event) => {
              event.preventDefault();
              saveCrmAccountSettings(settingsDraft);
            }}
          >
            <div>
              <p className="eyebrow">CRM account settings</p>
              <h3>Platform defaults</h3>
            </div>
            <div className="form-grid two">
              <label>
                Billing contact
                <input value={settingsDraft.billingContact} onChange={(event) => updateSettingsDraft('billingContact', event.target.value)} />
              </label>
              <label>
                Accounting email
                <input value={settingsDraft.accountingEmail} onChange={(event) => updateSettingsDraft('accountingEmail', event.target.value)} />
              </label>
              <label>
                Payment terms
                <select value={settingsDraft.defaultPaymentTerms} onChange={(event) => updateSettingsDraft('defaultPaymentTerms', event.target.value)}>
                  <option>Due on receipt</option>
                  <option>Net 7</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                </select>
              </label>
              <label>
                Platform mode
                <select value={settingsDraft.accountMode} onChange={(event) => updateSettingsDraft('accountMode', event.target.value)}>
                  <option>Live operations</option>
                  <option>Setup mode</option>
                  <option>Paused intake</option>
                </select>
              </label>
              <label>
                Statement approver
                <input value={settingsDraft.statementApprover} onChange={(event) => updateSettingsDraft('statementApprover', event.target.value)} />
              </label>
              <label>
                Vendor onboarding owner
                <input value={settingsDraft.vendorOnboardingOwner} onChange={(event) => updateSettingsDraft('vendorOnboardingOwner', event.target.value)} />
              </label>
              <label>
                Mobile catalog owner
                <input value={settingsDraft.mobileCatalogOwner} onChange={(event) => updateSettingsDraft('mobileCatalogOwner', event.target.value)} />
              </label>
              <label>
                Support routing
                <input value={settingsDraft.supportRouting} onChange={(event) => updateSettingsDraft('supportRouting', event.target.value)} />
              </label>
            </div>
            <label>
              Required compliance documents
              <textarea rows={3} value={settingsDraft.documentRequirements} onChange={(event) => updateSettingsDraft('documentRequirements', event.target.value)} />
            </label>
            <button type="submit">Save account settings</button>
          </form>
        </div>

        <div className="partnership-profile-list" aria-label="Active partnership profiles">
          {communities.map((community) => (
            <div className={`partnership-profile-row ${editingProfileId === community.id ? 'editing' : ''}`} key={community.id}>
              <span>
                {community.name}
                <em>{community.market} / {community.manager}</em>
              </span>
              <strong>{community.statementStatus}</strong>
              <span>{community.plusMembers} PLUS</span>
              <span>{dollars(community.netIncome)}</span>
              <span className="partnership-profile-actions">
                <button className="secondary-action" onClick={() => startProfileEdit(community)} type="button">
                  Edit
                </button>
                <button className="danger-action" onClick={() => deleteProfile(community)} type="button">
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="table-panel audit-panel">
        <button
          aria-controls="settings-audit-history"
          aria-expanded={auditExpanded}
          className="audit-toggle"
          onClick={() => setAuditExpanded((current) => !current)}
          type="button"
        >
          <span>
            <span className="eyebrow">Audit history</span>
            <strong>Employee actions</strong>
            <em>{latestAudit ? `Latest: ${latestAudit.action} / ${latestAudit.time}` : 'No employee actions recorded'}</em>
          </span>
          <b>{auditExpanded ? 'Hide history' : `Show ${audit.length} actions`}</b>
        </button>
        {auditExpanded && (
          <div className="activity-list" id="settings-audit-history">
            {audit.map((entry) => (
              <div className="activity-row" key={entry.id}>
                <span>{entry.time}</span>
                <strong>{entry.action}</strong>
                <p>{entry.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function VendorMonthCloseoutPanel({
  highlightRecordId,
  invoiceMode = false,
  jobs,
  onOpenInvoices,
  processVendorMonth,
  vendors,
}: {
  highlightRecordId?: string | null;
  invoiceMode?: boolean;
  jobs: Job[];
  onOpenInvoices?: () => void;
  processVendorMonth?: (vendorId: string, monthKey: string) => void;
  vendors: Vendor[];
}) {
  const monthKey = currentMonthKey();
  const rows = buildVendorMonthRows(jobs, vendors, monthKey);
  const residentTotal = rows.reduce((sum, row) => sum + row.residentTotal, 0);
  const flairoPayout = rows.reduce((sum, row) => sum + row.flairoPayout, 0);
  const readyJobs = rows.reduce((sum, row) => sum + row.readyCount, 0);
  const waitingJobs = rows.reduce((sum, row) => sum + row.waitingCount, 0);

  return (
    <section
      className={`table-panel vendor-month-panel${invoiceMode ? ' invoice-mode' : ''}`}
      data-record-id={invoiceMode ? 'vendor-month-panel' : 'vendor-month-command'}
    >
      <div className="section-heading vendor-month-head">
        <div>
          <p className="eyebrow">{invoiceMode ? 'Vendor Billing' : 'Accounting snapshot'}</p>
          <h2>{invoiceMode ? `${labelMonth(monthKey)} vendor invoice statements` : `${labelMonth(monthKey)} vendor billing candidates`}</h2>
        </div>
        {onOpenInvoices && (
          <button type="button" onClick={onOpenInvoices}>
            Open Accounting
          </button>
        )}
      </div>

      <div className="vendor-month-summary">
        <InfoTile label="Active vendors" value={String(rows.length)} />
        <InfoTile label="Resident service total" value={dollars(residentTotal)} />
        <InfoTile label={invoiceMode ? 'Statement total due' : 'Potential FLAIRO payout'} value={dollars(flairoPayout)} />
        <InfoTile label="Recommended" value={String(readyJobs)} />
        <InfoTile label="Requires review" value={String(waitingJobs)} />
      </div>

      <div className="vendor-month-table" role="table" aria-label="current month vendor closeout">
        <div className="vendor-month-row header" role="row">
          <span>Vendor</span>
          <span>Jobs</span>
          <span>Resident cost</span>
          <span>FLAIRO payout</span>
          <span>Status</span>
          {invoiceMode && <span>Closeout</span>}
        </div>
        {rows.length ? rows.map((row) => {
          const canProcess = row.readyCount > 0;
          const buttonLabel = row.waitingCount && row.readyCount
            ? 'Review recommended'
            : row.readyCount
              ? 'Review invoice'
              : 'Waiting';

          return (
            <div
              className={`vendor-month-record${highlightRecordId === `vendor-month-${row.vendorId}` ? ' record-highlight' : ''}`}
              data-record-id={`vendor-month-${row.vendorId}`}
              key={row.vendorId}
            >
              <div className="vendor-month-row" role="row">
                <span>
                  <strong>{row.vendorName}</strong>
                  <em>{row.services}</em>
                </span>
                <span>{row.jobs.length}</span>
                <span>{dollars(row.residentTotal)}</span>
                <span>{dollars(row.flairoPayout)}</span>
                <span className={`month-status ${row.waitingCount ? 'waiting' : 'ready'}`}>
                  {row.waitingCount ? `${row.waitingCount} require review` : 'Recommended'}
                </span>
                {invoiceMode && (
                  <span>
                    <button
                      disabled={!canProcess}
                      onClick={() => processVendorMonth?.(row.vendorId, monthKey)}
                      type="button"
                    >
                      {buttonLabel}
                    </button>
                  </span>
                )}
              </div>
              {invoiceMode && (
                <div className="vendor-statement-detail" aria-label={`${row.vendorName} monthly statement job breakdown`}>
                  <div className="vendor-statement-job header">
                    <span>Job</span>
                    <span>Service</span>
                    <span>Service date</span>
                    <span>Resident paid</span>
                    <span>FLAIRO due</span>
                    <span>Status</span>
                  </div>
                  {row.jobs.map((job) => (
                    <div className="vendor-statement-job" key={job.id} data-record-id={`statement-job-${job.id}`}>
                      <strong>{job.id}</strong>
                      <span>{job.service}</span>
                      <span>{labelDateTimeShort(job.serviceDate)}</span>
                      <span>{dollars(job.amount)}</span>
                      <span>{dollars(job.flairoFee)}</span>
                      <span>{job.invoiceStatus}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }) : (
          <div className="vendor-month-empty">
            No current-month vendor jobs are awaiting accounting review.
          </div>
        )}
      </div>
    </section>
  );
}

function MetricGrid({
  activeMetricId,
  metrics,
  onSelectMetric,
}: {
  activeMetricId?: string;
  metrics: Metric[];
  onSelectMetric?: (metricId: string) => void;
}) {
  return (
    <section className="metric-grid" aria-label="business metrics">
      {metrics.map((metric) => (
        <button
          aria-pressed={metric.id ? activeMetricId === metric.id : undefined}
          className={`metric-card ${metric.id && activeMetricId === metric.id ? 'selected' : ''}`}
          disabled={!metric.id || !onSelectMetric}
          key={metric.label}
          onClick={() => metric.id && onSelectMetric?.(metric.id)}
          type="button"
        >
          <p>{metric.label}</p>
          <strong>{metric.value}</strong>
          <span>{metric.detail}</span>
        </button>
      ))}
    </section>
  );
}

function QueueRow({
  active,
  count,
  detail,
  label,
  onSelect,
  tone,
}: {
  active?: boolean;
  count: number;
  detail: string;
  label: string;
  onSelect?: () => void;
  tone: string;
}) {
  return (
    <button
      aria-pressed={active}
      className={`queue-row drill-trigger ${active ? 'selected' : ''}`}
      onClick={onSelect}
      type="button"
    >
      <span className={`queue-dot ${tone}`} />
      <div>
        <strong>{label}</strong>
        <p>{detail}</p>
      </div>
      <b>{count}</b>
    </button>
  );
}

function DocumentTile({
  count,
  expiresAt,
  label,
  status,
}: {
  count?: number;
  expiresAt?: string | null;
  label: string;
  status: DocumentStatus;
}) {
  return (
    <div className="doc-tile">
      <span>{label}</span>
      <strong className={status === 'Verified' ? 'good-text' : 'review-text'}>{status}</strong>
      <em>{count ? `${count} saved` : 'No file saved'}{expiresAt ? ` / expires ${labelInputDate(expiresAt)}` : ''}</em>
    </div>
  );
}

function JobTimer({ timer }: { timer: ReturnType<typeof getJobTimer> }) {
  return (
    <div className={`job-timer ${timer.tone}`}>
      <span>{timer.label}</span>
      <strong>{timer.value}</strong>
      <em>{timer.detail}</em>
    </div>
  );
}

function VendorTile({ vendor }: { vendor?: Vendor }) {
  return (
    <div className="info-tile vendor-info">
      <span>Vendor</span>
      <strong className={`vendor-name ${vendor ? vendorVisibilityClass(vendor) : ''}`}>
        {vendor?.name ?? 'Vendor not set'}
      </strong>
      {vendor && <em>{vendor.preferred ? 'Preferred first-right vendor' : vendor.rating >= 4.7 ? `Highly rated / ${vendor.rating.toFixed(1)}` : `Rating ${vendor.rating.toFixed(1)}`}</em>}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusPill({ label, status }: { label: string; status: string }) {
  return (
    <div className="status-pill">
      <span>{label}</span>
      <strong>{status}</strong>
    </div>
  );
}

function moduleTitle(activeModule: ModuleId) {
  return navSections.find((section) => section.id === activeModule)?.label ?? 'Command';
}

function accountingTabFromHighlight(highlightRecordId?: string | null): AccountingTab {
  if (highlightRecordId?.startsWith('statement-')) return 'partnership-statements';
  if (highlightRecordId?.includes('reconciliation')) return 'reconciliation-queue';
  return 'vendor-billing';
}

function vendorIdFromHighlight(highlightRecordId: string | null | undefined, vendors: Vendor[], fallback: string) {
  const match = highlightRecordId?.match(/^vendor-month-(.+)$/);
  if (match?.[1] && vendors.some((vendor) => vendor.id === match[1])) return match[1];
  return fallback;
}

function communityIdFromHighlight(highlightRecordId: string | null | undefined, communities: Community[], fallback: string) {
  const match = highlightRecordId?.match(/^statement-(.+)$/);
  if (match?.[1] && communities.some((community) => community.id === match[1])) return match[1];
  return fallback;
}

function addHours(isoDate: string, hours: number) {
  const timestamp = Date.parse(isoDate);
  const base = Number.isNaN(timestamp) ? Date.now() : timestamp;
  return new Date(base + hours * HOUR_MS).toISOString();
}

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsInputDate(inputDate: string, months: number) {
  const base = new Date(`${inputDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return inputDate;
  base.setMonth(base.getMonth() + months);
  return base.toISOString().slice(0, 10);
}

function labelDateTimeShort(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Date(timestamp).toLocaleString('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  });
}

function calculateAdoptionVelocityIndex(settings: RewardSettings) {
  const registration = normalizedRate(settings.registrationGrowthPercent, 10);
  const activation = normalizedRate(settings.activationRatePercent, 50);
  const firstService = normalizedRate(settings.firstServiceConversionPercent, 25);
  const repeatUse = normalizedRate(settings.repeatUseRatePercent, 30);
  return Math.round((registration * 0.4) + (activation * 0.3) + (firstService * 0.2) + (repeatUse * 0.1));
}

function normalizedRate(value: number, greenTarget: number) {
  if (greenTarget <= 0) return 0;
  return Math.max(0, Math.min(100, (value / greenTarget) * 100));
}

function calculateExpirationRisk(entries: RewardEntry[]) {
  const currentMonth = todayInputDate().slice(0, 7);
  const expiring = entries
    .filter(
      (entry) =>
        (entry.status === 'Available' || entry.status === 'Pending') &&
        entry.expirationDate?.startsWith(currentMonth),
    )
    .reduce((sum, entry) => sum + Math.abs(entry.points), 0);
  const saved = entries
    .filter((entry) => entry.redeemedInExpirationWindow)
    .reduce((sum, entry) => sum + Math.abs(entry.points), 0);
  const totalAtRisk = expiring + saved;
  if (!totalAtRisk) return 0;
  return Math.round((expiring / totalAtRisk) * 100);
}

function rewardProgramRecommendation(settings: RewardSettings, expirationRisk: number, adoptionIndex: number) {
  if (expirationRisk > 60) return 'Weak usage risk';
  if (adoptionIndex > settings.adoptionIndexPreviousMonth && settings.avgCxRating >= 4.5) return 'Growing well';
  if (adoptionIndex >= settings.adoptionIndexPreviousMonth) return 'Holding steady';
  return 'Watch adoption';
}

function blankVendorDraft(): VendorFormDraft {
  return {
    boardAccess: false,
    contact: '',
    contractExpiresAt: '',
    contractUploadQueued: false,
    dbaName: '',
    email: '',
    feePercent: '10',
    id: '',
    name: '',
    phone: '',
    physicalAddress: '',
    preferred: false,
    pricingNotes: '',
    serviceLocations: '',
    services: [],
  };
}

function vendorToDraft(vendor: Vendor): VendorFormDraft {
  return {
    boardAccess: vendor.boardAccess,
    contact: vendor.contact,
    contractExpiresAt: vendor.contractExpiresAt ?? '',
    contractUploadQueued: false,
    dbaName: vendor.dbaName,
    email: vendor.email,
    feePercent: String(vendor.feePercent),
    id: vendor.id,
    name: vendor.name,
    phone: vendor.phone,
    physicalAddress: vendor.physicalAddress,
    preferred: vendor.preferred,
    pricingNotes: vendor.pricingNotes,
    serviceLocations: (vendor.serviceLocations.length ? vendor.serviceLocations : vendor.markets).join('\n'),
    services: vendor.services,
  };
}

function splitListInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function documentTotal(vendor: Vendor) {
  return Object.values(vendor.documentCounts).reduce((sum, count) => sum + count, 0);
}

function averageRating(vendors: Vendor[]) {
  const ratedVendors = vendors.filter((vendor) => vendor.rating > 0);
  if (!ratedVendors.length) return 0;
  return ratedVendors.reduce((sum, vendor) => sum + vendor.rating, 0) / ratedVendors.length;
}

function vendorHasExpiringUpdate(vendor: Vendor) {
  return vendor.insurance === 'Expiring' ||
    vendor.contract === 'Expiring' ||
    dateWithinDays(vendor.contractExpiresAt, 60) ||
    vendor.documents.some(
      (document) =>
        (document.type === 'insurance' || document.type === 'contract') &&
        (document.status === 'Expiring' || dateWithinDays(document.expiresAt, 60)),
    );
}

function dateWithinDays(value: string | null, days: number) {
  if (!value) return false;
  const timestamp = Date.parse(value.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(timestamp)) return false;
  const diff = timestamp - Date.now();
  return diff >= 0 && diff <= days * 24 * HOUR_MS;
}

function labelInputDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatFileSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function vendorIdFromName(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `vendor-${Date.now()}`;
}

function profileIdFromName(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `partnership-${Date.now()}`;
}

function sortVendorsForBoard(a: Vendor, b: Vendor) {
  if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
  if (a.rating !== b.rating) return b.rating - a.rating;
  return a.name.localeCompare(b.name);
}

function vendorVisibilityClass(vendor: Vendor) {
  if (vendor.preferred) return 'preferred-vendor';
  if (vendor.rating >= 4.7) return 'high-rated-vendor';
  return '';
}

function paymentSummary(job: Pick<Job, 'vendorPaymentConfirmed' | 'residentPaymentConfirmed'>) {
  if (job.vendorPaymentConfirmed && job.residentPaymentConfirmed) return 'Paid by both sides';
  if (job.vendorPaymentConfirmed) return 'Vendor confirmed';
  if (job.residentPaymentConfirmed) return 'Resident confirmed';
  return 'Open payment confirmation';
}

function paymentDetail(job: Job) {
  if (job.paymentInquiryStatus) return job.paymentInquiryStatus;

  const details = [
    job.amountPaid ? dollars(job.amountPaid) : null,
    job.paymentDate ? labelDateTimeShort(job.paymentDate) : null,
    job.receiptNumber ? `Receipt ${job.receiptNumber}` : null,
  ].filter(Boolean);

  return details.length ? details.join(' / ') : 'Amount, date, and receipt pending';
}

function jobRecommendedForReconciliation(job: Job) {
  return job.boardStatus === 'Completed' && job.residentPaymentConfirmed;
}

function paymentVerificationSource(job: Job) {
  const sources: string[] = [];
  const receipt = job.receiptNumber?.toLowerCase() ?? '';
  if (receipt.includes('stripe')) sources.push('Stripe Confirmed');
  if (receipt.includes('admin')) sources.push('Admin Marked Paid');
  if (job.residentPaymentConfirmed) sources.push('Resident Marked Paid');
  if (job.vendorPaymentConfirmed) sources.push('Vendor Marked Paid');
  return sources.length ? sources.join(' / ') : 'Not verified';
}

function jobVendorBillingStatus(job: Job, invoice?: InvoiceTrigger) {
  if (invoice?.status === 'Paid' || job.invoiceStatus === 'Paid') return 'Paid';
  if (invoice?.status === 'Sent' || job.invoiceStatus === 'Sent') return 'Invoiced';
  if (invoice?.status === 'Draft queued' || invoice?.status === 'Ready' || job.invoiceStatus === 'Draft queued' || job.invoiceStatus === 'Ready') return 'Invoice Draft';
  if (job.invoiceStatus === 'Deferred' || job.invoiceStatus === 'Hold') return 'Deferred';
  if (job.invoiceStatus === 'Disputed') return 'Disputed';
  if (job.invoiceStatus === 'Archived') return 'Archived';
  return 'Not Invoiced';
}

function accountingMonthChoices(jobs: Job[], invoices: InvoiceTrigger[]) {
  const months = new Set<string>([currentMonthKey()]);
  jobs.forEach((job) => {
    if (/^\d{4}-\d{2}/.test(job.serviceDate)) months.add(job.serviceDate.slice(0, 7));
  });
  invoices.forEach((invoice) => {
    if (invoice.billingMonth && /^\d{4}-\d{2}$/.test(invoice.billingMonth)) months.add(invoice.billingMonth);
    else if (/^\d{4}-\d{2}/.test(invoice.dueDate)) months.add(invoice.dueDate.slice(0, 7));
  });
  partnershipPrograms.forEach((program) => months.add(program.period));
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

function buildVendorBillingCandidates(
  jobs: Job[],
  invoices: InvoiceTrigger[],
  vendorId: string,
  monthKey: string,
) {
  const activeInvoiceByJob = new Map(
    invoices
      .filter((invoice) => invoice.status !== 'Hold' && invoice.status !== 'Paid')
      .map((invoice) => [invoice.jobId, invoice]),
  );

  return jobs
    .filter((job) => {
      if (job.vendorId !== vendorId || job.invoiceStatus === 'Archived') return false;
      const serviceMonth = job.serviceDate.slice(0, 7);
      const activeInvoice = activeInvoiceByJob.get(job.id);
      const unresolved = job.invoiceStatus !== 'Sent' && job.invoiceStatus !== 'Paid';
      return serviceMonth === monthKey || (serviceMonth < monthKey && unresolved) || activeInvoice?.billingMonth === monthKey;
    })
    .sort((a, b) => {
      const readiness = Number(jobRecommendedForReconciliation(b)) - Number(jobRecommendedForReconciliation(a));
      if (readiness) return readiness;
      return b.serviceDate.localeCompare(a.serviceDate);
    });
}

function buildReconciliationItems(
  jobs: Job[],
  invoices: InvoiceTrigger[],
  communities: Community[],
  vendors: Vendor[] = [],
): ReconciliationItem[] {
  const invoiceByJob = new Map(
    invoices
      .filter((invoice) => invoice.status !== 'Hold')
      .map((invoice) => [invoice.jobId, invoice]),
  );
  const currentMonth = currentMonthKey();
  const jobItems = jobs
    .filter((job) => job.invoiceStatus !== 'Paid' && job.invoiceStatus !== 'Archived')
    .map((job) => {
      const invoice = invoiceByJob.get(job.id);
      const serviceMonth = job.serviceDate.slice(0, 7);
      const isPriorPeriod = /^\d{4}-\d{2}$/.test(serviceMonth) && serviceMonth < currentMonth;
      const reconciliationStatus = jobReconciliationStatus(job);
      const type = invoice?.status === 'Sent' || job.invoiceStatus === 'Sent'
        ? 'Payment Matching'
        : isPriorPeriod
          ? 'Prior-Period Adjustments'
          : 'Vendor Billing';
      return {
        ageLabel: ageFromDate(job.serviceDate),
        amount: job.flairoFee,
        billingCandidate: labelMonth(invoice?.billingMonth ?? currentMonth),
        id: `job-reconciliation-${job.id}`,
        item: `${job.id} / ${job.service}`,
        jobStatus: job.boardStatus,
        partner: communityName(job.communityId, communities),
        paymentStatus: paymentSummary(job),
        program: 'Preferred Vendor Referral',
        property: communityName(job.communityId, communities),
        reconciliationStatus,
        servicePeriod: labelMonth(serviceMonth),
        suggestedAction: reconciliationSuggestion(job, type),
        type,
        vendor: job.vendorId ? vendorName(job.vendorId, vendors) : 'Vendor not assigned',
      };
    });

  const programItems = partnershipPrograms
    .filter((program) => program.status !== 'Ready')
    .map((program) => ({
      ageLabel: 'Program review',
      amount: program.income,
      billingCandidate: labelMonth(program.period),
      id: `program-reconciliation-${program.id}`,
      item: `${program.name} / ${dollars(program.income)}`,
      jobStatus: program.status,
      partner: communityName(program.communityId, communities),
      paymentStatus: 'Program income review',
      program: program.name,
      property: communityName(program.communityId, communities),
      reconciliationStatus: 'Exception',
      servicePeriod: labelMonth(program.period),
      suggestedAction: 'Confirm GL code or defer',
      type: 'Partnership Statements',
      vendor: '',
    }));

  return [...jobItems, ...programItems].sort((a, b) => {
    if (a.reconciliationStatus !== b.reconciliationStatus) return a.reconciliationStatus.localeCompare(b.reconciliationStatus);
    return b.servicePeriod.localeCompare(a.servicePeriod);
  });
}

function jobReconciliationStatus(job: Job) {
  if (job.paymentInquiryStatus || job.invoiceStatus === 'Disputed' || job.boardStatus === 'Disputed') return 'Exception';
  if (job.invoiceStatus === 'Hold' || job.invoiceStatus === 'Deferred') return 'Deferred';
  if (job.invoiceStatus === 'Paid') return 'Reconciled';
  return 'Open';
}

function reconciliationSuggestion(job: Job, type: string) {
  if (!job.vendorId) return 'Return to job processing';
  if (type === 'Payment Matching') return 'Track payment';
  if (type === 'Prior-Period Adjustments') return 'Include on current invoice or defer';
  if (!jobRecommendedForReconciliation(job)) return 'Review and acknowledge or defer';
  return 'Include on invoice';
}

function statusTone(status: string) {
  if (status === 'Reconciled') return 'good';
  if (status === 'Exception') return 'hold';
  return 'review';
}

function ageFromDate(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return 'Date pending';
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / (24 * HOUR_MS)));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

function getJobTimer(job: Job, clock: number) {
  const requestedAt = parseTimestamp(job.requestedAt, clock);
  const claimedAt = job.claimedAt ? parseTimestamp(job.claimedAt, clock) : null;
  const scheduledAt = job.scheduledAt ? parseTimestamp(job.scheduledAt, clock) : null;
  const scheduleDueAt = job.scheduleDueAt ? parseTimestamp(job.scheduleDueAt, clock) : claimedAt ? claimedAt + 24 * HOUR_MS : null;

  if (job.boardStatus === 'Open') {
    return {
      detail: 'since resident request',
      label: 'Open unclaimed',
      tone: 'open',
      value: formatDuration(clock - requestedAt),
    };
  }

  if (job.boardStatus === 'Claimed') {
    const startedAt = claimedAt ?? requestedAt;
    const dueText = scheduleDueAt && scheduleDueAt > clock
      ? `${formatDuration(scheduleDueAt - clock)} left`
      : 'Schedule due now';

    return {
      detail: dueText,
      label: 'Schedule timer',
      tone: scheduleDueAt && scheduleDueAt <= clock ? 'late' : 'claimed',
      value: formatDuration(clock - startedAt),
    };
  }

  if (job.boardStatus === 'Scheduled') {
    const startedAt = claimedAt ?? requestedAt;
    const stoppedAt = scheduledAt ?? startedAt;

    return {
      detail: 'claim to schedule',
      label: 'Scheduled in',
      tone: 'done',
      value: formatDuration(stoppedAt - startedAt),
    };
  }

  return {
    detail: 'finalized',
    label: 'Completed',
    tone: 'done',
    value: job.scheduledAt ? formatDuration(clock - parseTimestamp(job.scheduledAt, clock)) : 'Done',
  };
}

function parseTimestamp(value: string | null | undefined, fallback: number) {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(timestamp) ? fallback : timestamp;
}

function formatDuration(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / MINUTE_MS));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function buildVendorMonthRows(jobs: Job[], vendors: Vendor[], monthKey: string): VendorMonthRow[] {
  return vendors
    .map((vendor) => {
      const monthJobs = jobs.filter(
        (job) =>
          job.vendorId === vendor.id &&
          job.invoiceStatus !== 'Sent' &&
          job.invoiceStatus !== 'Paid' &&
          job.invoiceStatus !== 'Archived' &&
          jobInMonth(job, monthKey),
      );
      const services = Array.from(new Set(monthJobs.map((job) => job.service))).join(', ');

      return {
        flairoPayout: monthJobs.reduce((sum, job) => sum + job.flairoFee, 0),
        jobs: monthJobs,
        readyCount: monthJobs.filter(jobRecommendedForReconciliation).length,
        residentTotal: monthJobs.reduce((sum, job) => sum + job.amount, 0),
        services,
        vendorId: vendor.id,
        vendorName: vendor.name,
        waitingCount: monthJobs.filter((job) => !jobRecommendedForReconciliation(job)).length,
      };
    })
    .filter((row) => row.jobs.length > 0)
    .sort((a, b) => b.flairoPayout - a.flairoPayout);
}

function buildOpenVendorStatements(
  invoices: InvoiceTrigger[],
  jobs: Job[],
  vendors: Vendor[],
): OpenVendorStatement[] {
  const groups = new Map<string, OpenVendorStatement & { dueDates: string[] }>();

  invoices.forEach((invoice) => {
    if (invoice.status === 'Paid' || invoice.status === 'Hold') return;
    const vendor = vendors.find((item) => item.id === invoice.vendorId);
    if (!vendor) return;

    const monthKey = invoiceStatementMonth(invoice, jobs);
    const key = `${invoice.vendorId}-${monthKey}`;
    const existing = groups.get(key);
    const job = jobs.find((item) => item.id === invoice.jobId);
    const nextGroup = existing ?? {
      amount: 0,
      dueDates: [],
      dueLabel: 'Manual follow-up',
      invoices: [],
      jobCount: 0,
      jobs: [],
      monthKey,
      status: 'Ready to send',
      vendor,
    };

    nextGroup.amount += invoice.amount;
    nextGroup.invoices.push(invoice);
    nextGroup.jobCount += 1;
    if (job) nextGroup.jobs.push(job);
    if (invoice.dueDate) nextGroup.dueDates.push(invoice.dueDate);
    groups.set(key, nextGroup);
  });

  return Array.from(groups.values())
    .map((group) => ({
      amount: group.amount,
      dueLabel: labelInvoiceDue(group.dueDates),
      invoices: group.invoices,
      jobCount: group.jobCount,
      jobs: group.jobs,
      monthKey: group.monthKey,
      status: openStatementStatus(group.invoices),
      vendor: group.vendor,
    }))
    .sort((a, b) => {
      if (a.monthKey !== b.monthKey) return b.monthKey.localeCompare(a.monthKey);
      return b.amount - a.amount;
    });
}

function invoiceStatementMonth(invoice: InvoiceTrigger, jobs: Job[]) {
  if (invoice.billingMonth && /^\d{4}-\d{2}$/.test(invoice.billingMonth)) return invoice.billingMonth;
  const job = jobs.find((item) => item.id === invoice.jobId);
  const sourceDate = job?.serviceDate || invoice.dueDate;
  return /^\d{4}-\d{2}/.test(sourceDate) ? sourceDate.slice(0, 7) : currentMonthKey();
}

function openStatementStatus(invoices: InvoiceTrigger[]) {
  const statuses = new Set(invoices.map((invoice) => invoice.status));
  if (statuses.has('Sent')) return 'Sent unpaid';
  if (statuses.has('Draft queued')) return 'Draft unpaid';
  if (statuses.has('Ready')) return 'Ready to send';
  return 'Waiting review';
}

function labelInvoiceDue(dueDates: string[]) {
  const dated = dueDates
    .filter((dueDate) => /^\d{4}-\d{2}-\d{2}/.test(dueDate))
    .sort()[0];
  if (dated) return labelDateTimeShort(dated);
  return dueDates.find(Boolean) ?? 'Manual follow-up';
}


function currentMonthKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

function jobInMonth(job: Job, monthKey: string) {
  return job.serviceDate.startsWith(monthKey);
}

function labelMonth(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function vendorName(vendorId: string, vendors: Vendor[]) {
  return vendors.find((vendor) => vendor.id === vendorId)?.name ?? 'Vendor not set';
}

function communityName(communityId: string, communities: Community[]) {
  return communities.find((community) => community.id === communityId)?.name ?? 'Community not set';
}
