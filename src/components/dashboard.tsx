"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
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
  jarvisTasks: Array<{ id: number; titulo: string; status: string; atualizado_em: string }>;
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
    post: "Post",
  };
  return map[type] ?? type;
}

function PreviewCard({ creative }: { creative: MarketingCreative }) {
  const isBrand = creative.theme_mode === "brand";
  return (
    <div className={`relative overflow-hidden rounded-[28px] border p-6 aspect-[4/5] ${isBrand ? "bg-[#0A0A0F] border-cyan-400/20" : "bg-[#0c111c] border-white/10"}`}>
      <div className="absolute inset-0 pointer-events-none">
        {isBrand ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,255,0.12),transparent_30%),radial-gradient(circle_at_80%_15%,rgba(191,0,255,0.16),transparent_30%),linear-gradient(180deg,#0a0a0f,#0d0d1a)]" />
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-fuchsia-500" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#0e1525,#111827)]" />
        )}
      </div>
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image src="/nexus-logo.jpg" alt="Nexus" width={46} height={46} className="rounded-full border border-white/10" />
            <div>
              <p className={`text-xs uppercase tracking-[0.25em] ${isBrand ? "text-cyan-300/80" : "text-orange-300/80"}`}>Nexus Automação</p>
              <p className="text-xs text-slate-300/70">{typeLabel(creative.creative_type)} • {creative.theme_mode}</p>
            </div>
          </div>
          <div>
            <p className={`mb-3 text-[11px] uppercase tracking-[0.25em] ${isBrand ? "text-cyan-300/70" : "text-orange-300/70"}`}>{creative.pillar ?? "Mensagem"}</p>
            <h3 className="text-3xl font-black leading-tight text-white">{creative.hook || creative.title}</h3>
          </div>
          {creative.caption ? (
            <p className="line-clamp-6 text-sm leading-6 text-slate-200/85">{creative.caption}</p>
          ) : (
            <p className="text-sm leading-6 text-slate-300/80">Prévia visual do criativo com base no título, hook e CTA. Quando houver asset final, ele entra aqui.</p>
          )}
        </div>

        <div className={`mt-4 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${isBrand ? "bg-white/8 text-cyan-200" : "bg-orange-500 text-white"}`}>
          <Sparkles className="h-4 w-4" />
          {creative.cta || "Ação principal"}
        </div>
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
  const [filter, setFilter] = useState<"all" | "pendente" | "aprovado" | "reprovado">("all");

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
    if (filter === "all") return rows;
    return rows.filter((item) => item.approval_status === filter);
  }, [overview, filter]);

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
                  Painel para visualizar criativos, revisar mensagem, aprovar, reprovar e registrar feedback antes da publicação no Instagram.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
              {[
                ["Criativos", overview?.summary.totalCreatives ?? 0],
                ["Pendentes", overview?.summary.pendentes ?? 0],
                ["Aprovados", overview?.summary.aprovados ?? 0],
                ["Reprovados", overview?.summary.reprovados ?? 0],
                ["Produto", overview?.summary.productCount ?? 0],
                ["Marca", overview?.summary.brandCount ?? 0],
                ["Vídeos", overview?.summary.videosCount ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="glass-2 rounded-2xl p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <p className="mt-1 text-2xl font-bold">{value}</p>
                </div>
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

        <section className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)_430px]">
          <aside className="glass rounded-3xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Fila de criativos</h2>
                <p className="mt-1 text-xs text-slate-400">Clique para abrir a arte e a mensagem.</p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {(["all", "pendente", "aprovado", "reprovado"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === item ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-200" : "border-white/10 bg-white/5 text-slate-300"}`}
                >
                  {item === "all" ? "Todos" : item}
                </button>
              ))}
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
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      <span>{creative.theme_mode}</span>
                      <span>•</span>
                      <span>{creative.channel}</span>
                      <span>•</span>
                      <span>{creative.delivery_date || "sem data"}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">Nenhum criativo encontrado no filtro atual.</div>
              )}
            </div>
          </aside>

          <section className="glass rounded-3xl p-5">
            {!detail?.creative ? (
              <div className="flex h-full min-h-[720px] items-center justify-center rounded-3xl border border-dashed border-white/10 text-sm text-slate-400">
                Selecione um criativo para visualizar a arte e a mensagem.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Criativo selecionado</p>
                    <h2 className="mt-1 text-2xl font-black text-white">{detail.creative.title}</h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300/80">
                      <span>{typeLabel(detail.creative.creative_type)}</span>
                      <span>•</span>
                      <span>{detail.creative.theme_mode}</span>
                      <span>•</span>
                      <span>{detail.creative.channel}</span>
                      <span>•</span>
                      <span>Entrega {detail.creative.delivery_date || "sem data"}</span>
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusBadge(detail.creative.approval_status)}`}>
                    {detail.creative.approval_status}
                  </span>
                </div>

                <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="space-y-5">
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Prévia visual</p>
                      <PreviewCard creative={detail.creative} />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="glass-2 rounded-2xl p-4">
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Mensagem principal</p>
                        <div className="space-y-3 text-sm leading-7 text-slate-200/90">
                          <p><strong>Hook:</strong> {detail.creative.hook || "-"}</p>
                          <p><strong>Legenda:</strong> {detail.creative.caption || "-"}</p>
                          <p><strong>CTA:</strong> {detail.creative.cta || "-"}</p>
                          <p><strong>Notas:</strong> {detail.creative.notes || "-"}</p>
                        </div>
                      </div>

                      <div className="glass-2 rounded-2xl p-4">
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Arquivo fonte / copy completa</p>
                        <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-2xl bg-black/20 p-3 text-xs leading-6 text-slate-200/85">{detail.sourceContent || "Sem conteúdo-fonte carregado."}</pre>
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
                        {detail.feedback.length ? detail.feedback.map((item) => (
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
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Pendências centrais do Jarvis</h2>
              <div className="space-y-3">
                {(overview?.jarvisTasks ?? []).map((task) => (
                  <div key={task.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      tarefa {task.id}
                    </div>
                    <p className="text-sm font-semibold text-white">{task.titulo}</p>
                    <p className="mt-2 text-xs text-slate-400">Atualizado em {fmtDate(task.atualizado_em)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-3xl p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Fluxo operacional</h2>
              <div className="space-y-3 text-sm text-slate-200/85">
                {[
                  "1. Agentes pesquisam e geram propostas de criativos.",
                  "2. Jarvis filtra o que realmente está forte para engajamento e venda.",
                  "3. Diego abre a arte, lê a mensagem e decide no painel.",
                  "4. Se aprovado, o item segue para publicação direta.",
                  "5. Se reprovado, o feedback entra na próxima rodada de melhoria.",
                  "6. Vídeos e reels entram na mesma lógica de aprovação visual.",
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
