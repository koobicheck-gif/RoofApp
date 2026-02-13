import { useState } from 'react';
import { PricingProvider } from './context/PricingContext';
import { EstimateProvider, useEstimate } from './context/EstimateContext';
import { EstimateList } from './components/EstimateList';
import { EstimateWizard } from './components/EstimateWizard';
import { AdminDashboard } from './components/admin';

type View = 'list' | 'wizard' | 'admin';

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

  if (view === 'admin') {
    return <AdminDashboard onClose={handleCloseAdmin} />;
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
    />
  );
}

function App() {
  return (
    <PricingProvider>
      <EstimateProvider>
        <AppContent />
      </EstimateProvider>
    </PricingProvider>
  );
}

export default App;
