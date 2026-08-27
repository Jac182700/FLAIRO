'use client';

import { useEffect, useMemo, useState } from 'react';

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
type BoardStatus = 'Open' | 'Claimed' | 'Scheduled' | 'Completed';
type InvoiceStatus = 'Waiting' | 'Ready' | 'Draft queued' | 'Sent' | 'Hold';
type StatementStatus = 'Draft' | 'Ready' | 'Issued';

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
  contact: string;
  email: string;
  phone: string;
  markets: string[];
  services: string[];
  status: VendorStatus;
  boardAccess: boolean;
  insurance: DocumentStatus;
  license: DocumentStatus;
  w9: DocumentStatus;
  feePercent: number;
  stage: string;
  rating: number;
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
  invoiceStatus: InvoiceStatus;
};

type RewardEntry = {
  id: string;
  resident: string;
  communityId: string;
  source: string;
  status: 'Pending' | 'Available' | 'Redeemed' | 'Reversed' | 'Expired';
  points: number;
  value: number;
  note: string;
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
  rows: string[][];
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

type FlairoState = {
  audit: AuditEntry[];
  communities: Community[];
  invoices: InvoiceTrigger[];
  jobs: Job[];
  mobileSync: MobileSync;
  rewards: RewardEntry[];
  services: Service[];
  vendors: Vendor[];
};

const navSections: Array<{ id: ModuleId; label: string }> = [
  { id: 'command', label: 'Command' },
  { id: 'mobile', label: 'Mobile Controls' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'board', label: 'Job Board' },
  { id: 'tasks', label: 'Open Tasks' },
  { id: 'rewards', label: 'Rewards' },
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

const initialInvoices: InvoiceTrigger[] = [
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
    detail: 'J-1050 passed service date and entered the Bluevine draft queue.',
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
  viewerEmail,
  viewerName,
}: {
  viewerEmail: string;
  viewerName: string;
}) {
  const [activeModule, setActiveModule] = useState<ModuleId>('command');
  const [services, setServices] = useState<Service[]>(initialServices);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [rewards, setRewards] = useState<RewardEntry[]>(initialRewards);
  const [invoices, setInvoices] = useState<InvoiceTrigger[]>(initialInvoices);
  const [communities, setCommunities] = useState<Community[]>(initialCommunities);
  const [audit, setAudit] = useState<AuditEntry[]>(initialAudit);
  const [mobileSync, setMobileSync] = useState<MobileSync>(initialMobileSync);
  const [syncStatus, setSyncStatus] = useState('Checking live app bridge');
  const [mobilePushStatus, setMobilePushStatus] = useState('Push to mobile app');
  const [clock, setClock] = useState(() => Date.now());

  const applyServerState = (state: Partial<FlairoState>) => {
    if (state.audit) setAudit(state.audit);
    if (state.communities) setCommunities(state.communities);
    if (state.invoices) setInvoices(state.invoices);
    if (state.jobs) setJobs(state.jobs);
    if (state.mobileSync) setMobileSync(state.mobileSync);
    if (state.rewards) setRewards(state.rewards);
    if (state.services) setServices(state.services);
    if (state.vendors) setVendors(state.vendors);
  };

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const loadState = () => {
      fetch('/api/flairo')
        .then((response) => {
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
    timer = setInterval(loadState, 15000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), MINUTE_MS);
    return () => clearInterval(timer);
  }, []);

  const persistAction = async (action: string, payload: Record<string, string>) => {
    setSyncStatus('Autosaving to control center');
    try {
      const response = await fetch('/api/flairo', {
        body: JSON.stringify({ action, payload }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
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
      .filter((entry) => entry.status === 'Available' || entry.status === 'Pending')
      .reduce((sum, entry) => sum + entry.value, 0);
    const invoiceQueue = invoices
      .filter((invoice) => invoice.status === 'Ready' || invoice.status === 'Draft queued')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    return [
      { id: 'metric-board-jobs', label: 'Vendor-visible jobs', value: String(openBoard), detail: 'Open resident requests' },
      { id: 'metric-controlled-tasks', label: 'FLAIRO controlled tasks', value: String(controlledTasks), detail: 'Claimed, scheduled, or complete' },
      { id: 'metric-compliant-vendors', label: 'Compliant vendors', value: `${compliant}/${vendors.length}`, detail: 'Board access eligible' },
      { id: 'metric-reward-liability', label: 'Rewards liability', value: dollars(rewardLiability), detail: 'Pending and available points' },
      { id: 'metric-invoice-queue', label: 'Invoice trigger queue', value: dollars(invoiceQueue), detail: 'Bluevine draft requests' },
      { id: 'metric-plus-memberships', label: 'PLUS memberships', value: '182', detail: 'Across active communities' },
    ];
  }, [invoices, jobs, rewards, vendors]);

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

  const markDocumentUploaded = (vendorId: string, document: 'insurance' | 'license') => {
    setVendors((current) =>
      current.map((vendor) =>
        vendor.id === vendorId
          ? {
              ...vendor,
              [document]: vendor[document] === 'Verified' ? 'Verified' : 'Under review',
              stage: `${document === 'insurance' ? 'Insurance' : 'Business license'} uploaded for review`,
              status: vendor.status === 'Compliant' ? 'Compliant' : 'Review needed',
            }
          : vendor,
      ),
    );
    addAudit('Vendor document', `Compliance document uploaded for ${vendorName(vendorId, vendors)}.`);
    void persistAction('upload_document', { documentType: document, vendorId });
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
    const match = vendors.find(
      (vendor) =>
        vendor.boardAccess &&
        vendor.markets.includes(job.market) &&
        vendor.services.includes(job.service),
    );
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
              paymentConsult: 'Resident and vendor confirmed direct payment plan',
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
              paymentConsult: 'Service date passed; ready for FLAIRO fee invoice',
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
          value: job.points / 100,
          note: `${job.service} completion verified`,
        },
        ...current,
      ]);
    }
    addAudit('Job completed', `${jobId} completed and moved into invoice-ready status.`);
    void persistAction('complete_job', { jobId });
  };

  const triggerInvoice = (jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job || !job.vendorId) {
      addAudit('Invoice blocked', `${jobId} needs a claimed vendor before invoice creation.`);
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
        reference: 'Bluevine draft requested',
      },
      ...current,
    ]);
    setJobs((current) =>
      current.map((item) =>
        item.id === jobId ? { ...item, invoiceStatus: 'Draft queued' } : item,
      ),
    );
    addAudit('Bluevine invoice trigger', `${invoiceId} created for ${job.id}.`);
    void persistAction('trigger_invoice', { jobId });
  };

  const processVendorMonth = (vendorId: string, monthKey: string) => {
    const readyJobs = jobs.filter(
      (job) =>
        job.vendorId === vendorId &&
        jobInMonth(job, monthKey) &&
        job.invoiceStatus !== 'Sent' &&
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
          ? { ...invoice, status: 'Sent', reference: 'Month-end invoice processed' }
          : invoice,
      ),
    );
    addAudit('Vendor month processed', `${vendorName(vendorId, vendors)} ${labelMonth(monthKey)} invoices processed; active tally reset.`);
    void persistAction('process_vendor_month', { monthKey, vendorId });
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
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
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
              onClick={() => setActiveModule(section.id)}
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
            openInvoices={() => setActiveModule('invoices')}
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
            markDocumentUploaded={markDocumentUploaded}
            vendors={vendors}
          />
        )}

        {activeModule === 'board' && (
          <JobBoardModule
            claimJob={claimJob}
            communities={communities}
            clock={clock}
            jobs={jobs}
            vendors={vendors}
          />
        )}

        {activeModule === 'tasks' && (
          <OpenTasksModule
            communities={communities}
            completeJob={completeJob}
            confirmSchedule={confirmSchedule}
            clock={clock}
            jobs={jobs}
            triggerInvoice={triggerInvoice}
            vendors={vendors}
          />
        )}

        {activeModule === 'rewards' && (
          <RewardsModule communities={communities} rewards={rewards} />
        )}

        {activeModule === 'invoices' && (
          <InvoicesModule
            invoices={invoices}
            jobs={jobs}
            processVendorMonth={processVendorMonth}
            triggerInvoice={triggerInvoice}
            vendors={vendors}
          />
        )}

        {activeModule === 'reports' && (
          <ReportsModule
            communities={communities}
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
  openInvoices,
  rewards,
  vendors,
}: {
  clock: number;
  communities: Community[];
  invoices: InvoiceTrigger[];
  jobs: Job[];
  metrics: Metric[];
  openInvoices: () => void;
  rewards: RewardEntry[];
  vendors: Vendor[];
}) {
  const [activeDrilldown, setActiveDrilldown] = useState('priority-compliance');
  const reviewVendors = vendors.filter((vendor) => vendor.status !== 'Compliant');
  const boardJobs = jobs.filter((job) => job.visibleToVendors);
  const controlledJobs = jobs.filter((job) => job.boardStatus !== 'Open');
  const readyStatements = communities.filter((community) => community.statementStatus === 'Ready');
  const readyInvoiceJobs = jobs.filter((job) => job.invoiceStatus === 'Ready' || job.invoiceStatus === 'Draft queued');
  const invoiceQueue = invoices.filter((invoice) => invoice.status === 'Ready' || invoice.status === 'Draft queued');
  const activeRewardEntries = rewards.filter((entry) => entry.status === 'Available' || entry.status === 'Pending');

  const priorityDrilldowns: Drilldown[] = [
    {
      id: 'priority-compliance',
      label: 'Compliance review',
      count: String(reviewVendors.length),
      detail: 'Vendors that need a document upload, review, or board-access decision today.',
      rows: reviewVendors.map((vendor) => [
        vendor.name,
        vendor.stage,
        `Insurance: ${vendor.insurance}`,
        `License: ${vendor.license}`,
      ]),
    },
    {
      id: 'priority-board',
      label: 'Vendor job board',
      count: String(boardJobs.length),
      detail: 'Resident requests still visible for compliant vendors to claim by market and service.',
      rows: boardJobs.map((job) => [
        job.id,
        job.service,
        `${communityName(job.communityId, communities)} / ${job.market}`,
        `${getJobTimer(job, clock).value} unclaimed / ${job.preferredWindow}`,
      ]),
    },
    {
      id: 'priority-statements',
      label: 'Statements ready',
      count: String(readyStatements.length),
      detail: 'Community income reports ready to review, export, or mark issued.',
      rows: readyStatements.map((community) => [
        community.name,
        community.manager,
        `${community.plusMembers} PLUS members`,
        dollars(community.netIncome),
      ]),
    },
    {
      id: 'priority-invoices',
      label: 'Bluevine triggers',
      count: String(readyInvoiceJobs.length + invoiceQueue.length),
      detail: 'Completed jobs and invoice records that should be pushed into the Bluevine draft flow.',
      rows: [
        ...readyInvoiceJobs.map((job) => [
          job.id,
          job.vendorId ? vendorName(job.vendorId, vendors) : 'Vendor needed',
          job.invoiceStatus,
          dollars(job.flairoFee),
        ]),
        ...invoiceQueue.map((invoice) => [
          invoice.id,
          vendorName(invoice.vendorId, vendors),
          invoice.status,
          dollars(invoice.amount),
        ]),
      ],
    },
  ];

  const metricDrilldowns: Drilldown[] = [
    {
      id: 'metric-board-jobs',
      label: 'Vendor-visible jobs',
      count: String(boardJobs.length),
      detail: 'The open requests still available to the vendor pool.',
      rows: boardJobs.map((job) => [
        job.id,
        job.service,
        communityName(job.communityId, communities),
        `${job.market} / ${job.preferredWindow}`,
      ]),
    },
    {
      id: 'metric-controlled-tasks',
      label: 'FLAIRO controlled tasks',
      count: String(controlledJobs.length),
      detail: 'Claimed, scheduled, and completed work that employees can still manage.',
      rows: controlledJobs.map((job) => [
        job.id,
        job.boardStatus,
        job.vendorId ? vendorName(job.vendorId, vendors) : 'Unclaimed',
        `${getJobTimer(job, clock).label}: ${getJobTimer(job, clock).value}`,
      ]),
    },
    {
      id: 'metric-compliant-vendors',
      label: 'Compliant vendors',
      count: `${vendors.filter((vendor) => vendor.boardAccess).length}/${vendors.length}`,
      detail: 'Vendors allowed to claim work after compliance approval.',
      rows: vendors.map((vendor) => [
        vendor.name,
        vendor.status,
        vendor.boardAccess ? 'Board access on' : 'Board access off',
        vendor.markets.join(', '),
      ]),
    },
    {
      id: 'metric-reward-liability',
      label: 'Rewards liability',
      count: dollars(activeRewardEntries.reduce((sum, entry) => sum + entry.value, 0)),
      detail: 'Pending and available resident points that still carry value.',
      rows: activeRewardEntries.map((entry) => [
        entry.resident,
        entry.status,
        `${entry.points.toLocaleString()} pts`,
        dollars(entry.value),
      ]),
    },
    {
      id: 'metric-invoice-queue',
      label: 'Invoice trigger queue',
      count: dollars(invoiceQueue.reduce((sum, invoice) => sum + invoice.amount, 0)),
      detail: 'Invoice drafts waiting for or already queued to the Bluevine process.',
      rows: invoiceQueue.map((invoice) => [
        invoice.id,
        invoice.jobId,
        vendorName(invoice.vendorId, vendors),
        `${invoice.status} / ${dollars(invoice.amount)}`,
      ]),
    },
    {
      id: 'metric-plus-memberships',
      label: 'PLUS memberships',
      count: String(communities.reduce((sum, community) => sum + community.plusMembers, 0)),
      detail: 'Paid recurring FLAIRO PLUS memberships by community.',
      rows: communities.map((community) => [
        community.name,
        `${community.plusMembers} PLUS members`,
        `${community.occupied} occupied homes`,
        `${percent(community.servicePenetration)} penetration`,
      ]),
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
              <div className="drilldown-row" key={row.join('-')}>
                {row.map((cell) => (
                  <span key={cell}>{cell}</span>
                ))}
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
        onOpenInvoices={openInvoices}
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
          <StatusPill label="Rewards rules" status="Tracked" />
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
  markDocumentUploaded,
  vendors,
}: {
  approveVendor: (vendorId: string) => void;
  markDocumentUploaded: (vendorId: string, document: 'insurance' | 'license') => void;
  vendors: Vendor[];
}) {
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
            label: 'Default FLAIRO fee',
            value: '10%',
            detail: 'Vendor revenue obligation',
          },
        ]}
      />

      <section className="table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vendor CRM and compliance</p>
            <h2>Onboarding, documents, and job-board access</h2>
          </div>
          <button type="button">Invite vendor</button>
        </div>
        <div className="vendor-list">
          {vendors.map((vendor) => (
            <article className="vendor-card" key={vendor.id}>
              <div className="vendor-head">
                <div>
                  <span className={vendor.status === 'Compliant' ? 'status good' : 'status review'}>
                    {vendor.status}
                  </span>
                  <h3>{vendor.name}</h3>
                  <p>{vendor.contact} / {vendor.email} / {vendor.phone}</p>
                </div>
                <strong>{vendor.boardAccess ? 'Board access on' : 'No board access'}</strong>
              </div>

              <div className="vendor-meta">
                <span>{vendor.markets.join(', ')}</span>
                <span>{vendor.services.join(', ')}</span>
                <span>FLAIRO fee {vendor.feePercent}%</span>
                <span>Rating {vendor.rating.toFixed(1)}</span>
              </div>

              <div className="doc-grid">
                <DocumentTile label="Insurance" status={vendor.insurance} />
                <DocumentTile label="Business license" status={vendor.license} />
                <DocumentTile label="W-9" status={vendor.w9} />
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
                <button type="button" onClick={() => approveVendor(vendor.id)}>
                  Approve for board
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function JobBoardModule({
  claimJob,
  clock,
  communities,
  jobs,
  vendors,
}: {
  claimJob: (jobId: string) => void;
  clock: number;
  communities: Community[];
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
            <article className="job-card" key={job.id}>
              <div className="job-head">
                <span className="status good">Vendor visible</span>
                <strong>{job.id}</strong>
              </div>
              <h3>{job.service}</h3>
              <p>{communityName(job.communityId, communities)} / Unit {job.unit} / {job.homeProfile}</p>
              <div className="job-facts">
                <span>{job.preferredWindow}</span>
                <span>{dollars(job.amount)}</span>
                <span>{job.points} pts</span>
              </div>
              <JobTimer timer={timer} />
              <div className="matched-vendors">
                <p className="eyebrow">Eligible vendors</p>
                {matches.length ? matches.map((vendor) => <span key={vendor.id}>{vendor.name}</span>) : <span>No compliant match</span>}
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
  completeJob,
  confirmSchedule,
  jobs,
  triggerInvoice,
  vendors,
}: {
  clock: number;
  communities: Community[];
  completeJob: (jobId: string) => void;
  confirmSchedule: (jobId: string) => void;
  jobs: Job[];
  triggerInvoice: (jobId: string) => void;
  vendors: Vendor[];
}) {
  return (
    <section className="table-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Open task page</p>
          <h2>FLAIRO control copy for every resident request</h2>
        </div>
        <button type="button">Create job order</button>
      </div>

      <div className="task-stack">
        {jobs.map((job) => {
          const timer = getJobTimer(job, clock);
          return (
          <article className="task-card" key={job.id}>
            <div className="task-main">
              <div>
                <span className={job.visibleToVendors ? 'status good' : 'status hold'}>
                  {job.visibleToVendors ? 'On vendor board' : 'Board hidden'}
                </span>
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
              <InfoTile label="Vendor" value={job.vendorId ? vendorName(job.vendorId, vendors) : 'Unclaimed'} />
              <InfoTile label="Resident contact" value={job.residentInfoReleased ? `${job.resident} / ${job.phone}` : 'Hidden until claim'} />
              <InfoTile label="Vendor confirmation" value={job.vendorConfirmed ? 'Confirmed' : 'Needed'} />
              <InfoTile label="Payment consult" value={job.paymentConsult} />
              <InfoTile label="Task status" value={job.boardStatus} />
              <InfoTile label="Invoice" value={job.invoiceStatus} />
            </div>

            <div className="action-row">
              <button type="button" onClick={() => confirmSchedule(job.id)}>
                Confirm booking
              </button>
              <button type="button" onClick={() => completeJob(job.id)}>
                Mark service passed
              </button>
              <button type="button" onClick={() => triggerInvoice(job.id)}>
                Trigger invoice
              </button>
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}

function RewardsModule({
  communities,
  rewards,
}: {
  communities: Community[];
  rewards: RewardEntry[];
}) {
  const outstanding = rewards
    .filter((entry) => entry.status === 'Available' || entry.status === 'Pending')
    .reduce((sum, entry) => sum + entry.value, 0);
  const pendingPoints = rewards
    .filter((entry) => entry.status === 'Pending')
    .reduce((sum, entry) => sum + entry.points, 0);

  return (
    <>
      <MetricGrid
        metrics={[
          { label: 'Outstanding liability', value: dollars(outstanding), detail: 'Pending and available value' },
          { label: 'Pending points', value: pendingPoints.toLocaleString(), detail: 'Held until vendor confirmation' },
          { label: 'Free threshold', value: '500 pts', detail: '100 pts equals $1' },
          { label: 'PLUS threshold', value: '250 pts', detail: '2x earning and lower prices' },
        ]}
      />

      <section className="split-grid">
        <div className="table-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Resident point monitor</p>
              <h2>Rewards ledger</h2>
            </div>
            <button type="button">Run expiration batch</button>
          </div>
          <div className="compact-table">
            <div className="compact-row header">
              <span>Resident</span>
              <span>Community</span>
              <span>Source</span>
              <span>Status</span>
              <span>Points</span>
              <span>Value</span>
            </div>
            {rewards.map((entry) => (
              <div className="compact-row six" key={entry.id}>
                <span>{entry.resident}</span>
                <span>{communityName(entry.communityId, communities)}</span>
                <span>{entry.source}</span>
                <span>{entry.status}</span>
                <span>{entry.points.toLocaleString()}</span>
                <span>{dollars(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="table-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Reward controls</p>
              <h2>Program rules</h2>
            </div>
          </div>
          <div className="rule-list">
            <InfoTile label="Point value" value="100 points = $1 resident credit" />
            <InfoTile label="Redemption cap" value="10% of eligible subtotal" />
            <InfoTile label="PLUS membership" value="$5 monthly recurring membership" />
            <InfoTile label="Point status" value="Pending, available, redeemed, reversed, expired" />
            <InfoTile label="Vendor settlement" value="Reward credit can offset FLAIRO fee depending on agreement" />
          </div>
        </div>
      </section>
    </>
  );
}

function InvoicesModule({
  invoices,
  jobs,
  processVendorMonth,
  triggerInvoice,
  vendors,
}: {
  invoices: InvoiceTrigger[];
  jobs: Job[];
  processVendorMonth: (vendorId: string, monthKey: string) => void;
  triggerInvoice: (jobId: string) => void;
  vendors: Vendor[];
}) {
  const readyJobs = jobs.filter((job) => job.invoiceStatus !== 'Sent' && jobInvoiceActionable(job));

  return (
    <>
      <section className="section-band">
        <div>
          <p className="eyebrow">Invoice processing</p>
          <h2>Resident pays vendor directly. FLAIRO invoices vendors for the earned program fee.</h2>
        </div>
        <div className="integration-strip">
          <StatusPill label="Bluevine account" status="Invoice draft queue" />
          <StatusPill label="Payment collection" status="Vendor direct" />
          <StatusPill label="Trigger" status="Service date passed" />
        </div>
      </section>

      <VendorMonthCloseoutPanel
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
              <h2>Create invoice triggers</h2>
            </div>
          </div>
          <div className="task-stack compact">
            {readyJobs.length ? readyJobs.map((job) => (
              <article className="invoice-ready-row" key={job.id}>
                <div>
                  <strong>{job.id} / {job.service}</strong>
                  <p>{job.vendorId ? vendorName(job.vendorId, vendors) : 'Vendor needed'} owes {dollars(job.flairoFee)}</p>
                </div>
                <button type="button" onClick={() => triggerInvoice(job.id)}>
                  Trigger invoice
                </button>
              </article>
            )) : <p className="empty-note">No jobs are invoice-ready right now.</p>}
          </div>
        </div>

        <div className="table-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Invoice queue</p>
              <h2>Bluevine draft requests</h2>
            </div>
          </div>
          <div className="compact-table">
            <div className="compact-row header">
              <span>Invoice</span>
              <span>Job</span>
              <span>Vendor</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {invoices.map((invoice) => (
              <div className="compact-row" key={invoice.id}>
                <span>{invoice.id}</span>
                <span>{invoice.jobId}</span>
                <span>{vendorName(invoice.vendorId, vendors)}</span>
                <span>{dollars(invoice.amount)}</span>
                <span>{invoice.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ReportsModule({
  communities,
  markStatementIssued,
}: {
  communities: Community[];
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
            <article className="statement-card" key={community.id}>
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
            The reporting model follows the supplied FLAIRO workbook: property details, service period, gross revenue, vendor remittance, adjustments, net deposit, rewards liability, and community-facing tie-outs.
          </p>
        </div>
        <div className="statement-checklist" aria-label="statement controls">
          <span>Property tie-out</span>
          <span>Service period</span>
          <span>Vendor remittance</span>
          <span>Rewards liability</span>
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
          <InfoTile label="Resident mobile application" value="Service catalog, booking options, PLUS pricing, reward rules, and resident request intake" />
          <InfoTile label="Vendor portal" value="Onboarding, document upload, job board access, claim lock, schedule confirmation" />
          <InfoTile label="FLAIRO CRM" value={`${vendors.length} vendors, ${services.length} service lines, community reporting, audit history`} />
          <InfoTile label="Bluevine invoice queue" value="Draft invoice trigger after scheduled service date passes" />
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
  invoiceMode = false,
  jobs,
  onOpenInvoices,
  processVendorMonth,
  vendors,
}: {
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
    <section className={`table-panel vendor-month-panel${invoiceMode ? ' invoice-mode' : ''}`}>
      <div className="section-heading vendor-month-head">
        <div>
          <p className="eyebrow">{invoiceMode ? 'Month-end invoicing' : 'Current month vendor activity'}</p>
          <h2>{labelMonth(monthKey)} vendor income closeout</h2>
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
        <InfoTile label="Potential FLAIRO payout" value={dollars(flairoPayout)} />
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
            <div className="vendor-month-row" key={row.vendorId} role="row">
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

function DocumentTile({ label, status }: { label: string; status: DocumentStatus }) {
  return (
    <div className="doc-tile">
      <span>{label}</span>
      <strong className={status === 'Verified' ? 'good-text' : 'review-text'}>{status}</strong>
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

function jobInvoiceActionable(job: Job) {
  return job.invoiceStatus === 'Ready' || job.invoiceStatus === 'Draft queued' || job.boardStatus === 'Completed';
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
