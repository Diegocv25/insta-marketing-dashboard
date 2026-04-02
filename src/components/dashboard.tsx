"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  Filter,
  ImageIcon,
  LayoutPanelTop,
  MessageSquareText,
  RefreshCcw,
  Save,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import type {
  MarketingCalendar,
  MarketingCalendarDay,
  MarketingCreative,
  MarketingDailyOverview,
  MarketingFeedback,
  MarketingProject,
} from "@/lib/types";

type OverviewResponse = {
  project: MarketingProject;
  creatives: MarketingCreative[];
  calendar: MarketingCalendar;
  daily: MarketingDailyOverview | null;
  summary: {
    totalCreatives: number;
    pendentes: number;
    aprovados: number;
    reprovados: number;
    productCount: number;
    brandCount: number;
    videosCount: number;
  };
  updatedAt: string;
};

type CreativeDetailResponse = {
  creative: MarketingCreative;
  feedback: MarketingFeedback[];
  sourceContent: string | null;
};

type StatusFilter = "all" | "pendente" | "aprovado" | "reprovado";
type TypeFilter = "all" | "carousel" | "reels" | "stories" | "post" | "video";
type ThemeFilter = "all" | "product" | "brand";

type PreviewFrame = {
  title: string;
  body: string[];
  tone: "product" | "brand";
};

function fmtDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function statusBadge(status: string) {
  if (status === "aprovado") return "bg-emerald-500/15 text-emerald-300 border-emerald-400/20";
  if (status === "reprovado") return "bg-red-500/15 text-red-300 border-red-400/20";
  if (status === "em_andamento") return "bg-amber-500/15 text-amber-300 border-amber-400/20";
  return "bg-white/8 text-slate-200 border-white/10";
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    carousel: "Carrossel",
    reels: "Reels",
    reels_script: "Roteiro de Reels",
    video_render: "Vídeo",
    stories: "Stories",
    story: "Stories",
    post: "Post",
  };
  return map[type] ?? type;
}

function normalizeType(type: string): TypeFilter {
  if (["reels", "reels_script", "video_render"].includes(type)) return "video";
  if (type === "carousel") return "carousel";
  if (["stories", "story"].includes(type)) return "stories";
  if (type === "post") return "post";
  return "all";
}

function extractSections(sourceContent?: string | null) {
  if (!sourceContent) return [] as Array<{ title: string; body: string[] }>;
  const lines = sourceContent.split(/\r?\n/);
  const sections: Array<{ title: string; body: string[] }> = [];
  let current: { title: string; body: string[] } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace(/^##\s+/, ""), body: [] };
      continue;
    }
    if (line.startsWith("# ")) continue;
    if (line === "---") break;
    if (!current) current = { title: "Resumo", body: [] };
    current.body.push(line.replace(/^•\s*/, "• "));
  }

  if (current) sections.push(current);
  return sections;
}

function buildPreviewFrames(creative: MarketingCreative, sourceContent?: string | null): PreviewFrame[] {
  const sections = extractSections(sourceContent);
  const tone = creative.theme_mode === "brand" ? "brand" : "product";

  if (!sections.length) {
    return [
      {
        title: creative.title,
        body: [creative.hook || creative.caption || creative.notes || "Sem conteúdo visual gerado ainda."],
        tone,
      },
    ];
  }

  const usable = sections
    .filter((section) => !/Legenda|Hashtags|CTA$/i.test(section.title))
    .slice(0, 8)
    .map((section): PreviewFrame => ({
      title: section.title,
      body: section.body.length ? section.body : [creative.hook || creative.caption || "Sem texto."],
      tone,
    }));

  return usable.length
    ? usable
    : [
        {
          title: creative.title,
          body: [creative.hook || creative.caption || creative.notes || "Sem conteúdo visual gerado ainda."],
          tone,
        },
      ];
}

function isVideoAsset(path?: string | null) {
  return Boolean(path && /\.(mp4|webm|mov)(\?|$)/i.test(path));
}

function PreviewSlides({ creative, sourceContent }: { creative: MarketingCreative; sourceContent?: string | null }) {
  const frames = buildPreviewFrames(creative, sourceContent);
  const hasRenderedPreview = Boolean(creative.preview_path || creative.preview_url);
  const renderedPreviewUrl = creative.preview_url || (creative.preview_path ? `/api/marketing/assets?path=${encodeURIComponent(creative.preview_path)}` : null);
  const renderedDownloadUrl = creative.preview_path
    ? `/api/marketing/assets?path=${encodeURIComponent(creative.preview_path)}&download=1`
    : (creative.preview_url || null);
  const renderedPreviewIsVideo = isVideoAsset(creative.preview_url || creative.preview_path);

  return (
    <div className="space-y-3">
      {hasRenderedPreview && renderedPreviewUrl ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-300/80">Peça final para avaliação.</p>
            <div className="flex items-center gap-2">
              <a
                href={renderedDownloadUrl || renderedPreviewUrl || undefined}
                download
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20">
            {renderedPreviewIsVideo ? (
              <video src={renderedPreviewUrl} controls playsInline preload="metadata" className="h-auto w-full bg-black" />
            ) : (
              <img src={renderedPreviewUrl} alt={creative.title} className="h-auto w-full object-cover" />
            )}
          </div>
        </div>
      ) : null}

      {!hasRenderedPreview ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Preview visual navegável</p>
              <p className="mt-1 text-sm text-slate-300/80">Aqui fica a visualização estrutural da peça antes do asset final.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <ImageIcon className="h-3.5 w-3.5" />
              {frames.length} quadros
            </span>
          </div>
        </div>
      ) : null}

      {!hasRenderedPreview ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {frames.map((frame, index) => {
          const isBrand = frame.tone === "brand";
          return (
            <div
              key={`${frame.title}-${index}`}
              className={`relative overflow-hidden rounded-[28px] border p-5 aspect-[4/5] ${isBrand ? "border-cyan-400/20 bg-[#070b14]" : "border-orange-200/10 bg-[#140c0b]"}`}
            >
              <div className="absolute inset-0 pointer-events-none">
                {isBrand ? (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,255,0.12),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(180deg,#070b14,#0a0a12)]" />
                    <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-fuchsia-500" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(160,96,58,0.34),transparent_34%),radial-gradient(circle_at_50%_35%,rgba(108,56,30,0.28),transparent_48%),linear-gradient(180deg,#160d0a,#120a09_40%,#0c0708)]" />
                )}
              </div>

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Image src="/nexus-logo.jpg" alt="Nexus" width={36} height={36} className="rounded-full border border-white/10" />
                      <div>
                        <p className={`text-[11px] uppercase tracking-[0.24em] ${isBrand ? "text-cyan-300/80" : "text-orange-300/80"}`}>Nexus Automação</p>
                        <p className="text-[11px] text-slate-300/70">{typeLabel(creative.creative_type)}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-slate-200">{index + 1}/{frames.length}</span>
                  </div>

                  <div>
                    <p className={`mb-3 text-[11px] uppercase tracking-[0.22em] ${isBrand ? "text-cyan-300/70" : "text-orange-300/70"}`}>{frame.title}</p>
                    <div className="space-y-3">
                      {frame.body.slice(0, 5).map((line, lineIndex) => (
                        <p key={`${line}-${lineIndex}`} className={`text-base font-semibold leading-7 ${isBrand ? "text-white/95" : "text-[#f7eee8]"}`}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${isBrand ? "bg-white/10 text-cyan-100" : "bg-orange-500 text-white"}`}>
                  <Sparkles className="h-4 w-4" />
                  {creative.cta || creative.hook || "Mensagem principal"}
                </div>
              </div>
            </div>
          );
        })}
      </div> : null}
    </div>
  );
}

function dayLabel(day: string) {
  const map: Record<string, string> = {
    monday: "Seg",
    tuesday: "Ter",
    wednesday: "Qua",
    thursday: "Qui",
    friday: "Sex",
    saturday: "Sáb",
    sunday: "Dom",
  };
  return map[day] ?? day;
}

function WeeklyPlanner({ calendar, onSave, saving }: { calendar: MarketingCalendar; onSave: (calendar: MarketingCalendar) => Promise<void>; saving: boolean }) {
  const [draft, setDraft] = useState<MarketingCalendar>(calendar);

  useEffect(() => {
    setDraft(calendar);
  }, [calendar]);

  function updateDay(index: number, updater: (day: MarketingCalendarDay) => MarketingCalendarDay) {
    setDraft((prev) => {
      const nextWeekPlan = prev.week_plan.map((day, dayIndex) => (dayIndex === index ? updater(day) : day));
      return {
        ...prev,
        week_plan: nextWeekPlan,
      };
    });
  }

  return (
    <div className="glass rounded-3xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Calendário operacional</h2>
          <p className="mt-1 text-xs text-slate-400">Preencha o foco do feed e o nicho/foco dos stories de cada horário.</p>
        </div>
        <button
          onClick={() => onSave(draft)}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Salvar
        </button>
      </div>

      <div className="grid gap-3">
        {draft.week_plan.map((day, index) => {
          const feed = day.publish.feed;
          const stories = day.publish.stories;
          const storyTimes = stories?.times ?? ["07:30", "12:00", "18:00"];
          return (
            <div key={day.day} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">{dayLabel(day.day)}</span>
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Agenda</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300/85">
                <div>
                  <p><strong>Feed:</strong> {feed?.format ? `${typeLabel(feed.format)} ${feed.time || "12:00"}` : "Sem feed"}</p>
                  {feed ? (
                    <input
                      value={typeof feed.strategy?.niche_or_brand === "string" ? feed.strategy.niche_or_brand : ""}
                      onChange={(e) => updateDay(index, (current) => ({
                        ...current,
                        publish: {
                          ...current.publish,
                          feed: {
                            ...current.publish.feed!,
                            strategy: { ...(current.publish.feed?.strategy ?? {}), niche_or_brand: e.target.value },
                          },
                        },
                      }))}
                      placeholder="Nicho / foco do feed"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none"
                    />
                  ) : null}
                </div>

                <div>
                  <p><strong>Stories:</strong> {storyTimes.join(" · ")}</p>
                  <div className="mt-2 space-y-2">
                    {storyTimes.map((time, storyIndex) => {
                      const keys = ["story_1_focus", "story_2_focus", "story_3_focus"] as const;
                      const key = keys[storyIndex] ?? keys[0];
                      const value = typeof stories?.strategy?.[key] === "string" ? stories.strategy[key] : "";
                      return (
                        <div key={`${day.day}-${time}`} className="grid grid-cols-[64px_minmax(0,1fr)] gap-2 items-center">
                          <span className="text-[11px] text-slate-400">{time}</span>
                          <input
                            value={value}
                            onChange={(e) => updateDay(index, (current) => ({
                              ...current,
                              publish: {
                                ...current.publish,
                                stories: {
                                  ...current.publish.stories!,
                                  strategy: { ...(current.publish.stories?.strategy ?? {}), [key]: e.target.value },
                                },
                              },
                            }))}
                            placeholder="Nicho / foco"
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyPlanSummary({ calendar }: { calendar: MarketingCalendar }) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Resumo da semana</h2>
        <p className="mt-1 text-xs text-slate-400">Referência rápida para manter o rodízio dos nichos na próxima semana.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {calendar.week_plan.map((day) => {
          const feed = day.publish.feed;
          const stories = day.publish.stories;
          return (
            <div key={`summary-${day.day}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 min-h-[260px]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">{dayLabel(day.day)}</span>
                <span className="text-[11px] text-slate-400">{feed?.time || "-"}</span>
              </div>

              <div className="space-y-2 text-xs text-slate-300/85">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Feed</p>
                  <p className="mt-1 text-slate-200">{feed?.strategy?.niche_or_brand || "—"}</p>
                  {!!feed?.strategy?.hashtags?.length ? (
                    <p className="mt-1 text-xs leading-6 text-cyan-200/90">{feed.strategy.hashtags.join(" ")}</p>
                  ) : null}
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Stories</p>
                  <div className="mt-1 space-y-1">
                    {[
                      {
                        time: stories?.times?.[0] || "07:30",
                        focus: stories?.strategy?.story_1_focus || "—",
                        hashtags: stories?.strategy?.story_1_hashtags || [],
                      },
                      {
                        time: stories?.times?.[1] || "12:00",
                        focus: stories?.strategy?.story_2_focus || "—",
                        hashtags: stories?.strategy?.story_2_hashtags || [],
                      },
                      {
                        time: stories?.times?.[2] || "18:00",
                        focus: stories?.strategy?.story_3_focus || "—",
                        hashtags: stories?.strategy?.story_3_hashtags || [],
                      },
                    ].map((item) => (
                      <div key={`${day.day}-${item.time}`} className="grid grid-cols-[52px_minmax(0,1fr)] gap-2">
                        <span className="text-slate-500">{item.time}</span>
                        <div>
                          <span className="text-slate-200">{item.focus}</span>
                          {!!item.hashtags.length ? (
                            <p className="mt-0.5 text-xs leading-6 text-cyan-200/90">{item.hashtags.join(" ")}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CreativeDetailResponse | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>("all");
  const [curation, setCuration] = useState({
    messageStrength: "forte",
    clarity: "clara",
    hook: "bom",
    visual: "alinhado",
    objective: "produto",
    action: "manter",
    notes: "",
  });
  const [savingCuration, setSavingCuration] = useState(false);
  const [savingCalendar, setSavingCalendar] = useState(false);

  async function loadOverview(preserveSelected = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/overview", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar dashboard");
      setOverview(data);
      if (!preserveSelected) {
        const first = (data.creatives ?? [])[0]?.id ?? null;
        setSelectedId(first);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    try {
      const res = await fetch(`/api/marketing/creatives/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar criativo");
      setDetail(data);
      setFeedback(data.creative?.feedback_latest || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar criativo");
    }
  }

  async function saveCalendar(calendar: MarketingCalendar) {
    setSavingCalendar(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/calendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calendar),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar agenda");
      await loadOverview(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar agenda");
    } finally {
      setSavingCalendar(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!detail?.creative) return;
    setCuration((prev) => ({
      ...prev,
      objective: detail.creative.theme_mode === "brand" ? "marca" : "produto",
      notes: "",
    }));
  }, [detail?.creative?.id]);

  const visibleCreatives = useMemo(() => {
    const rows = overview?.creatives ?? [];
    return rows.filter((item) => {
      const statusOk = statusFilter === "all" || item.approval_status === statusFilter;
      const typeOk = typeFilter === "all" || normalizeType(item.creative_type) === typeFilter;
      const themeOk = themeFilter === "all" || item.theme_mode === themeFilter;
      return statusOk && typeOk && themeOk;
    });
  }, [overview, statusFilter, typeFilter, themeFilter]);

  useEffect(() => {
    if (!visibleCreatives.length) {
      setSelectedId(null);
      setDetail(null);
      return;
    }
    if (!selectedId || !visibleCreatives.some((item) => item.id === selectedId)) {
      setSelectedId(visibleCreatives[0].id);
    }
  }, [visibleCreatives, selectedId]);

  async function submitReview(status: "aprovado" | "reprovado") {
    if (!detail?.creative?.id) return;
    setReviewing(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketing/creatives/${detail.creative.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar review");
      await loadOverview(true);
      await loadDetail(detail.creative.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao registrar review");
    } finally {
      setReviewing(false);
    }
  }

  async function submitCuration() {
    if (!detail?.creative?.id) return;
    setSavingCuration(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketing/creatives/${detail.creative.id}/curation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(curation),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar curadoria");
      await loadDetail(detail.creative.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao registrar curadoria");
    } finally {
      setSavingCuration(false);
    }
  }

  const selectedCreative = detail?.creative;

  const statCards = [
    { label: "Todos", value: overview?.summary.totalCreatives ?? 0, active: statusFilter === "all" && themeFilter === "all" && typeFilter === "all", onClick: () => { setStatusFilter("all"); setThemeFilter("all"); setTypeFilter("all"); } },
    { label: "Pendentes", value: overview?.summary.pendentes ?? 0, active: statusFilter === "pendente", onClick: () => setStatusFilter("pendente") },
    { label: "Aprovados", value: overview?.summary.aprovados ?? 0, active: statusFilter === "aprovado", onClick: () => setStatusFilter("aprovado") },
    { label: "Reprovados", value: overview?.summary.reprovados ?? 0, active: statusFilter === "reprovado", onClick: () => setStatusFilter("reprovado") },
    { label: "Produto", value: overview?.summary.productCount ?? 0, active: themeFilter === "product", onClick: () => setThemeFilter("product") },
    { label: "Marca", value: overview?.summary.brandCount ?? 0, active: themeFilter === "brand", onClick: () => setThemeFilter("brand") },
    { label: "Vídeos", value: overview?.summary.videosCount ?? 0, active: typeFilter === "video", onClick: () => setTypeFilter("video") },
  ];

  return (
    <main className="min-h-screen text-slate-100">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="glass rounded-3xl p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <Image src="/nexus-logo.jpg" alt="Nexus" width={68} height={68} className="rounded-2xl border border-white/10" />
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-200">
                  <LayoutPanelTop className="h-3.5 w-3.5" />
                  Dashboard de Aprovação
                </p>
                <h1 className="text-3xl font-black tracking-tight">Nexus · Insta Marketing</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300/80">
                  Painel de revisão dos criativos, agenda semanal editável e acompanhamento do pacote do dia.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
              {statCards.map((card) => (
                <button
                  key={card.label}
                  onClick={card.onClick}
                  className={`glass-2 rounded-2xl p-3 text-left transition ${card.active ? "border border-cyan-300/30 bg-cyan-400/15" : "hover:bg-white/10"}`}
                >
                  <p className="text-[8px] uppercase tracking-[0.14em] leading-4 text-slate-400">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold">{card.value}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300/80">
            <span>Criação: <strong>20:00 (dia anterior)</strong></span>
            <span>Publicação principal: <strong>12:00</strong></span>
            <span>Stories: <strong>07:30 / 12:00 / 18:00</strong></span>
            <span>Fuso: <strong>America/Sao_Paulo</strong></span>
            <button onClick={() => loadOverview(true)} className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold hover:bg-white/10">
              <RefreshCcw className="h-4 w-4" /> Atualizar
            </button>
          </div>
        </header>

        {error ? (
          <div className="flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        {overview?.calendar ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <WeeklyPlanSummary calendar={overview.calendar} />
            <WeeklyPlanner calendar={overview.calendar} onSave={saveCalendar} saving={savingCalendar} />
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_430px]">
          <aside className="glass rounded-3xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Fila de criativos</h2>
                <p className="mt-1 text-xs text-slate-400">Clique para abrir a peça e a mensagem correspondente.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300">
                <Filter className="h-3.5 w-3.5" />
                {visibleCreatives.length} visíveis
              </span>
            </div>

            <div className="mb-4 space-y-3">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">Status</p>
                <div className="flex flex-wrap gap-2">
                  {(["all", "pendente", "aprovado", "reprovado"] as const).map((item) => (
                    <button
                      key={item}
                      onClick={() => setStatusFilter(item)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusFilter === item ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-200" : "border-white/10 bg-white/5 text-slate-300"}`}
                    >
                      {item === "all" ? "Todos" : item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">Formato</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    ["all", "Todos"],
                    ["carousel", "Carrossel"],
                    ["video", "Vídeos/Reels"],
                    ["stories", "Stories"],
                    ["post", "Post"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setTypeFilter(value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${typeFilter === value ? "border-orange-300/30 bg-orange-400/15 text-orange-200" : "border-white/10 bg-white/5 text-slate-300"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">Foco</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    ["all", "Todos"],
                    ["product", "Produto"],
                    ["brand", "Marca"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setThemeFilter(value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${themeFilter === value ? "border-fuchsia-300/30 bg-fuchsia-400/15 text-fuchsia-200" : "border-white/10 bg-white/5 text-slate-300"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="max-h-[920px] space-y-3 overflow-auto pr-1">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">Carregando criativos…</div>
              ) : visibleCreatives.length ? (
                visibleCreatives.map((creative) => (
                  <button
                    key={creative.id}
                    onClick={() => setSelectedId(creative.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === creative.id ? "border-cyan-300/35 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/8"}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(creative.approval_status)}`}>{creative.approval_status}</span>
                      <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{creative.asset_status === "video_pronto" ? "vídeo" : "peça"}</span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold leading-5 text-white">{creative.hook || creative.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-300/80">{creative.hook || creative.caption || creative.notes || "Sem resumo ainda."}</p>
                    <div className="mt-3 space-y-2 text-[11px] text-slate-400">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          <span>{creative.delivery_date || "sem data"}</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span>Criado em {fmtDate(creative.created_at)}</span>
                        <span>Atualizado em {fmtDate(creative.updated_at)}</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">Nenhum criativo encontrado no filtro atual.</div>
              )}
            </div>
          </aside>

          <section className="glass rounded-3xl p-5">
            {!selectedCreative ? (
              <div className="flex h-full min-h-[720px] items-center justify-center rounded-3xl border border-dashed border-white/10 text-sm text-slate-400">
                Selecione um criativo para visualizar a arte e a mensagem.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Avaliação da peça</p>
                    <h2 className="mt-1 text-3xl font-black text-white">{selectedCreative.hook || selectedCreative.title}</h2>
                    <div className="mt-2 flex flex-col gap-1 text-xs text-slate-400">
                      <span>Criado em {fmtDate(selectedCreative.created_at)}</span>
                      <span>Atualizado em {fmtDate(selectedCreative.updated_at)}</span>
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusBadge(selectedCreative.approval_status)}`}>
                    {selectedCreative.approval_status}
                  </span>
                </div>

                <PreviewSlides creative={selectedCreative} sourceContent={detail?.sourceContent} />

                <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="space-y-5">
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="glass-2 rounded-2xl p-4">
                        <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><Eye className="h-3.5 w-3.5" /> Mensagem da peça</p>
                        <div className="space-y-3 text-sm leading-7 text-slate-200/90">
                          <p><strong>Headline:</strong> {selectedCreative.hook || "-"}</p>
                          <p><strong>Legenda:</strong> {selectedCreative.caption || "-"}</p>
                          <p><strong>CTA:</strong> {selectedCreative.cta || "-"}</p>
                        </div>
                      </div>

                      <div className="glass-2 rounded-2xl p-4">
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Arquivo fonte / copy completa</p>
                        <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-2xl bg-black/20 p-3 text-xs leading-6 text-slate-200/85">{detail?.sourceContent || "Sem conteúdo-fonte carregado."}</pre>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="glass-2 rounded-2xl p-4">
                      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Curadoria Jarvis</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {([
                          ["messageStrength", "Mensagem", ["forte", "média", "fraca"]],
                          ["clarity", "Clareza", ["clara", "média", "confusa"]],
                          ["hook", "Gancho", ["bom", "morno", "fraco"]],
                          ["visual", "Visual", ["alinhado", "ajustar", "desalinhado"]],
                          ["objective", "Objetivo", ["produto", "marca"]],
                          ["action", "Ação", ["manter", "reescrever", "refazer", "priorizar"]],
                        ] as Array<[keyof typeof curation, string, string[]]>).map(([key, label, options]) => (
                          <label key={String(key)} className="space-y-1 text-xs text-slate-300">
                            <span className="uppercase tracking-[0.18em] text-slate-500">{label}</span>
                            <select
                              value={curation[key] as string}
                              onChange={(e) => setCuration((prev) => ({ ...prev, [key]: e.target.value }))}
                              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none"
                            >
                              {options.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </label>
                        ))}
                      </div>
                      <textarea
                        value={curation.notes}
                        onChange={(e) => setCuration((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Observações do Jarvis sobre força da peça, ajuste sugerido e prioridade."
                        className="mt-3 min-h-[110px] w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none focus:border-fuchsia-300/30"
                      />
                      <button
                        onClick={submitCuration}
                        disabled={savingCuration}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        <Sparkles className="h-4 w-4" /> Salvar curadoria Jarvis
                      </button>
                    </div>

                    <div className="glass-2 rounded-2xl p-4">
                      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Aprovação Diego</p>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Escreva aqui o feedback final. Se aprovar, pode deixar observações finais. Se reprovar, diga exatamente o que mudar."
                        className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300/30"
                      />
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <button
                          onClick={() => submitReview("aprovado")}
                          disabled={reviewing}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Aprovar
                        </button>
                        <button
                          onClick={() => submitReview("reprovado")}
                          disabled={reviewing}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" /> Reprovar
                        </button>
                      </div>
                    </div>

                    <div className="glass-2 rounded-2xl p-4">
                      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Histórico de feedback</p>
                      <div className="max-h-[260px] space-y-3 overflow-auto">
                        {detail?.feedback?.length ? detail.feedback.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge(item.status)}`}>{item.status}</span>
                                <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.reviewer}</span>
                              </div>
                              <span className="text-[11px] text-slate-400">{fmtDate(item.created_at)}</span>
                            </div>
                            <p className="text-xs leading-6 text-slate-200/85">{item.feedback || "Sem feedback textual."}</p>
                          </div>
                        )) : <p className="text-sm text-slate-400">Ainda não há feedback registrado.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="glass rounded-3xl p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Status do dia</h2>
              {!overview?.daily ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">Sem leitura operacional do dia.</div>
              ) : (
                <div className="space-y-3 text-sm text-slate-200/85">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Hoje</p>
                    <p className="mt-1 font-semibold text-white">{overview.daily.weekday} · {overview.daily.date}</p>
                    <p className="mt-1 text-xs text-slate-300/80">Fuso: {overview.daily.timezone}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Feed</p>
                    <p className="mt-1 font-semibold text-white">{overview.daily.feed.label}</p>
                    <p className="mt-1 text-xs text-slate-300/80">Horário: {overview.daily.feed.time || "-"}</p>
                    <p className="mt-1 text-xs text-slate-300/80">Aprovado: {overview.daily.feed.approvedCreativeId ? "sim" : "não"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Stories</p>
                    <p className="mt-1 font-semibold text-white">{overview.daily.stories.approvedCount}/{overview.daily.stories.requiredCount} aprovados</p>
                    <p className="mt-1 text-xs text-slate-300/80">Slots: {overview.daily.stories.times.join(" · ") || "-"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Manifesto</p>
                    <p className="mt-1 font-semibold text-white">{overview.daily.manifestStatus}</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </section>

        <footer className="flex items-center justify-between gap-3 pb-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2"><MessageSquareText className="h-3.5 w-3.5" /> aprovar / reprovar / feedback / publicação</span>
          <span className="inline-flex items-center gap-2"><Send className="h-3.5 w-3.5" /> atualizado em {fmtDate(overview?.updatedAt)}</span>
        </footer>
      </div>
    </main>
  );
}
