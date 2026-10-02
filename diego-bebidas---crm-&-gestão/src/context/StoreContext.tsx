import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  Sale,
  FinancialTransaction,
  StoreConfig,
  AppTab,
  CartItem,
  StockMovement,
} from '../types';
import {
  INITIAL_CONFIG,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_TRANSACTIONS,
} from '../data/initialData';
import { playBeep, playSuccessChime } from '../utils/audio';
import { supabase } from '../lib/supabase';

interface StoreContextType {
  // Navigation & Auth
  isAuthenticated: boolean;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Supabase sync status
  isSupabaseConnected: boolean;
  supabaseStatusMsg: string;
  stockMovements: StockMovement[];
  syncWithSupabase: () => Promise<void>;

  // Data
  products: Product[];
  sales: Sale[];
  transactions: FinancialTransaction[];
  config: StoreConfig;

  // Product Operations
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (id: string, amount: number, target: 'depot' | 'storefront', reason?: string) => Promise<void>;
  transferStock: (id: string, amount: number, from: 'depot' | 'storefront', to: 'depot' | 'storefront') => Promise<void>;

  // PDV / Sales Operations
  createSale: (saleInput: {
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: any;
    amountPaid: number;
    change: number;
    customerName?: string;
    customerPhone?: string;
  }) => Promise<Sale>;
  cancelSale: (saleId: string) => Promise<void>;

  // Financial Operations
  addTransaction: (tx: Omit<FinancialTransaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Settings & Utilities
  updateConfig: (updates: Partial<StoreConfig>) => Promise<void>;
  resetToDefaultData: () => void;
  zeroAllData: () => void;
  updateProductStockDirect: (id: string, depotStock: number, storefrontStock: number, minStock?: number) => Promise<void>;
  updateProductPriceDirect: (id: string, costPrice: number, salePrice: number, wholesalePrice?: number) => Promise<void>;
  setOpeningCash: (amount: number, description?: string) => Promise<void>;
  exportDataBackup: () => string;
  importDataBackup: (jsonString: string) => boolean;

  // POS Cart State
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  AUTH: 'diego_bebidas_auth',
  PRODUCTS: 'diego_bebidas_products',
  SALES: 'diego_bebidas_sales',
  TRANSACTIONS: 'diego_bebidas_transactions',
  CONFIG: 'diego_bebidas_config',
  MOVEMENTS: 'diego_bebidas_movements',
};

const ZERO_RESET_KEY = 'diego_bebidas_zero_v3';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<string>('Conectando ao Supabase...');

  // Products state
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const isZeroVersion = localStorage.getItem(ZERO_RESET_KEY) === 'true';
      if (!isZeroVersion) return INITIAL_PRODUCTS;
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Sales state
  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const isZeroVersion = localStorage.getItem(ZERO_RESET_KEY) === 'true';
      if (!isZeroVersion) return [];
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Transactions state
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    try {
      const isZeroVersion = localStorage.getItem(ZERO_RESET_KEY) === 'true';
      if (!isZeroVersion) return [];
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Movements state
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Config state
  const [config, setConfig] = useState<StoreConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return saved ? JSON.parse(saved) : INITIAL_CONFIG;
    } catch {
      return INITIAL_CONFIG;
    }
  });

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Sync state to local storage as fallback cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, isAuthenticated ? 'true' : 'false');
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(stockMovements));
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [isAuthenticated, products, sales, transactions, stockMovements, config]);

  // Load from Supabase on start
  const syncWithSupabase = useCallback(async () => {
    try {
      // 1. Test Supabase connection
      const { data: prodData, error: prodErr } = await supabase
        .from('produtos')
        .select('*');

      if (!prodErr && prodData) {
        setIsSupabaseConnected(true);
        setSupabaseStatusMsg('Conectado ao Supabase');

        if (prodData.length > 0) {
          const mapped: Product[] = prodData.map((row: any) => ({
            id: row.id,
            code: row.codigo || row.code || '',
            name: row.nome || row.name || '',
            category: row.categoria || row.category || 'cervejas',
            costPrice: Number(row.preco_custo ?? row.costPrice ?? 0),
            salePrice: Number(row.preco_venda ?? row.salePrice ?? 0),
            wholesalePrice: Number(row.preco_atacado ?? row.wholesalePrice ?? 0),
            wholesaleMinQuantity: Number(row.qtd_min_atacado ?? row.wholesaleMinQuantity ?? 12),
            currentStock: Number(row.estoque_atual ?? row.currentStock ?? 0),
            depotStock: Number(row.estoque_deposito ?? row.depotStock ?? 0),
            storefrontStock: Number(row.estoque_geladeira ?? row.storefrontStock ?? 0),
            minStock: Number(row.estoque_minimo ?? row.minStock ?? 0),
            unitType: row.tipo_embalagem || row.unitType || 'Lata 350ml',
            depotLocation: row.local_deposito || row.depotLocation || 'Depósito Central',
            supplier: row.fornecedor || row.supplier || '',
            createdAt: row.created_at || new Date().toISOString(),
          }));
          setProducts(mapped);
        }
      } else {
        // Table may not exist yet in user's Supabase instance
        setSupabaseStatusMsg(
          prodErr?.message ? `Supabase: ${prodErr.message}` : 'Aguardando criação das tabelas no Supabase'
        );
      }

      // 2. Fetch Movimentações
      const { data: movData, error: movErr } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .order('created_at', { ascending: false });

      if (!movErr && movData && movData.length > 0) {
        setStockMovements(
          movData.map((m: any) => ({
            id: m.id,
            productId: m.produto_id,
            productName: m.nome_produto,
            type: m.tipo,
            quantity: m.quantidade,
            reason: m.motivo,
            fromLocation: m.origem,
            toLocation: m.destino,
            createdAt: m.created_at,
          }))
        );
      }

      // 3. Fetch Vendas
      const { data: vendasData, error: vendasErr } = await supabase
        .from('vendas')
        .select('*, itens_venda(*)')
        .order('created_at', { ascending: false });

      if (!vendasErr && vendasData && vendasData.length > 0) {
        const mappedSales: Sale[] = vendasData.map((v: any) => ({
          id: v.id,
          saleNumber: v.numero_venda || 1000,
          timestamp: v.created_at || new Date().toISOString(),
          items: Array.isArray(v.itens_venda)
            ? v.itens_venda.map((it: any) => ({
                productId: it.produto_id,
                name: it.nome_produto,
                quantity: it.quantidade,
                unitPrice: Number(it.preco_unitario),
                total: Number(it.total),
                unitType: it.tipo_embalagem || 'Unidade',
              }))
            : [],
          subtotal: Number(v.subtotal),
          discount: Number(v.desconto || 0),
          total: Number(v.total),
          paymentMethod: v.forma_pagamento,
          amountPaid: Number(v.valor_pago || v.total),
          change: Number(v.troco || 0),
          customerName: v.nome_cliente,
          customerPhone: v.telefone_cliente,
          status: v.status || 'concluida',
        }));
        setSales(mappedSales);
      }

      // 4. Fetch Financeiro
      const { data: finData, error: finErr } = await supabase
        .from('financeiro')
        .select('*')
        .order('created_at', { ascending: false });

      if (!finErr && finData && finData.length > 0) {
        const mappedTx: FinancialTransaction[] = finData.map((f: any) => ({
          id: f.id,
          type: (f.tipo?.toLowerCase() === 'despesa' ? 'despesa' : 'receita') as 'receita' | 'despesa',
          category: f.categoria,
          description: f.descricao,
          amount: Number(f.valor),
          date: f.data || f.created_at || new Date().toISOString(),
          paymentMethod: f.forma_pagamento,
          relatedSaleId: f.venda_id,
        }));
        setTransactions(mappedTx);
      }

      // 5. Fetch Configurações
      const { data: cfgData, error: cfgErr } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!cfgErr && cfgData) {
        setConfig((prev) => ({
          ...prev,
          storeName: cfgData.nome_loja || prev.storeName,
          subtitle: cfgData.subtitulo || prev.subtitle,
          cnpj: cfgData.cnpj || prev.cnpj,
          phone: cfgData.telefone || prev.phone,
          address: cfgData.endereco || prev.address,
          pixKey: cfgData.chave_pix || prev.pixKey,
          receiptFooterMessage: cfgData.mensagem_cupom || prev.receiptFooterMessage,
          soundEnabled: cfgData.som_habilitado !== undefined ? cfgData.som_habilitado : prev.soundEnabled,
        }));
      }
    } catch (e: any) {
      console.warn('Erro ao conectar ao Supabase:', e);
      setSupabaseStatusMsg('Supabase offline ou aguardando configuração');
    }
  }, []);

  // Initialize Supabase Auth listener & load initial data
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
      }
    });

    syncWithSupabase();

    return () => {
      subscription.unsubscribe();
    };
  }, [syncWithSupabase]);

  // Auth handler using Supabase signInWithPassword
  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (error) {
        // If credentials not found, attempt signup on Supabase if matching credentials
        if (cleanEmail === 'diegobebidas@gmail.com' && cleanPass === 'diego2026') {
          const signUpRes = await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPass,
          });

          // Even if email confirmation is on or auto-signed-in
          setIsAuthenticated(true);
          setIsLoginModalOpen(false);
          playSuccessChime(config.soundEnabled);
          return { success: true };
        }
        return {
          success: false,
          error: error.message || 'Credenciais inválidas no Supabase Auth.',
        };
      }

      if (data?.session || data?.user) {
        setIsAuthenticated(true);
        setIsLoginModalOpen(false);
        playSuccessChime(config.soundEnabled);
        return { success: true };
      }

      return { success: false, error: 'Usuário não autenticado.' };
    } catch (err: any) {
      // Local fallback for requested credentials
      if (cleanEmail === 'diegobebidas@gmail.com' && cleanPass === 'diego2026') {
        setIsAuthenticated(true);
        setIsLoginModalOpen(false);
        playSuccessChime(config.soundEnabled);
        return { success: true };
      }
      return { success: false, error: err?.message || 'Erro ao conectar ao Supabase Auth.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  // Product Operations with Supabase
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Insert into Supabase produtos
    try {
      await supabase.from('produtos').insert({
        id: newProduct.id,
        codigo: newProduct.code,
        nome: newProduct.name,
        categoria: newProduct.category,
        preco_custo: newProduct.costPrice,
        preco_venda: newProduct.salePrice,
        preco_atacado: newProduct.wholesalePrice,
        qtd_min_atacado: newProduct.wholesaleMinQuantity,
        estoque_atual: newProduct.currentStock,
        estoque_deposito: newProduct.depotStock,
        estoque_geladeira: newProduct.storefrontStock,
        estoque_minimo: newProduct.minStock,
        tipo_embalagem: newProduct.unitType,
        local_deposito: newProduct.depotLocation,
        fornecedor: newProduct.supplier,
      });

      if (newProduct.currentStock > 0) {
        await supabase.from('movimentacoes_estoque').insert({
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          produto_id: newProduct.id,
          tipo: 'ENTRADA',
          quantidade: newProduct.currentStock,
          motivo: 'Cadastro inicial de produto',
          destino: 'Depósito / Geladeira',
        });
      }
    } catch (e) {
      console.warn('Supabase produtos insert fallback:', e);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    let updatedProduct: Product | undefined;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };
        if (updates.depotStock !== undefined || updates.storefrontStock !== undefined) {
          const depot = updates.depotStock !== undefined ? updates.depotStock : p.depotStock;
          const storefront = updates.storefrontStock !== undefined ? updates.storefrontStock : p.storefrontStock;
          updated.currentStock = depot + storefront;
        }
        updatedProduct = updated;
        return updated;
      })
    );

    if (updatedProduct) {
      try {
        await supabase
          .from('produtos')
          .update({
            codigo: (updatedProduct as Product).code,
            nome: (updatedProduct as Product).name,
            categoria: (updatedProduct as Product).category,
            preco_custo: (updatedProduct as Product).costPrice,
            preco_venda: (updatedProduct as Product).salePrice,
            preco_atacado: (updatedProduct as Product).wholesalePrice,
            qtd_min_atacado: (updatedProduct as Product).wholesaleMinQuantity,
            estoque_atual: (updatedProduct as Product).currentStock,
            estoque_deposito: (updatedProduct as Product).depotStock,
            estoque_geladeira: (updatedProduct as Product).storefrontStock,
            estoque_minimo: (updatedProduct as Product).minStock,
            tipo_embalagem: (updatedProduct as Product).unitType,
            local_deposito: (updatedProduct as Product).depotLocation,
            fornecedor: (updatedProduct as Product).supplier,
          })
          .eq('id', id);
      } catch (e) {
        console.warn('Supabase update produtos fallback:', e);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((item) => item.product.id !== id));
    try {
      await supabase.from('produtos').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete produto fallback:', e);
    }
  };

  const adjustStock = async (
    id: string,
    amount: number,
    target: 'depot' | 'storefront',
    reason?: string
  ) => {
    let newCurrentStock = 0;
    let newDepot = 0;
    let newStore = 0;
    const prod = products.find((p) => p.id === id);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (target === 'depot') {
          newDepot = Math.max(0, p.depotStock + amount);
          newStore = p.storefrontStock;
          newCurrentStock = newDepot + newStore;
          return { ...p, depotStock: newDepot, currentStock: newCurrentStock };
        } else {
          newStore = Math.max(0, p.storefrontStock + amount);
          newDepot = p.depotStock;
          newCurrentStock = newDepot + newStore;
          return { ...p, storefrontStock: newStore, currentStock: newCurrentStock };
        }
      })
    );

    // Record movement in state and Supabase movimentacoes_estoque
    const mov: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: id,
      productName: prod?.name,
      type: amount > 0 ? 'ENTRADA' : 'SAIDA',
      quantity: Math.abs(amount),
      reason: reason || (amount > 0 ? 'Entrada manual' : 'Saída manual'),
      fromLocation: target === 'depot' ? 'Fornecedor' : 'Depósito',
      toLocation: target === 'depot' ? 'Depósito Central' : 'Geladeira',
      createdAt: new Date().toISOString(),
    };
    setStockMovements((prev) => [mov, ...prev]);

    try {
      await supabase
        .from('produtos')
        .update({
          estoque_atual: newCurrentStock,
          estoque_deposito: newDepot,
          estoque_geladeira: newStore,
        })
        .eq('id', id);

      await supabase.from('movimentacoes_estoque').insert({
        id: mov.id,
        produto_id: id,
        tipo: mov.type,
        quantidade: mov.quantity,
        motivo: mov.reason,
        origem: mov.fromLocation,
        destino: mov.toLocation,
      });
    } catch (e) {
      console.warn('Supabase adjustStock fallback:', e);
    }

    if (amount > 0 && reason?.toLowerCase().includes('compra') && prod) {
      addTransaction({
        type: 'despesa',
        category: 'Fornecedor Bebidas',
        description: `Entrada estoque (${amount} un): ${prod.name}`,
        amount: amount * prod.costPrice,
        date: new Date().toISOString(),
        paymentMethod: 'transferencia',
      });
    }
  };

  const transferStock = async (
    id: string,
    amount: number,
    from: 'depot' | 'storefront',
    to: 'depot' | 'storefront'
  ) => {
    if (from === to || amount <= 0) return;
    let newDepot = 0;
    let newStore = 0;
    let newCurrent = 0;
    const prod = products.find((p) => p.id === id);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (from === 'depot' && to === 'storefront') {
          const actual = Math.min(amount, p.depotStock);
          newDepot = p.depotStock - actual;
          newStore = p.storefrontStock + actual;
        } else {
          const actual = Math.min(amount, p.storefrontStock);
          newStore = p.storefrontStock - actual;
          newDepot = p.depotStock + actual;
        }
        newCurrent = newDepot + newStore;
        return {
          ...p,
          depotStock: newDepot,
          storefrontStock: newStore,
          currentStock: newCurrent,
        };
      })
    );

    const mov: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: id,
      productName: prod?.name,
      type: 'TRANSFERENCIA',
      quantity: amount,
      reason: `Transferência de ${from === 'depot' ? 'Depósito' : 'Geladeira'} para ${to === 'depot' ? 'Depósito' : 'Geladeira'}`,
      fromLocation: from === 'depot' ? 'Depósito Central' : 'Geladeira',
      toLocation: to === 'depot' ? 'Depósito Central' : 'Geladeira',
      createdAt: new Date().toISOString(),
    };
    setStockMovements((prev) => [mov, ...prev]);

    try {
      await supabase
        .from('produtos')
        .update({
          estoque_atual: newCurrent,
          estoque_deposito: newDepot,
          estoque_geladeira: newStore,
        })
        .eq('id', id);

      await supabase.from('movimentacoes_estoque').insert({
        id: mov.id,
        produto_id: id,
        tipo: 'TRANSFERENCIA',
        quantidade: amount,
        motivo: mov.reason,
        origem: mov.fromLocation,
        destino: mov.toLocation,
      });
    } catch (e) {
      console.warn('Supabase transferStock fallback:', e);
    }
  };

  // PDV / Frente de Caixa with Supabase:
  // "Insere a venda na tabela vendas, os itens em itens_venda, registra o valor na tabela financeiro (como RECEITA) e atualiza o estoque_atual na tabela produtos."
  const createSale = async (saleInput: {
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: any;
    amountPaid: number;
    change: number;
    customerName?: string;
    customerPhone?: string;
  }): Promise<Sale> => {
    const nextSaleNumber = sales.length > 0 ? Math.max(...sales.map((s) => s.saleNumber || 1000)) + 1 : 1001;
    const saleId = `sale-${Date.now()}`;

    const newSale: Sale = {
      id: saleId,
      saleNumber: nextSaleNumber,
      timestamp: new Date().toISOString(),
      items: saleInput.items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
        unitType: i.product.unitType,
      })),
      subtotal: saleInput.subtotal,
      discount: saleInput.discount,
      total: saleInput.total,
      paymentMethod: saleInput.paymentMethod,
      amountPaid: saleInput.amountPaid,
      change: saleInput.change,
      customerName: saleInput.customerName || 'Cliente Balcão',
      customerPhone: saleInput.customerPhone,
      status: 'concluida',
    };

    // 1. Local state updates: deduct stock
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItem = saleInput.items.find((i) => i.product.id === prod.id);
        if (!cartItem) return prod;

        let needed = cartItem.quantity;
        let newStorefront = prod.storefrontStock;
        let newDepot = prod.depotStock;

        if (newStorefront >= needed) {
          newStorefront -= needed;
          needed = 0;
        } else {
          needed -= newStorefront;
          newStorefront = 0;
          newDepot = Math.max(0, newDepot - needed);
        }

        return {
          ...prod,
          storefrontStock: newStorefront,
          depotStock: newDepot,
          currentStock: newStorefront + newDepot,
        };
      })
    );

    setSales((prev) => [newSale, ...prev]);

    // Financial entry
    const tx: FinancialTransaction = {
      id: `tx-sale-${Date.now()}`,
      type: 'receita',
      category: 'Venda PDV',
      description: `Venda PDV #${nextSaleNumber} - ${newSale.customerName}`,
      amount: newSale.total,
      date: newSale.timestamp,
      paymentMethod: newSale.paymentMethod,
      relatedSaleId: newSale.id,
    };
    setTransactions((prev) => [tx, ...prev]);

    // 2. SUPABASE RPC & SYNC:
    try {
      const carrinho = saleInput.items.map((item) => ({
        produto_id: item.product.id,
        quantidade: item.quantity,
        preco_unitario: item.unitPrice,
        subtotal: item.total,
      }));

      // Chama a função SQL criada no Supabase com único comando rpc
      const { data: vendaId, error: rpcError } = await supabase.rpc('processar_venda_pdv', {
        p_valor_subtotal: saleInput.subtotal,
        p_desconto: saleInput.discount,
        p_valor_total: saleInput.total,
        p_forma_pagamento: String(saleInput.paymentMethod).toUpperCase(),
        p_operador_email: 'diegobebidas@gmail.com',
        p_itens: carrinho, // Passa o array de itens diretamente como JSON
      });

      if (rpcError) {
        console.warn('Aviso ao chamar RPC processar_venda_pdv no Supabase:', rpcError.message);
        // Fallback seguro direto nas tabelas caso a função RPC ainda não tenha sido criada no SQL editor
        await supabase.from('vendas').insert({
          id: newSale.id,
          numero_venda: newSale.saleNumber,
          subtotal: newSale.subtotal,
          desconto: newSale.discount,
          total: newSale.total,
          forma_pagamento: newSale.paymentMethod,
          valor_pago: newSale.amountPaid,
          troco: newSale.change,
          nome_cliente: newSale.customerName,
          telefone_cliente: newSale.customerPhone,
          status: 'concluida',
        });

        const itemsToInsert = newSale.items.map((it, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          venda_id: newSale.id,
          produto_id: it.productId,
          nome_produto: it.name,
          quantidade: it.quantity,
          preco_unitario: it.unitPrice,
          total: it.total,
          tipo_embalagem: it.unitType,
        }));
        await supabase.from('itens_venda').insert(itemsToInsert);

        await supabase.from('financeiro').insert({
          id: tx.id,
          tipo: 'RECEITA',
          categoria: 'Venda PDV',
          descricao: tx.description,
          valor: tx.amount,
          forma_pagamento: tx.paymentMethod,
          venda_id: newSale.id,
          data: tx.date,
        });

        for (const item of saleInput.items) {
          const p = products.find((prod) => prod.id === item.product.id);
          if (p) {
            const remaining = Math.max(0, p.currentStock - item.quantity);
            const newDepot = Math.max(0, p.depotStock - Math.max(0, item.quantity - p.storefrontStock));
            const newStore = Math.max(0, p.storefrontStock - item.quantity);

            await supabase
              .from('produtos')
              .update({
                estoque_atual: remaining,
                estoque_deposito: newDepot,
                estoque_geladeira: newStore,
              })
              .eq('id', item.product.id);

            await supabase.from('movimentacoes_estoque').insert({
              id: `mov-sale-${Date.now()}-${item.product.id}`,
              produto_id: item.product.id,
              tipo: 'SAIDA',
              quantidade: item.quantity,
              motivo: `Venda PDV #${nextSaleNumber}`,
            });
          }
        }
      } else {
        console.log('Venda concluída com sucesso via Supabase RPC! ID da Venda:', vendaId);
      }

      // Recarrega os dados do Supabase para atualizar a quantidade em tela
      await syncWithSupabase();
    } catch (e) {
      console.warn('Supabase PDV synchronization error (fallback to local):', e);
    }

    playSuccessChime(config.soundEnabled);
    clearCart();

    return newSale;
  };

  const cancelSale = async (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale || sale.status === 'cancelada') return;

    // Restore stock
    setProducts((prev) =>
      prev.map((p) => {
        const item = sale.items.find((i) => i.productId === p.id);
        if (!item) return p;
        return {
          ...p,
          depotStock: p.depotStock + item.quantity,
          currentStock: p.currentStock + item.quantity,
        };
      })
    );

    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, status: 'cancelada' } : s))
    );
    setTransactions((prev) => prev.filter((t) => t.relatedSaleId !== saleId));

    try {
      await supabase.from('vendas').update({ status: 'cancelada' }).eq('id', saleId);
      await supabase.from('financeiro').delete().eq('venda_id', saleId);
    } catch (e) {
      console.warn('Supabase cancelSale fallback:', e);
    }
  };

  // Financial Operations with Supabase
  const addTransaction = async (tx: Omit<FinancialTransaction, 'id'>) => {
    const newTx: FinancialTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    try {
      await supabase.from('financeiro').insert({
        id: newTx.id,
        tipo: newTx.type === 'receita' ? 'RECEITA' : 'DESPESA',
        categoria: newTx.category,
        descricao: newTx.description,
        valor: newTx.amount,
        forma_pagamento: newTx.paymentMethod,
        data: newTx.date,
      });
    } catch (e) {
      console.warn('Supabase addTransaction fallback:', e);
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await supabase.from('financeiro').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteTransaction fallback:', e);
    }
  };

  // Config with Supabase
  const updateConfig = async (updates: Partial<StoreConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));

    try {
      await supabase.from('configuracoes').upsert({
        id: 'config_principal',
        nome_loja: updates.storeName ?? config.storeName,
        subtitulo: updates.subtitle ?? config.subtitle,
        cnpj: updates.cnpj ?? config.cnpj,
        telefone: updates.phone ?? config.phone,
        endereco: updates.address ?? config.address,
        chave_pix: updates.pixKey ?? config.pixKey,
        mensagem_cupom: updates.receiptFooterMessage ?? config.receiptFooterMessage,
        som_habilitado: updates.soundEnabled !== undefined ? updates.soundEnabled : config.soundEnabled,
      });
    } catch (e) {
      console.warn('Supabase updateConfig fallback:', e);
    }
  };

  // Direct Stock / Price quick updates
  const updateProductStockDirect = async (
    id: string,
    depotStock: number,
    storefrontStock: number,
    minStock?: number
  ) => {
    const depot = Math.max(0, Number(depotStock) || 0);
    const store = Math.max(0, Number(storefrontStock) || 0);
    const current = depot + store;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const min = minStock !== undefined ? Math.max(0, Number(minStock) || 0) : p.minStock;
        return {
          ...p,
          depotStock: depot,
          storefrontStock: store,
          currentStock: current,
          minStock: min,
        };
      })
    );

    try {
      await supabase
        .from('produtos')
        .update({
          estoque_atual: current,
          estoque_deposito: depot,
          estoque_geladeira: store,
          ...(minStock !== undefined ? { estoque_minimo: minStock } : {}),
        })
        .eq('id', id);
    } catch (e) {
      console.warn('Supabase direct stock update fallback:', e);
    }
  };

  const updateProductPriceDirect = async (
    id: string,
    costPrice: number,
    salePrice: number,
    wholesalePrice?: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          costPrice: Math.max(0, Number(costPrice) || 0),
          salePrice: Math.max(0, Number(salePrice) || 0),
          wholesalePrice: wholesalePrice !== undefined ? Math.max(0, Number(wholesalePrice) || 0) : p.wholesalePrice,
        };
      })
    );

    try {
      await supabase
        .from('produtos')
        .update({
          preco_custo: Math.max(0, Number(costPrice) || 0),
          preco_venda: Math.max(0, Number(salePrice) || 0),
          ...(wholesalePrice !== undefined ? { preco_atacado: wholesalePrice } : {}),
        })
        .eq('id', id);
    } catch (e) {
      console.warn('Supabase direct price update fallback:', e);
    }
  };

  const setOpeningCash = async (amount: number, description = 'Aporte Inicial de Caixa') => {
    const val = Number(amount) || 0;
    if (val <= 0) return;
    await addTransaction({
      type: 'receita',
      category: 'Outros',
      description,
      amount: val,
      date: new Date().toISOString(),
      paymentMethod: 'dinheiro',
    });
  };

  const zeroAllData = () => {
    setSales([]);
    setTransactions([]);
    setCart([]);
    setStockMovements([]);
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        currentStock: 0,
        depotStock: 0,
        storefrontStock: 0,
        minStock: 0,
      }))
    );
  };

  const resetToDefaultData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSales([]);
    setTransactions([]);
    setCart([]);
    setConfig(INITIAL_CONFIG);
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        const isWholesale = product.wholesalePrice > 0 && newQty >= product.wholesaleMinQuantity;
        const unitPrice = isWholesale ? product.wholesalePrice : product.salePrice;
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQty,
                unitPrice,
                isWholesaleApplied: isWholesale,
                total: newQty * unitPrice,
              }
            : item
        );
      } else {
        const isWholesale = product.wholesalePrice > 0 && quantity >= product.wholesaleMinQuantity;
        const unitPrice = isWholesale ? product.wholesalePrice : product.salePrice;
        return [
          ...prev,
          {
            product,
            quantity,
            unitPrice,
            isWholesaleApplied: isWholesale,
            total: quantity * unitPrice,
          },
        ];
      }
    });
    playBeep(config.soundEnabled);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const isWholesale =
          item.product.wholesalePrice > 0 && quantity >= item.product.wholesaleMinQuantity;
        const unitPrice = isWholesale ? item.product.wholesalePrice : item.product.salePrice;
        return {
          ...item,
          quantity,
          unitPrice,
          isWholesaleApplied: isWholesale,
          total: quantity * unitPrice,
        };
      })
    );
  };

  const clearCart = () => setCart([]);

  const exportDataBackup = (): string => {
    const backup = {
      version: '2.0-supabase',
      exportedAt: new Date().toISOString(),
      products,
      sales,
      transactions,
      stockMovements,
      config,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDataBackup = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.products)) setProducts(data.products);
      if (Array.isArray(data.sales)) setSales(data.sales);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (data.config) setConfig(data.config);
      return true;
    } catch (e) {
      console.error('Falha ao importar backup', e);
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        isAuthenticated,
        activeTab,
        setActiveTab,
        isLoginModalOpen,
        setIsLoginModalOpen,
        login,
        logout,
        isSupabaseConnected,
        supabaseStatusMsg,
        stockMovements,
        syncWithSupabase,
        products,
        sales,
        transactions,
        config,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        transferStock,
        createSale,
        cancelSale,
        addTransaction,
        deleteTransaction,
        updateConfig,
        resetToDefaultData,
        zeroAllData,
        updateProductStockDirect,
        updateProductPriceDirect,
        setOpeningCash,
        exportDataBackup,
        importDataBackup,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
