import React, { useState } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext';
import { SystemToastContainer } from './components/modules/SystemMessages';
import { MainLayout } from './components/layout/MainLayout';
import { LoginScreen } from './screens/LoginScreen';

// Views
import DashboardView from './screens/DashboardView';
import ClientsView from './screens/ClientsView';
import ClientFormView from './screens/ClientFormView';
import VehiclesView from './screens/VehiclesView';
import ServiceOrdersView from './screens/ServiceOrdersView';
import ServiceOrderFormView from './screens/ServiceOrderFormView';
import ReportsView from './screens/ReportsView';
import UsersView from './screens/UsersView';
import AuditsView from './screens/AuditsView';
import TrashView from './screens/TrashView';

import { useNavigation } from './hooks/useNavigation';

const AppContent: React.FC = () => {
  const { currentView, params } = useNavigation();
  const auth = React.useContext(AuthContext);

  // Define `pdfLibsLoaded` como `true` por padrão, pois dependemos do backend para geração de PDFs
  const [pdfLibsLoaded] = useState(true);

  if (!auth) return null;
  const { isAuthenticated, loading } = auth;

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'clients': return <ClientsView params={params} />;
      case 'clientForm': return <ClientFormView key={params?.clientId} params={params} />;
      case 'vehicles': return <VehiclesView />;
      case 'serviceOrders': return <ServiceOrdersView />;
      case 'serviceOrderForm': return <ServiceOrderFormView key={params?.osId} params={params} pdfLibsLoaded={pdfLibsLoaded} />;
      case 'reports': return <ReportsView />;
      case 'users': return <UsersView />;
      case 'audits': return <AuditsView />;
      case 'trash': return <TrashView />;
      default: return <DashboardView />;
    }
  };

  return <MainLayout>{renderView()}</MainLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <SystemToastContainer />
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
}
