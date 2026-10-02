export type ProductCategory =
  | 'cervejas'
  | 'destilados'
  | 'refrigerantes'
  | 'energeticos'
  | 'vinhos'
  | 'gelo_carvao'
  | 'aguas_sucos'
  | 'petiscos'
  | 'outros';

export interface Product {
  id: string;
  code: string; // Código de barras ou SKU
  name: string;
  category: ProductCategory;
  costPrice: number;
  salePrice: number;
  wholesalePrice: number; // Preço fardo / atacado
  wholesaleMinQuantity: number;
  currentStock: number; // Estoque total
  depotStock: number; // No depósito principal
  storefrontStock: number; // Na área de venda / geladeiras
  minStock: number; // Alerta de reposição
  unitType: string;
  depotLocation: string; // Ex: Corredor A, Câmara Fria, Palete 3
  supplier?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  type: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA';
  quantity: number;
  reason?: string;
  fromLocation?: string;
  toLocation?: string;
  createdAt: string;
}

export type PaymentMethod =
  | 'pix'
  | 'dinheiro'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'fiado';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  isWholesaleApplied: boolean;
  total: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unitType: string;
}

export interface Sale {
  id: string;
  saleNumber: number;
  timestamp: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  customerName?: string;
  customerPhone?: string;
  status: 'concluida' | 'cancelada';
}

export type FinancialCategory =
  | 'Venda PDV'
  | 'Fornecedor Bebidas'
  | 'Energia & Refrigeração'
  | 'Aluguel do Ponto'
  | 'Equipe & Funcionários'
  | 'Frete & Logística'
  | 'Manutenção'
  | 'Impostos & Taxas'
  | 'Outros';

export interface FinancialTransaction {
  id: string;
  type: 'receita' | 'despesa';
  category: FinancialCategory | string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod | 'transferencia' | 'boleto';
  relatedSaleId?: string;
}

export interface StoreConfig {
  storeName: string;
  subtitle: string;
  cnpj: string;
  phone: string;
  address: string;
  soundEnabled: boolean;
  autoPrintReceipt: boolean;
  maxDiscountPercent: number;
  pixKey: string;
  receiptFooterMessage: string;
}

export type AppTab =
  | 'deposito'
  | 'dashboard'
  | 'pdv'
  | 'produtos'
  | 'financeiro'
  | 'configuracoes';
