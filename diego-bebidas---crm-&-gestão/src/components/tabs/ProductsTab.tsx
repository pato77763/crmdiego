import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory } from '../../types';
import { formatBRL, CATEGORY_LABELS, generateBarcode } from '../../utils/formatters';
import {
  PackagePlus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Plus,
  X,
  Barcode,
  TrendingUp,
  Boxes,
  Check,
} from 'lucide-react';

export const ProductsTab: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductPriceDirect,
    updateProductStockDirect,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [quickSaveAlert, setQuickSaveAlert] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'cervejas' as ProductCategory,
    costPrice: 0,
    salePrice: 0,
    wholesalePrice: 0,
    wholesaleMinQuantity: 12,
    depotStock: 0,
    storefrontStock: 0,
    minStock: 24,
    unitType: 'Lata 350ml',
    depotLocation: 'Depósito Central',
    supplier: '',
  });

  const resetForm = () => {
    setFormData({
      code: generateBarcode(),
      name: '',
      category: 'cervejas',
      costPrice: 3.50,
      salePrice: 6.00,
      wholesalePrice: 5.20,
      wholesaleMinQuantity: 12,
      depotStock: 48,
      storefrontStock: 24,
      minStock: 24,
      unitType: 'Lata 350ml',
      depotLocation: 'Depósito Central - Corredor 1',
      supplier: 'Ambev Logística',
    });
    setEditingProduct(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      code: p.code,
      name: p.name,
      category: p.category,
      costPrice: p.costPrice,
      salePrice: p.salePrice,
      wholesalePrice: p.wholesalePrice,
      wholesaleMinQuantity: p.wholesaleMinQuantity,
      depotStock: p.depotStock,
      storefrontStock: p.storefrontStock,
      minStock: p.minStock,
      unitType: p.unitType,
      depotLocation: p.depotLocation,
      supplier: p.supplier || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Informe o nome da bebida ou produto.');
      return;
    }

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        code: formData.code.trim(),
        name: formData.name.trim(),
        category: formData.category,
        costPrice: Number(formData.costPrice),
        salePrice: Number(formData.salePrice),
        wholesalePrice: Number(formData.wholesalePrice),
        wholesaleMinQuantity: Number(formData.wholesaleMinQuantity),
        depotStock: Number(formData.depotStock),
        storefrontStock: Number(formData.storefrontStock),
        minStock: Number(formData.minStock),
        unitType: formData.unitType,
        depotLocation: formData.depotLocation.trim(),
        supplier: formData.supplier.trim(),
      });
    } else {
      await addProduct({
        code: formData.code.trim() || generateBarcode(),
        name: formData.name.trim(),
        category: formData.category,
        costPrice: Number(formData.costPrice),
        salePrice: Number(formData.salePrice),
        wholesalePrice: Number(formData.wholesalePrice),
        wholesaleMinQuantity: Number(formData.wholesaleMinQuantity),
        depotStock: Number(formData.depotStock),
        storefrontStock: Number(formData.storefrontStock),
        currentStock: Number(formData.depotStock) + Number(formData.storefrontStock),
        minStock: Number(formData.minStock),
        unitType: formData.unitType,
        depotLocation: formData.depotLocation.trim() || 'Depósito Central',
        supplier: formData.supplier.trim(),
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover permanentemente o produto "${name}" do cadastro?`)) {
      deleteProduct(id);
    }
  };

  // Calculations for preview in modal
  const profitMargin = formData.salePrice > 0 
    ? ((formData.salePrice - formData.costPrice) / formData.salePrice) * 100 
    : 0;

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.includes(searchTerm) ||
      (p.supplier && p.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <span>Catálogo Oficial</span>
            <span>·</span>
            <span>Diego Bebidas</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Cadastro de Produtos</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Cadastre novas bebidas, fardos, destilados, combos e defina preços de varejo e atacado.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/30 self-start sm:self-auto"
        >
          <PackagePlus className="w-4 h-4" />
          <span>Novo Produto / Bebida</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, código ou fornecedor..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas as Categorias</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <span className="text-xs text-neutral-500 whitespace-nowrap">
            {filtered.length} bebidas
          </span>
        </div>
      </div>

      {/* Products Catalog Table */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider font-semibold bg-neutral-950/60">
                <th className="py-3.5 px-4 font-medium">Cód. Barras</th>
                <th className="py-3.5 px-4 font-medium">Bebida / Categoria</th>
                <th className="py-3.5 px-4 font-medium text-center">
                  <span className="text-neutral-300 font-bold">Custo (R$) ✎</span>
                </th>
                <th className="py-3.5 px-4 font-medium text-center">
                  <span className="text-emerald-400 font-bold">Venda Varejo (R$) ✎</span>
                </th>
                <th className="py-3.5 px-4 font-medium text-center">
                  <span className="text-blue-400 font-bold">Atacado / Fardo (R$) ✎</span>
                </th>
                <th className="py-3.5 px-4 font-medium text-center">
                  <span className="text-white font-bold">Estoque (un) ✎</span>
                </th>
                <th className="py-3.5 px-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    Nenhum produto cadastrado com esses filtros.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const margin = prod.salePrice > 0 ? ((prod.salePrice - prod.costPrice) / prod.salePrice) * 100 : 0;
                  return (
                    <tr key={prod.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-neutral-400">
                        {prod.code}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{prod.name}</div>
                        <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                          <span className="text-blue-400 font-medium">
                            {CATEGORY_LABELS[prod.category] || prod.category}
                          </span>
                          <span>·</span>
                          <span>{prod.unitType}</span>
                        </div>
                      </td>

                      {/* EDITABLE COST PRICE */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-xs text-neutral-500 font-mono">R$</span>
                          <input
                            type="number"
                            step="0.10"
                            min="0"
                            value={prod.costPrice}
                            onChange={(e) =>
                              updateProductPriceDirect(
                                prod.id,
                                parseFloat(e.target.value) || 0,
                                prod.salePrice,
                                prod.wholesalePrice
                              )
                            }
                            className="w-20 px-2 py-1 bg-neutral-950 border border-neutral-700 hover:border-neutral-500 focus:border-blue-500 focus:bg-neutral-900 rounded-lg text-center font-mono text-neutral-300 text-xs focus:outline-none"
                            title="Editar Preço de Custo"
                          />
                        </div>
                      </td>

                      {/* EDITABLE SALE PRICE */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-xs text-emerald-500 font-mono">R$</span>
                            <input
                              type="number"
                              step="0.10"
                              min="0"
                              value={prod.salePrice}
                              onChange={(e) =>
                                updateProductPriceDirect(
                                  prod.id,
                                  prod.costPrice,
                                  parseFloat(e.target.value) || 0,
                                  prod.wholesalePrice
                                )
                              }
                              className="w-20 px-2 py-1 bg-neutral-950 border border-neutral-700 hover:border-emerald-500 focus:border-emerald-500 focus:bg-neutral-900 rounded-lg text-center font-mono font-bold text-emerald-400 text-xs focus:outline-none"
                              title="Editar Preço de Venda Varejo"
                            />
                          </div>
                          {prod.salePrice > 0 && (
                            <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
                              {margin.toFixed(0)}% margem
                            </span>
                          )}
                        </div>
                      </td>

                      {/* EDITABLE WHOLESALE PRICE */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-xs text-blue-500 font-mono">R$</span>
                          <input
                            type="number"
                            step="0.10"
                            min="0"
                            value={prod.wholesalePrice}
                            onChange={(e) =>
                              updateProductPriceDirect(
                                prod.id,
                                prod.costPrice,
                                prod.salePrice,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 px-2 py-1 bg-neutral-950 border border-neutral-700 hover:border-blue-500 focus:border-blue-500 focus:bg-neutral-900 rounded-lg text-center font-mono text-blue-400 text-xs focus:outline-none"
                            title="Editar Preço de Atacado / Fardo"
                          />
                        </div>
                      </td>

                      {/* EDITABLE STOCK TOTAL */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={prod.currentStock}
                            onChange={(e) =>
                              updateProductStockDirect(
                                prod.id,
                                parseInt(e.target.value) || 0,
                                0,
                                prod.minStock
                              )
                            }
                            className="w-16 px-2 py-1 bg-neutral-950 border border-neutral-700 hover:border-blue-500 focus:border-blue-500 focus:bg-neutral-900 rounded-lg text-center font-mono font-bold text-white text-xs focus:outline-none"
                            title="Editar Estoque Total"
                          />
                          <span className="text-xs text-neutral-500">un</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 transition-colors"
                            title="Editar Cadastro Completo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Diego Bebidas
              </span>
              <span>·</span>
              <span className="text-xs text-neutral-400">Cadastro de Produtos</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-6">
              {editingProduct ? 'Editar Bebida / Produto' : 'Cadastrar Nova Bebida no Sistema'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Nome do Produto / Bebida *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Cerveja Spaten Puro Malte Lata 350ml"
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Code / Barcode & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Código de Barras (EAN)
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, code: generateBarcode() })}
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Gerar Automático</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Barcode className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="7890000000000"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prices: Cost, Sale, Wholesale */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-3">
                <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Precificação & Margens
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Preço de Custo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Preço Venda Varejo (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      required
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-sm font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Preço Atacado / Fardo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={formData.wholesalePrice}
                      onChange={(e) => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-sm text-blue-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                  <span>Margem Bruta Estimada: <strong className="text-white font-mono">{profitMargin.toFixed(1)}%</strong></span>
                  <div className="flex items-center gap-1.5">
                    <span>Qtd mín. para atacado:</span>
                    <input
                      type="number"
                      min="1"
                      value={formData.wholesaleMinQuantity}
                      onChange={(e) => setFormData({ ...formData, wholesaleMinQuantity: parseInt(e.target.value) || 1 })}
                      className="w-16 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-center text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Stock settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 uppercase mb-1">
                    No Depósito (un)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.depotStock}
                    onChange={(e) => setFormData({ ...formData, depotStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 uppercase mb-1">
                    Na Geladeira / Loja (un)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.storefrontStock}
                    onChange={(e) => setFormData({ ...formData, storefrontStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 uppercase mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Unit type, Depot Location & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 uppercase mb-1">
                    Tipo de Embalagem
                  </label>
                  <select
                    value={formData.unitType}
                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Lata 350ml">Lata 350ml</option>
                    <option value="Latão 473ml">Latão 473ml</option>
                    <option value="Long Neck 330ml">Long Neck 330ml</option>
                    <option value="Garrafa 600ml">Garrafa 600ml</option>
                    <option value="Garrafa 1L">Garrafa 1L</option>
                    <option value="Garrafa 750ml">Garrafa 750ml</option>
                    <option value="Garrafa Pet 2L">Garrafa Pet 2L</option>
                    <option value="Lata 250ml">Lata 250ml</option>
                    <option value="Saco 5kg">Saco 5kg</option>
                    <option value="Saco 2.5kg">Saco 2.5kg</option>
                    <option value="Fardo c/ 12">Fardo c/ 12</option>
                    <option value="Engradado c/ 24">Engradado c/ 24</option>
                    <option value="Unidade">Unidade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 uppercase mb-1">
                    Localização no Depósito
                  </label>
                  <input
                    type="text"
                    value={formData.depotLocation}
                    onChange={(e) => setFormData({ ...formData, depotLocation: e.target.value })}
                    placeholder="Ex: Câmara Fria 01 - Palete A"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 uppercase mb-1">
                    Fornecedor / Distribuidor
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Ex: Ambev, Heineken, Coca-Cola"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-neutral-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Salvar Alterações' : 'Cadastrar Bebida'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
