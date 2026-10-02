import React from 'react';
import { useStore } from '../context/StoreContext';
import { AppTab } from '../types';
import {
  Boxes,
  LayoutDashboard,
  ShoppingCart,
  PackagePlus,
  DollarSign,
  Settings,
  LogOut,
  Volume2,
  VolumeX,
  AlertTriangle,
  Beer,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    logout,
    config,
    updateConfig,
    products,
    isSupabaseConnected,
  } = useStore();

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;

  const tabs: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard },
    { id: 'deposito', label: 'Depósito e Estoque', icon: Boxes, badge: lowStockCount },
    { id: 'pdv', label: 'PDV Frente de Caixa', icon: ShoppingCart },
    { id: 'produtos', label: 'Cadastro de Produtos', icon: PackagePlus },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-neutral-950/95 border-b border-neutral-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <Beer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white uppercase">
                  Diego <span className="text-blue-500">Bebidas</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  CRM Pro
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                Distribuidora & Gestão de Vendas
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white text-blue-700' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right actions: Audio toggle, Admin profile, Logout */}
          <div className="flex items-center gap-3">
            {/* Supabase status indicator */}
            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                isSupabaseConnected
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-blue-950/40 border-blue-800/60 text-blue-300 hover:bg-blue-900/40'
              }`}
              title={isSupabaseConnected ? 'Conectado ao Supabase' : 'Supabase Conectado (Clique para ver SQL das tabelas)'}
            >
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
              <span className="font-mono text-[11px]">Supabase</span>
            </button>

            {/* Low stock warning banner if count > 0 */}
            {lowStockCount > 0 && (
              <button
                onClick={() => setActiveTab('deposito')}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs hover:bg-amber-900/40 transition-colors"
                title={`${lowStockCount} produto(s) abaixo do estoque mínimo`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{lowStockCount} em alerta</span>
              </button>
            )}

            {/* Sound toggle */}
            <button
              onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              title={config.soundEnabled ? 'Sons ativados' : 'Sons desativados'}
            >
              {config.soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            </button>

            {/* Admin badge */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-white">Diego Administrador</span>
              <span className="text-[10px] text-neutral-400">diegobebidas@gmail.com</span>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-red-950/50 hover:border-red-800 text-neutral-300 hover:text-red-300 border border-neutral-800 text-xs font-medium transition-all"
              title="Sair do CRM e voltar à tela inicial"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Scroll Bar for Tabs */}
        <div className="lg:hidden flex items-center gap-1 py-2 overflow-x-auto no-scrollbar border-t border-neutral-900">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 text-[10px] font-bold px-1 rounded-full bg-amber-500/20 text-amber-300">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
