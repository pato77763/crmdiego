import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://jxsavpadnkktqcrvvngq.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4c2F2cGFkbmtrdHFjcnZ2bmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MTQ3MzEsImV4cCI6MjEwNjQ5MDczMX0.UWeepyDiS2Ze9Kl7MyJlCG9E44jdxmy3kSGdoPMTSzM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * SQL Schema Helper for creating tables in Supabase SQL Editor if needed
 */
export const SUPABASE_SQL_SETUP = `-- Script SQL para criar as tabelas no Supabase (Diego Bebidas CRM)
-- Cole no SQL Editor do seu projeto Supabase: https://supabase.com/dashboard/project/jxsavpadnkktqcrvvngq/sql

-- 1. Tabela de Produtos
create table if not exists public.produtos (
  id text primary key,
  codigo text not null,
  nome text not null,
  categoria text not null,
  preco_custo numeric default 0,
  preco_venda numeric default 0,
  preco_atacado numeric default 0,
  qtd_min_atacado integer default 12,
  estoque_atual integer default 0,
  estoque_deposito integer default 0,
  estoque_geladeira integer default 0,
  estoque_minimo integer default 0,
  tipo_embalagem text default 'Lata 350ml',
  local_deposito text default 'Depósito Central',
  fornecedor text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Tabela de Movimentações de Estoque
create table if not exists public.movimentacoes_estoque (
  id text primary key,
  produto_id text references public.produtos(id) on delete cascade,
  tipo text not null, -- 'ENTRADA', 'SAIDA', 'TRANSFERENCIA'
  quantidade integer not null,
  motivo text,
  origem text,
  destino text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Tabela de Vendas
create table if not exists public.vendas (
  id text primary key,
  numero_venda integer,
  subtotal numeric not null,
  desconto numeric default 0,
  total numeric not null,
  forma_pagamento text not null,
  valor_pago numeric,
  troco numeric default 0,
  nome_cliente text,
  telefone_cliente text,
  status text default 'concluida',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Tabela de Itens da Venda
create table if not exists public.itens_venda (
  id text primary key,
  venda_id text references public.vendas(id) on delete cascade,
  produto_id text,
  nome_produto text not null,
  quantidade integer not null,
  preco_unitario numeric not null,
  total numeric not null,
  tipo_embalagem text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Tabela do Financeiro (Fluxo de Caixa)
create table if not exists public.financeiro (
  id text primary key,
  tipo text not null, -- 'RECEITA', 'DESPESA'
  categoria text not null,
  descricao text not null,
  valor numeric not null,
  forma_pagamento text not null,
  venda_id text,
  data timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Tabela de Configurações
create table if not exists public.configuracoes (
  id text primary key default 'config_principal',
  nome_loja text default 'Diego Bebidas',
  subtitulo text default 'Distribuidora, Depósito & Conveniência de Bebidas',
  cnpj text default '38.924.112/0001-45',
  telefone text default '(11) 98452-9011',
  endereco text default 'Av. das Nações, 1420 - Centro Comercial de Bebidas',
  chave_pix text default 'diegobebidas@gmail.com',
  mensagem_cupom text default 'Obrigado pela preferência! Bebidas geladas no precinho é na Diego Bebidas.',
  som_habilitado boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS e permitir acesso público/anon para desenvolvimento
alter table public.produtos enable row level security;
alter table public.movimentacoes_estoque enable row level security;
alter table public.vendas enable row level security;
alter table public.itens_venda enable row level security;
alter table public.financeiro enable row level security;
alter table public.configuracoes enable row level security;

create policy "Acesso livre produtos" on public.produtos for all using (true) with check (true);
create policy "Acesso livre movimentacoes" on public.movimentacoes_estoque for all using (true) with check (true);
create policy "Acesso livre vendas" on public.vendas for all using (true) with check (true);
create policy "Acesso livre itens_venda" on public.itens_venda for all using (true) with check (true);
-- 7. Função RPC: processar_venda_pdv
create or replace function public.processar_venda_pdv(
  p_valor_subtotal numeric,
  p_desconto numeric,
  p_valor_total numeric,
  p_forma_pagamento text,
  p_operador_email text,
  p_itens jsonb
)
returns text
language plpgsql
security definer
as $$
declare
  v_venda_id text;
  v_item jsonb;
  v_prod_id text;
  v_qtd integer;
  v_preco numeric;
  v_subtotal numeric;
  v_nome_prod text;
  v_embalagem text;
begin
  -- Gerar ID da venda
  v_venda_id := 'venda-' || floor(extract(epoch from now()) * 1000)::text;

  -- 1. Inserir na tabela vendas
  insert into public.vendas (
    id,
    subtotal,
    desconto,
    total,
    forma_pagamento,
    nome_cliente,
    status,
    created_at
  ) values (
    v_venda_id,
    p_valor_subtotal,
    coalesce(p_desconto, 0),
    p_valor_total,
    p_forma_pagamento,
    'Cliente PDV (' || p_operador_email || ')',
    'concluida',
    now()
  );

  -- 2. Processar itens do carrinho
  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    v_prod_id := v_item->>'produto_id';
    v_qtd := (v_item->>'quantidade')::integer;
    v_preco := (v_item->>'preco_unitario')::numeric;
    v_subtotal := (v_item->>'subtotal')::numeric;

    -- Obter dados do produto
    select nome, tipo_embalagem into v_nome_prod, v_embalagem
    from public.produtos where id = v_prod_id;

    if v_nome_prod is null then
      v_nome_prod := 'Produto ' || v_prod_id;
    end if;

    -- Inserir em itens_venda
    insert into public.itens_venda (
      id,
      venda_id,
      produto_id,
      nome_produto,
      quantidade,
      preco_unitario,
      total,
      tipo_embalagem,
      created_at
    ) values (
      'item-' || floor(extract(epoch from now()) * 1000)::text || '-' || substr(md5(random()::text), 1, 6),
      v_venda_id,
      v_prod_id,
      v_nome_prod,
      v_qtd,
      v_preco,
      v_subtotal,
      v_embalagem,
      now()
    );

    -- Atualizar estoque_atual do produto
    update public.produtos
    set estoque_atual = greatest(0, coalesce(estoque_atual, 0) - v_qtd),
        estoque_geladeira = greatest(0, coalesce(estoque_geladeira, 0) - v_qtd)
    where id = v_prod_id;

    -- Registrar saída em movimentacoes_estoque
    insert into public.movimentacoes_estoque (
      id,
      produto_id,
      tipo,
      quantidade,
      motivo,
      created_at
    ) values (
      'mov-' || floor(extract(epoch from now()) * 1000)::text || '-' || substr(md5(random()::text), 1, 6),
      v_prod_id,
      'SAIDA',
      v_qtd,
      'Venda PDV ' || v_venda_id,
      now()
    );
  end loop;

  -- 3. Registrar valor na tabela financeiro (como RECEITA)
  insert into public.financeiro (
    id,
    tipo,
    categoria,
    descricao,
    valor,
    forma_pagamento,
    venda_id,
    data,
    created_at
  ) values (
    'fin-' || floor(extract(epoch from now()) * 1000)::text,
    'RECEITA',
    'Venda PDV',
    'Venda PDV ' || v_venda_id || ' (' || p_forma_pagamento || ')',
    p_valor_total,
    p_forma_pagamento,
    v_venda_id,
    now(),
    now()
  );

  return v_venda_id;
end;
$$;

grant execute on function public.processar_venda_pdv(numeric, numeric, numeric, text, text, jsonb) to anon, authenticated, service_role;
`;
