import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory, PaymentMethod, Sale } from '../../types';
import {
  formatBRL,
  formatDateBR,
  CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../../utils/formatters';
import { playBeep, playSuccessChime, playErrorSound } from '../../utils/audio';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  CreditCard,
  QrCode,
  Banknote,
  FileText,
  Printer,
  X,
  AlertCircle,
  User,
  Percent,
  Beer,
} from 'lucide-react';

export const PosTab: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    createSale,
    config,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Payment Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [amountReceived, setAmountReceived] = useState<number>(0);

  // Completed sale receipt modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Barcode input ref for fast keyboard scanning
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const total = Math.max(0, subtotal - discountAmount);
  const change = Math.max(0, amountReceived - total);

  // Quick search / barcode enter key handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const codeOrName = searchTerm.trim().toLowerCase();
      if (!codeOrName) return;

      // Exact barcode match first
      const exactBarcode = products.find((p) => p.code.toLowerCase() === codeOrName);
      if (exactBarcode) {
        addToCart(exactBarcode, 1);
        setSearchTerm('');
        return;
      }

      // Name match
      const matched = products.find((p) => p.name.toLowerCase().includes(codeOrName));
      if (matched) {
        addToCart(matched, 1);
        setSearchTerm('');
      } else {
        playErrorSound(config.soundEnabled);
      }
    }
  };

  // Filter products for POS Grid
  const posProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setAmountReceived(total);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'dinheiro' && amountReceived < total) {
      alert('O valor em dinheiro recebido é menor que o total da venda.');
      return;
    }

    if (paymentMethod === 'fiado' && !customerName.trim()) {
      alert('Para venda no fiado / anotar, informe o nome do cliente.');
      return;
    }

    const sale = await createSale({
      items: cart,
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod,
      amountPaid: paymentMethod === 'dinheiro' ? amountReceived : total,
      change: paymentMethod === 'dinheiro' ? change : 0,
      customerName: customerName.trim() || 'Cliente Balcão',
      customerPhone: customerPhone.trim(),
    });

    setIsPaymentModalOpen(false);
    setDiscountAmount(0);
    setCustomerName('');
    setCustomerPhone('');
    setCompletedSale(sale);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[680px]">
      {/* LEFT COLUMN: Catalog / Product selection */}
      <div className="flex-1 flex flex-col min-w-0 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        {/* Top Controls: Barcode search & categories */}
        <div className="p-4 border-b border-neutral-800 space-y-3 bg-neutral-950/60">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Passe o leitor de código de barras ou digite o nome da bebida e dê Enter..."
                className="w-full pl-11 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              Todos os Produtos
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {posProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-neutral-500">
              Nenhuma bebida encontrada para o termo "{searchTerm}".
            </div>
          ) : (
            posProducts.map((product) => {
              const inCart = cart.find((item) => item.product.id === product.id);
              const isOut = product.currentStock === 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOut && addToCart(product, 1)}
                  className={`relative p-3.5 rounded-xl border flex flex-col justify-between transition-all select-none ${
                    isOut
                      ? 'bg-neutral-950/40 border-neutral-800/40 opacity-40 cursor-not-allowed'
                      : 'bg-neutral-950 border-neutral-800/80 hover:border-blue-500 hover:bg-neutral-900/80 cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  {/* Badge if in cart */}
                  {inCart && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono font-bold text-xs shadow-md">
                      {inCart.quantity}x
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 block mb-1">
                      {product.unitType}
                    </span>
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-2 border-t border-neutral-800/80 flex items-end justify-between">
                    <div>
                      <div className="text-base font-black text-white font-mono">
                        {formatBRL(product.salePrice)}
                      </div>
                      {product.wholesalePrice > 0 && (
                        <div className="text-[10px] text-neutral-400 font-mono">
                          Fardo ({product.wholesaleMinQuantity}+ un): {formatBRL(product.wholesalePrice)}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-mono ${
                          product.currentStock <= product.minStock
                            ? 'text-amber-400'
                            : 'text-neutral-500'
                        }`}
                      >
                        {product.currentStock} un
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: POS Cart & Checkout summary */}
      <div className="w-full lg:w-[420px] flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-white text-base">Carrinho de Venda</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
              {cart.reduce((acc, i) => acc + i.quantity, 0)} itens
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-neutral-400 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-600 mb-3">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-neutral-300">Carrinho Vazio</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-[220px]">
                Adicione bebidas pelo catálogo ao lado ou passe o código de barras.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {item.product.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                    <span className="font-mono">{formatBRL(item.unitPrice)}/un</span>
                    {item.isWholesaleApplied && (
                      <span className="text-emerald-400 font-semibold uppercase text-[9px] px-1 rounded bg-emerald-950/60 border border-emerald-800/50">
                        Atacado
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-sm text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Line total */}
                <div className="text-right min-w-[70px]">
                  <div className="text-xs font-mono font-bold text-white">
                    {formatBRL(item.total)}
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-neutral-500 hover:text-red-400 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Action */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 space-y-3">
          {/* Subtotal & Discount row */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal:</span>
              <span className="font-mono text-neutral-200">{formatBRL(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-400 flex items-center gap-1">
                <Percent className="w-3 h-3 text-blue-400" />
                <span>Desconto (R$):</span>
              </span>
              <input
                type="number"
                min="0"
                max={subtotal}
                step="0.50"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0,00"
                className="w-24 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-right font-mono text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Total a Pagar:
              </span>
              <span className="text-2xl font-black text-blue-400 font-mono">
                {formatBRL(total)}
              </span>
            </div>
          </div>

          {/* Checkout button */}
          <button
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <Banknote className="w-5 h-5" />
            <span>Cobrar / Finalizar Venda</span>
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Frente de Caixa
              </span>
              <span>·</span>
              <span className="text-xs text-neutral-400">Diego Bebidas</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              Finalizar Venda - <span className="font-mono text-blue-400">{formatBRL(total)}</span>
            </h3>

            {/* Optional Customer info */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase mb-1">
                  Nome do Cliente
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: João da Adega"
                    className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { id: 'pix', label: 'PIX', icon: QrCode },
                { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                { id: 'cartao_debito', label: 'Débito', icon: CreditCard },
                { id: 'cartao_credito', label: 'Crédito', icon: CreditCard },
                { id: 'fiado', label: 'Fiado / Anotar', icon: FileText },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as PaymentMethod);
                      if (m.id === 'dinheiro') setAmountReceived(total);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Method Specific Display */}
            {paymentMethod === 'pix' && (
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 mb-5 flex items-center gap-4">
                <div className="w-24 h-24 bg-white p-2 rounded-lg flex items-center justify-center flex-shrink-0">
                  {/* Visual QR Code simulation */}
                  <div className="w-full h-full bg-neutral-950 rounded flex items-center justify-center text-[10px] font-mono text-white text-center p-1 font-bold">
                    PIX QR DIEGO
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-white">Chave PIX Diego Bebidas:</div>
                  <div className="font-mono text-blue-400 bg-neutral-900 px-2 py-1 rounded border border-neutral-800 select-all">
                    {config.pixKey}
                  </div>
                  <p className="text-neutral-400 text-[11px]">
                    Aguardando confirmação do pagamento instantâneo no banco.
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'dinheiro' && (
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 mb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 uppercase">
                    Valor Recebido em Dinheiro:
                  </label>
                  <div className="flex gap-1.5">
                    {[20, 50, 100].map((note) => (
                      <button
                        key={note}
                        type="button"
                        onClick={() => setAmountReceived(note)}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-300"
                      >
                        R${note}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmountReceived(total)}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-blue-400"
                    >
                      Exato
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  step="0.50"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono text-lg font-bold focus:outline-none focus:border-blue-500"
                />

                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300 uppercase">Troco do Cliente:</span>
                  <span className={`text-xl font-black font-mono ${change > 0 ? 'text-emerald-400' : 'text-neutral-400'}`}>
                    {formatBRL(change)}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'fiado' && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs mb-5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong>Atenção: Venda a Prazo (Fiado).</strong>
                  <p className="mt-0.5 opacity-90">
                    O valor de {formatBRL(total)} será lançado na conta do cliente "{customerName || 'Informar Nome'}".
                  </p>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-1/3 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-medium"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckout}
                className="w-2/3 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Confirmar e Emitir Cupom</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED SALE RECEIPT MODAL (Cupom de Venda) */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setCompletedSale(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Thermal receipt paper preview */}
            <div id="printable-receipt" className="bg-white text-black p-4 rounded-xl font-mono text-xs shadow-inner">
              <div className="text-center border-b border-dashed border-black/40 pb-2 mb-2">
                <div className="font-black text-sm uppercase tracking-tight">
                  {config.storeName}
                </div>
                <div className="text-[10px] text-gray-700">{config.subtitle}</div>
                <div className="text-[9px] text-gray-600">CNPJ: {config.cnpj}</div>
                <div className="text-[9px] text-gray-600">{config.address}</div>
                <div className="text-[9px] text-gray-600">Tel: {config.phone}</div>
                <div className="font-bold text-[11px] mt-1">CUPOM NÃO FISCAL</div>
                <div className="text-[10px]">
                  Pedido #{completedSale.saleNumber} · {formatDateBR(completedSale.timestamp)}
                </div>
              </div>

              {completedSale.customerName && (
                <div className="text-[10px] mb-2 border-b border-dashed border-black/30 pb-1">
                  Cliente: <strong>{completedSale.customerName}</strong>
                </div>
              )}

              {/* Items */}
              <div className="border-b border-dashed border-black/40 pb-2 mb-2 space-y-1">
                {completedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <div className="font-medium text-[11px]">{it.name}</div>
                      <div className="text-[9px] text-gray-600">
                        {it.quantity} x {formatBRL(it.unitPrice)}
                      </div>
                    </div>
                    <div className="font-bold">{formatBRL(it.total)}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-b border-dashed border-black/40 pb-2 mb-2 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatBRL(completedSale.subtotal)}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto:</span>
                    <span>-{formatBRL(completedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs pt-1 border-t border-black/20">
                  <span>TOTAL:</span>
                  <span>{formatBRL(completedSale.total)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700 pt-1">
                  <span>Pagamento:</span>
                  <span className="uppercase font-semibold">{PAYMENT_METHOD_LABELS[completedSale.paymentMethod]}</span>
                </div>
                {completedSale.change > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span>Troco:</span>
                    <span>{formatBRL(completedSale.change)}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[9px] text-gray-600 pt-1">
                {config.receiptFooterMessage}
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Cupom</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
