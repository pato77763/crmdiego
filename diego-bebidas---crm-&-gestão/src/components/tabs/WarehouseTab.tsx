import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory } from '../../types';
import { formatBRL, CATEGORY_LABELS } from '../../utils/formatters';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  ArrowRightLeft,
  Plus,
  Minus,
  CheckCircle,
  Truck,
  Refrigerator,
  Layers,
  X,
  RotateCcw,
  Edit3,
  Check,
  Save,
} from 'lucide-react';

export const WarehouseTab: React.FC = () => {
  const {
    products,
    adjustStock,
    transferStock,
    updateProductStockDirect,
    zeroAllData,
    stockMovements,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'with_stock' | 'zero'>('all');
  const [savedAlert, setSavedAlert] = useState<string | null>(null);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);

  // Modal states for logistics
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(12);
  const [adjustTarget, setAdjustTarget] = useState<'depot' | 'storefront'>('depot');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustReason, setAdjustReason] = useState<string>('Compra / Reposição de Fornecedor');

  const [transferModalProduct, setTransferModalProduct] = useState<Product | null>(null);
  const [transferAmount, setTransferAmount] = useState<number>(12);
  const [transferDirection, setTransferDirection] = useState<'depot_to_store' | 'store_to_depot'>('depot_to_store');

  // Metrics
  const totalDepotUnits = products.reduce((acc, p) => acc + p.depotStock, 0);
  const totalStorefrontUnits = products.reduce((acc, p) => acc + p.storefrontStock, 0);
  const totalCostValue = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
  const totalSaleValue = products.reduce((acc, p) => acc + p.currentStock * p.salePrice, 0);
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock && p.minStock > 0).length;

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.includes(searchTerm) ||
      p.depotLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    let matchesStatus = true;
    if (statusFilter === 'low') {
      matchesStatus = p.currentStock <= p.minStock && p.minStock > 0;
    } else if (statusFilter === 'with_stock') {
      matchesStatus = p.currentStock > 0;
    } else if (statusFilter === 'zero') {
      matchesStatus = p.currentStock === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleConfirmAdjust = () => {
    if (!adjustModalProduct || adjustAmount <= 0) return;
    const delta = adjustType === 'add' ? adjustAmount : -adjustAmount;
    adjustStock(adjustModalProduct.id, delta, adjustTarget, adjustReason);
    setAdjustModalProduct(null);
  };

  const handleConfirmTransfer = () => {
    if (!transferModalProduct || transferAmount <= 0) return;
    if (transferDirection === 'depot_to_store') {
      transferStock(transferModalProduct.id, transferAmount, 'depot', 'storefront');
    } else {
      transferStock(transferModalProduct.id, transferAmount, 'storefront', 'depot');
    }
    setTransferModalProduct(null);
  };

  const handleInlineStockChange = (
    productId: string,
    field: 'depotStock' | 'storefrontStock' | 'minStock',
    newVal: number
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const val = Math.max(0, newVal || 0);
    const depot = field === 'depotStock' ? val : prod.depotStock;
    const store = field === 'storefrontStock' ? val : prod.storefrontStock;
    const min = field === 'minStock' ? val : prod.minStock;

    updateProductStockDirect(productId, depot, store, min);
    setSavedAlert(prod.name);
    setTimeout(() => setSavedAlert(null), 2000);
  };

  const handleConfirmZeroAllStock = () => {
    if (
      confirm(
        'Deseja zerar os estoques de todas as bebidas? O volume no depósito e nas geladeiras voltará para 0.'
      )
    ) {
      products.forEach((p) => {
        updateProductStockDirect(p.id, 0, 0, 0);
      });
      alert('Todos os volumes no depósito e geladeiras foram zerados com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <span>Logística & Armazenamento</span>
            <span>·</span>
            <span>Diego Bebidas</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Depósito e Estoque</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Gerencie o que tem no seu depósito. Os valores de estoque são <strong>editáveis diretamente nos campos abaixo</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsMovementsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl text-xs border border-neutral-700 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Histórico de Movimentações ({stockMovements.length})</span>
          </button>

          <button
            onClick={handleConfirmZeroAllStock}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-800 hover:bg-red-950/60 hover:text-red-300 text-neutral-300 font-medium rounded-xl text-xs border border-neutral-700 transition-colors"
            title="Zerar todos os estoques"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Zerar Estoques</span>
          </button>
        </div>
      </div>

      {savedAlert && (
        <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800 text-blue-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-blue-400" />
          <span>Volume de estoque atualizado: <strong>{savedAlert}</strong></span>
        </div>
      )}

      {/* KPI Cards for Warehouse - ALL ZEROED */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Depot stock */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              No Depósito (Paletes / Câmaras)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono">
              {totalDepotUnits.toLocaleString('pt-BR')} <span className="text-xs font-normal text-neutral-400">un</span>
            </div>
            <div className="mt-1 text-xs text-neutral-400">Editável diretamente na tabela</div>
          </div>
        </div>

        {/* Storefront stock */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Geladeiras / Frente Loja
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Refrigerator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono">
              {totalStorefrontUnits.toLocaleString('pt-BR')} <span className="text-xs font-normal text-neutral-400">un</span>
            </div>
            <div className="mt-1 text-xs text-neutral-400">Prontas para venda no PDV</div>
          </div>
        </div>

        {/* Inventory Value at Cost */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Valor de Custo em Estoque
            </span>
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono">
              {formatBRL(totalCostValue)}
            </div>
            <div className="mt-1 text-xs text-emerald-400">
              Venda projetada: {formatBRL(totalSaleValue)}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Abaixo do Mínimo
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              lowStockCount > 0 ? 'bg-amber-600/20 text-amber-400' : 'bg-blue-600/10 text-blue-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono">
              {lowStockCount} <span className="text-xs font-normal text-neutral-400">bebidas</span>
            </div>
            <div className="mt-1 text-xs text-neutral-400">Ajuste o limite mínimo na coluna</div>
          </div>
        </div>
      </div>

      {/* Filters and search bar */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar bebida, código ou local..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category & Status Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas as Categorias</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-xl bg-neutral-950 p-1 border border-neutral-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter('with_stock')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'with_stock' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Com Estoque
            </button>
            <button
              onClick={() => setStatusFilter('zero')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'zero' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Zerados ({products.filter((p) => p.currentStock === 0).length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Stock Table with DIRECT EDITABLE INPUTS */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider font-semibold bg-neutral-950/60">
                <th className="py-3.5 px-4 font-medium">Bebida / Embalagem</th>
                <th className="py-3.5 px-4 font-medium">Local no Depósito</th>
                <th className="py-3.5 px-4 font-medium text-center">
                  <span className="text-blue-400 font-bold">No Depósito (un) ✎</span>
                </th>
                <th className="py-3.5 px-4 font-medium text-center">
                  <span className="text-neutral-300 font-bold">Na Geladeira (un) ✎</span>
                </th>
                <th className="py-3.5 px-4 font-medium text-center">
                  <span className="text-amber-400 font-bold">Estoque Mínimo ✎</span>
                </th>
                <th className="py-3.5 px-4 font-medium text-center">Total Geral</th>
                <th className="py-3.5 px-4 font-medium text-right">Transferir / Ajustar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500 text-sm">
                    Nenhuma bebida encontrada.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  return (
                    <tr key={prod.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{prod.name}</div>
                        <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{prod.code}</span>
                          <span>·</span>
                          <span className="text-blue-400 font-medium">{prod.unitType}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 inline-block">
                          {prod.depotLocation || 'Depósito Geral'}
                        </div>
                      </td>

                      {/* EDITABLE DEPOT STOCK DIRECTLY */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={prod.depotStock}
                            onChange={(e) =>
                              handleInlineStockChange(
                                prod.id,
                                'depotStock',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 px-2 py-1 bg-neutral-950 border border-neutral-700 hover:border-blue-500 focus:border-blue-500 focus:bg-neutral-900 rounded-lg text-center font-mono font-bold text-blue-400 text-sm focus:outline-none transition-colors"
                            title="Digite a quantidade no depósito"
                          />
                        </div>
                      </td>

                      {/* EDITABLE STOREFRONT (GELADEIRA) STOCK DIRECTLY */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={prod.storefrontStock}
                            onChange={(e) =>
                              handleInlineStockChange(
                                prod.id,
                                'storefrontStock',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 px-2 py-1 bg-neutral-950 border border-neutral-700 hover:border-blue-500 focus:border-blue-500 focus:bg-neutral-900 rounded-lg text-center font-mono font-medium text-neutral-200 text-sm focus:outline-none transition-colors"
                            title="Digite a quantidade na geladeira/frente de loja"
                          />
                        </div>
                      </td>

                      {/* EDITABLE MIN STOCK DIRECTLY */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={prod.minStock}
                            onChange={(e) =>
                              handleInlineStockChange(
                                prod.id,
                                'minStock',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-16 px-2 py-1 bg-neutral-950 border border-neutral-700 hover:border-amber-500 focus:border-amber-500 focus:bg-neutral-900 rounded-lg text-center font-mono text-amber-300 text-sm focus:outline-none transition-colors"
                            title="Digite o estoque mínimo para alerta"
                          />
                        </div>
                      </td>

                      {/* TOTAL AUTOMATICALLY COMPUTED */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-mono font-black text-white text-base">
                          {prod.currentStock}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {prod.currentStock === 0 ? 'Zerado' : 'Total'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Transfer between depot & storefront */}
                          <button
                            onClick={() => {
                              setTransferModalProduct(prod);
                              setTransferAmount(Math.min(12, prod.depotStock || 6));
                            }}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-blue-600 hover:text-white text-neutral-300 transition-colors"
                            title="Transferir entre Depósito e Geladeira"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>

                          {/* Quick Adjust stock */}
                          <button
                            onClick={() => {
                              setAdjustModalProduct(prod);
                              setAdjustAmount(12);
                              setAdjustType('add');
                            }}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                            title="Lançar Entrada / Saída de Carga"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setAdjustModalProduct(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              Entrada / Ajuste de Estoque
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              {adjustModalProduct.name} ({adjustModalProduct.unitType})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Tipo de Operação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('add');
                      setAdjustReason('Compra / Reposição de Fornecedor');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustType === 'add'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Entrada (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('subtract');
                      setAdjustReason('Avaria / Quebra / Consumo Interno');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustType === 'subtract'
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Saída (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Destino do Ajuste
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustTarget('depot')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border ${
                      adjustTarget === 'depot'
                        ? 'bg-neutral-800 text-white border-neutral-600'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    Depósito Principal
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustTarget('storefront')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border ${
                      adjustTarget === 'storefront'
                        ? 'bg-neutral-800 text-white border-neutral-600'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    Geladeira / Balcão
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Quantidade (unidades)
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono text-base focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2 mt-2">
                  {[6, 12, 24, 48, 120].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setAdjustAmount(quick)}
                      className="px-2.5 py-1 text-xs font-mono rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    >
                      +{quick}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="w-1/3 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdjust}
                  className="w-2/3 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20"
                >
                  Confirmar Entrada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {transferModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setTransferModalProduct(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              Transferência de Mercadoria
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              {transferModalProduct.name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Direção da Transferência
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferDirection('depot_to_store')}
                    className={`p-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 ${
                      transferDirection === 'depot_to_store'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    <span>Depósito ➔ Geladeira</span>
                    <span className="text-[10px] font-normal opacity-80">
                      Disponível: {transferModalProduct.depotStock} un
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferDirection('store_to_depot')}
                    className={`p-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 ${
                      transferDirection === 'store_to_depot'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    <span>Geladeira ➔ Depósito</span>
                    <span className="text-[10px] font-normal opacity-80">
                      Disponível: {transferModalProduct.storefrontStock} un
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Quantidade a Transferir (unidades)
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    transferDirection === 'depot_to_store'
                      ? transferModalProduct.depotStock
                      : transferModalProduct.storefrontStock
                  }
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono text-base focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setTransferModalProduct(null)}
                  className="w-1/3 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTransfer}
                  className="w-2/3 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20"
                >
                  Transferir Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Stock Movements History Modal (Supabase: movimentacoes_estoque) */}
      {isMovementsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setIsMovementsModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Supabase · Tabela: movimentacoes_estoque
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              Histórico de Movimentações de Estoque
            </h3>

            <div className="flex-1 overflow-y-auto pr-1">
              {stockMovements.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 text-sm">
                  Nenhuma movimentação de estoque registrada ainda. Conforme você der entradas, transferências ou vendas no PDV, o histórico será gravado aqui e no Supabase.
                </div>
              ) : (
                <div className="space-y-2">
                  {stockMovements.map((mov) => {
                    const isEntry = mov.type === 'ENTRADA';
                    const isTransfer = mov.type === 'TRANSFERENCIA';
                    return (
                      <div
                        key={mov.id}
                        className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                              isEntry
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : isTransfer
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-red-950 text-red-300 border border-red-800'
                            }`}
                          >
                            {mov.type}
                          </span>
                          <div>
                            <div className="font-semibold text-white">
                              {mov.reason || 'Movimentação'}
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">
                              {mov.createdAt ? new Date(mov.createdAt).toLocaleString('pt-BR') : ''}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`font-mono font-bold text-sm ${isEntry ? 'text-emerald-400' : isTransfer ? 'text-blue-400' : 'text-red-400'}`}>
                            {isEntry ? '+' : isTransfer ? '⇄ ' : '-'}{mov.quantity} un
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-800 mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMovementsModalOpen(false)}
                className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
