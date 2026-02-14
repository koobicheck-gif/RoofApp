import { Input, CardSelect, Card, CardHeader } from '../ui';
import { useEstimate, useCurrentEstimate } from '../../context/EstimateContext';
import { SHINGLE_TYPE_NAMES, FLAT_ROOF_MATERIAL_NAMES, DEFAULT_FLAT_ROOF_PRICING } from '../../data/defaultPricing';
import { PropertyHistoryPanel } from '../PropertyHistoryPanel';
import type { ShingleType, Customer, RoofType, FlatRoofMaterial, FlatRoofDetails } from '../../types';

const SHINGLE_OPTIONS = [
  {
    value: 'three-tab',
    label: SHINGLE_TYPE_NAMES['three-tab'],
    description: 'Most economical option',
  },
  {
    value: 'architectural',
    label: SHINGLE_TYPE_NAMES['architectural'],
    description: 'Most popular choice',
  },
  {
    value: 'premium',
    label: SHINGLE_TYPE_NAMES['premium'],
    description: 'High-end appearance',
  },
];

const ROOF_TYPE_OPTIONS = [
  {
    value: 'residential',
    label: 'Residential (Pitched)',
    description: 'Shingle roofs with slope',
  },
  {
    value: 'commercial',
    label: 'Commercial (Flat)',
    description: 'Flat or low-slope roofs',
  },
];

const FLAT_ROOF_MATERIAL_OPTIONS = DEFAULT_FLAT_ROOF_PRICING.map((p) => ({
  value: p.material,
  label: FLAT_ROOF_MATERIAL_NAMES[p.material],
  description: `${p.warrantyYears}-year warranty`,
}));

export function CustomerInfoStep() {
  const { dispatch } = useEstimate();
  const estimate = useCurrentEstimate();

  if (!estimate) return null;

  const updateCustomer = (field: keyof Customer, value: string) => {
    dispatch({
      type: 'UPDATE_CUSTOMER',
      payload: { ...estimate.customer, [field]: value },
    });
  };

  const updateRoofType = (value: string) => {
    dispatch({ type: 'SET_ROOF_TYPE', payload: value as RoofType });
    // Initialize flat roof details when switching to commercial
    if (value === 'commercial' && !estimate.flatRoofDetails) {
      dispatch({
        type: 'SET_FLAT_ROOF_DETAILS',
        payload: {
          material: 'tpo',
          totalArea: 0,
          drainageIssues: false,
          pondingAreas: 0,
          seamCondition: 'good',
          flashingCondition: 'good',
          membraneCondition: 'good',
          roofAge: 0,
        },
      });
    }
  };

  const updateShingleType = (value: string) => {
    dispatch({ type: 'SET_SHINGLE_TYPE', payload: value as ShingleType });
  };

  const updateFlatRoofMaterial = (value: string) => {
    if (estimate.flatRoofDetails) {
      dispatch({
        type: 'SET_FLAT_ROOF_DETAILS',
        payload: { ...estimate.flatRoofDetails, material: value as FlatRoofMaterial },
      });
    }
  };

  const updateFlatRoofDetails = (field: keyof FlatRoofDetails, value: unknown) => {
    if (estimate.flatRoofDetails) {
      dispatch({
        type: 'SET_FLAT_ROOF_DETAILS',
        payload: { ...estimate.flatRoofDetails, [field]: value },
      });
    }
  };

  // Get roofType with fallback for existing estimates
  const roofType = estimate.roofType || 'residential';

  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader
          title="Customer Information"
          subtitle="Enter the customer's contact details"
        />
        <div className="space-y-4">
          <Input
            label="Customer Name"
            value={estimate.customer.name}
            onChange={(e) => updateCustomer('name', e.target.value)}
            placeholder="John Smith"
            autoComplete="name"
          />

          <Input
            label="Street Address"
            value={estimate.customer.address}
            onChange={(e) => updateCustomer('address', e.target.value)}
            placeholder="123 Oak Street"
            autoComplete="street-address"
          />

          {/* Property History Panel */}
          {estimate.customer.address.length >= 3 && (
            <PropertyHistoryPanel
              address={estimate.customer.address}
              city={estimate.customer.city}
              state={estimate.customer.state}
              currentEstimateId={estimate.id}
            />
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-2">
              <Input
                label="City"
                value={estimate.customer.city}
                onChange={(e) => updateCustomer('city', e.target.value)}
                placeholder="Oklahoma City"
                autoComplete="address-level2"
              />
            </div>
            <Input
              label="State"
              value={estimate.customer.state}
              onChange={(e) => updateCustomer('state', e.target.value)}
              placeholder="OK"
              autoComplete="address-level1"
            />
            <Input
              label="ZIP"
              value={estimate.customer.zip}
              onChange={(e) => updateCustomer('zip', e.target.value)}
              placeholder="73034"
              autoComplete="postal-code"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Phone"
              type="tel"
              value={estimate.customer.phone}
              onChange={(e) => updateCustomer('phone', e.target.value)}
              placeholder="(405) 555-1234"
              autoComplete="tel"
            />
            <Input
              label="Email"
              type="email"
              value={estimate.customer.email}
              onChange={(e) => updateCustomer('email', e.target.value)}
              placeholder="john@example.com"
              autoComplete="email"
            />
          </div>
        </div>
      </Card>

      {/* Roof Type Selection */}
      <Card>
        <CardHeader
          title="Roof Type"
          subtitle="Select residential (pitched) or commercial (flat)"
        />
        <CardSelect
          options={ROOF_TYPE_OPTIONS}
          value={roofType}
          onChange={updateRoofType}
          columns={2}
        />
      </Card>

      {/* Residential: Shingle Type Selection */}
      {roofType === 'residential' && (
        <Card>
          <CardHeader
            title="Shingle Type"
            subtitle="Select the type of shingles on the roof"
          />
          <CardSelect
            options={SHINGLE_OPTIONS}
            value={estimate.shingleType}
            onChange={updateShingleType}
            columns={3}
          />
        </Card>
      )}

      {/* Commercial: Flat Roof Details */}
      {roofType === 'commercial' && (
        <Card>
          <CardHeader
            title="Flat Roof Details"
            subtitle="Enter details about the commercial flat roof"
          />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Roof Material
              </label>
              <CardSelect
                options={FLAT_ROOF_MATERIAL_OPTIONS}
                value={estimate.flatRoofDetails?.material || 'tpo'}
                onChange={updateFlatRoofMaterial}
                columns={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total Roof Area (sq ft)"
                type="number"
                value={estimate.flatRoofDetails?.totalArea?.toString() || '0'}
                onChange={(e) => updateFlatRoofDetails('totalArea', parseInt(e.target.value) || 0)}
                placeholder="5000"
              />
              <Input
                label="Roof Age (years)"
                type="number"
                value={estimate.flatRoofDetails?.roofAge?.toString() || '0'}
                onChange={(e) => updateFlatRoofDetails('roofAge', parseInt(e.target.value) || 0)}
                placeholder="10"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membrane Condition
                </label>
                <select
                  value={estimate.flatRoofDetails?.membraneCondition || 'good'}
                  onChange={(e) => updateFlatRoofDetails('membraneCondition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seam Condition
                </label>
                <select
                  value={estimate.flatRoofDetails?.seamCondition || 'good'}
                  onChange={(e) => updateFlatRoofDetails('seamCondition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flashing Condition
                </label>
                <select
                  value={estimate.flatRoofDetails?.flashingCondition || 'good'}
                  onChange={(e) => updateFlatRoofDetails('flashingCondition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={estimate.flatRoofDetails?.drainageIssues || false}
                  onChange={(e) => updateFlatRoofDetails('drainageIssues', e.target.checked)}
                  className="w-4 h-4 text-[#00224a] rounded"
                />
                <span className="text-sm text-gray-700">Drainage Issues</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Ponding Areas:</label>
                <input
                  type="number"
                  min="0"
                  value={estimate.flatRoofDetails?.pondingAreas || 0}
                  onChange={(e) => updateFlatRoofDetails('pondingAreas', parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
