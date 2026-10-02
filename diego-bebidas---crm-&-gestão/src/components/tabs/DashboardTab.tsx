import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatBRL, formatDateBR, CATEGORY_LABELS } from '../../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  Package,
  Layers,
  CheckCircle2,
  Edit3,
  RotateCcw,
  Sparkles,
  X,
  Save,
  Check,
} from 'lucide-react';

export const DashboardTab: React.FC = () => {
  const {
    sales,
    products,
    transactions,
    setActiveTab,
    zeroAllData,
    setOpeningCash,
    addTransaction,
  } = useStore();

  // Modal to edit/set financial initial values
  const [isEditValuesModalOpen, setIsEditValuesModalOpen] = useState(false);
  const [initialCashAmount, setInitialCashAmount] = useState<number>(0);
  const [initialRevenueAmount, setInitialRevenueAmount] = useState<number>(0);
  const [valuesSavedNotice, setValuesSavedNotice] = useState(false);

  // Metrics calculations
  const totalSalesRevenue = sales
    .filter((s) => s.status === 'concluida')
    .reduce((acc, s) => acc + s.total, 0);

  const totalCostOfSales = sales
    .filter((s) => s.status === 'concluida')
    .reduce((acc, s) => {
      const saleCost = s.items.reduce((itemAcc, item) => {
        const prod = products.find((p) => p.id === item.productId);
        return itemAcc + (prod ? prod.costPrice * item.quantity : 0);
      }, 0);
      return acc + saleCost;
    }, 0);

  const estimatedGrossProfit = totalSalesRevenue - totalCostOfSales;
  const marginPercent = totalSalesRevenue > 0 ? (estimatedGrossProfit / totalSalesRevenue) * 100 : 0;

  const totalUnitsInStock = products.reduce((acc, p) => acc + p.currentStock, 0);
  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStock && p.minStock > 0);

  // Category breakdown
  const salesByCategory: Record<string, { quantity: number; revenue: number }> = {};
  sales
    .filter((s) => s.status === 'concluida')
    .forEach((s) => {
      s.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod ? prod.category : 'outros';
        if (!salesByCategory[cat]) {
          salesByCategory[cat] = { quantity: 0, revenue: 0 };
        }
        salesByCategory[cat].quantity += item.quantity;
        salesByCategory[cat].revenue += item.total;
      });
    });

  // Top products
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  sales
    .filter((s) => s.status === 'concluida')
    .forEach((s) => {
      s.items.forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSalesMap[item.productId].quantity += item.quantity;
        productSalesMap[item.productId].revenue += item.total;
      });
    });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const handleSaveInitialValues = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialCashAmount > 0) {
      setOpeningCash(initialCashAmount, 'Saldo Inicial de Caixa / Troco');
    }
    if (initialRevenueAmount > 0) {
      addTransaction({
        type: 'receita',
        category: 'Outros',
        description: 'Faturamento / Saldo Inicial Registrado',
        amount: initialRevenueAmount,
        date: new Date().toISOString(),
        paymentMethod: 'dinheiro',
      });
    }
    setValuesSavedNotice(true);
    setTimeout(() => {
      setValuesSavedNotice(false);
      setIsEditValuesModalOpen(false);
    }, 1500);
  };

  const handleConfirmZeroAll = () => {
    if (
      confirm(
        'Confirmar ZERAR TUDO? Faturamento, lucro, histórico de vendas e estoques serão zerados para início limpo da distribuidora.'
      )
    ) {
      zeroAllData();
      alert('Tudo foi zerado com sucesso! Sistema 100% limpo para operação.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sistema Zerado & Pronto para Operação</span>
            <span>·</span>
            <span>Diego Bebidas</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Dashboard Geral</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Todos os valores e volumes estão zerados e editáveis para você iniciar o lançamento real das suas bebidas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Edit Values Button */}
          <button
            onClick={() => setIsEditValuesModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl text-sm border border-neutral-700 transition-colors shadow-sm"
            title="Editar valores de faturamento e saldo inicial"
          >
            <Edit3 className="w-4 h-4 text-blue-400" />
            <span>Editar Valores</span>
          </button>

          {/* Zero all shortcut */}
          <button
            onClick={handleConfirmZeroAll}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-800 text-neutral-300 font-medium rounded-xl text-sm border border-neutral-700 transition-colors"
            title="Zerar todos os números caso precise recomeçar"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Zerar Tudo</span>
          </button>

          <button
            onClick={() => setActiveTab('pdv')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/20"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Abrir PDV (Caixa)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - All ZEROED and EDITABLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div 
          onClick={() => setIsEditValuesModalOpen(true)}
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-blue-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          title="Clique para editar valores"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider group-hover:text-neutral-200 transition-colors">
              Faturamento Vendas
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono flex items-center justify-between">
              <span>{formatBRL(totalSalesRevenue)}</span>
              <Edit3 className="w-3.5 h-3.5 text-neutral-500 group-hover:text-blue-400 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-400">
              <span className="text-blue-400 font-semibold">{sales.length} pedidos</span>
              <span>registrados (zerado)</span>
            </div>
          </div>
        </div>

        {/* Profit */}
        <div 
          onClick={() => setIsEditValuesModalOpen(true)}
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          title="Clique para editar valores"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider group-hover:text-neutral-200 transition-colors">
              Lucro Bruto Estimado
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono flex items-center justify-between">
              <span>{formatBRL(estimatedGrossProfit)}</span>
              <Edit3 className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Margem calculada por venda ({marginPercent.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* Total Stock in Depot */}
        <div 
          onClick={() => setActiveTab('deposito')}
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-blue-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          title="Clique para gerenciar ou editar o volume no depósito"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider group-hover:text-neutral-200 transition-colors">
              Volume no Depósito
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono flex items-center justify-between">
              <span>
                {totalUnitsInStock.toLocaleString('pt-BR')}{' '}
                <span className="text-xs font-normal text-neutral-400">unidades</span>
              </span>
              <Edit3 className="w-3.5 h-3.5 text-neutral-500 group-hover:text-blue-400 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-400">
              <span>{products.length} bebidas cadastradas (editável)</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div 
          onClick={() => setActiveTab('deposito')}
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          title="Clique para ver ou ajustar estoque mínimo"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider group-hover:text-neutral-200 transition-colors">
              Estoque Mínimo
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono flex items-center justify-between">
              <span>
                {lowStockProducts.length}{' '}
                <span className="text-xs font-normal text-neutral-400">em alerta</span>
              </span>
              <Edit3 className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-400 font-medium">
              <span>Zerado · Configure os limites no depósito</span>
            </div>
          </div>
        </div>
      </div>

      {/* Information Banner when starting empty */}
      {sales.length === 0 && (
        <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <strong className="text-white">Início de Atividade Diego Bebidas:</strong>
              <p className="text-neutral-300 mt-0.5">
                Vá para a aba <strong>"Depósito e Estoque"</strong> para preencher o volume inicial que você tem no depósito ou faça suas primeiras vendas no <strong>"PDV"</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('deposito')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
            >
              Preencher Estoque
            </button>
            <button
              onClick={() => setActiveTab('pdv')}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            >
              Iniciar Caixa PDV
            </button>
          </div>
        </div>
      )}

      {/* Middle Row: Top Selling Beverages & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Best Sellers */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Bebidas Mais Vendidas</h2>
              <p className="text-xs text-neutral-400">Ranking automático atualizado a cada venda</p>
            </div>
            <button
              onClick={() => setActiveTab('produtos')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Ver catálogo completo
            </button>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-neutral-500">
                <Boxes className="w-8 h-8 mx-auto text-neutral-700 mb-2" />
                <p className="text-sm font-medium text-neutral-400">Nenhuma venda registrada ainda</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Os produtos mais vendidos aparecerão aqui conforme as vendas forem feitas no PDV.
                </p>
              </div>
            ) : (
              topProducts.map((item, idx) => {
                const maxQty = topProducts[0]?.quantity || 1;
                const percent = Math.round((item.quantity / maxQty) * 100);
                return (
                  <div key={idx} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-white">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-mono font-bold">{formatBRL(item.revenue)}</span>
                        <span className="text-neutral-400 text-xs ml-2 font-mono">({item.quantity} un)</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Vendas por Categoria</h2>
                <p className="text-xs text-neutral-400">Participação no faturamento</p>
              </div>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>

            <div className="space-y-3">
              {Object.keys(salesByCategory).length === 0 ? (
                <div className="py-12 text-center text-neutral-500">
                  <Layers className="w-8 h-8 mx-auto text-neutral-700 mb-2" />
                  <p className="text-sm font-medium text-neutral-400">Gráfico zerado</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Cervejas, destilados e refrigerantes serão divididos proporcionalmente aqui.
                  </p>
                </div>
              ) : (
                Object.entries(salesByCategory).map(([catKey, data]) => {
                  const label = CATEGORY_LABELS[catKey as keyof typeof CATEGORY_LABELS] || catKey;
                  const catPercent = totalSalesRevenue > 0 ? (data.revenue / totalSalesRevenue) * 100 : 0;
                  return (
                    <div key={catKey}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-neutral-300 font-medium">{label}</span>
                        <span className="font-mono text-neutral-400">
                          {formatBRL(data.revenue)} ({catPercent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, catPercent))}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>Controle automático de saídas por categoria.</span>
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Últimas Vendas do PDV</h2>
            <p className="text-xs text-neutral-400">Transações recentes realizadas no balcão</p>
          </div>
          <button
            onClick={() => setActiveTab('financeiro')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            Ver fluxo financeiro
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                <th className="pb-3 font-medium">Pedido #</th>
                <th className="pb-3 font-medium">Data / Hora</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Itens</th>
                <th className="pb-3 font-medium">Pagamento</th>
                <th className="pb-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500 text-xs">
                    Nenhuma venda realizada ainda. O caixa está zerado e pronto para o primeiro cliente!
                  </td>
                </tr>
              ) : (
                sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 font-mono font-semibold text-blue-400">
                      #{sale.saleNumber}
                    </td>
                    <td className="py-3 text-xs text-neutral-400">
                      {formatDateBR(sale.timestamp)}
                    </td>
                    <td className="py-3 text-neutral-200">
                      {sale.customerName || 'Cliente Balcão'}
                    </td>
                    <td className="py-3 text-xs text-neutral-400">
                      {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'} (
                      {sale.items.map((i) => i.name).slice(0, 2).join(', ')}
                      {sale.items.length > 2 ? '...' : ''})
                    </td>
                    <td className="py-3">
                      <span className="text-xs uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-white">
                      {formatBRL(sale.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT INITIAL VALUES MODAL */}
      {isEditValuesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsEditValuesModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Diego Bebidas
              </span>
              <span>·</span>
              <span className="text-xs text-neutral-400">Ajuste de Valores Iniciais</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              Editar Saldo & Faturamento
            </h3>

            {valuesSavedNotice ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Valores atualizados com sucesso!</span>
              </div>
            ) : (
              <form onSubmit={handleSaveInitialValues} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Saldo Inicial de Caixa / Gaveta (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={initialCashAmount || ''}
                    onChange={(e) => setInitialCashAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 300,00 (troco inicial da gaveta)"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono text-base focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Esse valor entrará como dinheiro em caixa para troco no PDV.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Lançamento de Faturamento Inicial Avulso (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={initialRevenueAmount || ''}
                    onChange={(e) => setInitialRevenueAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono text-base focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Deixe 0,00 caso vá registrar todas as vendas diretamente pelo PDV.
                  </span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditValuesModalOpen(false)}
                    className="w-1/3 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-medium"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Valores</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
