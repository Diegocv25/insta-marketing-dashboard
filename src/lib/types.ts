export type SubscriptionRow = {
  id: string;
  customer_email: string | null;
  status: string | null;
  product_id: string | null;
  product_name: string | null;
  provider: string | null;
  last_event_trigger: string | null;
  meta: Record<string, unknown> | null;
  updated_at: string | null;
  created_at: string | null;
};

export type CadastroRow = {
  id: string;
  email: string | null;
  nome_estabelecimento: string | null;
  nome_proprietario: string | null;
  telefone: string | null;
  endereco: string | null;
  plano_atual: string | null;
  status: string | null;
  acesso_ate: string | null;
  created_at: string | null;
  user_id: string | null;
};

// Payment session timeline is optional (used only as complement)
export type PaymentSessionRow = {
  id: string;
  user_email: string | null;
  nome_estabelecimento: string | null;
  plan_id: string | null;
  status: string | null;
  status_pagamento: string | null;
  ultimo_evento: string | null;
  data_ultimo_evento: string | null;
  created_at: string | null;
  paid_at: string | null;
  telefone: string | null;
  nome_proprietario: string | null;
  endereco: string | null;
  amount_cents: number | null;
  provider: string | null;
  payload_raw: Record<string, unknown> | null;
};

// Profile row used by the dashboard (subscriptions + cadastro + optional timeline summary)
export type EstablishmentProfileRow = {
  id: string; // we use email as stable id
  email: string;
  subscription: SubscriptionRow | null;
  cadastro: CadastroRow | null;
  lastPaymentSession: PaymentSessionRow | null;
  // computed/mapped fields (for list convenience)
  plan_id: string | null;
  status: string | null;
  ultimo_evento: string | null;
  data_ultimo_evento: string | null;
  amount_cents: number | null;
};

export type NormalizedBillingStatus = "ativo" | "atrasado" | "reembolsado" | "aprovado" | "pendente" | "desconhecido";
