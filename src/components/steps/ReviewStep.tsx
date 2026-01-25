import { useState, useMemo } from 'react';
import { Card, CardHeader, Button, TextArea } from '../ui';
import { useEstimate, useCurrentEstimate } from '../../context/EstimateContext';
import { usePricing } from '../../context/PricingContext';
import { calculateEstimate, formatCurrency, formatDate } from '../../utils/calculateEstimate';
import { SHINGLE_TYPE_NAMES } from '../../data/defaultPricing';

export function ReviewStep() {
  const { dispatch } = useEstimate();
  const estimate = useCurrentEstimate();
  const { state: pricingState } = usePricing();
  const [viewMode, setViewMode] = useState<'detailed' | 'customer'>('detailed');

  const calculation = useMemo(() => {
    if (!estimate) return null;
    return calculateEstimate({
      estimate,
      shinglePricing: pricingState.shinglePricing,
      additionalRepairs: pricingState.additionalRepairs,
      pitchMultipliers: pricingState.pitchMultipliers,
      accessibilityMultipliers: pricingState.accessibilityMultipliers,
      fixedFees: pricingState.fixedFees,
      warrantyOptions: pricingState.warrantyOptions,
    });
  }, [estimate, pricingState]);

  if (!estimate || !calculation) return null;

  const selectedPitch = pricingState.pitchMultipliers.find(
    (p) => p.id === estimate.pitchMultiplierId
  );
  const selectedAccessibility = pricingState.accessibilityMultipliers.find(
    (a) => a.id === estimate.accessibilityMultiplierId
  );
  const selectedWarranty = pricingState.warrantyOptions.find(
    (w) => w.id === estimate.warrantyOptionId
  );

  const hasShingleRepairs = calculation.shingleLineItems.length > 0;
  const hasAdditionalRepairs =
    calculation.additionalRepairLineItems.length > 0 ||
    calculation.customRepairLineItems.length > 0;

  const saveEstimate = () => {
    dispatch({ type: 'SAVE_ESTIMATE' });
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'detailed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Detailed View
          </button>
          <button
            onClick={() => setViewMode('customer')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'customer'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Customer View
          </button>
        </div>
      </div>

      {/* Estimate Preview */}
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="bg-blue-700 text-white p-6 -m-4 mb-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{pricingState.companyInfo.name}</h1>
            <p className="text-blue-200 mt-1">{pricingState.companyInfo.tagline}</p>
          </div>
        </div>

        {/* Estimate Details */}
        <div className="space-y-6 mt-6">
          {/* Customer and Estimate Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
              <p className="text-gray-700">{estimate.customer.name || 'Not provided'}</p>
              <p className="text-gray-600">
                {estimate.customer.address}
                {estimate.customer.address && <br />}
                {estimate.customer.city}
                {estimate.customer.city && ', '}
                {estimate.customer.state} {estimate.customer.zip}
              </p>
              {estimate.customer.phone && (
                <p className="text-gray-600">{estimate.customer.phone}</p>
              )}
              {estimate.customer.email && (
                <p className="text-gray-600">{estimate.customer.email}</p>
              )}
            </div>
            <div className="text-sm sm:text-right">
              <p className="text-gray-500">Estimate #</p>
              <p className="font-semibold text-gray-900">{estimate.estimateNumber}</p>
              <p className="text-gray-500 mt-2">Date</p>
              <p className="text-gray-700">{formatDate(estimate.createdAt)}</p>
              <p className="text-gray-500 mt-2">Shingle Type</p>
              <p className="text-gray-700">{SHINGLE_TYPE_NAMES[estimate.shingleType]}</p>
            </div>
          </div>

          {/* Line Items */}
          <div className="border-t border-gray-200 pt-4">
            {/* Shingle Repairs */}
            {hasShingleRepairs && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">SHINGLE REPAIRS</h3>
                <div className="border-b border-gray-100 pb-1 mb-2">
                  <div className="grid grid-cols-12 text-xs text-gray-500 font-medium">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2 text-right">Qty</div>
                    {viewMode === 'detailed' && (
                      <>
                        <div className="col-span-2 text-right">Material</div>
                        <div className="col-span-2 text-right">Labor</div>
                      </>
                    )}
                    <div
                      className={`text-right ${viewMode === 'detailed' ? 'col-span-1' : 'col-span-5'}`}
                    >
                      Total
                    </div>
                  </div>
                </div>
                {calculation.shingleLineItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 text-sm py-1 hover:bg-gray-50"
                  >
                    <div className="col-span-5 text-gray-700">{item.description}</div>
                    <div className="col-span-2 text-right text-gray-600">
                      {item.quantity} {item.unit}
                    </div>
                    {viewMode === 'detailed' && (
                      <>
                        <div className="col-span-2 text-right text-gray-600">
                          {formatCurrency(item.material)}
                        </div>
                        <div className="col-span-2 text-right text-gray-600">
                          {formatCurrency(item.labor)}
                        </div>
                      </>
                    )}
                    <div
                      className={`text-right font-medium text-gray-900 ${viewMode === 'detailed' ? 'col-span-1' : 'col-span-5'}`}
                    >
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shingle Repairs Subtotal</span>
                    <span className="font-semibold">
                      {formatCurrency(calculation.shingleSubtotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Repairs */}
            {hasAdditionalRepairs && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">ADDITIONAL REPAIRS</h3>
                <div className="border-b border-gray-100 pb-1 mb-2">
                  <div className="grid grid-cols-12 text-xs text-gray-500 font-medium">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2 text-right">Qty</div>
                    {viewMode === 'detailed' && (
                      <>
                        <div className="col-span-2 text-right">Material</div>
                        <div className="col-span-2 text-right">Labor</div>
                      </>
                    )}
                    <div
                      className={`text-right ${viewMode === 'detailed' ? 'col-span-1' : 'col-span-5'}`}
                    >
                      Total
                    </div>
                  </div>
                </div>
                {[...calculation.additionalRepairLineItems, ...calculation.customRepairLineItems].map(
                  (item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 text-sm py-1 hover:bg-gray-50"
                    >
                      <div className="col-span-5 text-gray-700">{item.description}</div>
                      <div className="col-span-2 text-right text-gray-600">
                        {item.quantity} {item.unit}
                      </div>
                      {viewMode === 'detailed' && (
                        <>
                          <div className="col-span-2 text-right text-gray-600">
                            {formatCurrency(item.material)}
                          </div>
                          <div className="col-span-2 text-right text-gray-600">
                            {formatCurrency(item.labor)}
                          </div>
                        </>
                      )}
                      <div
                        className={`text-right font-medium text-gray-900 ${viewMode === 'detailed' ? 'col-span-1' : 'col-span-5'}`}
                      >
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  )
                )}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Additional Repairs Subtotal</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        calculation.additionalRepairsSubtotal + calculation.customRepairsSubtotal
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Totals Section */}
            <div className="border-t-2 border-gray-300 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(calculation.subtotalBeforeMultipliers)}</span>
              </div>

              {calculation.pitchAdjustment > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Pitch Adjustment ({selectedPitch?.name} {selectedPitch?.multiplier}x)
                  </span>
                  <span>+{formatCurrency(calculation.pitchAdjustment)}</span>
                </div>
              )}

              {calculation.accessibilityAdjustment > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Access Adjustment ({selectedAccessibility?.name}{' '}
                    {selectedAccessibility?.multiplier}x)
                  </span>
                  <span>+{formatCurrency(calculation.accessibilityAdjustment)}</span>
                </div>
              )}

              {calculation.minimumServiceFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Minimum Service Fee Adjustment</span>
                  <span>+{formatCurrency(calculation.minimumServiceFee)}</span>
                </div>
              )}

              {calculation.emergencySurcharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Emergency/Same-Day Surcharge</span>
                  <span>+{formatCurrency(calculation.emergencySurcharge)}</span>
                </div>
              )}

              {calculation.afterHoursSurcharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">After-Hours Surcharge</span>
                  <span>+{formatCurrency(calculation.afterHoursSurcharge)}</span>
                </div>
              )}

              {calculation.warrantyFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {selectedWarranty?.name}
                  </span>
                  <span>+{formatCurrency(calculation.warrantyFee)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-xl font-bold text-gray-900">TOTAL</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(calculation.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Warranty Note */}
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <p className="text-sm text-gray-600">
              <strong>Warranty:</strong> {selectedWarranty?.name}
              {selectedWarranty?.years === 1 && ' (included with all repairs)'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              This estimate is valid for 30 days from the date above.
            </p>
          </div>
        </div>
      </Card>

      {/* Tech Notes */}
      <Card>
        <CardHeader title="Tech Notes" subtitle="Add any notes for this estimate" />
        <TextArea
          value={estimate.techNotes}
          onChange={(e) => dispatch({ type: 'SET_TECH_NOTES', payload: e.target.value })}
          placeholder="Add any notes about the job, special considerations, or follow-up items..."
          rows={4}
        />
      </Card>

      {/* Photo Summary */}
      {estimate.photos.length > 0 && (
        <Card>
          <CardHeader
            title="Attached Photos"
            subtitle={`${estimate.photos.length} photo${estimate.photos.length > 1 ? 's' : ''} attached`}
          />
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {estimate.photos.slice(0, 6).map((photo) => (
              <img
                key={photo.id}
                src={photo.dataUrl}
                alt="Damage"
                className="aspect-square object-cover rounded-lg"
              />
            ))}
            {estimate.photos.length > 6 && (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 font-medium">
                  +{estimate.photos.length - 6}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex gap-3">
        <Button fullWidth onClick={saveEstimate}>
          Save Estimate
        </Button>
      </div>
    </div>
  );
}
