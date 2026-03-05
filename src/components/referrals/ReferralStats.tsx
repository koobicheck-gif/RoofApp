import { useMemo } from 'react';
import { Card } from '../ui';
import { useReferrals } from '../../context/ReferralsContext';
import { formatCurrency } from '../../utils/calculateEstimate';

export function ReferralStats() {
  const { state } = useReferrals();

  const stats = useMemo(() => {
    const total = state.referrals.length;
    const pending = state.referrals.filter(r => r.status === 'pending').length;
    const converted = state.referrals.filter(r => ['converted', 'paid_out'].includes(r.status)).length;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    const totalCommissionsPaid = state.payouts
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.totalAmount, 0);

    const pendingCommissions = state.referrals
      .filter(r => r.status === 'converted' && r.commissionAmount)
      .reduce((sum, r) => sum + (r.commissionAmount || 0), 0);

    const totalJobValue = state.referrals
      .filter(r => r.jobTotal)
      .reduce((sum, r) => sum + (r.jobTotal || 0), 0);

    return {
      total,
      pending,
      converted,
      conversionRate,
      totalCommissionsPaid,
      pendingCommissions,
      totalJobValue,
      activeSources: state.sources.filter(s => s.active).length,
    };
  }, [state]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card padding="md">
        <div className="text-sm text-gray-500">Total Referrals</div>
        <div className="text-2xl font-bold text-[#00224a]">{stats.total}</div>
        <div className="text-xs text-gray-400">{stats.pending} pending</div>
      </Card>

      <Card padding="md">
        <div className="text-sm text-gray-500">Conversion Rate</div>
        <div className="text-2xl font-bold text-green-600">{stats.conversionRate.toFixed(0)}%</div>
        <div className="text-xs text-gray-400">{stats.converted} converted</div>
      </Card>

      <Card padding="md">
        <div className="text-sm text-gray-500">Job Revenue</div>
        <div className="text-2xl font-bold text-[#00224a]">{formatCurrency(stats.totalJobValue)}</div>
        <div className="text-xs text-gray-400">from referrals</div>
      </Card>

      <Card padding="md">
        <div className="text-sm text-gray-500">Commissions</div>
        <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.totalCommissionsPaid)}</div>
        <div className="text-xs text-gray-400">{formatCurrency(stats.pendingCommissions)} pending</div>
      </Card>
    </div>
  );
}
