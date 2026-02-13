import { useState } from 'react';
import { Card, CardHeader, Button, Input, Select } from '../ui';
import { usePricing } from '../../context/PricingContext';
import { formatCurrency } from '../../utils/calculateEstimate';
import { UNIT_NAMES } from '../../data/defaultPricing';
import type { AdditionalRepairType } from '../../types';

export function RepairsManager() {
  const { state, dispatch } = usePricing();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<AdditionalRepairType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRepair, setNewRepair] = useState<Omit<AdditionalRepairType, 'id'>>({
    name: '',
    unit: 'each',
    material: 0,
    labor: 0,
    active: true,
  });

  const startEditing = (repair: AdditionalRepairType) => {
    setEditingId(repair.id);
    setEditValues({ ...repair });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const saveEdit = () => {
    if (!editValues) return;
    const updatedRepairs = state.additionalRepairs.map((r) =>
      r.id === editValues.id ? editValues : r
    );
    dispatch({ type: 'SET_ADDITIONAL_REPAIRS', payload: updatedRepairs });
    setEditingId(null);
    setEditValues(null);
  };

  const toggleActive = (id: string) => {
    const updatedRepairs = state.additionalRepairs.map((r) =>
      r.id === id ? { ...r, active: !r.active } : r
    );
    dispatch({ type: 'SET_ADDITIONAL_REPAIRS', payload: updatedRepairs });
  };

  const addRepair = () => {
    if (!newRepair.name.trim()) return;
    const id = `custom-${Date.now()}`;
    const updatedRepairs = [...state.additionalRepairs, { ...newRepair, id }];
    dispatch({ type: 'SET_ADDITIONAL_REPAIRS', payload: updatedRepairs });
    setNewRepair({
      name: '',
      unit: 'each',
      material: 0,
      labor: 0,
      active: true,
    });
    setShowAddForm(false);
  };

  const deleteRepair = (id: string) => {
    if (!confirm('Delete this repair type? This cannot be undone.')) return;
    const updatedRepairs = state.additionalRepairs.filter((r) => r.id !== id);
    dispatch({ type: 'SET_ADDITIONAL_REPAIRS', payload: updatedRepairs });
  };

  const activeRepairs = state.additionalRepairs.filter((r) => r.active);
  const inactiveRepairs = state.additionalRepairs.filter((r) => !r.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Additional Repairs</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage repair types available for estimates
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          + Add Repair Type
        </Button>
      </div>

      {/* Add New Repair Form */}
      {showAddForm && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader title="Add New Repair Type" />
          <div className="space-y-4">
            <Input
              label="Name"
              value={newRepair.name}
              onChange={(e) => setNewRepair({ ...newRepair, name: e.target.value })}
              placeholder="e.g., Specialty Vent Repair"
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Material Cost"
                type="number"
                step="0.50"
                min="0"
                value={newRepair.material || ''}
                onChange={(e) =>
                  setNewRepair({ ...newRepair, material: parseFloat(e.target.value) || 0 })
                }
              />
              <Input
                label="Labor Cost"
                type="number"
                step="0.50"
                min="0"
                value={newRepair.labor || ''}
                onChange={(e) =>
                  setNewRepair({ ...newRepair, labor: parseFloat(e.target.value) || 0 })
                }
              />
              <Select
                label="Unit"
                value={newRepair.unit}
                onChange={(value) =>
                  setNewRepair({ ...newRepair, unit: value as 'each' | 'linear_ft' | 'area' })
                }
                options={[
                  { value: 'each', label: 'Each' },
                  { value: 'linear_ft', label: 'Linear Feet' },
                  { value: 'area', label: 'Per Area' },
                ]}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={addRepair} disabled={!newRepair.name.trim()}>
                Add Repair
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Active Repairs */}
      <Card>
        <CardHeader
          title="Active Repair Types"
          subtitle={`${activeRepairs.length} types available for estimates`}
        />
        <div className="space-y-2">
          {activeRepairs.map((repair) => {
            const isEditing = editingId === repair.id;
            const displayRepair = isEditing && editValues ? editValues : repair;

            return (
              <div
                key={repair.id}
                className={`border rounded-lg p-4 ${
                  isEditing ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      label="Name"
                      value={displayRepair.name}
                      onChange={(e) =>
                        setEditValues({ ...displayRepair, name: e.target.value })
                      }
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        label="Material"
                        type="number"
                        step="0.50"
                        value={displayRepair.material}
                        onChange={(e) =>
                          setEditValues({
                            ...displayRepair,
                            material: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <Input
                        label="Labor"
                        type="number"
                        step="0.50"
                        value={displayRepair.labor}
                        onChange={(e) =>
                          setEditValues({
                            ...displayRepair,
                            labor: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <Select
                        label="Unit"
                        value={displayRepair.unit}
                        onChange={(value) =>
                          setEditValues({
                            ...displayRepair,
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
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{repair.name}</div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(repair.material)} + {formatCurrency(repair.labor)} ={' '}
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(repair.material + repair.labor)}
                        </span>
                        {' / '}{UNIT_NAMES[repair.unit]}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(repair)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => toggleActive(repair.id)}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                        title="Deactivate"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                      {repair.id.startsWith('custom-') && (
                        <button
                          onClick={() => deleteRepair(repair.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Inactive Repairs */}
      {inactiveRepairs.length > 0 && (
        <Card>
          <CardHeader
            title="Inactive Repair Types"
            subtitle="These won't appear in estimates"
          />
          <div className="space-y-2">
            {inactiveRepairs.map((repair) => (
              <div
                key={repair.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-700">{repair.name}</div>
                    <div className="text-sm text-gray-400">
                      {formatCurrency(repair.material + repair.labor)} / {UNIT_NAMES[repair.unit]}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(repair.id)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded"
                  >
                    Reactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
