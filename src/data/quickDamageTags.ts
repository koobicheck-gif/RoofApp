import type { QuickDamageTag } from '../types';

/**
 * Quick Damage Tags - One-tap field entries that auto-populate repairs
 * Each tag links to existing AdditionalRepairType IDs from defaultPricing.ts
 */
export const QUICK_DAMAGE_TAGS: QuickDamageTag[] = [
  // Penetration Issues
  {
    id: 'pipe-boot-damaged',
    label: 'Pipe Boot',
    icon: '🔧',
    category: 'penetration',
    autoRepairIds: ['pipe-boot'],
    scopeText: 'Replace damaged pipe boot with new thermoplastic boot and seal.',
    defaultQuantity: 1,
  },
  {
    id: 'vent-impact',
    label: 'Vent Damage',
    icon: '💨',
    category: 'ventilation',
    autoRepairIds: ['roof-vent'],
    scopeText: 'Replace damaged roof vent and reseal surrounding shingles.',
    defaultQuantity: 1,
  },
  {
    id: 'skylight-leak',
    label: 'Skylight Issue',
    icon: '🪟',
    category: 'penetration',
    autoRepairIds: ['skylight-seal'],
    scopeText: 'Reseal skylight perimeter and address any flashing concerns.',
    defaultQuantity: 1,
  },

  // Flashing Issues
  {
    id: 'flashing-separation',
    label: 'Flashing Lift',
    icon: '📐',
    category: 'flashing',
    autoRepairIds: ['flashing-repair'],
    scopeText: 'Resecure and reseal separated roof flashing.',
    defaultQuantity: 1,
  },
  {
    id: 'valley-flashing',
    label: 'Valley Issue',
    icon: '⌄',
    category: 'flashing',
    autoRepairIds: ['valley-repair'],
    scopeText: 'Address valley flashing concerns and ensure proper water flow.',
    defaultQuantity: 1,
  },
  {
    id: 'chimney-flashing',
    label: 'Chimney Flash',
    icon: '🏠',
    category: 'flashing',
    autoRepairIds: ['chimney-flashing'],
    scopeText: 'Repair chimney flashing and counter-flashing. Reseal all joints.',
    defaultQuantity: 1,
  },
  {
    id: 'gutter-apron',
    label: 'Gutter Apron',
    icon: '🌧️',
    category: 'flashing',
    autoRepairIds: ['gutter-apron'],
    scopeText: 'Install or repair gutter apron flashing to prevent water intrusion.',
    defaultQuantity: 1,
  },

  // Sealant & Surface Issues
  {
    id: 'sealant-failure',
    label: 'Sealant Fail',
    icon: '💧',
    category: 'sealant',
    autoRepairIds: ['sealant-repair'],
    scopeText: 'Remove failed sealant and apply new professional-grade roofing sealant.',
    defaultQuantity: 1,
  },
  {
    id: 'exposed-nails',
    label: 'Exposed Nails',
    icon: '📍',
    category: 'sealant',
    autoRepairIds: ['nail-sealing'],
    scopeText: 'Seal all exposed nail heads with roofing cement to prevent leaks.',
    defaultQuantity: 1,
  },
  {
    id: 'nail-pops',
    label: 'Nail Pops',
    icon: '⬆️',
    category: 'sealant',
    autoRepairIds: ['nail-sealing'],
    scopeText: 'Address nail pops by reseating and sealing with roofing cement.',
    defaultQuantity: 1,
  },

  // Ridge & Edge Issues
  {
    id: 'ridge-cap-damage',
    label: 'Ridge Cap',
    icon: '🔝',
    category: 'structural',
    autoRepairIds: ['ridge-cap'],
    scopeText: 'Replace damaged ridge cap shingles and ensure proper ventilation seal.',
    defaultQuantity: 1,
  },
  {
    id: 'drip-edge-issue',
    label: 'Drip Edge',
    icon: '↘️',
    category: 'structural',
    autoRepairIds: ['drip-edge'],
    scopeText: 'Repair or replace drip edge to ensure proper water runoff.',
    defaultQuantity: 1,
  },

  // Ventilation
  {
    id: 'turbine-vent',
    label: 'Turbine Vent',
    icon: '🌀',
    category: 'ventilation',
    autoRepairIds: ['turbine-vent'],
    scopeText: 'Replace or repair turbine vent assembly.',
    defaultQuantity: 1,
  },
  {
    id: 'box-vent',
    label: 'Box Vent',
    icon: '📦',
    category: 'ventilation',
    autoRepairIds: ['roof-vent'],
    scopeText: 'Replace damaged box vent and seal surrounding area.',
    defaultQuantity: 1,
  },
];

// Category metadata for grouping
export const TAG_CATEGORIES = {
  penetration: { label: 'Penetrations', color: 'blue' },
  flashing: { label: 'Flashing', color: 'amber' },
  ventilation: { label: 'Ventilation', color: 'green' },
  sealant: { label: 'Sealant', color: 'purple' },
  structural: { label: 'Structural', color: 'red' },
} as const;

/**
 * Get tags by category
 */
export function getTagsByCategory(category: QuickDamageTag['category']): QuickDamageTag[] {
  return QUICK_DAMAGE_TAGS.filter(tag => tag.category === category);
}

/**
 * Get tag by ID
 */
export function getTagById(id: string): QuickDamageTag | undefined {
  return QUICK_DAMAGE_TAGS.find(tag => tag.id === id);
}

/**
 * Get multiple tags by IDs
 */
export function getTagsByIds(ids: string[]): QuickDamageTag[] {
  return ids.map(id => getTagById(id)).filter((tag): tag is QuickDamageTag => tag !== undefined);
}
