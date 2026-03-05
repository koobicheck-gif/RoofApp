import { useState } from 'react';
import { Card } from '../ui';
import { ReferralStats } from './ReferralStats';
import { ReferralsList } from './ReferralsList';
import { ReferralSourceManager } from './ReferralSourceManager';
import { PayoutManager } from './PayoutManager';

interface ReferralsDashboardProps {
  onClose: () => void;
}

type ViewMode = 'referrals' | 'sources' | 'payouts';

export function ReferralsDashboard({ onClose }: ReferralsDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('referrals');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#00224a] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">Referral Tracking</h1>
              <p className="text-sm text-white/70">Manage referrals and payouts</p>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('referrals')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'referrals' ? 'bg-white text-[#00224a]' : 'text-white hover:bg-white/10'
              }`}
            >
              Referrals
            </button>
            <button
              onClick={() => setViewMode('sources')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'sources' ? 'bg-white text-[#00224a]' : 'text-white hover:bg-white/10'
              }`}
            >
              Sources
            </button>
            <button
              onClick={() => setViewMode('payouts')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'payouts' ? 'bg-white text-[#00224a]' : 'text-white hover:bg-white/10'
              }`}
            >
              Payouts
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <ReferralStats />

        {/* View content */}
        <Card padding="lg">
          {viewMode === 'referrals' && <ReferralsList />}
          {viewMode === 'sources' && <ReferralSourceManager />}
          {viewMode === 'payouts' && <PayoutManager />}
        </Card>
      </div>
    </div>
  );
}
