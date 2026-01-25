import { Card, CardHeader, CardSelect, Toggle } from '../ui';
import { useEstimate, useCurrentEstimate } from '../../context/EstimateContext';
import {
  usePitchMultipliers,
  useAccessibilityMultipliers,
  useWarrantyOptions,
  useFixedFees,
} from '../../context/PricingContext';
import { formatCurrency } from '../../utils/calculateEstimate';

export function SiteConditionsStep() {
  const { dispatch } = useEstimate();
  const estimate = useCurrentEstimate();
  const pitchMultipliers = usePitchMultipliers();
  const accessibilityMultipliers = useAccessibilityMultipliers();
  const warrantyOptions = useWarrantyOptions();
  const fixedFees = useFixedFees();

  if (!estimate) return null;

  const selectedPitch = pitchMultipliers.find((p) => p.id === estimate.pitchMultiplierId);
  const selectedAccessibility = accessibilityMultipliers.find(
    (a) => a.id === estimate.accessibilityMultiplierId
  );

  const pitchOptions = pitchMultipliers.map((p) => ({
    value: p.id,
    label: p.name,
    description: `${p.description} (${p.multiplier === 1 ? 'No adjustment' : `${((p.multiplier - 1) * 100).toFixed(0)}% increase`})`,
  }));

  const accessibilityOptions = accessibilityMultipliers.map((a) => ({
    value: a.id,
    label: a.name,
    description: `${a.description} (${a.multiplier === 1 ? 'No adjustment' : `${((a.multiplier - 1) * 100).toFixed(0)}% increase`})`,
  }));

  const warrantySelectOptions = warrantyOptions.map((w) => ({
    value: w.id,
    label: w.name,
    description: w.price === 0 ? 'Included' : `+${formatCurrency(w.price)}`,
  }));

  return (
    <div className="space-y-6">
      {/* Roof Pitch */}
      <Card>
        <CardHeader
          title="Roof Pitch"
          subtitle="Select the steepness of the roof"
        />

        {/* Visual pitch guide */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-end justify-center gap-4 h-24">
            <div className="text-center">
              <div className="w-16 h-4 bg-gray-400 rounded-sm" style={{ transform: 'rotate(-5deg)' }} />
              <span className="text-xs text-gray-500 mt-1 block">Low</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-4 bg-gray-400 rounded-sm" style={{ transform: 'rotate(-20deg)' }} />
              <span className="text-xs text-gray-500 mt-1 block">Medium</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-4 bg-gray-400 rounded-sm" style={{ transform: 'rotate(-35deg)' }} />
              <span className="text-xs text-gray-500 mt-1 block">Steep</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-4 bg-gray-400 rounded-sm" style={{ transform: 'rotate(-50deg)' }} />
              <span className="text-xs text-gray-500 mt-1 block">Extreme</span>
            </div>
          </div>
        </div>

        <CardSelect
          options={pitchOptions}
          value={estimate.pitchMultiplierId}
          onChange={(value) => dispatch({ type: 'SET_PITCH_MULTIPLIER', payload: value })}
          columns={2}
        />

        {selectedPitch && selectedPitch.multiplier > 1 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              A {((selectedPitch.multiplier - 1) * 100).toFixed(0)}% adjustment will be applied
              due to the roof pitch requiring additional safety measures and slower work pace.
            </p>
          </div>
        )}
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader
          title="Site Accessibility"
          subtitle="How easy is it to access the repair area?"
        />

        <CardSelect
          options={accessibilityOptions}
          value={estimate.accessibilityMultiplierId}
          onChange={(value) =>
            dispatch({ type: 'SET_ACCESSIBILITY_MULTIPLIER', payload: value })
          }
          columns={3}
        />

        {selectedAccessibility && selectedAccessibility.multiplier > 1 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              A {((selectedAccessibility.multiplier - 1) * 100).toFixed(0)}% adjustment will be
              applied due to difficult access conditions.
            </p>
          </div>
        )}
      </Card>

      {/* Service Options */}
      <Card>
        <CardHeader
          title="Service Options"
          subtitle="Select any applicable service options"
        />

        <div className="space-y-3">
          <Toggle
            label="Emergency / Same-Day Service"
            description={`+${formatCurrency(fixedFees.emergencySurcharge)} surcharge`}
            checked={estimate.isEmergency}
            onChange={(checked) => dispatch({ type: 'SET_EMERGENCY', payload: checked })}
          />

          <Toggle
            label="After-Hours Service"
            description={`+${formatCurrency(fixedFees.afterHoursSurcharge)} surcharge (evenings, weekends, holidays)`}
            checked={estimate.isAfterHours}
            onChange={(checked) => dispatch({ type: 'SET_AFTER_HOURS', payload: checked })}
          />
        </div>

        {(estimate.isEmergency || estimate.isAfterHours) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Total surcharges:{' '}
              <strong>
                {formatCurrency(
                  (estimate.isEmergency ? fixedFees.emergencySurcharge : 0) +
                    (estimate.isAfterHours ? fixedFees.afterHoursSurcharge : 0)
                )}
              </strong>
            </p>
          </div>
        )}
      </Card>

      {/* Warranty Selection */}
      <Card>
        <CardHeader
          title="Warranty Options"
          subtitle="Select the warranty coverage"
        />

        <CardSelect
          options={warrantySelectOptions}
          value={estimate.warrantyOptionId}
          onChange={(value) => dispatch({ type: 'SET_WARRANTY', payload: value })}
          columns={3}
        />
      </Card>

      {/* Minimum Service Fee Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <strong>Minimum Service Call Fee:</strong> {formatCurrency(fixedFees.minimumServiceCall)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              If the repair total is less than the minimum service call fee, the minimum will
              be charged instead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
