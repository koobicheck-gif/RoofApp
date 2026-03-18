import { useState } from 'react';
import { PricingProvider } from './context/PricingContext';
import { EstimateProvider, useEstimate } from './context/EstimateContext';
import { JobsProvider } from './context/JobsContext';
import { ReferralsProvider } from './context/ReferralsContext';
import { EstimateList } from './components/EstimateList';
import { EstimateWizard } from './components/EstimateWizard';
import { AdminDashboard } from './components/admin';
import { JobsDashboard } from './components/jobs';
import { ReferralsDashboard } from './components/referrals';
import { InspectionReportDashboard } from './components/reports';

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
    return <AdminDashboard onClose={handleCloseAdmin} />;
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

function App() {
  return (
    <PricingProvider>
      <EstimateProvider>
        <JobsProvider>
          <ReferralsProvider>
            <AppContent />
          </ReferralsProvider>
        </JobsProvider>
      </EstimateProvider>
    </PricingProvider>
  );
}

export default App;
