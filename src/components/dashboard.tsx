"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, MessageSquareWarning, RefreshCcw, Send, XCircle } from "lucide-react";

type Delivery = {
  id: number;
  tema: string;
  tipo: string;
  canal: string;
  status: string;
  resumo: string | null;
  cron_entrega: string | null;
  prazo_aprovacao: string | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
};

type Planning = {
  id: number;
  titulo: string;
  status: string;
  o_que_ja_tem: string | null;
  o_que_falta: string | null;
  proximo_passo: string | null;
};

type PendingTask = {
  id: number;
  titulo: string;
  status: string;
  atribuido_a: string | null;
  atualizado_em: string;
};

type Asset = {
  id: number;
  etapa: string;
  titulo: string;
  conteudo: string | null;
  preview_url: string | null;
  status: string;
};

function fmt(v?: string | null) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString("pt-BR");
  } catch {
    return v;
  }
}

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [detail, setDetail] = useState<{ delivery: Delivery; assets: Asset[] } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/overview");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar dashboard");
      setData(json);
      const first = (json.deliveries ?? [])[0] ?? null;
      setSelected(first);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: number) {
    const res = await fetch(`/api/marketing/deliveries/${id}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Erro ao carregar detalhe");
    setDetail(json);
    setFeedback(json.delivery?.feedback || "");
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selected?.id) loadDetail(selected.id).catch((e) => setError(e.message));
  }, [selected?.id]);

  async function update(action: "approved" | "rejected") {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/marketing/deliveries/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feedback }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao atualizar status");
      await load();
      setSelected(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="glass rounded-2xl p-6">Carregando dashboard de marketing…</div>;
  if (error) return <div className="glass rounded-2xl p-6 text-red-300">{error}</div>;

  return (
    <main className="space-y-5">
      <header className="glass rounded-3xl p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              <Send className="h-3.5 w-3.5" />
              insta-marketing.ias-nexus-automacao.com.br
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">Nexus · Insta Marketing</h1>
            <p className="mt-1 text-sm text-muted">
              Operação de criativos, aprovação/reprovação com feedback e fluxo até postagem.
            </p>
          </div>

          <button onClick={load} className="btn-neon inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-950">
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-5">
        {[
          ["Total", data.kpis.total, <Clock3 key="t" className="h-4 w-4" />],
          ["Em revisão", data.kpis.review, <MessageSquareWarning key="r" className="h-4 w-4" />],
          ["Aprovados", data.kpis.approved, <CheckCircle2 key="a" className="h-4 w-4" />],
          ["Reprovados", data.kpis.rejected, <XCircle key="x" className="h-4 w-4" />],
          ["Postados", data.kpis.posted, <Send key="p" className="h-4 w-4" />],
        ].map(([label, value, icon]) => (
          <div key={String(label)} className="glass-2 rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between text-sm text-muted">
              <span>{label}</span>
              {icon}
            </div>
            <div className="text-2xl font-bold">{Number(value)}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_1.4fr]">
        <div className="glass rounded-2xl p-4">
          <h2 className="mb-3 text-lg font-semibold">Planejamento</h2>
          {(data.planning as Planning[]).map((item) => (
            <div key={item.id} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-cyan-200">{item.status}</div>
                <div className="text-base font-semibold">{item.titulo}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-cyan-200">O que já temos</div>
                <p className="text-sm text-slate-200">{item.o_que_ja_tem}</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-cyan-200">O que falta</div>
                <p className="text-sm text-slate-200">{item.o_que_falta}</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-cyan-200">Próximo passo</div>
                <p className="text-sm text-slate-200">{item.proximo_passo}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-4">
          <h2 className="mb-3 text-lg font-semibold">Pendências do Jarvis</h2>
          <div className="space-y-3">
            {(data.tasks as PendingTask[]).map((task) => (
              <div key={task.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mb-1 text-xs uppercase tracking-wide text-cyan-200">#{task.id} · {task.status}</div>
                <div className="text-sm font-medium text-slate-100">{task.titulo}</div>
                <div className="mt-2 text-xs text-muted">Atualizado: {fmt(task.atualizado_em)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h2 className="mb-3 text-lg font-semibold">Entregas e aprovação</h2>
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3">
              {(data.deliveries as Delivery[]).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === item.id ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wide text-cyan-200">{item.tipo} · {item.status}</span>
                    <span className="text-xs text-muted">#{item.id}</span>
                  </div>
                  <div className="font-medium text-slate-100">{item.tema}</div>
                  <div className="mt-1 text-sm text-slate-300">{item.resumo}</div>
                  <div className="mt-2 text-xs text-muted">Entrega: {fmt(item.cron_entrega)}</div>
                  <div className="text-xs text-muted">Aprovação até: {fmt(item.prazo_aprovacao)}</div>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              {!detail ? (
                <div className="text-sm text-muted">Selecione uma entrega.</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-cyan-200">Detalhe da entrega</div>
                    <h3 className="text-xl font-semibold">{detail.delivery.tema}</h3>
                    <p className="mt-1 text-sm text-slate-300">{detail.delivery.resumo}</p>
                  </div>

                  <div className="grid gap-2 text-xs text-slate-300 md:grid-cols-2">
                    <div><strong>Status:</strong> {detail.delivery.status}</div>
                    <div><strong>Canal:</strong> {detail.delivery.canal}</div>
                    <div><strong>Entrega:</strong> {fmt(detail.delivery.cron_entrega)}</div>
                    <div><strong>Revisão até:</strong> {fmt(detail.delivery.prazo_aprovacao)}</div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-200">Etapas / materiais</div>
                    <div className="space-y-2">
                      {detail.assets.length ? detail.assets.map((asset) => (
                        <div key={asset.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="text-xs uppercase tracking-wide text-cyan-200">{asset.etapa} · {asset.status}</div>
                          <div className="font-medium">{asset.titulo}</div>
                          {asset.conteudo ? <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{asset.conteudo}</p> : null}
                          {asset.preview_url ? <a className="mt-2 inline-block text-sm text-cyan-300 underline" href={asset.preview_url} target="_blank">Abrir preview</a> : null}
                        </div>
                      )) : <div className="text-sm text-muted">Ainda sem assets registrados. O dashboard já está pronto para receber essa camada.</div>}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cyan-200">Feedback / observações</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Ex.: reforçar mensagem principal, melhorar impacto visual, trocar CTA, revisar copy..."
                      className="input-glass min-h-32 w-full rounded-xl px-3 py-2 text-sm text-slate-100 outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button disabled={saving} onClick={() => update("approved")} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
                      Aprovar
                    </button>
                    <button disabled={saving} onClick={() => update("rejected")} className="rounded-xl bg-rose-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
                      Reprovar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
