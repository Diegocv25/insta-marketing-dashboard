import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getSupabaseFunilAdmin } from "@/lib/supabaseFunilAdmin";
import type { MarketingCalendar, MarketingCalendarDay, MarketingCreative, MarketingDailyOverview, MarketingFeedback, MarketingProject } from "@/lib/types";

const WORKSPACE_ROOT = "/root/.openclaw/workspace";
const PROJECT_SLUG = "nexus-instagram-marketing";
const CALENDAR_PATH = join(WORKSPACE_ROOT, "marketing", "calendar-weekly.json");
const MANIFEST_DIR = join(WORKSPACE_ROOT, "marketing", "daily-output");

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

function formatLabel(format: string | null) {
  const map: Record<string, string> = {
    carousel: "Carrossel",
    reels: "Reels",
    post: "Post",
    stories_only: "Stories",
  };
  return format ? (map[format] ?? format) : "-";
}

export async function readCalendar(): Promise<MarketingCalendar> {
  const raw = await readFile(CALENDAR_PATH, "utf-8");
  return JSON.parse(raw) as MarketingCalendar;
}

export async function saveCalendar(calendar: MarketingCalendar) {
  await writeFile(CALENDAR_PATH, JSON.stringify(calendar, null, 2) + "\n", "utf-8");
  return calendar;
}

async function buildDailyOverview(project: MarketingProject, creatives: MarketingCreative[], calendar: MarketingCalendar): Promise<MarketingDailyOverview | null> {
  try {
    const timezone = calendar.timezone || project.delivery_timezone || "America/Sao_Paulo";
    const now = new Date();
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: timezone })
      .format(now)
      .toLowerCase();
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const entry = calendar.week_plan.find((item) => item.day === weekday) ?? null;
    const feedFormat = entry?.publish?.feed?.format ?? null;
    const feedTime = entry?.publish?.feed?.time ?? calendar.post_windows?.feed_primary ?? project.delivery_hour?.slice(0, 5) ?? null;
    const storyTimes = entry?.publish?.stories?.times ?? calendar.post_windows?.stories_default ?? [];

    const todayCreatives = creatives.filter((creative) => creative.delivery_date === today);
    const approvedToday = todayCreatives.filter((creative) => creative.approval_status === "aprovado");
    const approvedFeed = feedFormat ? approvedToday.find((creative) => creative.creative_type === feedFormat) ?? null : null;
    const approvedStories = approvedToday.filter((creative) => ["stories", "story"].includes(creative.creative_type));

    let manifest: Record<string, unknown> | null = null;
    try {
      const manifestRaw = await readFile(join(MANIFEST_DIR, `${today}-approved.json`), "utf-8");
      manifest = JSON.parse(manifestRaw);
    } catch {
      manifest = null;
    }

    return {
      date: today,
      weekday,
      timezone,
      feed: {
        required: Boolean(feedFormat),
        format: feedFormat,
        label: formatLabel(feedFormat),
        time: feedTime,
        approvedCreativeId: approvedFeed?.id ?? null,
        approvedStatus: approvedFeed?.approval_status ?? null,
      },
      stories: {
        requiredCount: entry?.publish?.stories?.count ?? storyTimes.length,
        approvedCount: approvedStories.length,
        times: storyTimes,
      },
      manifestStatus: manifest ? String(manifest.status ?? manifest.overall_status ?? "gerado") : "nao_gerado",
      manifest,
    };
  } catch {
    return null;
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

  const { data: creativesData, error: creativesError } = await funil
    .from("marketing_creatives")
    .select("*")
    .eq("project_id", project.id)
    .order("delivery_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (creativesError) throw new Error(creativesError.message);

  const creatives = ((creativesData ?? []) as MarketingCreative[]).sort((a, b) => {
    const w = creativeStatusWeight(a.approval_status) - creativeStatusWeight(b.approval_status);
    if (w !== 0) return w;
    return (b.delivery_date || "").localeCompare(a.delivery_date || "");
  });

  const calendar = await readCalendar();
  const daily = await buildDailyOverview(project as MarketingProject, creatives, calendar);

  return {
    project: project as MarketingProject,
    creatives,
    calendar,
    daily,
    summary: {
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

export async function updateCreativeAssets(
  id: string,
  payload: {
    preview_path?: string | null;
    preview_url?: string | null;
    asset_status?: string | null;
    notes_append?: string | null;
  },
) {
  const { client: funil, error } = getSupabaseFunilAdmin();
  if (!funil) throw new Error(error || "Supabase funil indisponível");

  const { data: current, error: currentError } = await funil
    .from("marketing_creatives")
    .select("id,notes")
    .eq("id", id)
    .single();

  if (currentError) throw new Error(currentError.message);

  const nextNotes = payload.notes_append?.trim()
    ? [current.notes, payload.notes_append.trim()].filter(Boolean).join("\n\n")
    : current.notes;

  if ((payload.asset_status ?? "render_pronto") === "render_pronto" && !payload.preview_path && !payload.preview_url) {
    throw new Error("render_pronto exige preview_path ou preview_url");
  }

  const { data, error: updateError } = await funil
    .from("marketing_creatives")
    .update({
      preview_path: payload.preview_path ?? null,
      preview_url: payload.preview_url ?? null,
      asset_status: payload.asset_status ?? "render_pronto",
      notes: nextNotes ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) throw new Error(updateError.message);

  return data as MarketingCreative;
}

export function normalizeCalendarPayload(payload: MarketingCalendar) {
  const calendar = payload as MarketingCalendar;
  if (!calendar.week_plan || !Array.isArray(calendar.week_plan)) {
    throw new Error("week_plan inválido");
  }

  calendar.week_plan = calendar.week_plan.map((day: MarketingCalendarDay) => ({
    ...day,
    publish: {
      feed: day.publish?.feed ?? null,
      stories: day.publish?.stories ?? {
        count: 3,
        times: ["08:00", "12:00", "18:00"],
        strategy: {
          story_1_focus: null,
          story_2_focus: null,
          story_3_focus: null,
          niche_or_brand: null,
          theme_mode: null,
          hashtags: [],
        },
      },
    },
  }));

  return calendar;
}
