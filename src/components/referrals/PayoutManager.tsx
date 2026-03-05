import { useState, useMemo } from 'react';
import { Card, Button, Input, Select } from '../ui';
import { useReferrals } from '../../context/ReferralsContext';
import { formatCurrency, formatDate } from '../../utils/calculateEstimate';
import type { ReferralPayout } from '../../types';

const paymentMethodOptions = [
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Bank Transfer' },
  { value: 'credit', label: 'Account Credit' },
];

export function PayoutManager() {
  const { state, dispatch, getSource, getConvertedUnpaidReferrals } = useReferrals();
  const [showCreatePayout, setShowCreatePayout] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [selectedReferralIds, setSelectedReferralIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<ReferralPayout['paymentMethod']>('check');
  const [checkNumber, setCheckNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Get unpaid referrals grouped by source
  const unpaidBySource = useMemo(() => {
    const unpaid = getConvertedUnpaidReferrals();
    const grouped: Record<string, typeof unpaid> = {};

    unpaid.forEach(r => {
      if (!grouped[r.sourceId]) {
        grouped[r.sourceId] = [];
      }
      grouped[r.sourceId].push(r);
    });

    return grouped;
  }, [getConvertedUnpaidReferrals]);

  const sourcesWithUnpaid = Object.keys(unpaidBySource).map(id => {
    const source = getSource(id);
    const referrals = unpaidBySource[id];
    const total = referrals.reduce((sum, r) => sum + (r.commissionAmount || 0), 0);
    return { id, source, referrals, total };
  });

  const selectedSourceReferrals = selectedSourceId ? (unpaidBySource[selectedSourceId] || []) : [];
  const selectedTotal = selectedReferralIds
    .map(id => selectedSourceReferrals.find(r => r.id === id))
    .filter(Boolean)
    .reduce((sum, r) => sum + (r?.commissionAmount || 0), 0);

  const handleCreatePayout = () => {
    if (!selectedSourceId || selectedReferralIds.length === 0) return;

    dispatch({
      type: 'CREATE_PAYOUT',
      payload: {
        sourceId: selectedSourceId,
        referralIds: selectedReferralIds,
        paymentMethod,
        checkNumber: checkNumber || undefined,
        notes: notes || undefined,
      },
    });

    // Reset form
    setShowCreatePayout(false);
    setSelectedSourceId('');
    setSelectedReferralIds([]);
    setPaymentMethod('check');
    setCheckNumber('');
    setNotes('');
  };

  const handleMarkPaid = (payoutId: string) => {
    dispatch({
      type: 'UPDATE_PAYOUT_STATUS',
      payload: { id: payoutId, status: 'paid', by: 'Admin' },
    });
  };

  const toggleReferralSelection = (referralId: string) => {
    setSelectedReferralIds(prev =>
      prev.includes(referralId)
        ? prev.filter(id => id !== referralId)
        : [...prev, referralId]
    );
  };

  const selectAllReferrals = () => {
    setSelectedReferralIds(selectedSourceReferrals.map(r => r.id));
  };

  const getStatusColor = (status: ReferralPayout['status']): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">Payouts</h3>
        {!showCreatePayout && sourcesWithUnpaid.length > 0 && (
          <Button size="sm" onClick={() => setShowCreatePayout(true)}>
            + Create Payout
          </Button>
        )}
      </div>

      {/* Pending commissions summary */}
      {sourcesWithUnpaid.length > 0 && !showCreatePayout && (
        <Card padding="md" className="mb-4 bg-amber-50">
          <h4 className="font-medium text-amber-800 mb-2">Pending Commissions</h4>
          <div className="space-y-1">
            {sourcesWithUnpaid.map(({ id, source, referrals, total }) => (
              <div key={id} className="flex justify-between text-sm">
                <span>{source?.name || 'Unknown'} ({referrals.length} referral{referrals.length !== 1 ? 's' : ''})</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create payout form */}
      {showCreatePayout && (
        <Card padding="md" className="mb-4">
          <h4 className="font-medium mb-4">Create New Payout</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Referrer</label>
              <Select
                value={selectedSourceId}
                onChange={(value) => {
                  setSelectedSourceId(value);
                  setSelectedReferralIds([]);
                }}
                options={[
                  { value: '', label: 'Select...' },
                  ...sourcesWithUnpaid.map(({ id, source, total }) => ({
                    value: id,
                    label: `${source?.name || 'Unknown'} - ${formatCurrency(total)} pending`,
                  })),
                ]}
              />
            </div>

            {selectedSourceId && selectedSourceReferrals.length > 0 && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Select Referrals to Pay</label>
                    <Button size="sm" variant="outline" onClick={selectAllReferrals}>
                      Select All
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedSourceReferrals.map(referral => (
                      <label
                        key={referral.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                          selectedReferralIds.includes(referral.id) ? 'bg-blue-50' : 'bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedReferralIds.includes(referral.id)}
                          onChange={() => toggleReferralSelection(referral.id)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{referral.referredCustomer.name}</div>
                          <div className="text-xs text-gray-500">
                            {referral.referralCode} • {formatCurrency(referral.commissionAmount || 0)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <Select
                      value={paymentMethod || 'check'}
                      onChange={(value) => setPaymentMethod(value as ReferralPayout['paymentMethod'])}
                      options={paymentMethodOptions}
                    />
                  </div>
                  {paymentMethod === 'check' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check Number</label>
                      <Input
                        value={checkNumber}
                        onChange={(e) => setCheckNumber(e.target.value)}
                        placeholder="Check #"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-lg font-bold">
                    Total: {formatCurrency(selectedTotal)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreatePayout(false);
                        setSelectedSourceId('');
                        setSelectedReferralIds([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePayout}
                      disabled={selectedReferralIds.length === 0}
                    >
                      Create Payout
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Payout history */}
      <h4 className="font-medium text-gray-700 mb-2">Payout History</h4>
      <div className="space-y-2">
        {state.payouts.length === 0 ? (
          <Card padding="md" className="text-center text-gray-500">
            No payouts yet.
          </Card>
        ) : (
          [...state.payouts]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((payout) => {
              const source = getSource(payout.sourceId);
              return (
                <Card key={payout.id} padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{source?.name || 'Unknown'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {payout.referralIds.length} referral{payout.referralIds.length !== 1 ? 's' : ''}
                        {payout.paymentMethod && ` • ${payout.paymentMethod}`}
                        {payout.checkNumber && ` #${payout.checkNumber}`}
                      </div>
                      <div className="text-xs text-gray-400">
                        Created {formatDate(payout.createdAt)}
                        {payout.paidAt && ` • Paid ${formatDate(payout.paidAt)}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold">{formatCurrency(payout.totalAmount)}</div>
                      {payout.status === 'pending' && (
                        <Button size="sm" onClick={() => handleMarkPaid(payout.id)}>
                          Mark Paid
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
