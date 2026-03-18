import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSupabaseFunilAdmin } from "@/lib/supabaseFunilAdmin";
import type { MarketingCreative, MarketingFeedback, MarketingProject, MarketingTask } from "@/lib/types";

const WORKSPACE_ROOT = "/root/.openclaw/workspace";
const PROJECT_SLUG = "nexus-instagram-marketing";

function creativeStatusWeight(status: string) {
  switch (status) {
    case "pendente":
      return 0;
    case "reprovado":
      return 1;
    case "aprovado":
      return 2;
    default:
      return 3;
  }
}

export async function fetchMarketingOverview() {
  const { client: funil, error: funilErr } = getSupabaseFunilAdmin();

  if (!funil) throw new Error(funilErr || "Supabase funil indisponível");

  const { data: project, error: projectError } = await funil
    .from("marketing_projects")
    .select("*")
    .eq("slug", PROJECT_SLUG)
    .single();

  if (projectError) throw new Error(projectError.message);

  const [tasksRes, creativesRes] = await Promise.all([
    funil.from("marketing_tasks").select("*").eq("project_id", project.id).order("sort_order", { ascending: true }).order("id", { ascending: true }),
    funil.from("marketing_creatives").select("*").eq("project_id", project.id).order("delivery_date", { ascending: false }).order("created_at", { ascending: false }),
  ]);

  if (tasksRes.error) throw new Error(tasksRes.error.message);
  if (creativesRes.error) throw new Error(creativesRes.error.message);

  const creatives = ((creativesRes.data ?? []) as MarketingCreative[]).sort((a, b) => {
    const w = creativeStatusWeight(a.approval_status) - creativeStatusWeight(b.approval_status);
    if (w !== 0) return w;
    return (b.delivery_date || "").localeCompare(a.delivery_date || "");
  });

  return {
    project: project as MarketingProject,
    tasks: (tasksRes.data ?? []) as MarketingTask[],
    creatives,
    summary: {
      totalTasks: (tasksRes.data ?? []).length,
      totalCreatives: creatives.length,
      pendentes: creatives.filter((c) => c.approval_status === "pendente").length,
      aprovados: creatives.filter((c) => c.approval_status === "aprovado").length,
      reprovados: creatives.filter((c) => c.approval_status === "reprovado").length,
      productCount: creatives.filter((c) => c.theme_mode === "product").length,
      brandCount: creatives.filter((c) => c.theme_mode === "brand").length,
      videosCount: creatives.filter((c) => ["reels", "video_render", "reels_script"].includes(c.creative_type)).length,
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchCreativeDetail(id: string) {
  const { client: funil, error } = getSupabaseFunilAdmin();
  if (!funil) throw new Error(error || "Supabase funil indisponível");

  const [{ data: creative, error: creativeError }, { data: feedback, error: feedbackError }] = await Promise.all([
    funil.from("marketing_creatives").select("*").eq("id", id).single(),
    funil.from("marketing_feedback").select("*").eq("creative_id", id).order("created_at", { ascending: false }),
  ]);

  if (creativeError) throw new Error(creativeError.message);
  if (feedbackError) throw new Error(feedbackError.message);

  let sourceContent: string | null = null;
  const sourcePath = creative.source_path ? join(WORKSPACE_ROOT, creative.source_path) : null;
  if (sourcePath) {
    try {
      sourceContent = await readFile(sourcePath, "utf-8");
    } catch {
      sourceContent = null;
    }
  }

  return {
    creative: creative as MarketingCreative,
    feedback: (feedback ?? []) as MarketingFeedback[],
    sourceContent,
  };
}

export async function reviewCreative(id: string, status: "aprovado" | "reprovado", feedback: string | null) {
  const { client: funil, error } = getSupabaseFunilAdmin();
  if (!funil) throw new Error(error || "Supabase funil indisponível");

  const { data: updated, error: updateError } = await funil
    .from("marketing_creatives")
    .update({ approval_status: status, feedback_latest: feedback })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) throw new Error(updateError.message);

  const { error: feedbackError } = await funil
    .from("marketing_feedback")
    .insert({ creative_id: id, reviewer: "Diego", status, feedback });

  if (feedbackError) throw new Error(feedbackError.message);

  return updated as MarketingCreative;
}

export async function saveCreativeCuration(
  id: string,
  payload: {
    messageStrength?: string;
    clarity?: string;
    hook?: string;
    visual?: string;
    objective?: string;
    action?: string;
    notes?: string;
  },
) {
  const { client: funil, error } = getSupabaseFunilAdmin();
  if (!funil) throw new Error(error || "Supabase funil indisponível");

  const lines = [
    "Curadoria Jarvis",
    `- Mensagem: ${payload.messageStrength || "-"}`,
    `- Clareza: ${payload.clarity || "-"}`,
    `- Gancho: ${payload.hook || "-"}`,
    `- Visual: ${payload.visual || "-"}`,
    `- Objetivo: ${payload.objective || "-"}`,
    `- Ação sugerida: ${payload.action || "-"}`,
  ];

  if (payload.notes?.trim()) {
    lines.push(`- Observações: ${payload.notes.trim()}`);
  }

  const feedback = lines.join("\n");

  const { data, error: insertError } = await funil
    .from("marketing_feedback")
    .insert({ creative_id: id, reviewer: "Jarvis", status: "curadoria", feedback })
    .select("*")
    .single();

  if (insertError) throw new Error(insertError.message);

  return data as MarketingFeedback;
}
