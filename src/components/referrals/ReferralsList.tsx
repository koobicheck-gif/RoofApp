import { useState, useMemo } from 'react';
import { Card, Button, Input, Select } from '../ui';
import { useReferrals } from '../../context/ReferralsContext';
import { formatCurrency, formatDate } from '../../utils/calculateEstimate';
import type { Referral, ReferralStatus, ReferredCustomer } from '../../types';

interface ReferralFormData {
  sourceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  notes: string;
}

const emptyForm: ReferralFormData = {
  sourceId: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  notes: '',
};

type FilterStatus = 'all' | ReferralStatus;

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'estimate_created', label: 'Estimate Created' },
  { value: 'converted', label: 'Converted' },
  { value: 'paid_out', label: 'Paid Out' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ReferralsList() {
  const { state, dispatch, getSource, getActiveSources } = useReferrals();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ReferralFormData>(emptyForm);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSource, setFilterSource] = useState<string>('all');

  const activeSources = getActiveSources();

  const sourceOptions = [
    { value: 'all', label: 'All Sources' },
    ...activeSources.map(s => ({ value: s.id, label: s.name })),
  ];

  const filteredReferrals = useMemo(() => {
    return state.referrals
      .filter(r => filterStatus === 'all' || r.status === filterStatus)
      .filter(r => filterSource === 'all' || r.sourceId === filterSource)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.referrals, filterStatus, filterSource]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sourceId || !form.customerName.trim()) return;

    const referredCustomer: ReferredCustomer = {
      name: form.customerName,
      phone: form.customerPhone || undefined,
      email: form.customerEmail || undefined,
      address: form.customerAddress || undefined,
      notes: form.notes || undefined,
    };

    dispatch({
      type: 'ADD_REFERRAL',
      payload: {
        sourceId: form.sourceId,
        referredCustomer,
        notes: form.notes || undefined,
      },
    });

    setForm(emptyForm);
    setShowForm(false);
  };

  const getStatusColor = (status: ReferralStatus): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'estimate_created':
        return 'bg-blue-100 text-blue-700';
      case 'converted':
        return 'bg-green-100 text-green-700';
      case 'paid_out':
        return 'bg-emerald-100 text-emerald-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: ReferralStatus): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'estimate_created':
        return 'Estimate Created';
      case 'converted':
        return 'Converted';
      case 'paid_out':
        return 'Paid Out';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleStatusChange = (referral: Referral, newStatus: ReferralStatus) => {
    dispatch({
      type: 'UPDATE_REFERRAL_STATUS',
      payload: { id: referral.id, status: newStatus },
    });
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h3 className="font-semibold text-gray-700">Referrals</h3>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={filterStatus}
            onChange={(value) => setFilterStatus(value as FilterStatus)}
            options={statusOptions}
          />
          <Select
            value={filterSource}
            onChange={(value) => setFilterSource(value)}
            options={sourceOptions}
          />
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              + New Referral
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card padding="md" className="mb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral Source *</label>
              <Select
                value={form.sourceId}
                onChange={(value) => setForm({ ...form, sourceId: value })}
                options={[
                  { value: '', label: 'Select a source...' },
                  ...activeSources.map(s => ({ value: s.id, label: `${s.name} (${s.commissionRate}%)` })),
                ]}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Referred Customer</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <Input
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="Customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <Input
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <Input
                    value={form.customerAddress}
                    onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!form.sourceId || !form.customerName.trim()}>
                Create Referral
              </Button>
              <Button type="button" variant="outline" onClick={() => { setForm(emptyForm); setShowForm(false); }}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {filteredReferrals.length === 0 ? (
          <Card padding="md" className="text-center text-gray-500">
            No referrals found.
          </Card>
        ) : (
          filteredReferrals.map((referral) => {
            const source = getSource(referral.sourceId);
            return (
              <Card key={referral.id} padding="sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-gray-500">{referral.referralCode}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(referral.status)}`}>
                        {getStatusLabel(referral.status)}
                      </span>
                    </div>
                    <div className="font-medium">{referral.referredCustomer.name}</div>
                    <div className="text-sm text-gray-500">
                      Referred by: {source?.name || 'Unknown'}
                      {referral.referredCustomer.phone && ` • ${referral.referredCustomer.phone}`}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Created {formatDate(referral.createdAt)}
                      {referral.jobTotal && (
                        <span className="ml-2">
                          • Job: {formatCurrency(referral.jobTotal)}
                          • Commission: {formatCurrency(referral.commissionAmount || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {referral.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(referral, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                    {referral.status === 'estimate_created' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(referral, 'converted')}
                      >
                        Mark Converted
                      </Button>
                    )}
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
