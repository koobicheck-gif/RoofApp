import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardHeader, Button, Input, InlineNumberInput, Select } from '../ui';
import { useEstimate, useCurrentEstimate } from '../../context/EstimateContext';
import { useAdditionalRepairs } from '../../context/PricingContext';
import { formatCurrency } from '../../utils/calculateEstimate';
import { UNIT_NAMES } from '../../data/defaultPricing';
import type { AdditionalRepair, CustomRepair } from '../../types';

export function AdditionalRepairsStep() {
  const { dispatch } = useEstimate();
  const estimate = useCurrentEstimate();
  const availableRepairs = useAdditionalRepairs();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customRepair, setCustomRepair] = useState<Omit<CustomRepair, 'id'>>({
    name: '',
    material: 0,
    labor: 0,
    quantity: 1,
    unit: 'each',
  });

  if (!estimate) return null;

  const getRepairQuantity = (repairTypeId: string): number => {
    return estimate.additionalRepairs.find((r) => r.repairTypeId === repairTypeId)?.quantity || 0;
  };

  const updateRepairQuantity = (repairTypeId: string, quantity: number) => {
    const existing = estimate.additionalRepairs.find((r) => r.repairTypeId === repairTypeId);
    let newRepairs: AdditionalRepair[];

    if (quantity === 0) {
      newRepairs = estimate.additionalRepairs.filter((r) => r.repairTypeId !== repairTypeId);
    } else if (existing) {
      newRepairs = estimate.additionalRepairs.map((r) =>
        r.repairTypeId === repairTypeId ? { ...r, quantity } : r
      );
    } else {
      newRepairs = [...estimate.additionalRepairs, { repairTypeId, quantity }];
    }

    dispatch({ type: 'SET_ADDITIONAL_REPAIRS', payload: newRepairs });
  };

  const addCustomRepair = () => {
    if (!customRepair.name.trim()) return;

    const newCustomRepair: CustomRepair = {
      ...customRepair,
      id: uuidv4(),
    };

    dispatch({
      type: 'SET_CUSTOM_REPAIRS',
      payload: [...estimate.customRepairs, newCustomRepair],
    });

    // Reset form
    setCustomRepair({
      name: '',
      material: 0,
      labor: 0,
      quantity: 1,
      unit: 'each',
    });
    setShowCustomForm(false);
  };

  const updateCustomRepairQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      dispatch({
        type: 'SET_CUSTOM_REPAIRS',
        payload: estimate.customRepairs.filter((r) => r.id !== id),
      });
    } else {
      dispatch({
        type: 'SET_CUSTOM_REPAIRS',
        payload: estimate.customRepairs.map((r) => (r.id === id ? { ...r, quantity } : r)),
      });
    }
  };

  const removeCustomRepair = (id: string) => {
    dispatch({
      type: 'SET_CUSTOM_REPAIRS',
      payload: estimate.customRepairs.filter((r) => r.id !== id),
    });
  };

  // Calculate totals
  const additionalRepairsTotal = estimate.additionalRepairs.reduce((sum, repair) => {
    const repairType = availableRepairs.find((r) => r.id === repair.repairTypeId);
    if (!repairType) return sum;
    return sum + repair.quantity * (repairType.material + repairType.labor);
  }, 0);

  const customRepairsTotal = estimate.customRepairs.reduce((sum, repair) => {
    return sum + repair.quantity * (repair.material + repair.labor);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Standard Repairs */}
      <Card>
        <CardHeader
          title="Additional Repairs"
          subtitle="Select any additional repairs needed"
        />

        <div className="space-y-3">
          {availableRepairs.map((repairType) => {
            const quantity = getRepairQuantity(repairType.id);
            const total = quantity * (repairType.material + repairType.labor);
            const isSelected = quantity > 0;

            return (
              <div
                key={repairType.id}
                className={`border rounded-lg p-4 transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{repairType.name}</h4>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(repairType.material + repairType.labor)}/{' '}
                      {UNIT_NAMES[repairType.unit]}
                      <span className="text-gray-400 ml-2">
                        (Mat: {formatCurrency(repairType.material)} + Lab:{' '}
                        {formatCurrency(repairType.labor)})
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <InlineNumberInput
                      value={quantity}
                      onChange={(value) => updateRepairQuantity(repairType.id, value)}
                      min={0}
                      max={999}
                    />
                    <span className="text-sm text-gray-500 w-12">
                      {UNIT_NAMES[repairType.unit]}
                    </span>
                    <div className="w-20 text-right">
                      <span
                        className={`font-semibold ${
                          total > 0 ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      >
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {additionalRepairsTotal > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="font-medium text-gray-700">Additional Repairs Subtotal</span>
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(additionalRepairsTotal)}
            </span>
          </div>
        )}
      </Card>

      {/* Custom Repairs */}
      <Card>
        <CardHeader
          title="Custom Repairs"
          subtitle="Add any repairs not listed above"
          action={
            !showCustomForm && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCustomForm(true)}
              >
                + Add Custom
              </Button>
            )
          }
        />

        {/* Custom Repair Form */}
        {showCustomForm && (
          <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="space-y-4">
              <Input
                label="Repair Name"
                value={customRepair.name}
                onChange={(e) =>
                  setCustomRepair({ ...customRepair, name: e.target.value })
                }
                placeholder="e.g., Specialty vent repair"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Material Cost"
                  type="number"
                  value={customRepair.material || ''}
                  onChange={(e) =>
                    setCustomRepair({
                      ...customRepair,
                      material: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
                <Input
                  label="Labor Cost"
                  type="number"
                  value={customRepair.labor || ''}
                  onChange={(e) =>
                    setCustomRepair({
                      ...customRepair,
                      labor: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  value={customRepair.quantity || ''}
                  onChange={(e) =>
                    setCustomRepair({
                      ...customRepair,
                      quantity: parseFloat(e.target.value) || 1,
                    })
                  }
                  min={1}
                />
                <Select
                  label="Unit"
                  value={customRepair.unit}
                  onChange={(value) =>
                    setCustomRepair({
                      ...customRepair,
                      unit: value as 'each' | 'linear_ft' | 'area',
                    })
                  }
                  options={[
                    { value: 'each', label: 'Each' },
                    { value: 'linear_ft', label: 'Linear Feet' },
                    { value: 'area', label: 'Per Area' },
                  ]}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowCustomForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={addCustomRepair} disabled={!customRepair.name.trim()}>
                  Add Repair
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Repairs List */}
        {estimate.customRepairs.length > 0 ? (
          <div className="space-y-3">
            {estimate.customRepairs.map((repair) => {
              const total = repair.quantity * (repair.material + repair.labor);

              return (
                <div
                  key={repair.id}
                  className="border border-green-200 bg-green-50 rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{repair.name}</h4>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                          Custom
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(repair.material + repair.labor)}/{' '}
                        {UNIT_NAMES[repair.unit]}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <InlineNumberInput
                        value={repair.quantity}
                        onChange={(value) => updateCustomRepairQuantity(repair.id, value)}
                        min={0}
                        max={999}
                      />
                      <span className="text-sm text-gray-500 w-12">
                        {UNIT_NAMES[repair.unit]}
                      </span>
                      <div className="w-20 text-right">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(total)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeCustomRepair(repair.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {customRepairsTotal > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-medium text-gray-700">Custom Repairs Subtotal</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(customRepairsTotal)}
                </span>
              </div>
            )}
          </div>
        ) : (
          !showCustomForm && (
            <p className="text-gray-500 text-center py-4">
              No custom repairs added
            </p>
          )
        )}
      </Card>

      {/* Total */}
      {(additionalRepairsTotal > 0 || customRepairsTotal > 0) && (
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">
              All Additional Repairs Total
            </span>
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(additionalRepairsTotal + customRepairsTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
