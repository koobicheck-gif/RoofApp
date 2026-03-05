import { useState } from 'react';
import { Card, Button, Input, Select } from '../ui';
import { useReferrals } from '../../context/ReferralsContext';
import type { ReferralSource, ReferralSourceType } from '../../types';

interface SourceFormData {
  name: string;
  type: ReferralSourceType;
  email: string;
  phone: string;
  company: string;
  commissionRate: number;
  fixedBonus: number;
  notes: string;
}

const emptyForm: SourceFormData = {
  name: '',
  type: 'customer',
  email: '',
  phone: '',
  company: '',
  commissionRate: 5,
  fixedBonus: 0,
  notes: '',
};

const sourceTypeOptions = [
  { value: 'customer', label: 'Customer' },
  { value: 'partner', label: 'Partner' },
  { value: 'employee', label: 'Employee' },
  { value: 'other', label: 'Other' },
];

export function ReferralSourceManager() {
  const { state, dispatch, getReferralsBySource } = useReferrals();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SourceFormData>(emptyForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingId) {
      const existing = state.sources.find(s => s.id === editingId);
      if (existing) {
        dispatch({
          type: 'UPDATE_SOURCE',
          payload: {
            ...existing,
            ...form,
            commissionRate: form.commissionRate,
            fixedBonus: form.fixedBonus || undefined,
          },
        });
      }
    } else {
      dispatch({
        type: 'ADD_SOURCE',
        payload: {
          ...form,
          commissionRate: form.commissionRate,
          fixedBonus: form.fixedBonus || undefined,
          active: true,
        },
      });
    }

    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (source: ReferralSource) => {
    setForm({
      name: source.name,
      type: source.type,
      email: source.email || '',
      phone: source.phone || '',
      company: source.company || '',
      commissionRate: source.commissionRate,
      fixedBonus: source.fixedBonus || 0,
      notes: source.notes || '',
    });
    setEditingId(source.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">Referral Sources</h3>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Add Source
          </Button>
        )}
      </div>

      {showForm && (
        <Card padding="md" className="mb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <Select
                  value={form.type}
                  onChange={(value) => setForm({ ...form, type: value as ReferralSourceType })}
                  options={sourceTypeOptions}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {form.type === 'partner' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Bonus ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="25"
                  value={form.fixedBonus}
                  onChange={(e) => setForm({ ...form, fixedBonus: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">{editingId ? 'Update' : 'Add'} Source</Button>
              <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {state.sources.length === 0 ? (
          <Card padding="md" className="text-center text-gray-500">
            No referral sources yet. Add one to get started.
          </Card>
        ) : (
          state.sources.map((source) => {
            const referralCount = getReferralsBySource(source.id).length;
            return (
              <Card
                key={source.id}
                padding="sm"
                className={`${!source.active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{source.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        source.type === 'customer' ? 'bg-blue-100 text-blue-700' :
                        source.type === 'partner' ? 'bg-purple-100 text-purple-700' :
                        source.type === 'employee' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {source.type}
                      </span>
                      {!source.active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {source.commissionRate}% commission
                      {source.fixedBonus ? ` + $${source.fixedBonus} bonus` : ''}
                      {' • '}{referralCount} referral{referralCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dispatch({ type: 'TOGGLE_SOURCE_ACTIVE', payload: source.id })}
                    >
                      {source.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(source)}>
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
