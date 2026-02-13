import { useState } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { usePricing } from '../../context/PricingContext';
import { SHINGLE_TYPE_NAMES, LAYER_DEPTH_NAMES } from '../../data/defaultPricing';
import { formatCurrency } from '../../utils/calculateEstimate';
import type { ShingleType, LayerDepth, AllShinglePricing } from '../../types';

const SHINGLE_TYPES: ShingleType[] = ['three-tab', 'architectural', 'premium'];
const LAYER_DEPTHS: LayerDepth[] = ['surface', 'one-layer', 'two-layer', 'three-layer'];

export function PricingManager() {
  const { state, dispatch } = usePricing();
  const [editingType, setEditingType] = useState<ShingleType | null>(null);
  const [editValues, setEditValues] = useState<AllShinglePricing | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const startEditing = (type: ShingleType) => {
    setEditingType(type);
    setEditValues(JSON.parse(JSON.stringify(state.shinglePricing)));
    setHasChanges(false);
  };

  const cancelEditing = () => {
    setEditingType(null);
    setEditValues(null);
    setHasChanges(false);
  };

  const updatePrice = (
    type: ShingleType,
    layer: LayerDepth,
    field: 'material' | 'labor',
    value: string
  ) => {
    if (!editValues) return;
    const numValue = parseFloat(value) || 0;
    setEditValues({
      ...editValues,
      [type]: {
        ...editValues[type],
        [layer]: {
          ...editValues[type][layer],
          [field]: numValue,
        },
      },
    });
    setHasChanges(true);
  };

  const saveChanges = () => {
    if (!editValues) return;
    dispatch({ type: 'SET_SHINGLE_PRICING', payload: editValues });
    setEditingType(null);
    setEditValues(null);
    setHasChanges(false);
  };

  const resetToDefaults = () => {
    if (confirm('Reset all pricing to defaults? This cannot be undone.')) {
      dispatch({ type: 'RESET_TO_DEFAULTS' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shingle Pricing</h2>
          <p className="text-sm text-gray-500 mt-1">
            Set material and labor costs per shingle by type and repair depth
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
      </div>

      {SHINGLE_TYPES.map((type) => {
        const isEditing = editingType === type;
        const pricing = isEditing && editValues ? editValues[type] : state.shinglePricing[type];

        return (
          <Card key={type}>
            <CardHeader
              title={SHINGLE_TYPE_NAMES[type]}
              action={
                isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={cancelEditing}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveChanges} disabled={!hasChanges}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => startEditing(type)}>
                    Edit
                  </Button>
                )
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-medium text-gray-600">Layer Depth</th>
                    <th className="text-right py-2 px-4 font-medium text-gray-600">Material</th>
                    <th className="text-right py-2 px-4 font-medium text-gray-600">Labor</th>
                    <th className="text-right py-2 pl-4 font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {LAYER_DEPTHS.map((layer) => {
                    const layerPricing = pricing[layer];
                    const total = layerPricing.material + layerPricing.labor;

                    return (
                      <tr key={layer} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 pr-4">
                          <span className="font-medium text-gray-900">
                            {LAYER_DEPTH_NAMES[layer].split('(')[0].trim()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              value={layerPricing.material}
                              onChange={(e) => updatePrice(type, layer, 'material', e.target.value)}
                              className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <span className="text-gray-600 block text-right">
                              {formatCurrency(layerPricing.material)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              value={layerPricing.labor}
                              onChange={(e) => updatePrice(type, layer, 'labor', e.target.value)}
                              className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <span className="text-gray-600 block text-right">
                              {formatCurrency(layerPricing.labor)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(total)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      {/* Multipliers Section */}
      <Card>
        <CardHeader
          title="Pitch Multipliers"
          subtitle="Adjustments based on roof steepness"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {state.pitchMultipliers.map((pitch) => (
            <div key={pitch.id} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="font-medium text-gray-900">{pitch.name}</div>
              <div className="text-xs text-gray-500">{pitch.description}</div>
              <div className="text-lg font-bold text-blue-600 mt-1">{pitch.multiplier}x</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Accessibility Multipliers"
          subtitle="Adjustments based on job site access"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {state.accessibilityMultipliers.map((access) => (
            <div key={access.id} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="font-medium text-gray-900">{access.name}</div>
              <div className="text-xs text-gray-500">{access.description}</div>
              <div className="text-lg font-bold text-blue-600 mt-1">{access.multiplier}x</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Fixed Fees" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Minimum Service Call</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(state.fixedFees.minimumServiceCall)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Emergency Surcharge</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(state.fixedFees.emergencySurcharge)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">After-Hours Surcharge</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(state.fixedFees.afterHoursSurcharge)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
