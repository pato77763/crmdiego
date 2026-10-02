import { ProductCategory, PaymentMethod } from '../types';

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateBR(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateOnlyBR(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cervejas: 'Cervejas',
  destilados: 'Destilados & Whiskies',
  refrigerantes: 'Refrigerantes',
  energeticos: 'Energéticos',
  vinhos: 'Vinhos & Espumantes',
  gelo_carvao: 'Gelo & Carvão',
  aguas_sucos: 'Águas & Sucos',
  petiscos: 'Petiscos & Bomboniere',
  outros: 'Outros Itens',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX Instantâneo',
  dinheiro: 'Dinheiro em Espécie',
  cartao_debito: 'Cartão de Débito',
  cartao_credito: 'Cartão de Crédito',
  fiado: 'Fiado / Anotar na Conta',
};

export function generateBarcode(): string {
  // Generate valid 13-digit EAN style
  const prefix = '789'; // Brazil EAN prefix
  const middle = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `${prefix}${middle}`.slice(0, 13);
}
