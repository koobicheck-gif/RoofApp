import { useState } from 'react';
import { PricingProvider } from './context/PricingContext';
import { EstimateProvider, useEstimate } from './context/EstimateContext';
import { JobsProvider } from './context/JobsContext';
import { ReferralsProvider } from './context/ReferralsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EstimateList } from './components/EstimateList';
import { EstimateWizard } from './components/EstimateWizard';
import { AdminDashboard } from './components/admin';
import { JobsDashboard } from './components/jobs';
import { ReferralsDashboard } from './components/referrals';
import { InspectionReportDashboard } from './components/reports';
import { AuthScreen } from './components/auth/AuthScreen';
import { ToastProvider } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';

type View = 'list' | 'wizard' | 'admin' | 'jobs' | 'referrals' | 'reports';

function AppContent() {
  const [view, setView] = useState<View>('list');
  const { dispatch } = useEstimate();

  const handleNewEstimate = () => {
    dispatch({ type: 'CREATE_NEW_ESTIMATE' });
    setView('wizard');
  };

  const handleSelectEstimate = (id: string) => {
    dispatch({ type: 'LOAD_ESTIMATE', payload: id });
    setView('wizard');
  };

  const handleWizardComplete = () => {
    setView('list');
  };

  const handleWizardCancel = () => {
    setView('list');
  };

  const handleOpenAdmin = () => {
    setView('admin');
  };

  const handleCloseAdmin = () => {
    setView('list');
  };

  const handleOpenJobs = () => {
    setView('jobs');
  };

  const handleCloseJobs = () => {
    setView('list');
  };

  const handleOpenReferrals = () => {
    setView('referrals');
  };

  const handleCloseReferrals = () => {
    setView('list');
  };

  const handleOpenReports = () => {
    setView('reports');
  };

  const handleCloseReports = () => {
    setView('list');
  };

  if (view === 'reports') {
    return <InspectionReportDashboard onClose={handleCloseReports} />;
  }

  if (view === 'referrals') {
    return <ReferralsDashboard onClose={handleCloseReferrals} />;
  }

  if (view === 'admin') {
    return <AdminDashboard onClose={handleCloseAdmin} onOpenInspectionReport={handleOpenReports} />;
  }

  if (view === 'jobs') {
    return <JobsDashboard onClose={handleCloseJobs} />;
  }

  if (view === 'wizard') {
    return (
      <EstimateWizard
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
      />
    );
  }

  return (
    <EstimateList
      onNewEstimate={handleNewEstimate}
      onSelectEstimate={handleSelectEstimate}
      onOpenAdmin={handleOpenAdmin}
      onOpenJobs={handleOpenJobs}
      onOpenReferrals={handleOpenReferrals}
      onOpenReports={handleOpenReports}
    />
  );
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-violet-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <ToastProvider>
      <PricingProvider>
        <EstimateProvider>
          <JobsProvider>
            <ReferralsProvider>
              <AppContent />
            </ReferralsProvider>
          </JobsProvider>
        </EstimateProvider>
      </PricingProvider>
    </ToastProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
