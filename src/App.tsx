import { useState } from 'react';
import { PricingProvider } from './context/PricingContext';
import { EstimateProvider, useEstimate } from './context/EstimateContext';
import { JobsProvider } from './context/JobsContext';
import { EstimateList } from './components/EstimateList';
import { EstimateWizard } from './components/EstimateWizard';
import { AdminDashboard } from './components/admin';
import { JobsDashboard } from './components/jobs';

type View = 'list' | 'wizard' | 'admin' | 'jobs';

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
    />
  );
}

function App() {
  return (
    <PricingProvider>
      <EstimateProvider>
        <JobsProvider>
          <AppContent />
        </JobsProvider>
      </EstimateProvider>
    </PricingProvider>
  );
}

export default App;
