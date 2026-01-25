import type {
  AllShinglePricing,
  AdditionalRepairType,
  PitchMultiplier,
  AccessibilityMultiplier,
  FixedFees,
  WarrantyOption,
  CompanyInfo,
} from '../types';

// Default shingle pricing by type and layer
export const DEFAULT_SHINGLE_PRICING: AllShinglePricing = {
  'three-tab': {
    surface: { material: 2.0, labor: 8.0 },
    'one-layer': { material: 3.5, labor: 12.0 },
    'two-layer': { material: 6.0, labor: 18.0 },
    'three-layer': { material: 15.0, labor: 35.0 },
  },
  architectural: {
    surface: { material: 3.0, labor: 8.0 },
    'one-layer': { material: 5.5, labor: 14.0 },
    'two-layer': { material: 8.5, labor: 20.0 },
    'three-layer': { material: 18.0, labor: 38.0 },
  },
  premium: {
    surface: { material: 5.0, labor: 10.0 },
    'one-layer': { material: 9.0, labor: 16.0 },
    'two-layer': { material: 14.0, labor: 24.0 },
    'three-layer': { material: 28.0, labor: 45.0 },
  },
};

// Default additional repair types
export const DEFAULT_ADDITIONAL_REPAIRS: AdditionalRepairType[] = [
  {
    id: 'pipe-boot',
    name: 'Pipe boot/collar replacement',
    unit: 'each',
    material: 18.0,
    labor: 45.0,
    active: true,
  },
  {
    id: 'flashing',
    name: 'Flashing repair',
    unit: 'linear_ft',
    material: 8.0,
    labor: 15.0,
    active: true,
  },
  {
    id: 'ridge-cap',
    name: 'Ridge cap repair',
    unit: 'linear_ft',
    material: 6.0,
    labor: 12.0,
    active: true,
  },
  {
    id: 'roof-vent',
    name: 'Roof vent replacement',
    unit: 'each',
    material: 35.0,
    labor: 55.0,
    active: true,
  },
  {
    id: 'chimney-flashing',
    name: 'Chimney flashing',
    unit: 'each',
    material: 75.0,
    labor: 175.0,
    active: true,
  },
  {
    id: 'valley-repair',
    name: 'Valley repair',
    unit: 'linear_ft',
    material: 12.0,
    labor: 22.0,
    active: true,
  },
  {
    id: 'sealant',
    name: 'Sealant/caulking work',
    unit: 'area',
    material: 5.0,
    labor: 25.0,
    active: true,
  },
  {
    id: 'gutter',
    name: 'Gutter reattachment',
    unit: 'linear_ft',
    material: 4.0,
    labor: 10.0,
    active: true,
  },
  {
    id: 'skylight',
    name: 'Skylight seal repair',
    unit: 'each',
    material: 25.0,
    labor: 75.0,
    active: true,
  },
  {
    id: 'turbine-vent',
    name: 'Turbine vent replacement',
    unit: 'each',
    material: 55.0,
    labor: 65.0,
    active: true,
  },
];

// Pitch multipliers
export const DEFAULT_PITCH_MULTIPLIERS: PitchMultiplier[] = [
  {
    id: 'low',
    name: 'Low Pitch',
    description: '0-4/12 slope',
    multiplier: 1.0,
  },
  {
    id: 'medium',
    name: 'Medium Pitch',
    description: '5-8/12 slope',
    multiplier: 1.15,
  },
  {
    id: 'steep',
    name: 'Steep Pitch',
    description: '9-12/12 slope',
    multiplier: 1.35,
  },
  {
    id: 'extreme',
    name: 'Extreme Pitch',
    description: '12+/12 slope',
    multiplier: 1.5,
  },
];

// Accessibility multipliers
export const DEFAULT_ACCESSIBILITY_MULTIPLIERS: AccessibilityMultiplier[] = [
  {
    id: 'easy',
    name: 'Easy Access',
    description: 'Single story, clear access',
    multiplier: 1.0,
  },
  {
    id: 'moderate',
    name: 'Moderate Access',
    description: 'Two story or minor obstacles',
    multiplier: 1.15,
  },
  {
    id: 'difficult',
    name: 'Difficult Access',
    description: '3+ story, tight access, safety equipment needed',
    multiplier: 1.3,
  },
];

// Fixed fees
export const DEFAULT_FIXED_FEES: FixedFees = {
  minimumServiceCall: 150.0,
  emergencySurcharge: 125.0,
  afterHoursSurcharge: 175.0,
};

// Warranty options
export const DEFAULT_WARRANTY_OPTIONS: WarrantyOption[] = [
  {
    id: 'standard',
    name: 'Standard 1-year workmanship',
    years: 1,
    price: 0,
  },
  {
    id: 'extended-3',
    name: 'Extended 3-year workmanship',
    years: 3,
    price: 75.0,
  },
  {
    id: 'extended-5',
    name: 'Extended 5-year workmanship',
    years: 5,
    price: 150.0,
  },
];

// Company info (to be customized)
export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'Roof Repair Partners',
  tagline: "Oklahoma's Only Repair-Focused Roofing Company",
  phone: '(405) 555-ROOF',
  email: 'info@roofrepairpartners.com',
  website: 'roofrepairpartners.com',
  address: 'Oklahoma City, OK',
  licenseNumber: '',
};

// Layer depth display names
export const LAYER_DEPTH_NAMES: Record<string, string> = {
  surface: 'Surface repair (sealant/adhesive fix)',
  'one-layer': '1 Layer (shingle replacement)',
  'two-layer': '2 Layer (shingle + underlayment)',
  'three-layer': '3 Layer (shingle + underlayment + decking)',
};

// Shingle type display names
export const SHINGLE_TYPE_NAMES: Record<string, string> = {
  'three-tab': '3-Tab Shingles',
  architectural: 'Architectural/Dimensional Shingles',
  premium: 'Premium/Designer Shingles',
};

// Unit display names
export const UNIT_NAMES: Record<string, string> = {
  each: 'each',
  linear_ft: 'linear ft',
  area: 'per area',
};
