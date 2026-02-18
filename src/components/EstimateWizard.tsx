import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui';
import {
  CustomerInfoStep,
  DamageAssessmentStep,
  AdditionalRepairsStep,
  SiteConditionsStep,
  ServiceAgreementStep,
  ReviewStep,
} from './steps';
import { useEstimate, useCurrentEstimate } from '../context/EstimateContext';
import { usePricing } from '../context/PricingContext';
import { calculateEstimate, formatCurrency } from '../utils/calculateEstimate';

const STEPS = [
  { id: 'customer', title: 'Customer', shortTitle: '1' },
  { id: 'damage', title: 'Damage', shortTitle: '2' },
  { id: 'repairs', title: 'Repairs', shortTitle: '3' },
  { id: 'conditions', title: 'Conditions', shortTitle: '4' },
  { id: 'service', title: 'Service', shortTitle: '5' },
  { id: 'review', title: 'Review', shortTitle: '6' },
];

interface EstimateWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function EstimateWizard({ onComplete, onCancel }: EstimateWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { dispatch } = useEstimate();
  const estimate = useCurrentEstimate();
  const { state: pricingState } = usePricing();

  // Create new estimate on mount if none exists
  useEffect(() => {
    if (!estimate) {
      dispatch({ type: 'CREATE_NEW_ESTIMATE' });
    }
  }, [estimate, dispatch]);

  // Calculate running total
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

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    dispatch({ type: 'SAVE_ESTIMATE' });
    onComplete?.();
  };

  const handleCancel = () => {
    dispatch({ type: 'CLEAR_CURRENT_ESTIMATE' });
    onCancel?.();
  };

  if (!estimate) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <CustomerInfoStep />;
      case 1:
        return <DamageAssessmentStep onNext={nextStep} />;
      case 2:
        return <AdditionalRepairsStep onNext={nextStep} />;
      case 3:
        return <SiteConditionsStep />;
      case 4:
        return <ServiceAgreementStep />;
      case 5:
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleCancel}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <h1 className="font-semibold text-gray-900">New Estimate</h1>
              <p className="text-xs text-gray-500">{estimate.estimateNumber}</p>
            </div>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors
                  ${
                    index === currentStep
                      ? 'bg-[#00224a] text-white'
                      : index < currentStep
                        ? 'bg-[#00224a]/20 text-[#00224a]'
                        : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {index < currentStep ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.shortTitle
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-center mt-1">
            <span className="text-xs text-gray-500">{STEPS[currentStep].title}</span>
          </div>
        </div>
      </header>

      {/* Running Total Bar */}
      {calculation && calculation.grandTotal > 0 && (
        <div className="bg-[#00224a] text-white px-4 py-2 text-center sticky top-[105px] z-10">
          <span className="text-sm">Running Total: </span>
          <span className="font-bold">{formatCurrency(calculation.grandTotal)}</span>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">{renderStep()}</div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-gray-200 sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep} className="flex-1">
                Back
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button onClick={nextStep} className="flex-1">
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete} className="flex-1">
                Complete & Save
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
