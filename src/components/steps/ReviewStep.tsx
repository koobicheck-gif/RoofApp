import { useState, useMemo } from 'react';
import { Card, CardHeader, Button, TextArea } from '../ui';
import { useEstimate, useCurrentEstimate } from '../../context/EstimateContext';
import { usePricing } from '../../context/PricingContext';
import { calculateEstimate, formatCurrency, formatDate } from '../../utils/calculateEstimate';
import { generateEstimatePdf, downloadPdf } from '../../utils/generatePdf';
import { generateFullScope } from '../../utils/autoGenerateScope';
import { SHINGLE_TYPE_NAMES, DEFAULT_SERVICE_AGREEMENT_PLANS, FLAT_ROOF_MATERIAL_NAMES } from '../../data/defaultPricing';

export function ReviewStep() {
  const { dispatch } = useEstimate();
  const estimate = useCurrentEstimate();
  const { state: pricingState } = usePricing();
  const [viewMode, setViewMode] = useState<'detailed' | 'customer'>('detailed');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
  const selectedServicePlan = estimate.includeServiceAgreement
    ? DEFAULT_SERVICE_AGREEMENT_PLANS.find((p) => p.id === estimate.selectedServicePlanId)
    : null;

  const hasShingleRepairs = calculation.shingleLineItems.length > 0;
  const isCommercial = estimate.roofType === 'commercial';
  const hasFlatRoofRepairs = calculation.flatRoofLineItems.length > 0;
  const hasAdditionalRepairs =
    calculation.additionalRepairLineItems.length > 0 ||
    calculation.customRepairLineItems.length > 0;

  const saveEstimate = () => {
    dispatch({ type: 'SAVE_ESTIMATE' });
  };

  const handleDownloadPdf = async (showDetailed: boolean) => {
    setIsGeneratingPdf(true);
    try {
      const doc = await generateEstimatePdf({
        estimate,
        calculation,
        companyInfo: pricingState.companyInfo,
        showDetailedPricing: showDetailed,
      });
      const filename = `Estimate-${estimate.estimateNumber}-${estimate.customer.name || 'Customer'}.pdf`;
      downloadPdf(doc, filename.replace(/[^a-zA-Z0-9-_\.]/g, '_'));
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSharePdf = async () => {
    if (!navigator.share) {
      alert('Sharing is not supported on this device. Use the download button instead.');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const doc = await generateEstimatePdf({
        estimate,
        calculation,
        companyInfo: pricingState.companyInfo,
        showDetailedPricing: false,
      });
      const blob = doc.output('blob');
      const filename = `Estimate-${estimate.estimateNumber}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });

      await navigator.share({
        title: `Roof Repair Estimate ${estimate.estimateNumber}`,
        text: `Estimate for ${estimate.customer.name || 'Customer'} - ${formatCurrency(calculation.grandTotal)}`,
        files: [file],
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to share PDF:', error);
        alert('Failed to share. Try downloading instead.');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
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
        <div className="bg-[#00224a] text-white p-6 -m-4 mb-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{pricingState.companyInfo.name}</h1>
            <p className="text-white/70 mt-1">{pricingState.companyInfo.tagline}</p>
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
              <p className="text-gray-500 mt-2">Roof Type</p>
              <p className="text-gray-700">
                {isCommercial
                  ? `Commercial - ${FLAT_ROOF_MATERIAL_NAMES[estimate.flatRoofDetails?.material || 'tpo']}`
                  : `Residential - ${SHINGLE_TYPE_NAMES[estimate.shingleType]}`}
              </p>
            </div>
          </div>

          {/* Flat Roof Condition Summary (Commercial) */}
          {isCommercial && estimate.flatRoofDetails && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Flat Roof Condition</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Total Area:</span>{' '}
                  <span className="text-gray-900">{estimate.flatRoofDetails.totalArea.toLocaleString()} sq ft</span>
                </div>
                <div>
                  <span className="text-gray-500">Roof Age:</span>{' '}
                  <span className="text-gray-900">{estimate.flatRoofDetails.roofAge} years</span>
                </div>
                <div>
                  <span className="text-gray-500">Membrane:</span>{' '}
                  <span className={`capitalize font-medium ${
                    estimate.flatRoofDetails.membraneCondition === 'poor' ? 'text-red-600' :
                    estimate.flatRoofDetails.membraneCondition === 'fair' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>{estimate.flatRoofDetails.membraneCondition}</span>
                </div>
                <div>
                  <span className="text-gray-500">Seams:</span>{' '}
                  <span className={`capitalize font-medium ${
                    estimate.flatRoofDetails.seamCondition === 'poor' ? 'text-red-600' :
                    estimate.flatRoofDetails.seamCondition === 'fair' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>{estimate.flatRoofDetails.seamCondition}</span>
                </div>
                <div>
                  <span className="text-gray-500">Flashing:</span>{' '}
                  <span className={`capitalize font-medium ${
                    estimate.flatRoofDetails.flashingCondition === 'poor' ? 'text-red-600' :
                    estimate.flatRoofDetails.flashingCondition === 'fair' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>{estimate.flatRoofDetails.flashingCondition}</span>
                </div>
                <div>
                  <span className="text-gray-500">Ponding Areas:</span>{' '}
                  <span className="text-gray-900">{estimate.flatRoofDetails.pondingAreas}</span>
                </div>
                {estimate.flatRoofDetails.drainageIssues && (
                  <div className="col-span-2">
                    <span className="text-amber-600 font-medium">Drainage issues noted</span>
                  </div>
                )}
              </div>
            </div>
          )}

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

            {/* Flat Roof Repairs (Commercial) */}
            {hasFlatRoofRepairs && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">FLAT ROOF REPAIRS</h3>
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
                {calculation.flatRoofLineItems.map((item, index) => (
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
                    <span className="text-gray-600">Flat Roof Repairs Subtotal</span>
                    <span className="font-semibold">
                      {formatCurrency(calculation.flatRoofSubtotal)}
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

              {calculation.serviceAgreementFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Service Agreement ({selectedServicePlan?.name})
                  </span>
                  <span>+{formatCurrency(calculation.serviceAgreementFee)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-xl font-bold text-gray-900">TOTAL</span>
                <span className="text-2xl font-bold text-[#00224a]">
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

          {/* Service Agreement */}
          {selectedServicePlan && (
            <div className="bg-[#00224a]/5 border border-[#00224a]/20 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#00224a] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[#00224a]">
                    Service Agreement: {selectedServicePlan.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedServicePlan.inspectionsPerYear} inspection
                    {selectedServicePlan.inspectionsPerYear > 1 ? 's' : ''} per year •{' '}
                    {selectedServicePlan.discountPercent}% off future repairs
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-lg font-bold text-[#00224a]">
                      {formatCurrency(selectedServicePlan.annualPrice)}
                    </span>
                    <span className="text-sm text-gray-500">/year</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Scope of Work */}
      <Card>
        <CardHeader
          title="Scope of Work"
          subtitle="Included on the final estimate — auto-generated or custom"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const autoScope = generateFullScope(estimate, calculation);
                dispatch({ type: 'SET_SCOPE_OF_WORK', payload: autoScope });
              }}
            >
              Auto-Generate
            </Button>
          }
        />
        <TextArea
          value={estimate.scopeOfWork}
          onChange={(e) => dispatch({ type: 'SET_SCOPE_OF_WORK', payload: e.target.value })}
          placeholder="Describe the scope of work for this estimate. Click 'Auto-Generate' to create from the line items above, then edit as needed..."
          rows={10}
          className="font-mono text-sm"
        />
        {!estimate.scopeOfWork && (
          <p className="text-xs text-amber-600 mt-2">
            Tap "Auto-Generate" to create a scope of work from the estimate details above.
          </p>
        )}
      </Card>

      {/* PDF Actions */}
      <Card>
        <CardHeader
          title="Generate PDF"
          subtitle="Download or share the estimate as a PDF"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleDownloadPdf(false)}
            disabled={isGeneratingPdf}
            fullWidth
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isGeneratingPdf ? 'Generating...' : 'Customer PDF'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDownloadPdf(true)}
            disabled={isGeneratingPdf}
            fullWidth
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isGeneratingPdf ? 'Generating...' : 'Detailed PDF'}
          </Button>
        </div>
        {'share' in navigator && (
          <Button
            variant="secondary"
            onClick={handleSharePdf}
            disabled={isGeneratingPdf}
            fullWidth
            className="mt-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share PDF
          </Button>
        )}
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
