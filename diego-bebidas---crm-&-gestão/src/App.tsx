import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { LandingScreen } from './components/LandingScreen';
import { LoginModal } from './components/LoginModal';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/tabs/DashboardTab';
import { WarehouseTab } from './components/tabs/WarehouseTab';
import { PosTab } from './components/tabs/PosTab';
import { ProductsTab } from './components/tabs/ProductsTab';
import { FinancialTab } from './components/tabs/FinancialTab';
import { SettingsTab } from './components/tabs/SettingsTab';

const AppContent: React.FC = () => {
  const { isAuthenticated, activeTab } = useStore();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <LandingScreen />
        <LoginModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main CRM Workspace Tabs */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'deposito' && <WarehouseTab />}
        {activeTab === 'pdv' && <PosTab />}
        {activeTab === 'produtos' && <ProductsTab />}
        {activeTab === 'financeiro' && <FinancialTab />}
        {activeTab === 'configuracoes' && <SettingsTab />}
      </main>

      {/* Subtle footer */}
      <footer className="w-full py-4 border-t border-neutral-900 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Diego Bebidas CRM · Sistema de Gestão de Depósito & PDV</span>
          <span>Versão 1.0 · Pt-BR</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
