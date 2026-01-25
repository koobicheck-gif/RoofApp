import { Input, CardSelect, Card, CardHeader } from '../ui';
import { useEstimate, useCurrentEstimate } from '../../context/EstimateContext';
import { SHINGLE_TYPE_NAMES } from '../../data/defaultPricing';
import type { ShingleType, Customer } from '../../types';

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

  const updateShingleType = (value: string) => {
    dispatch({ type: 'SET_SHINGLE_TYPE', payload: value as ShingleType });
  };

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

      {/* Shingle Type Selection */}
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
    </div>
  );
}
