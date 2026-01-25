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
import { UNIT_NAMES } from '../data/defaultPricing';

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

  // Get pricing for selected shingle type
  const selectedShinglePricing = shinglePricing[estimate.shingleType];

  // Calculate shingle line items
  const shingleLineItems: LineItem[] = estimate.shingleDamage
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

  // Calculate additional repair line items
  const additionalRepairLineItems: LineItem[] = estimate.additionalRepairs
    .filter((r) => r.quantity > 0)
    .map((repair) => {
      const repairType = additionalRepairs.find((r) => r.id === repair.repairTypeId);
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
        unit: UNIT_NAMES[repairType.unit],
        material,
        labor,
        subtotal: material + labor,
      };
    });

  // Calculate custom repair line items
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

  // Calculate subtotals
  const shingleSubtotal = shingleLineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const additionalRepairsSubtotal = additionalRepairLineItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );
  const customRepairsSubtotal = customRepairLineItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  const subtotalBeforeMultipliers =
    shingleSubtotal + additionalRepairsSubtotal + customRepairsSubtotal;

  // Get multipliers
  const pitchMultiplier =
    pitchMultipliers.find((p) => p.id === estimate.pitchMultiplierId)?.multiplier || 1.0;
  const accessibilityMultiplier =
    accessibilityMultipliers.find((a) => a.id === estimate.accessibilityMultiplierId)
      ?.multiplier || 1.0;

  // Calculate adjustments
  const pitchAdjustment = subtotalBeforeMultipliers * (pitchMultiplier - 1);
  const accessibilityAdjustment =
    (subtotalBeforeMultipliers + pitchAdjustment) * (accessibilityMultiplier - 1);

  const subtotalAfterMultipliers =
    subtotalBeforeMultipliers + pitchAdjustment + accessibilityAdjustment;

  // Apply minimum service fee if applicable
  const minimumServiceFee =
    subtotalAfterMultipliers < fixedFees.minimumServiceCall &&
    subtotalBeforeMultipliers > 0
      ? fixedFees.minimumServiceCall - subtotalAfterMultipliers
      : 0;

  // Add surcharges
  const emergencySurcharge = estimate.isEmergency ? fixedFees.emergencySurcharge : 0;
  const afterHoursSurcharge = estimate.isAfterHours ? fixedFees.afterHoursSurcharge : 0;

  // Get warranty fee
  const warrantyFee =
    warrantyOptions.find((w) => w.id === estimate.warrantyOptionId)?.price || 0;

  // Calculate grand total
  const grandTotal =
    subtotalAfterMultipliers +
    minimumServiceFee +
    emergencySurcharge +
    afterHoursSurcharge +
    warrantyFee;

  return {
    shingleLineItems,
    additionalRepairLineItems,
    customRepairLineItems,
    shingleSubtotal,
    additionalRepairsSubtotal,
    customRepairsSubtotal,
    subtotalBeforeMultipliers,
    pitchAdjustment,
    accessibilityAdjustment,
    subtotalAfterMultipliers,
    minimumServiceFee,
    emergencySurcharge,
    afterHoursSurcharge,
    warrantyFee,
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
