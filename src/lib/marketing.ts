import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSupabaseFunilAdmin } from "@/lib/supabaseFunilAdmin";
import type { MarketingCalendar, MarketingCalendarDay, MarketingCreative, MarketingDailyOverview, MarketingFeedback, MarketingHashtagWeekPlan, MarketingProject, MarketingResearchPlan } from "@/lib/types";

const WORKSPACE_ROOT = "/root/.openclaw/workspace";
const PROJECT_SLUG = "nexus-instagram-marketing";
const MANIFEST_DIR = join(WORKSPACE_ROOT, "marketing", "daily-output");
const WEEK_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

type MarketingWeekPlanRow = {
  project_slug: string;
  day_of_week: string;
  feed_format: string | null;
  feed_time: string | null;
  feed_topic: string | null;
  feed_hashtags: string[] | null;
  story_1_time: string | null;
  story_1_topic: string | null;
  story_1_hashtags: string[] | null;
  story_2_time: string | null;
  story_2_topic: string | null;
  story_2_hashtags: string[] | null;
  story_3_time: string | null;
  story_3_topic: string | null;
  story_3_hashtags: string[] | null;
};

const DEFAULT_CALENDAR: MarketingCalendar = {
  timezone: "America/Sao_Paulo",
  create_at: "21:10",
  post_windows: {
    feed_primary: "12:00",
    feed_secondary_test: "19:00",
    stories_default: ["07:30", "12:00", "18:00"],
  },
  week_plan: [
    { day: "monday", publish: { feed: { format: "carousel", time: "12:00", strategy: {} }, stories: { count: 3, times: ["07:30", "12:00", "18:00"], strategy: {} } } },
    { day: "tuesday", publish: { feed: { format: "reels", time: "12:00", strategy: {} }, stories: { count: 3, times: ["07:30", "12:00", "18:00"], strategy: {} } } },
    { day: "wednesday", publish: { feed: { format: "post", time: "12:00", strategy: {} }, stories: { count: 3, times: ["07:30", "12:00", "18:00"], strategy: {} } } },
    { day: "thursday", publish: { feed: { format: "reels", time: "12:00", strategy: {} }, stories: { count: 3, times: ["07:30", "12:00", "18:00"], strategy: {} } } },
    { day: "friday", publish: { feed: { format: "carousel", time: "12:00", strategy: {} }, stories: { count: 3, times: ["07:30", "12:00", "18:00"], strategy: {} } } },
    { day: "saturday", publish: { feed: null, stories: { count: 3, times: ["07:30", "12:00", "18:00"], strategy: {} } } },
    { day: "sunday", publish: { feed: null, stories: { count: 3, times: ["07:30", "12:00", "18:00"], strategy: {} } } },
  ],
};

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

function nextWeekdayAndDate(timezone: string) {
  const now = new Date();
  const currentWeekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: timezone }).format(now).toLowerCase();
  const currentIndex = WEEK_ORDER.findIndex((day) => day === currentWeekday);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % WEEK_ORDER.length : 0;
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const targetDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);

  return {
    weekday: WEEK_ORDER[nextIndex],
    date: targetDate,
  };
}

export async function readCalendar(): Promise<MarketingCalendar> {
  const { client: funil, error } = getSupabaseFunilAdmin();
  if (!funil) throw new Error(error || "Supabase funil indisponível");

  try {
    const { data, error: fetchError } = await funil
      .from("marketing_week_plan")
      .select("*")
      .eq("project_slug", PROJECT_SLUG);

    if (fetchError) throw new Error(fetchError.message);

    if (!data || !data.length) {
      return DEFAULT_CALENDAR;
    }

    const rowsByDay = new Map<string, MarketingWeekPlanRow>((data as MarketingWeekPlanRow[]).map((row) => [row.day_of_week, row]));

    const week_plan: MarketingCalendarDay[] = WEEK_ORDER.map((day) => {
      const row = rowsByDay.get(day) ?? null;
      const storyTimes = [row?.story_1_time, row?.story_2_time, row?.story_3_time].filter(Boolean) as string[];
      const times = storyTimes.length ? storyTimes : DEFAULT_CALENDAR.post_windows?.stories_default ?? ["07:30", "12:00", "18:00"];

      return {
        day,
        publish: {
          feed: row?.feed_format
            ? {
                format: row.feed_format,
                time: row.feed_time ?? DEFAULT_CALENDAR.post_windows?.feed_primary ?? "12:00",
                strategy: {
                  niche_or_brand: row.feed_topic ?? null,
                  hashtags: row.feed_hashtags ?? [],
                },
              }
            : null,
          stories: {
            count: 3,
            times,
            strategy: {
              story_1_focus: row?.story_1_topic ?? null,
              story_1_hashtags: row?.story_1_hashtags ?? [],
              story_2_focus: row?.story_2_topic ?? null,
              story_2_hashtags: row?.story_2_hashtags ?? [],
              story_3_focus: row?.story_3_topic ?? null,
              story_3_hashtags: row?.story_3_hashtags ?? [],
            },
          },
        },
      };
    });

    return {
      ...DEFAULT_CALENDAR,
      week_plan,
    } as MarketingCalendar;
  } catch {
    return DEFAULT_CALENDAR;
  }
}

export async function saveCalendar(calendar: MarketingCalendar) {
  const { client: funil, error } = getSupabaseFunilAdmin();
  if (!funil) throw new Error(error || "Supabase funil indisponível");

  const rows: MarketingWeekPlanRow[] = calendar.week_plan.map((day) => {
    const feed = day.publish?.feed ?? null;
    const stories = day.publish?.stories ?? null;
    const times = stories?.times ?? DEFAULT_CALENDAR.post_windows?.stories_default ?? ["07:30", "12:00", "18:00"];
    return {
      project_slug: PROJECT_SLUG,
      day_of_week: day.day,
      feed_format: feed?.format ?? null,
      feed_time: feed?.time ?? null,
      feed_topic: feed?.strategy?.niche_or_brand ?? null,
      feed_hashtags: Array.isArray(feed?.strategy?.hashtags) ? feed?.strategy?.hashtags ?? [] : [],
      story_1_time: times[0] ?? null,
      story_1_topic: stories?.strategy?.story_1_focus ?? null,
      story_1_hashtags: Array.isArray(stories?.strategy?.story_1_hashtags) ? stories?.strategy?.story_1_hashtags ?? [] : [],
      story_2_time: times[1] ?? null,
      story_2_topic: stories?.strategy?.story_2_focus ?? null,
      story_2_hashtags: Array.isArray(stories?.strategy?.story_2_hashtags) ? stories?.strategy?.story_2_hashtags ?? [] : [],
      story_3_time: times[2] ?? null,
      story_3_topic: stories?.strategy?.story_3_focus ?? null,
      story_3_hashtags: Array.isArray(stories?.strategy?.story_3_hashtags) ? stories?.strategy?.story_3_hashtags ?? [] : [],
    };
  });

  const { error: upsertError } = await funil
    .from("marketing_week_plan")
    .upsert(rows, { onConflict: "project_slug,day_of_week" });

  if (upsertError) throw new Error(upsertError.message);

  return readCalendar();
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

  const timezone = (project as MarketingProject).delivery_timezone || "America/Sao_Paulo";
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const creatives = ((creativesData ?? []) as MarketingCreative[]).sort((a, b) => {
    const aToday = a.delivery_date === today ? 1 : 0;
    const bToday = b.delivery_date === today ? 1 : 0;
    if (aToday !== bToday) return bToday - aToday;

    const deliveryCmp = (b.delivery_date || "").localeCompare(a.delivery_date || "");
    if (deliveryCmp !== 0) return deliveryCmp;

    const statusCmp = creativeStatusWeight(a.approval_status) - creativeStatusWeight(b.approval_status);
    if (statusCmp !== 0) return statusCmp;

    return (b.created_at || "").localeCompare(a.created_at || "");
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

export async function fetchTomorrowResearchPlan(): Promise<MarketingResearchPlan> {
  const calendar = await readCalendar();
  const timezone = calendar.timezone || "America/Sao_Paulo";
  const target = nextWeekdayAndDate(timezone);
  const entry = calendar.week_plan.find((item) => item.day === target.weekday) ?? null;

  const items = [
    entry?.publish?.feed
      ? {
          slot: "feed" as const,
          time: entry.publish.feed.time ?? calendar.post_windows?.feed_primary ?? "12:00",
          format: entry.publish.feed.format ?? null,
          topic: entry.publish.feed.strategy?.niche_or_brand ?? null,
          researchBase: `Pesquisar conteúdo de gestão para o nicho \"${entry.publish.feed.strategy?.niche_or_brand || "Nexus"}\" ou relacionar com Nexus / empresas de micro SaaS.`,
          hashtags: entry.publish.feed.strategy?.hashtags ?? [],
        }
      : null,
    {
      slot: "story_1" as const,
      time: entry?.publish?.stories?.times?.[0] ?? "07:30",
      format: "stories",
      topic: entry?.publish?.stories?.strategy?.story_1_focus ?? null,
      researchBase: `Pesquisar gestão do nicho \"${entry?.publish?.stories?.strategy?.story_1_focus || "Nexus"}\" ou gancho de Nexus / micro SaaS para story curto.`,
      hashtags: entry?.publish?.stories?.strategy?.story_1_hashtags ?? [],
    },
    {
      slot: "story_2" as const,
      time: entry?.publish?.stories?.times?.[1] ?? "12:00",
      format: "stories",
      topic: entry?.publish?.stories?.strategy?.story_2_focus ?? null,
      researchBase: `Pesquisar gestão do nicho \"${entry?.publish?.stories?.strategy?.story_2_focus || "Nexus"}\" ou relação com operação de empresas / micro SaaS.`,
      hashtags: entry?.publish?.stories?.strategy?.story_2_hashtags ?? [],
    },
    {
      slot: "story_3" as const,
      time: entry?.publish?.stories?.times?.[2] ?? "18:00",
      format: "stories",
      topic: entry?.publish?.stories?.strategy?.story_3_focus ?? null,
      researchBase: `Pesquisar gestão do nicho \"${entry?.publish?.stories?.strategy?.story_3_focus || "Nexus"}\" ou fechamento com Nexus / automação / micro SaaS.`,
          hashtags: entry?.publish?.stories?.strategy?.story_3_hashtags ?? [],
        },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    projectSlug: PROJECT_SLUG,
    targetDate: target.date,
    targetWeekday: target.weekday,
    timezone,
    createAt: calendar.create_at ?? null,
    items,
    instructions: [
      "Sempre pesquisar gestão do nicho solicitado ou Nexus / empresas de micro SaaS.",
      "Ler o planejamento do dia seguinte antes de criar qualquer peça.",
      "Gerar 1 feed e até 3 stories conforme os tópicos preenchidos no plano.",
      "Se algum tópico vier vazio, usar Nexus / micro SaaS como fallback de pesquisa.",
    ],
  };
}

export async function fetchWeekHashtagPlan(): Promise<MarketingHashtagWeekPlan> {
  const calendar = await readCalendar();

  const slots = calendar.week_plan.flatMap((day) => {
    const feed = day.publish.feed;
    const stories = day.publish.stories;

    return [
      feed
        ? {
            day: day.day,
            slot: "feed" as const,
            topic: feed.strategy?.niche_or_brand ?? null,
            hashtags: Array.isArray(feed.strategy?.hashtags) ? feed.strategy?.hashtags ?? [] : [],
          }
        : null,
      {
        day: day.day,
        slot: "story_1" as const,
        topic: stories?.strategy?.story_1_focus ?? null,
        hashtags: Array.isArray(stories?.strategy?.story_1_hashtags) ? stories?.strategy?.story_1_hashtags ?? [] : [],
      },
      {
        day: day.day,
        slot: "story_2" as const,
        topic: stories?.strategy?.story_2_focus ?? null,
        hashtags: Array.isArray(stories?.strategy?.story_2_hashtags) ? stories?.strategy?.story_2_hashtags ?? [] : [],
      },
      {
        day: day.day,
        slot: "story_3" as const,
        topic: stories?.strategy?.story_3_focus ?? null,
        hashtags: Array.isArray(stories?.strategy?.story_3_hashtags) ? stories?.strategy?.story_3_hashtags ?? [] : [],
      },
    ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  });

  return {
    projectSlug: PROJECT_SLUG,
    timezone: calendar.timezone,
    updatedAt: new Date().toISOString(),
    slots,
  };
}

export async function saveWeekHashtagPlan(payload: MarketingHashtagWeekPlan) {
  const calendar = await readCalendar();
  const slots = payload.slots ?? [];

  const nextCalendar: MarketingCalendar = {
    ...calendar,
    week_plan: calendar.week_plan.map((day) => {
      const feedSlot = slots.find((item) => item.day === day.day && item.slot === "feed");
      const story1 = slots.find((item) => item.day === day.day && item.slot === "story_1");
      const story2 = slots.find((item) => item.day === day.day && item.slot === "story_2");
      const story3 = slots.find((item) => item.day === day.day && item.slot === "story_3");

      return {
        ...day,
        publish: {
          feed: day.publish.feed
            ? {
                ...day.publish.feed,
                strategy: {
                  ...(day.publish.feed.strategy ?? {}),
                  hashtags: feedSlot?.hashtags ?? day.publish.feed.strategy?.hashtags ?? [],
                },
              }
            : null,
          stories: day.publish.stories
            ? {
                ...day.publish.stories,
                strategy: {
                  ...(day.publish.stories.strategy ?? {}),
                  story_1_hashtags: story1?.hashtags ?? day.publish.stories.strategy?.story_1_hashtags ?? [],
                  story_2_hashtags: story2?.hashtags ?? day.publish.stories.strategy?.story_2_hashtags ?? [],
                  story_3_hashtags: story3?.hashtags ?? day.publish.stories.strategy?.story_3_hashtags ?? [],
                },
              }
            : null,
        },
      };
    }),
  };

  await saveCalendar(nextCalendar);
  return fetchWeekHashtagPlan();
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
        times: ["07:30", "12:00", "18:00"],
        strategy: {
          story_1_focus: null,
          story_1_hashtags: [],
          story_2_focus: null,
          story_2_hashtags: [],
          story_3_focus: null,
          story_3_hashtags: [],
          niche_or_brand: null,
          theme_mode: null,
          hashtags: [],
        },
      },
    },
  }));

  return calendar;
}
