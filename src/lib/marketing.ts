import { getSupabaseFunilAdmin } from "@/lib/supabaseFunilAdmin";
import { getSupabaseJarvisAdmin } from "@/lib/supabaseJarvisAdmin";

export type MarketingDelivery = {
  id: number;
  tema: string;
  tipo: string;
  canal: string;
  status: string;
  resumo: string | null;
  cron_entrega: string | null;
  prazo_aprovacao: string | null;
  aprovado_em: string | null;
  rejeitado_em: string | null;
  postado_em: string | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketingAsset = {
  id: number;
  delivery_id: number;
  etapa: string;
  titulo: string;
  conteudo: string | null;
  preview_url: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MarketingPlanning = {
  id: number;
  titulo: string;
  status: string;
  o_que_ja_tem: string | null;
  o_que_falta: string | null;
  proximo_passo: string | null;
  created_at: string;
  updated_at: string;
};

export type PendingTask = {
  id: number;
  titulo: string;
  status: string;
  atribuido_a: string | null;
  atualizado_em: string;
};

export async function fetchOverview() {
  const { client: funil, error: funilErr } = getSupabaseFunilAdmin();
  const { client: jarvis, error: jarvisErr } = getSupabaseJarvisAdmin();
  if (!funil) throw new Error(funilErr || "Supabase funil indisponível");
  if (!jarvis) throw new Error(jarvisErr || "Supabase Jarvis indisponível");

  const [{ data: deliveries, error: deliveriesErr }, { data: planning, error: planningErr }, { data: tasks, error: tasksErr }] = await Promise.all([
    funil.from("marketing_deliveries").select("*").order("id", { ascending: false }).limit(20),
    funil.from("marketing_planning").select("*").order("id", { ascending: false }).limit(5),
    jarvis.from("tarefas").select("id,titulo,status,atribuido_a,atualizado_em").eq("arquivada", false).eq("status", "Pendente").order("id", { ascending: false }).limit(20),
  ]);

  if (deliveriesErr) throw new Error(deliveriesErr.message);
  if (planningErr) throw new Error(planningErr.message);
  if (tasksErr) throw new Error(tasksErr.message);

  const rows = (deliveries ?? []) as MarketingDelivery[];
  return {
    kpis: {
      total: rows.length,
      review: rows.filter((r) => r.status === "review").length,
      approved: rows.filter((r) => r.status === "approved").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
      posted: rows.filter((r) => r.status === "posted").length,
    },
    deliveries: rows,
    planning: (planning ?? []) as MarketingPlanning[],
    tasks: (tasks ?? []) as PendingTask[],
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchDelivery(id: number) {
  const { client: funil, error } = getSupabaseFunilAdmin();
  if (!funil) throw new Error(error || "Supabase funil indisponível");

  const [{ data: delivery, error: deliveryErr }, { data: assets, error: assetsErr }] = await Promise.all([
    funil.from("marketing_deliveries").select("*").eq("id", id).single(),
    funil.from("marketing_assets").select("*").eq("delivery_id", id).order("id", { ascending: true }),
  ]);

  if (deliveryErr) throw new Error(deliveryErr.message);
  if (assetsErr) throw new Error(assetsErr.message);

  return {
    delivery: delivery as MarketingDelivery,
    assets: (assets ?? []) as MarketingAsset[],
  };
}

export async function updateDeliveryFeedback(id: number, action: "approved" | "rejected", feedback?: string) {
  const { client: funil, error } = getSupabaseFunilAdmin();
  if (!funil) throw new Error(error || "Supabase funil indisponível");

  const patch: Record<string, unknown> = {
    status: action,
    feedback: feedback || null,
  };

  if (action === "approved") patch.aprovado_em = new Date().toISOString();
  if (action === "rejected") patch.rejeitado_em = new Date().toISOString();

  const { data, error: updateErr } = await funil
    .from("marketing_deliveries")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (updateErr) throw new Error(updateErr.message);
  return data as MarketingDelivery;
}
