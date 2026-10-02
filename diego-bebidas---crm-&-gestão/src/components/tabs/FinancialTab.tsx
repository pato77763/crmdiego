import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { FinancialTransaction, FinancialCategory, PaymentMethod } from '../../types';
import { formatBRL, formatDateBR } from '../../utils/formatters';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  PlusCircle,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  X,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';

export const FinancialTab: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction, sales } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Transaction Form state
  const [formType, setFormType] = useState<'receita' | 'despesa'>('despesa');
  const [formCategory, setFormCategory] = useState<FinancialCategory>('Fornecedor Bebidas');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod | 'transferencia' | 'boleto'>('transferencia');

  // Calculations
  const totalRevenue = transactions
    .filter((t) => t.type === 'receita')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'despesa')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalRevenue - totalExpenses;

  // Breakdown by payment method
  const cashInDrawer = transactions
    .filter((t) => t.type === 'receita' && t.paymentMethod === 'dinheiro')
    .reduce((acc, t) => acc + t.amount, 0);

  const pixTotal = transactions
    .filter((t) => t.type === 'receita' && t.paymentMethod === 'pix')
    .reduce((acc, t) => acc + t.amount, 0);

  const cardTotal = transactions
    .filter((t) => t.type === 'receita' && (t.paymentMethod === 'cartao_debito' || t.paymentMethod === 'cartao_credito'))
    .reduce((acc, t) => acc + t.amount, 0);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim() || formAmount <= 0) {
      alert('Preencha a descrição e um valor válido.');
      return;
    }

    addTransaction({
      type: formType,
      category: formCategory,
      description: formDescription.trim(),
      amount: formAmount,
      date: new Date().toISOString(),
      paymentMethod: formPaymentMethod,
    });

    setIsAddModalOpen(false);
    setFormDescription('');
    setFormAmount(0);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <span>Controle de Caixa & Finanças</span>
            <span>·</span>
            <span>Diego Bebidas</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Fluxo de Caixa Financeiro</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Monitore entradas de vendas, despesas operacionais com fornecedores, refrigeração e fechamento diário.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              const valor = prompt('Digite o valor do Saldo Inicial de Caixa / Troco (R$):', '200.00');
              if (valor && !isNaN(parseFloat(valor))) {
                addTransaction({
                  type: 'receita',
                  category: 'Outros',
                  description: 'Aporte Inicial de Caixa / Troco',
                  amount: parseFloat(valor),
                  date: new Date().toISOString(),
                  paymentMethod: 'dinheiro',
                });
              }
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl text-sm border border-neutral-700 transition-colors"
          >
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span>Definir Saldo Inicial</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/30 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Lançamento Manual</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Entradas */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Total Entradas (Receitas)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              +{formatBRL(totalRevenue)}
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              Vendas no balcão e recebimentos
            </div>
          </div>
        </div>

        {/* Saídas */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Total Saídas (Despesas)
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-red-400 font-mono">
              -{formatBRL(totalExpenses)}
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              Cervejarias, energia, insumos
            </div>
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Saldo Líquido em Caixa
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-black font-mono ${netBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
              {formatBRL(netBalance)}
            </div>
            <div className="mt-1 text-xs text-blue-400 font-medium">
              Posição consolidada da distribuidora
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown by Payment Channel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-400">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400">Dinheiro Físico no Caixa</div>
            <div className="text-base font-bold text-white font-mono">{formatBRL(cashInDrawer)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-400">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400">Recebido via PIX</div>
            <div className="text-base font-bold text-white font-mono">{formatBRL(pixTotal)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400">Cartões Débito / Crédito</div>
            <div className="text-base font-bold text-white font-mono">{formatBRL(cardTotal)}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar lançamentos..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center rounded-xl bg-neutral-950 p-1 border border-neutral-800 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 sm:flex-initial px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filterType === 'all' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Todos ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('receita')}
            className={`flex-1 sm:flex-initial px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filterType === 'receita' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Entradas
          </button>
          <button
            onClick={() => setFilterType('despesa')}
            className={`flex-1 sm:flex-initial px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filterType === 'despesa' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Saídas
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider font-semibold bg-neutral-950/60">
                <th className="py-3.5 px-4 font-medium">Data / Hora</th>
                <th className="py-3.5 px-4 font-medium">Descrição</th>
                <th className="py-3.5 px-4 font-medium">Categoria</th>
                <th className="py-3.5 px-4 font-medium">Método</th>
                <th className="py-3.5 px-4 font-medium text-right">Valor</th>
                <th className="py-3.5 px-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'receita';
                  return (
                    <tr key={tx.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-mono text-neutral-400">
                        {formatDateBR(tx.date)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isIncome ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          <span>{tx.description}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-neutral-300">
                        <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                          {tx.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-neutral-400 uppercase">
                        {tx.paymentMethod}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={isIncome ? 'text-emerald-400' : 'text-red-400'}>
                          {isIncome ? '+' : '-'} {formatBRL(tx.amount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Deseja excluir este lançamento financeiro?')) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="text-neutral-500 hover:text-red-400 p-1 text-xs"
                          title="Excluir lançamento"
                        >
                          <X className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD TRANSACTION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              Novo Lançamento no Fluxo de Caixa
            </h3>
            <p className="text-xs text-neutral-400 mb-5">
              Lance despesas de fornecedores, contas de energia ou outras receitas avulsas.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Type Switch */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Tipo de Operação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('receita');
                      setFormCategory('Venda PDV');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      formType === 'receita'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Receita (Entrada)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('despesa');
                      setFormCategory('Fornecedor Bebidas');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      formType === 'despesa'
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Despesa (Saída)</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Descrição do Lançamento *
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Pagamento Fornecedor Ambev - Cervejas"
                  className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as FinancialCategory)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Fornecedor Bebidas">Fornecedor Bebidas</option>
                    <option value="Energia & Refrigeração">Energia & Câmaras Frias</option>
                    <option value="Aluguel do Ponto">Aluguel do Ponto</option>
                    <option value="Equipe & Funcionários">Equipe / Diárias</option>
                    <option value="Frete & Logística">Frete & Logística</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Impostos & Taxas">Impostos & Taxas</option>
                    <option value="Venda PDV">Venda Balcão / PDV</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formAmount || ''}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Forma de Pagamento
                </label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferência / TED</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="dinheiro">Dinheiro em Espécie</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/3 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
