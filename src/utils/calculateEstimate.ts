import type {
  Estimate,
  EstimateCalculation,
  LineItem,
  AllShinglePricing,
  AdditionalRepairType,
  PitchMultiplier,
  AccessibilityMultiplier,
  FixedFees,
  WarrantyOption,
  LayerDepth,
} from '../types';
import { UNIT_NAMES, DEFAULT_FLAT_ROOF_PRICING, DEFAULT_COMMERCIAL_REPAIRS, DEFAULT_SERVICE_AGREEMENT_PLANS } from '../data/defaultPricing';

interface CalculationParams {
  estimate: Estimate;
  shinglePricing: AllShinglePricing;
  additionalRepairs: AdditionalRepairType[];
  pitchMultipliers: PitchMultiplier[];
  accessibilityMultipliers: AccessibilityMultiplier[];
  fixedFees: FixedFees;
  warrantyOptions: WarrantyOption[];
}

export function calculateEstimate(params: CalculationParams): EstimateCalculation {
  const {
    estimate,
    shinglePricing,
    additionalRepairs,
    pitchMultipliers,
    accessibilityMultipliers,
    fixedFees,
    warrantyOptions,
  } = params;

  const isCommercial = estimate.roofType === 'commercial';

  // ========== FLAT ROOF LINE ITEMS (Commercial) ==========
  const flatRoofLineItems: LineItem[] = [];

  if (isCommercial && estimate.flatRoofDetails) {
    const details = estimate.flatRoofDetails;
    const materialPricing = DEFAULT_FLAT_ROOF_PRICING.find(
      (p) => p.material === details.material
    );

    // Main membrane repair/replacement area
    if (materialPricing && details.totalArea > 0) {
      const matCost = materialPricing.perSquareFoot.material * details.totalArea;
      const labCost = materialPricing.perSquareFoot.labor * details.totalArea;
      flatRoofLineItems.push({
        description: `${materialPricing.name} - Membrane Repair`,
        quantity: details.totalArea,
        unit: 'sq ft',
        material: matCost,
        labor: labCost,
        subtotal: matCost + labCost,
      });
    }

    // Condition-based auto-add items
    if (details.membraneCondition === 'poor') {
      const area = Math.ceil(details.totalArea * 0.3); // ~30% needs extra work
      if (area > 0) {
        const coating = DEFAULT_COMMERCIAL_REPAIRS.find((r) => r.id === 'coating-application');
        if (coating) {
          flatRoofLineItems.push({
            description: 'Reflective Coating (membrane in poor condition)',
            quantity: area,
            unit: 'sq ft',
            material: coating.material * area,
            labor: coating.labor * area,
            subtotal: (coating.material + coating.labor) * area,
          });
        }
      }
    }

    if (details.seamCondition === 'poor') {
      // Estimate ~1 linear ft of seam repair per 10 sq ft
      const seamFt = Math.ceil(details.totalArea / 10);
      const seamRepair = DEFAULT_COMMERCIAL_REPAIRS.find((r) => r.id === 'seam-repair');
      if (seamRepair && seamFt > 0) {
        flatRoofLineItems.push({
          description: 'Seam/Weld Repair (seams in poor condition)',
          quantity: seamFt,
          unit: 'linear ft',
          material: seamRepair.material * seamFt,
          labor: seamRepair.labor * seamFt,
          subtotal: (seamRepair.material + seamRepair.labor) * seamFt,
        });
      }
    }

    if (details.pondingAreas > 0) {
      const pondingRepair = DEFAULT_COMMERCIAL_REPAIRS.find((r) => r.id === 'ponding-correction');
      if (pondingRepair) {
        // ~100 sq ft per ponding area
        const area = details.pondingAreas * 100;
        flatRoofLineItems.push({
          description: `Ponding Area Correction (${details.pondingAreas} area${details.pondingAreas > 1 ? 's' : ''})`,
          quantity: area,
          unit: 'sq ft',
          material: pondingRepair.material * area,
          labor: pondingRepair.labor * area,
          subtotal: (pondingRepair.material + pondingRepair.labor) * area,
        });
      }
    }

    if (details.drainageIssues) {
      const drainRepair = DEFAULT_COMMERCIAL_REPAIRS.find((r) => r.id === 'drain-repair');
      if (drainRepair) {
        flatRoofLineItems.push({
          description: 'Roof Drain Repair (drainage issues noted)',
          quantity: 1,
          unit: 'each',
          material: drainRepair.material,
          labor: drainRepair.labor,
          subtotal: drainRepair.material + drainRepair.labor,
        });
      }
    }

    if (details.flashingCondition !== 'good') {
      const flashingRepair = DEFAULT_COMMERCIAL_REPAIRS.find((r) => r.id === 'parapet-flashing');
      if (flashingRepair) {
        // Estimate perimeter as sqrt(area)*4
        const perimeter = Math.ceil(Math.sqrt(details.totalArea) * 4);
        const factor = details.flashingCondition === 'poor' ? 1 : 0.5;
        const qty = Math.ceil(perimeter * factor);
        if (qty > 0) {
          flatRoofLineItems.push({
            description: `Parapet Flashing Repair (${details.flashingCondition} condition)`,
            quantity: qty,
            unit: 'linear ft',
            material: flashingRepair.material * qty,
            labor: flashingRepair.labor * qty,
            subtotal: (flashingRepair.material + flashingRepair.labor) * qty,
          });
        }
      }
    }
  }

  // ========== SHINGLE LINE ITEMS (Residential) ==========
  const selectedShinglePricing = shinglePricing[estimate.shingleType];

  const shingleLineItems: LineItem[] = isCommercial
    ? []
    : estimate.shingleDamage
        .filter((d) => d.count > 0)
        .map((damage) => {
          const pricing = selectedShinglePricing[damage.layerDepth];
          const material = pricing.material * damage.count;
          const labor = pricing.labor * damage.count;
          return {
            description: getLayerDescription(damage.layerDepth),
            quantity: damage.count,
            unit: damage.count === 1 ? 'shingle' : 'shingles',
            material,
            labor,
            subtotal: material + labor,
          };
        });

  // ========== ADDITIONAL REPAIR LINE ITEMS ==========
  const additionalRepairLineItems: LineItem[] = estimate.additionalRepairs
    .filter((r) => r.quantity > 0)
    .map((repair) => {
      // Look up in standard repairs first, then commercial
      const repairType =
        additionalRepairs.find((r) => r.id === repair.repairTypeId) ||
        DEFAULT_COMMERCIAL_REPAIRS.find((r) => r.id === repair.repairTypeId);

      if (!repairType) {
        return {
          description: 'Unknown repair',
          quantity: repair.quantity,
          unit: 'each',
          material: 0,
          labor: 0,
          subtotal: 0,
        };
      }
      const material = repairType.material * repair.quantity;
      const labor = repairType.labor * repair.quantity;
      return {
        description: repairType.name,
        quantity: repair.quantity,
        unit: UNIT_NAMES[repairType.unit] || repairType.unit,
        material,
        labor,
        subtotal: material + labor,
      };
    });

  // ========== CUSTOM REPAIR LINE ITEMS ==========
  const customRepairLineItems: LineItem[] = estimate.customRepairs
    .filter((r) => r.quantity > 0)
    .map((repair) => {
      const material = repair.material * repair.quantity;
      const labor = repair.labor * repair.quantity;
      return {
        description: repair.name,
        quantity: repair.quantity,
        unit: UNIT_NAMES[repair.unit],
        material,
        labor,
        subtotal: material + labor,
      };
    });

  // ========== CALCULATE SUBTOTALS ==========
  const shingleSubtotal = shingleLineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const flatRoofSubtotal = flatRoofLineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const additionalRepairsSubtotal = additionalRepairLineItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );
  const customRepairsSubtotal = customRepairLineItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  const subtotalBeforeMultipliers =
    shingleSubtotal + flatRoofSubtotal + additionalRepairsSubtotal + customRepairsSubtotal;

  // ========== MULTIPLIERS ==========
  // For commercial flat roofs, skip pitch adjustment (flat = no pitch)
  const pitchMultiplier = isCommercial
    ? 1.0
    : pitchMultipliers.find((p) => p.id === estimate.pitchMultiplierId)?.multiplier || 1.0;
  const accessibilityMultiplier =
    accessibilityMultipliers.find((a) => a.id === estimate.accessibilityMultiplierId)
      ?.multiplier || 1.0;

  const pitchAdjustment = subtotalBeforeMultipliers * (pitchMultiplier - 1);
  const accessibilityAdjustment =
    (subtotalBeforeMultipliers + pitchAdjustment) * (accessibilityMultiplier - 1);

  const subtotalAfterMultipliers =
    subtotalBeforeMultipliers + pitchAdjustment + accessibilityAdjustment;

  // ========== FEES ==========
  const minimumServiceFee =
    subtotalAfterMultipliers < fixedFees.minimumServiceCall &&
    subtotalBeforeMultipliers > 0
      ? fixedFees.minimumServiceCall - subtotalAfterMultipliers
      : 0;

  const emergencySurcharge = estimate.isEmergency ? fixedFees.emergencySurcharge : 0;
  const afterHoursSurcharge = estimate.isAfterHours ? fixedFees.afterHoursSurcharge : 0;

  const warrantyFee =
    warrantyOptions.find((w) => w.id === estimate.warrantyOptionId)?.price || 0;

  // ========== SERVICE AGREEMENT FEE ==========
  const serviceAgreementFee = estimate.includeServiceAgreement && estimate.selectedServicePlanId
    ? DEFAULT_SERVICE_AGREEMENT_PLANS.find((p) => p.id === estimate.selectedServicePlanId)
        ?.annualPrice || 0
    : 0;

  // ========== GRAND TOTAL ==========
  const grandTotal =
    subtotalAfterMultipliers +
    minimumServiceFee +
    emergencySurcharge +
    afterHoursSurcharge +
    warrantyFee +
    serviceAgreementFee;

  return {
    shingleLineItems,
    additionalRepairLineItems,
    customRepairLineItems,
    flatRoofLineItems,
    shingleSubtotal,
    additionalRepairsSubtotal,
    customRepairsSubtotal,
    flatRoofSubtotal,
    subtotalBeforeMultipliers,
    pitchAdjustment,
    accessibilityAdjustment,
    subtotalAfterMultipliers,
    minimumServiceFee,
    emergencySurcharge,
    afterHoursSurcharge,
    warrantyFee,
    serviceAgreementFee,
    grandTotal,
  };
}

function getLayerDescription(layerDepth: LayerDepth): string {
  const descriptions: Record<LayerDepth, string> = {
    surface: 'Surface repair',
    'one-layer': '1 layer replacement',
    'two-layer': '2 layer repair',
    'three-layer': '3 layer repair',
  };
  return descriptions[layerDepth];
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Format date
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Get total shingle count
export function getTotalShingleCount(estimate: Estimate): number {
  return estimate.shingleDamage.reduce((sum, d) => sum + d.count, 0);
}
