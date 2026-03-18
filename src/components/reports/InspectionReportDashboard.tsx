import { InspectionReport } from './InspectionReport';

interface InspectionReportDashboardProps {
  onClose: () => void;
}

export function InspectionReportDashboard({ onClose }: InspectionReportDashboardProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 text-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 -ml-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="font-semibold text-lg">Inspection Reports</h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Content */}
      <InspectionReport />
    </div>
  );
}
