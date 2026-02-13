import type {
  AllShinglePricing,
  AdditionalRepairType,
  PitchMultiplier,
  AccessibilityMultiplier,
  FixedFees,
  WarrantyOption,
  CompanyInfo,
} from '../types';

// =============================================================================
// ABC SUPPLY SHINGLE PRICING (2025 Industry Rates)
// Brands: Owens Corning, CertainTeed, GAF, Atlas, TAMKO
// Pricing based on Oklahoma market rates + 40% material / 60% labor split
// =============================================================================

// Default shingle pricing by type and layer
// Per-shingle repair costs (material + labor)
export const DEFAULT_SHINGLE_PRICING: AllShinglePricing = {
  // OC Supreme / CertainTeed XT25 / GAF Royal Sovereign
  'three-tab': {
    surface: { material: 2.50, labor: 8.00 },      // $10.50/shingle - sealant fix
    'one-layer': { material: 4.00, labor: 12.00 }, // $16.00/shingle - full replacement
    'two-layer': { material: 7.00, labor: 20.00 }, // $27.00/shingle - with underlayment
    'three-layer': { material: 18.00, labor: 40.00 }, // $58.00/shingle - with decking
  },
  // OC Duration / CertainTeed Landmark / GAF Timberline HDZ
  architectural: {
    surface: { material: 3.50, labor: 9.00 },      // $12.50/shingle
    'one-layer': { material: 6.50, labor: 15.00 }, // $21.50/shingle
    'two-layer': { material: 10.00, labor: 22.00 }, // $32.00/shingle
    'three-layer': { material: 22.00, labor: 45.00 }, // $67.00/shingle
  },
  // OC Duration Premium / CertainTeed Grand Manor / GAF Camelot
  premium: {
    surface: { material: 5.50, labor: 12.00 },     // $17.50/shingle
    'one-layer': { material: 11.00, labor: 18.00 }, // $29.00/shingle
    'two-layer': { material: 16.00, labor: 28.00 }, // $44.00/shingle
    'three-layer': { material: 32.00, labor: 55.00 }, // $87.00/shingle
  },
};

// =============================================================================
// ABC SUPPLY ADDITIONAL MATERIALS & REPAIRS (2025 Pricing)
// =============================================================================

export const DEFAULT_ADDITIONAL_REPAIRS: AdditionalRepairType[] = [
  {
    id: 'pipe-boot',
    name: 'Pipe Boot Replacement (Oatey/Hercules)',
    unit: 'each',
    material: 22.00,  // ABC Supply ~$15-25 retail
    labor: 50.00,
    active: true,
  },
  {
    id: 'flashing',
    name: 'Step/Drip Edge Flashing (Aluminum)',
    unit: 'linear_ft',
    material: 4.50,   // ABC Supply aluminum flashing
    labor: 12.00,
    active: true,
  },
  {
    id: 'ridge-cap',
    name: 'Ridge Cap Shingles (OC/GAF)',
    unit: 'linear_ft',
    material: 5.00,   // Hip & ridge bundles
    labor: 10.00,
    active: true,
  },
  {
    id: 'roof-vent',
    name: 'Static Roof Vent (Lomanco/Air Vent)',
    unit: 'each',
    material: 45.00,
    labor: 65.00,
    active: true,
  },
  {
    id: 'chimney-flashing',
    name: 'Chimney Flashing Kit (Complete)',
    unit: 'each',
    material: 85.00,
    labor: 195.00,
    active: true,
  },
  {
    id: 'valley-repair',
    name: 'Valley Metal (W-Valley Aluminum)',
    unit: 'linear_ft',
    material: 8.00,
    labor: 18.00,
    active: true,
  },
  {
    id: 'ice-water',
    name: 'Ice & Water Shield (OC WeatherLock)',
    unit: 'linear_ft',
    material: 3.50,   // Per linear foot from roll
    labor: 6.00,
    active: true,
  },
  {
    id: 'underlayment',
    name: 'Synthetic Underlayment (Deck Armor)',
    unit: 'linear_ft',
    material: 1.25,
    labor: 3.00,
    active: true,
  },
  {
    id: 'sealant',
    name: 'Roof Sealant/Caulk (Geocel/OSI)',
    unit: 'area',
    material: 8.00,   // Tube cost + waste
    labor: 25.00,
    active: true,
  },
  {
    id: 'gutter',
    name: 'Gutter Reattachment/Spike Repair',
    unit: 'linear_ft',
    material: 3.50,
    labor: 8.00,
    active: true,
  },
  {
    id: 'skylight',
    name: 'Skylight Flashing/Seal Repair',
    unit: 'each',
    material: 35.00,
    labor: 85.00,
    active: true,
  },
  {
    id: 'turbine-vent',
    name: 'Turbine Vent Replacement (Lomanco)',
    unit: 'each',
    material: 65.00,
    labor: 75.00,
    active: true,
  },
  {
    id: 'power-vent',
    name: 'Power Attic Vent (Master Flow)',
    unit: 'each',
    material: 125.00,
    labor: 150.00,
    active: true,
  },
  {
    id: 'starter-strip',
    name: 'Starter Strip (OC Starter Strip Plus)',
    unit: 'linear_ft',
    material: 2.00,
    labor: 4.00,
    active: true,
  },
  {
    id: 'plywood-patch',
    name: 'Plywood Decking Patch (1/2" CDX)',
    unit: 'each',  // Per 4x4 section
    material: 35.00,
    labor: 55.00,
    active: true,
  },
];

// Pitch multipliers (industry standard)
export const DEFAULT_PITCH_MULTIPLIERS: PitchMultiplier[] = [
  {
    id: 'low',
    name: 'Low Pitch',
    description: '0-4/12 slope (walkable)',
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
    description: '9-12/12 slope (safety gear)',
    multiplier: 1.35,
  },
  {
    id: 'extreme',
    name: 'Extreme Pitch',
    description: '12+/12 slope (specialty equipment)',
    multiplier: 1.50,
  },
];

// Accessibility multipliers
export const DEFAULT_ACCESSIBILITY_MULTIPLIERS: AccessibilityMultiplier[] = [
  {
    id: 'easy',
    name: 'Easy Access',
    description: 'Single story, clear driveway access',
    multiplier: 1.0,
  },
  {
    id: 'moderate',
    name: 'Moderate Access',
    description: 'Two story or backyard access only',
    multiplier: 1.15,
  },
  {
    id: 'difficult',
    name: 'Difficult Access',
    description: '3+ story, tight lot, extensive laddering',
    multiplier: 1.30,
  },
];

// Fixed fees (Oklahoma market 2025)
export const DEFAULT_FIXED_FEES: FixedFees = {
  minimumServiceCall: 175.00,    // Truck roll + inspection
  emergencySurcharge: 150.00,    // Same-day/emergency
  afterHoursSurcharge: 200.00,   // Evenings/weekends/holidays
};

// Warranty options
export const DEFAULT_WARRANTY_OPTIONS: WarrantyOption[] = [
  {
    id: 'standard',
    name: 'Standard 1-Year Workmanship',
    years: 1,
    price: 0,
  },
  {
    id: 'extended-3',
    name: 'Extended 3-Year Workmanship',
    years: 3,
    price: 95.00,
  },
  {
    id: 'extended-5',
    name: 'Extended 5-Year Workmanship',
    years: 5,
    price: 175.00,
  },
];

// Company info
export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'Roof Repair Partners',
  tagline: "Oklahoma's Only Repair-Focused Roofing Company",
  phone: '(405) 555-ROOF',
  email: 'info@roofrepairpartners.com',
  website: 'roofrepairpartners.com',
  address: 'Oklahoma City, OK',
  city: 'Oklahoma City',
  state: 'OK',
  zip: '73102',
  license: '',
};

// Layer depth display names
export const LAYER_DEPTH_NAMES: Record<string, string> = {
  surface: 'Surface Repair (sealant/adhesive fix)',
  'one-layer': '1 Layer - Shingle Only',
  'two-layer': '2 Layer - Shingle + Underlayment',
  'three-layer': '3 Layer - Shingle + Underlayment + Decking',
};

// Shingle type display names (ABC Supply brands)
export const SHINGLE_TYPE_NAMES: Record<string, string> = {
  'three-tab': '3-Tab (OC Supreme / GAF Royal Sovereign)',
  architectural: 'Architectural (OC Duration / GAF Timberline)',
  premium: 'Premium Designer (OC Duration Premium / GAF Camelot)',
};

// Unit display names
export const UNIT_NAMES: Record<string, string> = {
  each: 'each',
  linear_ft: 'linear ft',
  area: 'per area',
};

// =============================================================================
// ABC SUPPLY REFERENCE INFO
// Brands carried: Owens Corning, CertainTeed, GAF, Atlas, TAMKO, Malarkey
// Contact local ABC Supply branch for current wholesale pricing
// Oklahoma locations: OKC, Tulsa, Norman, Lawton, Edmond
// =============================================================================
