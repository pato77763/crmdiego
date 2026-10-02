import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { SUPABASE_SQL_SETUP, SUPABASE_URL } from '../../lib/supabase';
import {
  Settings,
  Store,
  Printer,
  Shield,
  Database,
  Save,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  Volume2,
  Lock,
  Mail,
  Server,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const {
    config,
    updateConfig,
    resetToDefaultData,
    zeroAllData,
    exportDataBackup,
    importDataBackup,
    products,
    sales,
    transactions,
    isSupabaseConnected,
    supabaseStatusMsg,
    syncWithSupabase,
  } = useStore();

  const [formData, setFormData] = useState({ ...config });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncWithSupabase();
    setIsSyncing(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleExport = () => {
    const jsonStr = exportDataBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_diego_bebidas_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataBackup(content);
        if (success) {
          setImportStatus('Backup importado com sucesso!');
        } else {
          setImportStatus('Erro ao ler arquivo de backup. Formato inválido.');
        }
        setTimeout(() => setImportStatus(''), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (
      confirm(
        'Tem certeza que deseja restaurar os dados originais de demonstração da Diego Bebidas? Suas vendas e produtos criados serão substituídos pelo catálogo padrão.'
      )
    ) {
      resetToDefaultData();
      alert('Dados de demonstração restaurados com sucesso!');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <span>Preferências do Sistema</span>
            <span>·</span>
            <span>Diego Bebidas</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Configurações Gerais</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Gerencie as informações da distribuidora, dados do cupom impresso, backup e segurança.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Configurações salvas!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info Card */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Dados da Empresa & Distribuidora</h2>
              <p className="text-xs text-neutral-400">Informações que aparecem na tela e nos cupons</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Nome Fantasia da Empresa
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Subtítulo / Slogan
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                CNPJ
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Telefone / WhatsApp Comercial
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Endereço Completo do Depósito
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* POS & Payment Settings */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configurações do PDV & Cupom</h2>
              <p className="text-xs text-neutral-400">Chave PIX e mensagens impressas para os clientes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Chave PIX Oficial para Recebimento
              </label>
              <input
                type="text"
                value={formData.pixKey}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                placeholder="diegobebidas@gmail.com"
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Essa chave será apresentada ao cliente no momento do pagamento via PIX.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Efeitos Sonoros do PDV
              </label>
              <label className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.soundEnabled}
                  onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded bg-neutral-900 border-neutral-700"
                />
                <span className="text-sm text-neutral-300 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  <span>Bipe sonoro em leitura de código de barras e venda</span>
                </span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Mensagem no Rodapé do Cupom
              </label>
              <input
                type="text"
                value={formData.receiptFooterMessage}
                onChange={(e) => setFormData({ ...formData, receiptFooterMessage: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </form>

      {/* Supabase Integration Card */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Banco de Dados Supabase</h2>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isSupabaseConnected
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-blue-950/60 border-blue-800 text-blue-300'
                  }`}
                >
                  {isSupabaseConnected ? 'Conectado' : 'Online / Aguardando Tabelas'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                URL: <span className="font-mono text-neutral-300">{SUPABASE_URL}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : 'text-neutral-400'}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Supabase'}</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
          <div className="text-xs text-neutral-300 flex items-center justify-between">
            <span>Tabelas configuradas no Supabase:</span>
            <span className="font-mono text-[11px] text-blue-400">{supabaseStatusMsg}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800/80">
              <span className="text-blue-400">public.produtos</span>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Catálogo e estoque</p>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800/80">
              <span className="text-blue-400">public.movimentacoes_estoque</span>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Histórico entradas/saídas</p>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800/80">
              <span className="text-blue-400">public.vendas</span>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Vendas do PDV</p>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800/80">
              <span className="text-blue-400">public.itens_venda</span>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Itens de cada venda</p>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800/80">
              <span className="text-blue-400">public.financeiro</span>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Fluxo (receitas e despesas)</p>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800/80">
              <span className="text-blue-400">public.configuracoes</span>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Dados da distribuidora</p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-neutral-900 text-xs">
            <span className="text-neutral-400 text-[11px]">
              Caso ainda não tenha criado as 6 tabelas no SQL Editor do Supabase:
            </span>

            <button
              type="button"
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Script SQL Copiado!' : 'Copiar Script SQL das Tabelas'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Credentials Info Card */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Acesso do Administrador</h2>
            <p className="text-xs text-neutral-400">Credenciais configuradas conforme solicitado</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-400 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              <span>E-mail do Administrador:</span>
            </span>
            <span className="font-mono text-white font-semibold">diegobebidas@gmail.com</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-400 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>Senha de Acesso:</span>
            </span>
            <span className="font-mono text-neutral-400">•••••••• (diego2026)</span>
          </div>

          <div className="pt-2 text-xs text-neutral-500">
            Acesso ativado exclusivamente através do pontinho discreto no canto superior direito da tela inicial do CRM.
          </div>
        </div>
      </div>

      {/* Backup and Data Maintenance */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Backup & Gestão de Dados</h2>
            <p className="text-xs text-neutral-400">
              {products.length} bebidas cadastradas · {sales.length} vendas · {transactions.length} lançamentos financeiros
            </p>
          </div>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-800 text-blue-300 text-xs">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold border border-neutral-700 transition-colors"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Fazer Backup (Download JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Restaurar Backup (Carregar JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (confirm('Atenção: Deseja ZERAR TUDO (Faturamento, vendas e volume de estoque)? O sistema ficará 100% limpo.')) {
                zeroAllData();
                alert('Tudo foi zerado com sucesso!');
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-red-950 hover:text-red-300 hover:border-red-800 text-neutral-300 rounded-xl text-xs font-semibold border border-neutral-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-red-400" />
            <span>Zerar Faturamento & Estoque</span>
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold border border-neutral-700 transition-colors ml-auto"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>Recarregar Catálogo Base Zerado</span>
          </button>
        </div>
      </div>
    </div>
  );
};
