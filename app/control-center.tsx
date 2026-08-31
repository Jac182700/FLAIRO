'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

type ModuleId =
  | 'command'
  | 'mobile'
  | 'vendors'
  | 'board'
  | 'tasks'
  | 'rewards'
  | 'invoices'
  | 'reports'
  | 'settings';

type VendorStatus = 'Compliant' | 'Review needed' | 'Pending onboarding';
type DocumentStatus = 'Verified' | 'Under review' | 'Needs upload' | 'Expiring';
type VendorDocumentType = 'insurance' | 'license' | 'w9' | 'contract';
type BoardStatus = 'Open' | 'Claimed' | 'Scheduled' | 'Completed';
type InvoiceStatus = 'Waiting' | 'Ready' | 'Draft queued' | 'Sent' | 'Paid' | 'Hold';
type StatementStatus = 'Draft' | 'Ready' | 'Issued';
type RewardStatus = 'Pending' | 'Available' | 'Redeemed' | 'Reversed' | 'Expired';

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

type InvoiceTrigger = {
  id: string;
  jobId: string;
  vendorId: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  reference: string;
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
  { id: 'invoices', label: 'Invoices' },
  { id: 'reports', label: 'Community Reports' },
  { id: 'settings', label: 'Settings' },
];

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

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

const initialInvoices: InvoiceTrigger[] = [
  {
    id: 'INV-Q-2208',
    jobId: 'J-1050',
    vendorId: 'pink-palm',
    amount: 2.7,
    status: 'Ready',
    dueDate: '2026-09-07',
    reference: 'Ready for monthly vendor statement',
  },
  {
    id: 'INV-Q-2209',
    jobId: 'J-1038',
    vendorId: 'sparkle',
    amount: 118.4,
    status: 'Draft queued',
    dueDate: '2026-09-05',
    reference: 'Added to vendor monthly statement',
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
    const invoiceQueue = invoices
      .filter((invoice) => invoice.status === 'Ready' || invoice.status === 'Draft queued')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    return [
      { id: 'metric-board-jobs', label: 'Vendor-visible jobs', value: String(openBoard), detail: 'Open resident requests' },
      { id: 'metric-controlled-tasks', label: 'FLAIRO controlled tasks', value: String(controlledTasks), detail: 'Claimed, scheduled, or complete' },
      { id: 'metric-compliant-vendors', label: 'Compliant vendors', value: `${compliant}/${vendors.length}`, detail: 'Board access eligible' },
      { id: 'metric-reward-liability', label: 'Plume Point liability', value: dollars(rewardLiability), detail: 'Pending redemption value' },
      { id: 'metric-invoice-queue', label: 'Statement queue', value: dollars(invoiceQueue), detail: 'Vendor fee records waiting for monthly closeout' },
      { id: 'metric-plus-memberships', label: 'PLUS memberships', value: '182', detail: 'Across active communities' },
    ];
  }, [invoices, jobs, rewardSettings, rewards, vendors]);

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

  const markDocumentUploaded = (vendorId: string, document: VendorDocumentType) => {
    const documentLabels: Record<VendorDocumentType, string> = {
      contract: 'FLAIRO contract',
      insurance: 'Insurance',
      license: 'Business license',
      w9: 'W-9',
    };

    setVendors((current) =>
      current.map((vendor) =>
        vendor.id === vendorId
          ? {
              ...vendor,
              [document]: vendor[document] === 'Verified' ? 'Verified' : 'Under review',
              documentCounts: {
                ...vendor.documentCounts,
                [document]: (vendor.documentCounts[document] ?? 0) + 1,
              },
              stage: `${documentLabels[document]} uploaded for review`,
              status: vendor.status === 'Compliant' ? 'Compliant' : 'Review needed',
            }
          : vendor,
      ),
    );
    addAudit('Vendor document', `Compliance document uploaded for ${vendorName(vendorId, vendors)}.`);
    void persistAction('upload_document', { documentType: document, vendorId });
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
      openModuleRecord('invoices', `vendor-month-${existingInvoice.vendorId}`);
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
    openModuleRecord('invoices', `vendor-month-${job.vendorId}`);
    void persistAction('trigger_invoice', { jobId });
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

  const processVendorMonth = (vendorId: string, monthKey: string) => {
    const readyJobs = jobs.filter(
      (job) =>
        job.vendorId === vendorId &&
        jobInMonth(job, monthKey) &&
        job.invoiceStatus !== 'Sent' &&
        job.invoiceStatus !== 'Paid' &&
        jobInvoiceActionable(job),
    );
    if (!readyJobs.length) {
      addAudit('Month closeout waiting', `${vendorName(vendorId, vendors)} has no invoice-ready jobs for ${labelMonth(monthKey)}.`);
      return;
    }

    const readyJobIds = new Set(readyJobs.map((job) => job.id));
    setJobs((current) =>
      current.map((job) =>
        readyJobIds.has(job.id) ? { ...job, invoiceStatus: 'Sent' } : job,
      ),
    );
    setInvoices((current) =>
      current.map((invoice) =>
        readyJobIds.has(invoice.jobId)
          ? { ...invoice, status: 'Sent', reference: 'Included on vendor monthly statement' }
          : invoice,
      ),
    );
    addAudit('Vendor month processed', `${vendorName(vendorId, vendors)} ${labelMonth(monthKey)} monthly statement processed; job-level tally reset.`);
    void persistAction('process_vendor_month', { monthKey, vendorId });
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

  const markStatementIssued = (communityId: string) => {
    setCommunities((current) =>
      current.map((community) =>
        community.id === communityId ? { ...community, statementStatus: 'Issued' } : community,
      ),
    );
    addAudit('Statement issued', `${communityName(communityId, communities)} statement marked issued.`);
    void persistAction('mark_statement_issued', { communityId });
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
            markDocumentUploaded={markDocumentUploaded}
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

        {activeModule === 'invoices' && (
          <InvoicesModule
            invoices={invoices}
            jobs={jobs}
            highlightRecordId={activeModule === 'invoices' ? focusTarget?.recordId : null}
            markVendorStatementPaid={markVendorStatementPaid}
            processVendorMonth={processVendorMonth}
            triggerInvoice={triggerInvoice}
            vendors={vendors}
          />
        )}

        {activeModule === 'reports' && (
          <ReportsModule
            communities={communities}
            highlightRecordId={activeModule === 'reports' ? focusTarget?.recordId : null}
            markStatementIssued={markStatementIssued}
          />
        )}

        {activeModule === 'settings' && (
          <SettingsModule audit={audit} services={services} vendors={vendors} />
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
  const readyInvoiceJobs = jobs.filter(
    (job) =>
      job.vendorId &&
      job.invoiceStatus === 'Ready' &&
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
    action: { label: 'Open report', module: 'reports', recordId: `statement-${community.id}` },
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
      action: { label: 'Process', module: 'invoices' as ModuleId, recordId: `vendor-month-${job.vendorId}` },
      cells: [
        job.id,
        job.vendorId ? vendorName(job.vendorId, vendors) : 'Vendor needed',
        'Ready for monthly statement',
        dollars(job.flairoFee),
      ],
      id: `invoice-ready-${job.id}`,
    })),
    ...invoiceQueue.map((invoice) => ({
      action: { label: 'Open statement', module: 'invoices' as ModuleId, recordId: `vendor-month-${invoice.vendorId}` },
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
      label: 'Statements ready',
      count: String(priorityStatementRows.length),
      detail: 'Community income reports ready to review, export, or mark issued.',
      rows: priorityStatementRows,
    },
    {
      id: 'priority-invoices',
      label: 'Vendor invoice statements',
      count: String(priorityInvoiceRows.length),
      detail: 'Completed jobs and invoice records that should roll into monthly vendor statements.',
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
      label: 'Statement queue',
      count: dollars(invoiceQueue.reduce((sum, invoice) => sum + invoice.amount, 0)),
      detail: 'Vendor fee records waiting for or already queued to monthly closeout.',
      rows: invoiceQueue.map((invoice) => ({
        action: { label: 'Open statement', module: 'invoices', recordId: `vendor-month-${invoice.vendorId}` },
        cells: [
          invoice.id,
          invoice.jobId,
          vendorName(invoice.vendorId, vendors),
          `${invoice.status} / ${dollars(invoice.amount)}`,
        ],
        id: `metric-invoice-${invoice.id}`,
      })),
    },
    {
      id: 'metric-plus-memberships',
      label: 'PLUS memberships',
      count: String(communities.reduce((sum, community) => sum + community.plusMembers, 0)),
      detail: 'Paid recurring FLAIRO PLUS memberships by community.',
      rows: communities.map((community) => ({
        action: { label: 'Open report', module: 'reports', recordId: `statement-${community.id}` },
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
        onOpenInvoices={() => onOpenRecord('invoices', 'vendor-month-panel')}
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
  markDocumentUploaded,
  saveVendorProfile,
  services,
  vendors,
}: {
  approveVendor: (vendorId: string) => void;
  highlightRecordId?: string | null;
  markDocumentUploaded: (vendorId: string, document: VendorDocumentType) => void;
  saveVendorProfile: (draft: VendorFormDraft) => boolean;
  services: Service[];
  vendors: Vendor[];
}) {
  const [vendorDialog, setVendorDialog] = useState<{ mode: 'add' | 'edit'; draft: VendorFormDraft } | null>(null);

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

  const submitVendorProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (vendorDialog && saveVendorProfile(vendorDialog.draft)) setVendorDialog(null);
  };

  return (
    <>
      <MetricGrid
        metrics={[
          {
            label: 'Active vendor pool',
            value: String(vendors.filter((vendor) => vendor.boardAccess).length),
            detail: 'Can claim work now',
          },
          {
            label: 'Compliance review',
            value: String(vendors.filter((vendor) => vendor.status !== 'Compliant').length),
            detail: 'Needs document or approval',
          },
          {
            label: 'Avg. vendor rating',
            value: '4.7',
            detail: 'From completed FLAIRO jobs',
          },
          {
            label: 'Vendor-specific fees',
            value: 'Per vendor',
            detail: 'Agreed FLAIRO share lives on each profile',
          },
        ]}
      />

      <section className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vendor CRM and compliance</p>
            <h2>Onboarding, documents, and job-board access</h2>
          </div>
          <div className="section-actions">
            <button type="button" onClick={() => setVendorDialog({ mode: 'add', draft: blankVendorDraft() })}>
              Add vendor
            </button>
            <button className="secondary-action" type="button">Invite vendor</button>
          </div>
        </div>
        <div className="vendor-list">
          {vendors.map((vendor) => (
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
                    onClick={() => setVendorDialog({ mode: 'edit', draft: vendorToDraft(vendor) })}
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
                <span>Rating {vendor.rating.toFixed(1)}</span>
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
                    onChange={() => markDocumentUploaded(vendor.id, 'insurance')}
                    type="file"
                  />
                  Upload insurance
                </label>
                <label className="file-upload secondary">
                  <input
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={() => markDocumentUploaded(vendor.id, 'license')}
                    type="file"
                  />
                  Upload license
                </label>
                <label className="file-upload">
                  <input
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={() => markDocumentUploaded(vendor.id, 'w9')}
                    type="file"
                  />
                  Upload W-9
                </label>
                <label className="file-upload secondary">
                  <input
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={() => markDocumentUploaded(vendor.id, 'contract')}
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

function InvoicesModule({
  highlightRecordId,
  invoices,
  jobs,
  markVendorStatementPaid,
  processVendorMonth,
  triggerInvoice,
  vendors,
}: {
  highlightRecordId?: string | null;
  invoices: InvoiceTrigger[];
  jobs: Job[];
  markVendorStatementPaid: (vendorId: string, monthKey: string) => void;
  processVendorMonth: (vendorId: string, monthKey: string) => void;
  triggerInvoice: (jobId: string) => void;
  vendors: Vendor[];
}) {
  const activeInvoices = invoices.filter((invoice) => invoice.status !== 'Hold' && invoice.status !== 'Paid');
  const queuedJobIds = new Set(activeInvoices.map((invoice) => invoice.jobId));
  const openStatements = buildOpenVendorStatements(invoices, jobs, vendors);
  const readyJobs = jobs.filter(
    (job) =>
      job.invoiceStatus !== 'Sent' &&
      job.invoiceStatus !== 'Paid' &&
      jobInvoiceActionable(job) &&
      !queuedJobIds.has(job.id),
  );

  return (
    <>
      <section className="section-band">
        <div>
          <p className="eyebrow">Invoice processing</p>
          <h2>Job fee records roll into one monthly vendor statement for FLAIRO invoicing.</h2>
        </div>
        <div className="integration-strip">
          <StatusPill label="Bluevine account" status="Monthly statement draft" />
          <StatusPill label="Resident payment" status="Vendor direct" />
          <StatusPill label="Closeout" status="Vendor-by-vendor" />
        </div>
      </section>

      <VendorMonthCloseoutPanel
        highlightRecordId={highlightRecordId}
        invoiceMode
        jobs={jobs}
        processVendorMonth={processVendorMonth}
        vendors={vendors}
      />

      <section className="split-grid">
        <div className="table-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Ready jobs</p>
              <h2>Add job records to monthly statements</h2>
            </div>
          </div>
          <div className="task-stack compact">
            {readyJobs.length ? readyJobs.map((job) => (
              <article
                className={`invoice-ready-row${highlightRecordId === `invoice-ready-${job.id}` ? ' record-highlight' : ''}`}
                data-record-id={`invoice-ready-${job.id}`}
                key={job.id}
              >
                <div>
                  <strong>{job.id} / {job.service}</strong>
                  <p>{job.vendorId ? vendorName(job.vendorId, vendors) : 'Vendor needed'} monthly statement item: {dollars(job.flairoFee)}</p>
                </div>
                <button type="button" onClick={() => triggerInvoice(job.id)}>
                  Add to statement
                </button>
              </article>
            )) : <p className="empty-note">No jobs are invoice-ready right now.</p>}
          </div>
        </div>

        <div className="table-panel open-statement-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Open unpaid statements</p>
              <h2>Running vendor invoice statements</h2>
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
                    <p>{labelMonth(statement.monthKey)} / {statement.jobCount} job record{statement.jobCount === 1 ? '' : 's'}</p>
                  </div>
                  <strong>{dollars(statement.amount)}</strong>
                </div>
                <div className="open-statement-facts">
                  <InfoTile label="Statement status" value={statement.status} />
                  <InfoTile label="Due / follow-up" value={statement.dueLabel} />
                  <InfoTile label="Collection" value="Managed manually until Bluevine connection" />
                </div>
                <div className="open-statement-items" aria-label={`${statement.vendor.name} unpaid statement job records`}>
                  <div className="open-statement-item header">
                    <span>Invoice</span>
                    <span>Job</span>
                    <span>Service</span>
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
                        <span>{job?.service ?? invoice.reference}</span>
                        <strong>{dollars(invoice.amount)}</strong>
                      </div>
                    );
                  })}
                </div>
                <button type="button" onClick={() => markVendorStatementPaid(statement.vendor.id, statement.monthKey)}>
                  Mark paid manually
                </button>
              </article>
            )) : <p className="empty-note">No open unpaid vendor statements right now.</p>}
          </div>
        </div>
      </section>
    </>
  );
}

function ReportsModule({
  communities,
  highlightRecordId,
  markStatementIssued,
}: {
  communities: Community[];
  highlightRecordId?: string | null;
  markStatementIssued: (communityId: string) => void;
}) {
  return (
    <>
      <MetricGrid
        metrics={[
          {
            label: 'Serviced communities',
            value: String(communities.length),
            detail: 'Active FLAIRO reporting locations',
          },
          {
            label: 'Net income this month',
            value: dollars(communities.reduce((sum, community) => sum + community.netIncome, 0)),
            detail: 'Community statement basis',
          },
          {
            label: 'Occupied homes',
            value: communities.reduce((sum, community) => sum + community.occupied, 0).toLocaleString(),
            detail: 'Statement denominator',
          },
          {
            label: 'Avg. penetration',
            value: percent(communities.reduce((sum, community) => sum + community.servicePenetration, 0) / communities.length),
            detail: 'Homes enrolled or transacting',
          },
        ]}
      />

      <section className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Community financial reporting</p>
            <h2>Monthly statement control</h2>
          </div>
          <button type="button">Export statement set</button>
        </div>
        <div className="statement-grid">
          {communities.map((community) => (
            <article
              className={`statement-card${highlightRecordId === `statement-${community.id}` ? ' record-highlight' : ''}`}
              data-record-id={`statement-${community.id}`}
              key={community.id}
            >
              <div>
                <span className={community.statementStatus === 'Issued' ? 'status good' : 'status review'}>
                  {community.statementStatus}
                </span>
                <h3>{community.name}</h3>
                <p>{community.address} / {community.manager}</p>
              </div>
              <div className="statement-numbers">
                <InfoTile label="Homes / occupied" value={`${community.homes} / ${community.occupied}`} />
                <InfoTile label="Program penetration" value={percent(community.servicePenetration)} />
                <InfoTile label="PLUS members" value={String(community.plusMembers)} />
                <InfoTile label="Net ancillary income" value={dollars(community.netIncome)} />
              </div>
              <button type="button" onClick={() => markStatementIssued(community.id)}>
                Mark statement issued
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="statement-strip">
        <div>
          <p className="eyebrow gold">Statement format source</p>
          <h2>Ancillary income statement model</h2>
          <p>
            The reporting model follows the supplied FLAIRO workbook: property details, service period, gross revenue, vendor remittance, adjustments, net deposit, Plume Point liability, and community-facing tie-outs.
          </p>
        </div>
        <div className="statement-checklist" aria-label="statement controls">
          <span>Property tie-out</span>
          <span>Service period</span>
          <span>Vendor remittance</span>
          <span>Plume Point liability</span>
          <span>Net deposit</span>
        </div>
      </section>
    </>
  );
}

function SettingsModule({
  audit,
  services,
  vendors,
}: {
  audit: AuditEntry[];
  services: Service[];
  vendors: Vendor[];
}) {
  return (
    <section className="split-grid">
      <div className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Integration model</p>
            <h2>Systems this control center governs</h2>
          </div>
        </div>
        <div className="rule-list">
          <InfoTile label="Resident mobile application" value="Service catalog, booking options, PLUS pricing, Plume Point rules, and resident request intake" />
          <InfoTile label="Vendor portal" value="Onboarding, document upload, job board access, claim lock, schedule confirmation" />
          <InfoTile label="FLAIRO CRM" value={`${vendors.length} vendors, ${services.length} service lines, community reporting, audit history`} />
          <InfoTile label="Bluevine invoice queue" value="Job fee records roll into one monthly vendor statement for Bluevine invoice processing" />
          <InfoTile label="Compliance storage" value="Insurance, business license, W-9, review status, expiration dates" />
        </div>
      </div>

      <div className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Audit history</p>
            <h2>Employee actions</h2>
          </div>
        </div>
        <div className="activity-list">
          {audit.map((entry) => (
            <div className="activity-row" key={entry.id}>
              <span>{entry.time}</span>
              <strong>{entry.action}</strong>
              <p>{entry.detail}</p>
            </div>
          ))}
        </div>
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
          <p className="eyebrow">{invoiceMode ? 'Month-end invoicing' : 'Current month vendor activity'}</p>
          <h2>{invoiceMode ? `${labelMonth(monthKey)} vendor invoice statements` : `${labelMonth(monthKey)} vendor income closeout`}</h2>
        </div>
        {onOpenInvoices && (
          <button type="button" onClick={onOpenInvoices}>
            Open month-end invoices
          </button>
        )}
      </div>

      <div className="vendor-month-summary">
        <InfoTile label="Active vendors" value={String(rows.length)} />
        <InfoTile label="Resident service total" value={dollars(residentTotal)} />
        <InfoTile label={invoiceMode ? 'Statement total due' : 'Potential FLAIRO payout'} value={dollars(flairoPayout)} />
        <InfoTile label="Ready to invoice" value={String(readyJobs)} />
        <InfoTile label="Waiting on service" value={String(waitingJobs)} />
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
            ? 'Process ready'
            : row.readyCount
              ? 'Mark processed'
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
                  {row.waitingCount ? `${row.waitingCount} waiting` : 'Ready for closeout'}
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
            All current-month vendor invoices have been processed. The tally will begin again as new work is booked or completed.
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

function labelInputDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function vendorIdFromName(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `vendor-${Date.now()}`;
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
          job.boardStatus !== 'Open' &&
          job.invoiceStatus !== 'Sent' &&
          job.invoiceStatus !== 'Paid' &&
          jobInMonth(job, monthKey),
      );
      const services = Array.from(new Set(monthJobs.map((job) => job.service))).join(', ');

      return {
        flairoPayout: monthJobs.reduce((sum, job) => sum + job.flairoFee, 0),
        jobs: monthJobs,
        readyCount: monthJobs.filter(jobInvoiceActionable).length,
        residentTotal: monthJobs.reduce((sum, job) => sum + job.amount, 0),
        services,
        vendorId: vendor.id,
        vendorName: vendor.name,
        waitingCount: monthJobs.filter((job) => !jobInvoiceActionable(job)).length,
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

function jobInvoiceActionable(job: Job) {
  return job.invoiceStatus !== 'Paid' && (
    job.invoiceStatus === 'Ready' ||
    job.invoiceStatus === 'Draft queued' ||
    job.boardStatus === 'Completed'
  );
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
