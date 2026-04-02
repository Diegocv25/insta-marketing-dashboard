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

export type MarketingCalendarStrategy = {
  niche_or_brand?: string | null;
  angle?: string | null;
  theme_mode?: string | null;
  caption?: string | null;
  hashtags?: string[];
  story_1_hashtags?: string[];
  story_2_hashtags?: string[];
  story_3_hashtags?: string[];
  slides?: number | null;
  structure?: string | null;
  story_1_focus?: string | null;
  story_2_focus?: string | null;
  story_3_focus?: string | null;
};

export type MarketingCalendarDay = {
  day: string;
  publish: {
    feed: {
      format?: string | null;
      time?: string | null;
      strategy?: MarketingCalendarStrategy | null;
    } | null;
    stories: {
      count?: number;
      times?: string[];
      strategy?: MarketingCalendarStrategy | null;
    } | null;
  };
};

export type MarketingCalendar = {
  timezone: string;
  create_at?: string;
  review_window?: Record<string, unknown>;
  post_windows?: {
    feed_primary?: string;
    feed_secondary_test?: string;
    stories_default?: string[];
  };
  rules?: Record<string, unknown>;
  week_plan: MarketingCalendarDay[];
};

export type MarketingDailyOverview = {
  date: string;
  weekday: string;
  timezone: string;
  feed: {
    required: boolean;
    format: string | null;
    label: string;
    time: string | null;
    approvedCreativeId: string | null;
    approvedStatus: string | null;
  };
  stories: {
    requiredCount: number;
    approvedCount: number;
    times: string[];
  };
  manifestStatus: string;
  manifest: Record<string, unknown> | null;
};

export type MarketingResearchItem = {
  slot: "feed" | "story_1" | "story_2" | "story_3";
  time: string | null;
  format: string | null;
  topic: string | null;
  researchBase: string;
  hashtags?: string[];
};

export type MarketingResearchPlan = {
  projectSlug: string;
  targetDate: string;
  targetWeekday: string;
  timezone: string;
  createAt: string | null;
  items: MarketingResearchItem[];
  instructions: string[];
};

export type MarketingHashtagSlot = {
  day: string;
  slot: "feed" | "story_1" | "story_2" | "story_3";
  topic: string | null;
  hashtags: string[];
};

export type MarketingHashtagWeekPlan = {
  projectSlug: string;
  timezone: string;
  updatedAt: string;
  slots: MarketingHashtagSlot[];
};
