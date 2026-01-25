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

  // Shingle selection
  shingleType: ShingleType;

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
  address: string;
  licenseNumber: string;
}
