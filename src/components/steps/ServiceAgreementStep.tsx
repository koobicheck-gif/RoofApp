import { Card, CardHeader } from '../ui';
import { useEstimate, useCurrentEstimate } from '../../context/EstimateContext';
import { DEFAULT_SERVICE_AGREEMENT_PLANS } from '../../data/defaultPricing';
import { formatCurrency } from '../../utils/calculateEstimate';

export function ServiceAgreementStep() {
  const { dispatch } = useEstimate();
  const estimate = useCurrentEstimate();

  if (!estimate) return null;

  const includeAgreement = estimate.includeServiceAgreement ?? false;
  const selectedPlanId = estimate.selectedServicePlanId;

  const toggleServiceAgreement = () => {
    dispatch({
      type: 'SET_SERVICE_AGREEMENT',
      payload: {
        include: !includeAgreement,
        planId: !includeAgreement ? 'standard' : undefined,
      },
    });
  };

  const selectPlan = (planId: string) => {
    dispatch({
      type: 'SET_SERVICE_AGREEMENT',
      payload: { include: true, planId },
    });
  };

  const selectedPlan = DEFAULT_SERVICE_AGREEMENT_PLANS.find(
    (p) => p.id === selectedPlanId
  );

  return (
    <div className="space-y-6">
      {/* Service Agreement Toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Add Service Agreement
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Offer recurring maintenance for long-term roof protection
            </p>
          </div>
          <button
            onClick={toggleServiceAgreement}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              includeAgreement ? 'bg-[#00224a]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                includeAgreement ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Service Agreement Plans */}
      {includeAgreement && (
        <>
          <Card>
            <CardHeader
              title="Select Maintenance Plan"
              subtitle="Choose the level of protection for your customer"
            />
            <div className="grid gap-4 md:grid-cols-3">
              {DEFAULT_SERVICE_AGREEMENT_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const monthlyPrice = Math.round(plan.annualPrice / 12);

                return (
                  <div
                    key={plan.id}
                    onClick={() => selectPlan(plan.id)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#00224a] bg-[#00224a]/5 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* Popular Badge */}
                    {plan.tier === 'standard' && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-[#00224a] text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}

                    {/* Plan Name */}
                    <div className="text-center mb-4 mt-2">
                      <h4
                        className={`text-lg font-bold ${
                          isSelected ? 'text-[#00224a]' : 'text-gray-900'
                        }`}
                      >
                        {plan.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {plan.description}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-[#00224a]">
                        {formatCurrency(plan.annualPrice)}
                      </div>
                      <div className="text-sm text-gray-500">/year</div>
                      <div className="text-xs text-gray-400 mt-1">
                        or {formatCurrency(monthlyPrice)}/month
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <svg
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              isSelected ? 'text-[#00224a]' : 'text-green-500'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Select Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-[#00224a] rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Selected Plan Summary */}
          {selectedPlan && (
            <Card className="bg-[#00224a]/5 border-[#00224a]/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#00224a] rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
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
                    {selectedPlan.name} Plan Selected
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedPlan.inspectionsPerYear} inspection
                    {selectedPlan.inspectionsPerYear > 1 ? 's' : ''} per year •{' '}
                    {selectedPlan.discountPercent}% off repairs
                    {selectedPlan.minorRepairsIncluded && (
                      <> • Minor repairs up to {formatCurrency(selectedPlan.minorRepairLimit)} included</>
                    )}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#00224a]">
                      {formatCurrency(selectedPlan.annualPrice)}
                    </span>
                    <span className="text-sm text-gray-500">/year</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Benefits Highlight */}
          <Card>
            <CardHeader
              title="Why Offer Service Agreements?"
              subtitle="Benefits for you and your customers"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Recurring Revenue</h5>
                  <p className="text-sm text-gray-500">
                    Predictable income stream for your business
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Customer Retention</h5>
                  <p className="text-sm text-gray-500">
                    Build long-term relationships
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-amber-600"
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
                <div>
                  <h5 className="font-medium text-gray-900">Roof Protection</h5>
                  <p className="text-sm text-gray-500">
                    Extend roof lifespan with preventive care
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Priority Service</h5>
                  <p className="text-sm text-gray-500">
                    Customers get faster response times
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
