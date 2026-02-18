import type { Estimate, EstimateCalculation, ShingleType, ShingleDamage, QuickDamageTag } from '../types';
import { LAYER_DEPTH_NAMES, FLAT_ROOF_MATERIAL_NAMES } from '../data/defaultPricing';

interface GenerateScopeParams {
  shingleType: ShingleType;
  damages: ShingleDamage[];
  quickTags: QuickDamageTag[];
  includeWarrantyNote?: boolean;
}

const SHINGLE_SCOPE_NAMES: Record<ShingleType, string> = {
  'three-tab': '3-tab shingles',
  'architectural': 'architectural shingles',
  'premium': 'premium designer shingles',
};

/**
 * Generates professional repair scope language from damage assessment
 */
export function generateScope(params: GenerateScopeParams): string {
  const { shingleType, damages, quickTags, includeWarrantyNote = true } = params;

  const scopeParts: string[] = [];
  const shingleName = SHINGLE_SCOPE_NAMES[shingleType];

  // Generate shingle damage scope
  const activeDamages = damages.filter(d => d.count > 0);

  if (activeDamages.length > 0) {
    const totalShingles = activeDamages.reduce((sum, d) => sum + d.count, 0);

    // Group by severity for better scope language
    const hasDecking = activeDamages.some(d => d.layerDepth === 'three-layer');
    const hasUnderlayment = activeDamages.some(d => d.layerDepth === 'two-layer' || d.layerDepth === 'three-layer');
    const hasSurfaceOnly = activeDamages.some(d => d.layerDepth === 'surface');
    const hasShingleOnly = activeDamages.some(d => d.layerDepth === 'one-layer');

    if (hasDecking) {
      scopeParts.push(
        `Remove and replace approximately ${totalShingles} damaged ${shingleName}. ` +
        `Repair damaged roof decking as required. Install new synthetic underlayment ` +
        `and restore complete roofing system integrity.`
      );
    } else if (hasUnderlayment) {
      scopeParts.push(
        `Remove and replace approximately ${totalShingles} damaged ${shingleName}. ` +
        `Replace underlayment in affected areas and ensure proper water barrier protection.`
      );
    } else if (hasShingleOnly) {
      scopeParts.push(
        `Remove and replace approximately ${totalShingles} damaged ${shingleName}. ` +
        `Match existing shingle pattern and color for seamless repair.`
      );
    } else if (hasSurfaceOnly) {
      scopeParts.push(
        `Apply professional-grade roofing sealant to secure approximately ${totalShingles} ` +
        `loose or lifted ${shingleName}. Reseal all affected areas.`
      );
    }
  }

  // Add quick tag scope descriptions
  if (quickTags.length > 0) {
    const tagDescriptions = quickTags.map(tag => tag.scopeText);
    scopeParts.push(...tagDescriptions);
  }

  // Add standard closing language
  if (scopeParts.length > 0) {
    scopeParts.push('Clean work area and dispose of all debris. Perform final inspection to ensure watertight integrity.');
  }

  // Add warranty note if applicable
  if (includeWarrantyNote && scopeParts.length > 0) {
    scopeParts.push('All repairs include standard workmanship warranty.');
  }

  return scopeParts.join(' ');
}

/**
 * Generates a comprehensive Scope of Work from a full estimate and calculation
 * Handles both residential and commercial estimates
 */
export function generateFullScope(estimate: Estimate, calculation: EstimateCalculation): string {
  const sections: string[] = [];
  const isCommercial = estimate.roofType === 'commercial';

  // Header
  if (isCommercial && estimate.flatRoofDetails) {
    const materialName = FLAT_ROOF_MATERIAL_NAMES[estimate.flatRoofDetails.material] || estimate.flatRoofDetails.material;
    sections.push(
      `SCOPE OF WORK — Commercial Flat Roof Repair\n` +
      `Property: ${estimate.customer.address || 'TBD'}, ${estimate.customer.city || ''} ${estimate.customer.state || ''}\n` +
      `Roof System: ${materialName} membrane, approximately ${estimate.flatRoofDetails.totalArea.toLocaleString()} sq ft\n` +
      `Roof Age: ${estimate.flatRoofDetails.roofAge} years`
    );
  } else {
    const shingleName = SHINGLE_SCOPE_NAMES[estimate.shingleType];
    sections.push(
      `SCOPE OF WORK — Residential Roof Repair\n` +
      `Property: ${estimate.customer.address || 'TBD'}, ${estimate.customer.city || ''} ${estimate.customer.state || ''}\n` +
      `Roof System: ${shingleName.charAt(0).toUpperCase() + shingleName.slice(1)}`
    );
  }

  // Flat Roof Repairs (Commercial)
  if (isCommercial && calculation.flatRoofLineItems.length > 0) {
    const items = calculation.flatRoofLineItems.map(
      (item) => `  - ${item.description}: ${item.quantity} ${item.unit}`
    );
    sections.push(`\nFlat Roof Repairs:\n${items.join('\n')}`);

    // Condition-based notes
    if (estimate.flatRoofDetails) {
      const notes: string[] = [];
      if (estimate.flatRoofDetails.membraneCondition === 'poor') {
        notes.push('  - Membrane in poor condition — full coating recommended for long-term protection');
      }
      if (estimate.flatRoofDetails.seamCondition === 'poor') {
        notes.push('  - Seam deterioration detected — re-welding and seam reinforcement required');
      }
      if (estimate.flatRoofDetails.drainageIssues) {
        notes.push('  - Drainage deficiencies identified — drain repair/clearing required');
      }
      if (estimate.flatRoofDetails.pondingAreas > 0) {
        notes.push(`  - ${estimate.flatRoofDetails.pondingAreas} ponding area(s) identified — tapered insulation or re-grading recommended`);
      }
      if (notes.length > 0) {
        sections.push(`\nCondition Notes:\n${notes.join('\n')}`);
      }
    }
  }

  // Shingle Repairs (Residential)
  if (!isCommercial && calculation.shingleLineItems.length > 0) {
    const items = calculation.shingleLineItems.map(
      (item) => `  - ${item.description}: ${item.quantity} ${item.unit}`
    );
    sections.push(`\nShingle Repairs:\n${items.join('\n')}`);
  }

  // Additional Repairs
  const allAdditional = [...calculation.additionalRepairLineItems, ...calculation.customRepairLineItems];
  if (allAdditional.length > 0) {
    const items = allAdditional.map(
      (item) => `  - ${item.description}: ${item.quantity} ${item.unit}`
    );
    sections.push(`\nAdditional Repairs:\n${items.join('\n')}`);
  }

  // Standard work items
  sections.push(
    `\nGeneral:\n` +
    `  - Remove and dispose of all debris and old materials\n` +
    `  - Protect landscaping and property during work\n` +
    `  - Final walkthrough and inspection upon completion\n` +
    `  - Clean all work areas and gutters of debris`
  );

  // Warranty
  sections.push(
    `\nWarranty:\n` +
    `  - All work includes standard workmanship warranty\n` +
    `  - Material manufacturer warranties apply as applicable`
  );

  return sections.join('\n');
}

/**
 * Generates a short summary for estimate cards/lists
 */
export function generateScopeSummary(params: GenerateScopeParams): string {
  const { damages, quickTags } = params;
  const parts: string[] = [];

  const totalShingles = damages.reduce((sum, d) => sum + d.count, 0);

  if (totalShingles > 0) {
    parts.push(`${totalShingles} shingle repair${totalShingles > 1 ? 's' : ''}`);
  }

  if (quickTags.length > 0) {
    parts.push(`${quickTags.length} additional item${quickTags.length > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return 'No damage recorded';
  }

  return parts.join(', ');
}

/**
 * Gets repair IDs that should be auto-added based on quick tags
 */
export function getAutoRepairsFromTags(quickTags: QuickDamageTag[]): string[] {
  const repairIds = new Set<string>();

  quickTags.forEach(tag => {
    tag.autoRepairIds.forEach(id => repairIds.add(id));
  });

  return Array.from(repairIds);
}

/**
 * Validates if damage assessment is complete enough for estimate
 */
export function validateDamageAssessment(damages: ShingleDamage[], quickTags: QuickDamageTag[]): {
  isValid: boolean;
  message: string;
} {
  const totalShingles = damages.reduce((sum, d) => sum + d.count, 0);

  if (totalShingles === 0 && quickTags.length === 0) {
    return {
      isValid: false,
      message: 'Add at least one damage item or quick tag to continue',
    };
  }

  return {
    isValid: true,
    message: '',
  };
}

/**
 * Formats damage counts for display
 */
export function formatDamageCount(damages: ShingleDamage[]): string {
  const counts = damages.filter(d => d.count > 0);

  if (counts.length === 0) return '0 shingles';

  const total = counts.reduce((sum, d) => sum + d.count, 0);
  const layerNames = counts.map(d => {
    const name = LAYER_DEPTH_NAMES[d.layerDepth].split('(')[0].trim();
    return `${d.count} ${name}`;
  });

  return `${total} total (${layerNames.join(', ')})`;
}
