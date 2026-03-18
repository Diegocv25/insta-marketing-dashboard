"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  Filter,
  ImageIcon,
  LayoutPanelTop,
  MessageSquareText,
  RefreshCcw,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { MarketingCreative, MarketingFeedback, MarketingProject, MarketingTask } from "@/lib/types";

type OverviewResponse = {
  project: MarketingProject;
  tasks: MarketingTask[];
  creatives: MarketingCreative[];
  summary: {
    totalTasks: number;
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

function PreviewSlides({ creative, sourceContent }: { creative: MarketingCreative; sourceContent?: string | null }) {
  const frames = buildPreviewFrames(creative, sourceContent);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Preview visual navegável</p>
          <p className="mt-1 text-sm text-slate-300/80">Aqui fica a visualização da peça em formato de arte/slides, mesmo antes do asset final.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          <ImageIcon className="h-3.5 w-3.5" />
          {frames.length} quadros
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {frames.map((frame, index) => {
          const isBrand = frame.tone === "brand";
          return (
            <div
              key={`${frame.title}-${index}`}
              className={`relative overflow-hidden rounded-[28px] border p-5 aspect-[4/5] ${isBrand ? "border-cyan-400/20 bg-[#070b14]" : "border-white/10 bg-[#0f172a]"}`}
            >
              <div className="absolute inset-0 pointer-events-none">
                {isBrand ? (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,255,0.12),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(180deg,#070b14,#0a0a12)]" />
                    <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-fuchsia-500" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,#111827,#0f172a)]" />
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
                        <p key={`${line}-${lineIndex}`} className="text-base font-semibold leading-7 text-white/95">
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

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId]);

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
                  Painel de marketing para abrir criativos, visualizar a peça em formato de arte, filtrar por status/tipo e decidir aprovação com feedback.
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
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold">{card.value}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300/80">
            <span>Entrega diária: <strong>{overview?.project.delivery_hour?.slice(0, 5) || "10:00"}</strong></span>
            <span>Revisão: <strong>{overview?.project.review_hour?.slice(0, 5) || "12:00"}</strong></span>
            <span>Fuso: <strong>{overview?.project.delivery_timezone || "America/Sao_Paulo"}</strong></span>
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
                      <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{typeLabel(creative.creative_type)}</span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold leading-5 text-white">{creative.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-300/80">{creative.hook || creative.caption || creative.notes || "Sem resumo ainda."}</p>
                    <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <div className="flex flex-wrap gap-2">
                        <span>{creative.theme_mode}</span>
                        <span>•</span>
                        <span>{creative.delivery_date || "sem data"}</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
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
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Criativo selecionado</p>
                    <h2 className="mt-1 text-2xl font-black text-white">{selectedCreative.title}</h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300/80">
                      <span>{typeLabel(selectedCreative.creative_type)}</span>
                      <span>•</span>
                      <span>{selectedCreative.theme_mode}</span>
                      <span>•</span>
                      <span>{selectedCreative.channel}</span>
                      <span>•</span>
                      <span>Entrega {selectedCreative.delivery_date || "sem data"}</span>
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
                        <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><Eye className="h-3.5 w-3.5" /> Mensagem principal</p>
                        <div className="space-y-3 text-sm leading-7 text-slate-200/90">
                          <p><strong>Hook:</strong> {selectedCreative.hook || "-"}</p>
                          <p><strong>Legenda:</strong> {selectedCreative.caption || "-"}</p>
                          <p><strong>CTA:</strong> {selectedCreative.cta || "-"}</p>
                          <p><strong>Notas:</strong> {selectedCreative.notes || "-"}</p>
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
                      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Aprovação</p>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Escreva aqui o feedback. Se aprovar, pode deixar observações finais. Se reprovar, diga exatamente o que mudar."
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
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge(item.status)}`}>{item.status}</span>
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
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Planejamento</h2>
              <div className="space-y-3">
                {(overview?.tasks ?? []).map((task) => (
                  <div key={task.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(task.status)}`}>{task.status}</span>
                      <span className="text-[11px] text-slate-500">#{task.id}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{task.title}</p>
                    <p className="mt-2 text-xs leading-6 text-slate-300/80">{task.details || "Sem detalhes."}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-3xl p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Fluxo operacional</h2>
              <div className="space-y-3 text-sm text-slate-200/85">
                {[
                  "1. O criativo entra no painel já ligado ao arquivo-fonte do marketing.",
                  "2. Você clica no card e abre a peça em formato visual no centro.",
                  "3. Os filtros mudam a fila real, não só a aparência.",
                  "4. Você lê a copy, legenda, CTA e contexto no mesmo lugar.",
                  "5. Se aprovar, o item avança. Se reprovar, o feedback fica salvo para a próxima rodada.",
                  "6. O mesmo padrão vale para carrossel, stories, post e vídeo/reels.",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-3 leading-6">{item}</div>
                ))}
              </div>
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
