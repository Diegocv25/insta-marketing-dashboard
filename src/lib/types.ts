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

export type EstablishmentProfileRow = {
  id: string;
  email: string;
  subscription: SubscriptionRow | null;
  cadastro: CadastroRow | null;
  lastPaymentSession: PaymentSessionRow | null;
  plan_id: string | null;
  status: string | null;
  ultimo_evento: string | null;
  data_ultimo_evento: string | null;
  amount_cents: number | null;
};

export type NormalizedBillingStatus = "ativo" | "atrasado" | "reembolsado" | "aprovado" | "pendente" | "desconhecido";

export type MarketingProject = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  delivery_timezone: string | null;
  delivery_hour: string | null;
  review_hour: string | null;
  auto_post: boolean | null;
  created_at: string;
  updated_at: string;
};

export type MarketingTask = {
  id: number;
  project_id: string;
  title: string;
  status: string;
  details: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type MarketingCreative = {
  id: string;
  project_id: string;
  channel: string;
  creative_type: string;
  theme_mode: "product" | "brand" | string;
  pillar: string | null;
  title: string;
  hook: string | null;
  caption: string | null;
  cta: string | null;
  approval_status: "pendente" | "aprovado" | "reprovado" | string;
  asset_status: string;
  delivery_date: string | null;
  due_at: string | null;
  preview_path: string | null;
  preview_url: string | null;
  source_path: string | null;
  notes: string | null;
  feedback_latest: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketingFeedback = {
  id: number;
  creative_id: string;
  reviewer: string;
  status: string;
  feedback: string | null;
  created_at: string;
};
