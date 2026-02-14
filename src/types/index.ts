// Shingle Types
export type ShingleType = 'three-tab' | 'architectural' | 'premium';

// Layer Damage Types
export type LayerDepth = 'surface' | 'one-layer' | 'two-layer' | 'three-layer';

// Damage Severity Types
export type DamageSeverity = 'cracked' | 'missing' | 'lifted' | 'hail' | 'wind';

// Pricing structure for shingles
export interface LayerPricing {
  material: number;
  labor: number;
}

export interface ShinglePricing {
  surface: LayerPricing;
  'one-layer': LayerPricing;
  'two-layer': LayerPricing;
  'three-layer': LayerPricing;
}

export interface AllShinglePricing {
  'three-tab': ShinglePricing;
  architectural: ShinglePricing;
  premium: ShinglePricing;
}

// Additional repair types
export interface AdditionalRepairType {
  id: string;
  name: string;
  unit: 'each' | 'linear_ft' | 'area';
  material: number;
  labor: number;
  active: boolean;
}

// Site condition multipliers
export interface PitchMultiplier {
  id: string;
  name: string;
  description: string;
  multiplier: number;
}

export interface AccessibilityMultiplier {
  id: string;
  name: string;
  description: string;
  multiplier: number;
}

// Fixed fees
export interface FixedFees {
  minimumServiceCall: number;
  emergencySurcharge: number;
  afterHoursSurcharge: number;
}

// Warranty options
export interface WarrantyOption {
  id: string;
  name: string;
  years: number;
  price: number;
}

// Customer information
export interface Customer {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

// Shingle damage entry
export interface ShingleDamage {
  layerDepth: LayerDepth;
  count: number;
}

// Additional repair entry
export interface AdditionalRepair {
  repairTypeId: string;
  quantity: number;
  customPrice?: number;
}

// Custom repair entry
export interface CustomRepair {
  id: string;
  name: string;
  material: number;
  labor: number;
  quantity: number;
  unit: 'each' | 'linear_ft' | 'area';
}

// Photo entry
export interface EstimatePhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
  notes?: string;
}

// Complete estimate
export interface Estimate {
  id: string;
  estimateNumber: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'sent' | 'approved' | 'scheduled' | 'completed' | 'invoiced' | 'void';

  // Customer info
  customer: Customer;

  // Roof type (residential vs commercial/flat)
  roofType: RoofType;

  // Residential shingle selection
  shingleType: ShingleType;

  // Commercial/Flat roof details
  flatRoofDetails?: FlatRoofDetails;

  // Damage assessment
  shingleDamage: ShingleDamage[];

  // Additional repairs
  additionalRepairs: AdditionalRepair[];
  customRepairs: CustomRepair[];

  // Site conditions
  pitchMultiplierId: string;
  accessibilityMultiplierId: string;

  // Fees and options
  isEmergency: boolean;
  isAfterHours: boolean;
  warrantyOptionId: string;

  // Service agreement
  serviceAgreementId?: string;
  includeServiceAgreement: boolean;
  selectedServicePlanId?: string;

  // Photos
  photos: EstimatePhoto[];

  // Notes
  techNotes: string;

  // Pricing snapshot (captured at estimate creation)
  pricingSnapshot?: {
    shinglePricing: AllShinglePricing;
    additionalRepairs: AdditionalRepairType[];
    pitchMultipliers: PitchMultiplier[];
    accessibilityMultipliers: AccessibilityMultiplier[];
    fixedFees: FixedFees;
    warrantyOptions: WarrantyOption[];
  };

  // Tech info
  techId?: string;
  techName?: string;
}

// Calculated line item for display
export interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  material: number;
  labor: number;
  subtotal: number;
}

// Estimate calculation result
export interface EstimateCalculation {
  shingleLineItems: LineItem[];
  additionalRepairLineItems: LineItem[];
  customRepairLineItems: LineItem[];

  shingleSubtotal: number;
  additionalRepairsSubtotal: number;
  customRepairsSubtotal: number;

  subtotalBeforeMultipliers: number;
  pitchAdjustment: number;
  accessibilityAdjustment: number;
  subtotalAfterMultipliers: number;

  minimumServiceFee: number;
  emergencySurcharge: number;
  afterHoursSurcharge: number;
  warrantyFee: number;

  grandTotal: number;
}

// Company info
export interface CompanyInfo {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  license?: string;
}

// Crew member
export interface CrewMember {
  id: string;
  name: string;
  phone: string;
  role: 'lead' | 'technician' | 'helper';
  active: boolean;
}

// Job schedule
export interface JobSchedule {
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration: number; // in hours
  crewIds: string[];
}

// Job timeline event
export interface JobTimelineEvent {
  id: string;
  timestamp: Date;
  type: 'status_change' | 'note' | 'photo' | 'schedule' | 'crew_change';
  description: string;
  userId?: string;
  userName?: string;
  oldValue?: string;
  newValue?: string;
}

// Job completion data
export interface JobCompletion {
  completedAt: Date;
  completedBy: string;
  completionNotes: string;
  completionPhotos: EstimatePhoto[];
  customerSignature?: string;
  materialsUsed?: string;
  actualDuration?: number; // in hours
}

// Extended job/estimate with tracking
export interface Job extends Estimate {
  schedule?: JobSchedule;
  timeline: JobTimelineEvent[];
  completion?: JobCompletion;
  invoiceNumber?: string;
  invoicedAt?: Date;
  paidAt?: Date;
  paymentMethod?: 'cash' | 'check' | 'card' | 'financing';
}

// ============================================
// FIELD MODE & QUICK DAMAGE TAGS (Phase 6)
// ============================================

// Quick damage tag for one-tap field entry
export interface QuickDamageTag {
  id: string;
  label: string;
  icon: string;
  category: 'flashing' | 'penetration' | 'ventilation' | 'sealant' | 'structural';
  autoRepairIds: string[];      // Links to AdditionalRepairType IDs
  scopeText: string;            // Auto-generated scope description
  defaultQuantity: number;
}

// Enhanced damage entry with auto-scope
export interface DamageEntry {
  id: string;
  shingleType: ShingleType;
  layerDepth: LayerDepth;
  quantity: number;
  photos: EstimatePhoto[];
  notes: string;
  quickTagIds: string[];        // Applied QuickDamageTag IDs
  autoGeneratedScope: string;
  autoGeneratedRepairs: string[];
}

// Field mode user preferences
export interface FieldModeSettings {
  enabled: boolean;
  quickIncrements: number[];    // Default: [1, 5, 10]
  stickyTotal: boolean;
  reducedFields: boolean;
  hapticFeedback: boolean;
}

// Property history for address lookup
export interface PropertyHistory {
  address: string;
  city: string;
  state: string;
  estimates: {
    id: string;
    estimateNumber: string;
    date: Date;
    total: number;
    shingleType: ShingleType;
    status: Estimate['status'];
  }[];
}

// ============================================
// COMMERCIAL ROOFING & SERVICE AGREEMENTS
// ============================================

// Roof type classification
export type RoofType = 'residential' | 'commercial';

// Commercial/Flat roof material types
export type FlatRoofMaterial = 'tpo' | 'epdm' | 'pvc' | 'modified-bitumen' | 'built-up' | 'spray-foam';

// Flat roof pricing structure
export interface FlatRoofPricing {
  material: FlatRoofMaterial;
  name: string;
  perSquareFoot: {
    material: number;
    labor: number;
  };
  minimumArea: number; // sq ft
  warrantyYears: number;
}

// Commercial repair types
export interface CommercialRepairType {
  id: string;
  name: string;
  description: string;
  unit: 'each' | 'linear_ft' | 'sq_ft';
  material: number;
  labor: number;
  active: boolean;
}

// Service Agreement Types
export type ServiceAgreementTier = 'basic' | 'standard' | 'premium';
export type BillingFrequency = 'annual' | 'semi-annual' | 'quarterly' | 'monthly';

// Service agreement plan
export interface ServiceAgreementPlan {
  id: string;
  tier: ServiceAgreementTier;
  name: string;
  description: string;
  annualPrice: number;
  features: string[];
  inspectionsPerYear: number;
  discountPercent: number; // Discount on repairs
  priorityService: boolean;
  emergencyResponse: boolean;
  gutterCleaning: boolean;
  minorRepairsIncluded: boolean; // Up to a certain $$ amount
  minorRepairLimit: number; // Max $ covered per visit
}

// Active service agreement for a customer
export interface ServiceAgreement {
  id: string;
  customerId: string;
  planId: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  roofType: RoofType;
  roofSize: number; // sq ft
  startDate: Date;
  renewalDate: Date;
  billingFrequency: BillingFrequency;
  paymentAmount: number; // Per billing period
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  inspectionHistory: ServiceInspection[];
  notes: string;
}

// Scheduled maintenance inspection
export interface ServiceInspection {
  id: string;
  scheduledDate: Date;
  completedDate?: Date;
  techId?: string;
  techName?: string;
  status: 'scheduled' | 'completed' | 'missed' | 'rescheduled';
  findings: string;
  photos: EstimatePhoto[];
  repairsNeeded: string[];
  repairsPerformed: string[];
  repairsCost: number;
  coveredByAgreement: boolean;
}

// Flat roof details for commercial estimates
export interface FlatRoofDetails {
  material: FlatRoofMaterial;
  totalArea: number; // sq ft
  drainageIssues: boolean;
  pondingAreas: number; // count
  seamCondition: 'good' | 'fair' | 'poor';
  flashingCondition: 'good' | 'fair' | 'poor';
  membraneCondition: 'good' | 'fair' | 'poor';
  roofAge: number; // years
  lastInspectionDate?: Date;
}

