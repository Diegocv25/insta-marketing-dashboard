"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Layers3, RefreshCcw, Send, Sparkles, XCircle } from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string;
  delivery_timezone: string;
  delivery_hour: string;
  review_hour: string;
  auto_post: boolean;
};

type Task = {
  id: number;
  title: string;
  status: string;
  details: string | null;
  sort_order: number;
};

type Creative = {
  id: string;
  creative_type: string;
  channel: string;
  theme_mode: "product" | "brand";
  pillar: string | null;
  title: string;
  hook: string | null;
  cta: string | null;
  approval_status: string;
  asset_status: string;
  delivery_date: string | null;
  source_path: string | null;
  notes: string | null;
  feedback_latest: string | null;
};

type OverviewResponse = {
  project: Project;
  tasks: Task[];
  creatives: Creative[];
  summary: {
    totalTasks: number;
    totalCreatives: number;
    pendentes: number;
    aprovados: number;
    reprovados: number;
    productCount: number;
    brandCount: number;
  };
  updatedAt: string;
};

function badgeTheme(theme: string) {
  return theme === "brand"
    ? "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200"
    : "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
}

function badgeStatus(status: string) {
  if (status === "aprovado") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (status === "reprovado") return "border-red-400/30 bg-red-500/10 text-red-200";
  return "border-amber-400/30 bg-amber-500/10 text-amber-100";
}

export function Dashboard() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/overview", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar dashboard");
      setData(json);
      if (!selectedId && json.creatives?.length) setSelectedId(json.creatives[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(
    () => data?.creatives.find((c) => c.id === selectedId) ?? null,
    [data, selectedId],
  );

  const reviewCreative = async (id: string, status: "aprovado" | "reprovado") => {
    try {
      setSavingId(id);
      const res = await fetch(`/api/marketing/creatives/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, feedback: feedback[id] ?? "" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar review");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar review");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="min-h-screen text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              Nexus · Insta Marketing
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard de aprovação de criativos</h1>
              <p className="text-sm text-muted">
                Visualização simples para entrega, aprovação/reprovação e feedback com histórico do que já começou.
              </p>
            </div>
          </div>

          <button onClick={load} className="btn-neon inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-950">
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </button>
        </header>

        {error ? <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

        {loading && !data ? <div className="rounded-2xl glass p-6 text-sm text-slate-300">Carregando painel…</div> : null}

        {data ? (
          <>
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              {[
                ["Total tarefas", data.summary.totalTasks],
                ["Total criativos", data.summary.totalCreatives],
                ["Pendentes", data.summary.pendentes],
                ["Aprovados", data.summary.aprovados],
                ["Reprovados", data.summary.reprovados],
                ["Brand / Product", `${data.summary.brandCount} / ${data.summary.productCount}`],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl glass p-4">
                  <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
                  <p className="mt-2 text-2xl font-bold">{value}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl glass p-4 lg:col-span-2">
                <div className="mb-4 flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-cyan-300" />
                  <h2 className="text-lg font-semibold">Planejamento e tarefas em andamento</h2>
                </div>
                <div className="space-y-3">
                  {data.tasks.map((task) => (
                    <div key={task.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{task.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${badgeStatus(task.status === "em_andamento" ? "pendente" : task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      {task.details ? <p className="mt-2 text-sm text-slate-300">{task.details}</p> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl glass p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-fuchsia-300" />
                  <h2 className="text-lg font-semibold">Operação</h2>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted">Projeto</p>
                    <p className="mt-1 font-semibold">{data.project.name}</p>
                    <p className="mt-1">{data.project.description}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p><strong>Fuso:</strong> {data.project.delivery_timezone}</p>
                    <p><strong>Entrega:</strong> {data.project.delivery_hour}</p>
                    <p><strong>Revisão:</strong> {data.project.review_hour}</p>
                    <p><strong>Post automático:</strong> {data.project.auto_post ? "ligado" : "desligado"}</p>
                  </div>
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-cyan-100">
                    Regras ativas: <strong>produto = cores da landing</strong> · <strong>marca = cyber neon Nexus</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-2xl glass p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Send className="h-4 w-4 text-cyan-300" />
                  <h2 className="text-lg font-semibold">Fila de criativos</h2>
                </div>
                <div className="space-y-3">
                  {data.creatives.map((creative) => (
                    <button
                      key={creative.id}
                      onClick={() => setSelectedId(creative.id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${selectedId === creative.id ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${badgeTheme(creative.theme_mode)}`}>{creative.theme_mode}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${badgeStatus(creative.approval_status)}`}>{creative.approval_status}</span>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-200">{creative.creative_type}</span>
                      </div>
                      <p className="mt-2 font-semibold">{creative.title}</p>
                      {creative.hook ? <p className="mt-1 text-sm text-slate-300">{creative.hook}</p> : null}
                      <div className="mt-2 text-xs text-muted">
                        <p>Canal: {creative.channel} · Pilar: {creative.pillar || "-"}</p>
                        <p>Fonte: {creative.source_path || "-"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl glass p-4">
                <h2 className="mb-4 text-lg font-semibold">Aprovação / reprovação</h2>
                {!selected ? (
                  <p className="text-sm text-slate-400">Selecione um criativo para revisar.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${badgeTheme(selected.theme_mode)}`}>{selected.theme_mode}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${badgeStatus(selected.approval_status)}`}>{selected.approval_status}</span>
                      </div>
                      <p className="mt-3 text-xl font-bold">{selected.title}</p>
                      {selected.hook ? <p className="mt-2 text-sm text-slate-200">{selected.hook}</p> : null}
                      <div className="mt-3 space-y-1 text-sm text-slate-300">
                        <p><strong>Tipo:</strong> {selected.creative_type}</p>
                        <p><strong>CTA:</strong> {selected.cta || "-"}</p>
                        <p><strong>Arquivo:</strong> {selected.source_path || "-"}</p>
                        <p><strong>Notas:</strong> {selected.notes || "-"}</p>
                        {selected.feedback_latest ? <p><strong>Último feedback:</strong> {selected.feedback_latest}</p> : null}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Feedback</label>
                      <textarea
                        value={feedback[selected.id] ?? selected.feedback_latest ?? ""}
                        onChange={(e) => setFeedback((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                        placeholder="Escreva aqui o que melhorar ou valide se está pronto para postar"
                        className="min-h-32 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400/50"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => reviewCreative(selected.id, "aprovado")}
                        disabled={savingId === selected.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 font-semibold text-emerald-100 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => reviewCreative(selected.id, "reprovado")}
                        disabled={savingId === selected.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 font-semibold text-red-100 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        Reprovar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
