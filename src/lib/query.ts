import { supabaseAdmin } from "./supabaseAdmin";
import type { CadastroRow, EstablishmentProfileRow, PaymentSessionRow, SubscriptionRow } from "./types";

export type SessionFilters = {
  from?: string | null;
  to?: string | null;
  plan?: string | null;
  q?: string | null;
};

async function fetchSubscriptions(): Promise<SubscriptionRow[]> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id,customer_email,status,product_id,product_name,provider,last_event_trigger,meta,updated_at,created_at")
    .order("updated_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []) as SubscriptionRow[];
}

async function fetchCadastros(): Promise<CadastroRow[]> {
  const { data, error } = await supabaseAdmin
    .from("cadastros_estabelecimento")
    .select("id,email,nome_estabelecimento,nome_proprietario,telefone,endereco,plano_atual,status,acesso_ate,created_at,user_id")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []) as CadastroRow[];
}

async function fetchPaymentSessions(): Promise<PaymentSessionRow[]> {
  const { data, error } = await supabaseAdmin
    .from("payment_sessions")
    .select(
      "id,user_email,nome_estabelecimento,plan_id,status,status_pagamento,ultimo_evento,data_ultimo_evento,created_at,paid_at,telefone,nome_proprietario,endereco,amount_cents,provider,payload_raw",
    )
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentSessionRow[];
}

function normalizeEmail(v: string | null | undefined): string {
  return String(v ?? "").trim().toLowerCase();
}

function normalizeText(v: string | null | undefined): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    // remove accents/diacritics
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    // make separators searchable
    .replace(/[\s_-]+/g, " ");
}

export async function fetchProfiles(filters: SessionFilters = {}): Promise<EstablishmentProfileRow[]> {
  const [subs, cadastros, sessions] = await Promise.all([fetchSubscriptions(), fetchCadastros(), fetchPaymentSessions()]);

  const cadastroByEmail = new Map<string, CadastroRow>();
  for (const c of cadastros) {
    const email = normalizeEmail(c.email);
    if (!email) continue;
    // keep first (most recent due to ordering)
    if (!cadastroByEmail.has(email)) cadastroByEmail.set(email, c);
  }

  // Latest session per email
  const lastSessionByEmail = new Map<string, PaymentSessionRow>();
  for (const s of sessions) {
    const email = normalizeEmail(s.user_email);
    if (!email) continue;
    if (!lastSessionByEmail.has(email)) lastSessionByEmail.set(email, s);
  }

  let profiles: EstablishmentProfileRow[] = subs
    .map((sub) => {
      const email = normalizeEmail(sub.customer_email);
      const cadastro = email ? cadastroByEmail.get(email) ?? null : null;
      const lastPaymentSession = email ? lastSessionByEmail.get(email) ?? null : null;

      const planId = (sub.product_id || cadastro?.plano_atual || null) as string | null;

      return {
        id: email || sub.id,
        email: email || "-",
        subscription: sub,
        cadastro,
        lastPaymentSession,
        plan_id: planId,
        status: sub.status,
        ultimo_evento: lastPaymentSession?.ultimo_evento ?? sub.last_event_trigger ?? null,
        data_ultimo_evento: lastPaymentSession?.data_ultimo_evento ?? sub.updated_at ?? null,
        amount_cents: lastPaymentSession?.amount_cents ?? null,
      };
    })
    .filter((p) => p.email !== "-");

  // Filters
  if (filters.plan && filters.plan !== "all") {
    const want = String(filters.plan).toLowerCase();
    profiles = profiles.filter((p) => String(p.plan_id ?? "").toLowerCase() === want);
  }

  if (filters.q) {
    const q = normalizeText(filters.q);
    if (q) {
      profiles = profiles.filter((p) => {
        const c = p.cadastro;
        return (
          normalizeText(p.email).includes(q) ||
          normalizeText(c?.nome_estabelecimento).includes(q) ||
          normalizeText(c?.nome_proprietario).includes(q)
        );
      });
    }
  }

  // Date filter: apply on subscription.updated_at (or created_at as fallback)
  if (filters.from) {
    profiles = profiles.filter((p) => {
      const t = p.subscription?.updated_at ?? p.subscription?.created_at;
      return t ? t >= filters.from! : false;
    });
  }
  if (filters.to) {
    profiles = profiles.filter((p) => {
      const t = p.subscription?.updated_at ?? p.subscription?.created_at;
      return t ? t <= filters.to! : false;
    });
  }

  return profiles;
}

export async function fetchProfileByEmail(email: string): Promise<EstablishmentProfileRow | null> {
  const want = normalizeEmail(email);
  if (!want) return null;
  const rows = await fetchProfiles();
  return rows.find((r) => normalizeEmail(r.email) === want) ?? null;
}

export async function fetchTimelineByEmail(email: string): Promise<PaymentSessionRow[]> {
  const want = normalizeEmail(email);
  if (!want) return [];

  const { data, error } = await supabaseAdmin
    .from("payment_sessions")
    .select(
      "id,user_email,nome_estabelecimento,plan_id,status,status_pagamento,ultimo_evento,data_ultimo_evento,created_at,paid_at,telefone,nome_proprietario,endereco,amount_cents,provider,payload_raw",
    )
    .eq("user_email", want)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentSessionRow[];
}
