"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Filter, Loader2 } from "lucide-react";

type FacetItem = { key: string; value: number };

type CrmSummary = {
  kpis: {
    total_extraidos: number;
    aguardando: number;
    enviado: number;
    invalidos: number;
    retornaram: number;
    fase2: number;
    fase2_done: number;
  };
  context: {
    stage: string;
    nicho: string;
    estado: string;
    cidade: string;
    bairro: string;
  };
  facets: {
    nicho: FacetItem[];
    estado: FacetItem[];
    cidade: FacetItem[];
    bairro: FacetItem[];
  };
  sample: Array<Record<string, unknown>>;
  updatedAt: string;
};

type LeadDetail = {
  lead: any;
  funil: any;
};

const STAGES: Array<{ key: string; label: string }> = [
  { key: "extraidos", label: "Extraídos" },
  { key: "aguardando", label: "Aguardando" },
  { key: "enviado", label: "Enviado" },
  { key: "invalidos", label: "Inválidos" },
  { key: "retornaram", label: "Retornaram" },
  { key: "fase2", label: "Fase 2" },
  { key: "fase2_done", label: "Fechamento teste grátis" },
];

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      onClick={onClear}
      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-white/10"
      title="Clique para remover filtro"
    >
      {label} ✕
    </button>
  );
}

function Facet({
  title,
  items,
  selected,
  onPick,
}: {
  title: string;
  items: FacetItem[];
  selected: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="glass-2 rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted">{items.length}</div>
      </div>
      <div className="max-h-64 space-y-1 overflow-auto pr-1">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onPick(it.key)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
              selected && selected.toLowerCase() === it.key.toLowerCase()
                ? "border-cyan-300/40 bg-cyan-300/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <span className="truncate">{it.key}</span>
            <span className="text-muted">{it.value}</span>
          </button>
        ))}
        {!items.length ? <div className="text-xs text-muted">Sem dados</div> : null}
      </div>
    </div>
  );
}

export default function CrmPage() {
  const [stage, setStage] = useState("extraidos");
  const [nicho, setNicho] = useState("");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");

  const [data, setData] = useState<CrmSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openLead, setOpenLead] = useState<LeadDetail | null>(null);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  // Use drawer overlay only on real desktops (mouse/trackpad).
  // Mobile browsers in "modo PC" can report large widths, but the UX breaks with fixed drawer.
  const [useDrawer, setUseDrawer] = useState(false);

  useEffect(() => {
    const compute = () => {
      try {
        const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
        setUseDrawer(!!mq.matches);
      } catch {
        setUseDrawer(false);
      }
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const qs = useMemo(() => {
    const sp = new URLSearchParams();
    if (stage) sp.set("stage", stage);
    if (nicho) sp.set("nicho", nicho);
    if (estado) sp.set("estado", estado);
    if (cidade) sp.set("cidade", cidade);
    if (bairro) sp.set("bairro", bairro);
    return sp.toString();
  }, [stage, nicho, estado, cidade, bairro]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/summary?${qs}`).then((r) => r.json());
      if (res.error) throw new Error(res.error);
      setData(res as CrmSummary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar CRM");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  const clearBelow = (level: "nicho" | "estado" | "cidade" | "bairro") => {
    if (level === "nicho") {
      setNicho("");
      setEstado("");
      setCidade("");
      setBairro("");
    }
    if (level === "estado") {
      setEstado("");
      setCidade("");
      setBairro("");
    }
    if (level === "cidade") {
      setCidade("");
      setBairro("");
    }
    if (level === "bairro") setBairro("");
  };

  return (
      <main className="pb-20">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              <BarChart3 className="h-3.5 w-3.5 text-cyan-300" />
              CRM · Funil
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard de Leads</h1>
            <p className="text-sm text-muted">
              Clique nos cards para encontrar gargalos. Depois refine por nicho, estado, cidade e bairro.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setStage("extraidos");
                clearBelow("nicho");
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10"
            >
              <Filter className="h-4 w-4" />
              Limpar filtros
            </button>
          </div>
        </header>

        {/* Filter chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip label={`Etapa: ${STAGES.find((s) => s.key === stage)?.label ?? stage}`} onClear={() => setStage("extraidos")} />
          {nicho ? <Chip label={`Nicho: ${nicho}`} onClear={() => clearBelow("nicho")} /> : null}
          {estado ? <Chip label={`UF: ${estado}`} onClear={() => clearBelow("estado")} /> : null}
          {cidade ? <Chip label={`Cidade: ${cidade}`} onClear={() => clearBelow("cidade")} /> : null}
          {bairro ? <Chip label={`Bairro: ${bairro}`} onClear={() => clearBelow("bairro")} /> : null}
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {/* KPI cards */}
        <section className="mb-6 grid gap-3 md:grid-cols-3 lg:grid-cols-7">
          {STAGES.map((s) => {
            const value =
              s.key === "extraidos"
                ? data?.kpis.total_extraidos
                : s.key === "aguardando"
                  ? data?.kpis.aguardando
                  : s.key === "enviado"
                    ? data?.kpis.enviado
                    : s.key === "invalidos"
                      ? data?.kpis.invalidos
                      : s.key === "retornaram"
                        ? data?.kpis.retornaram
                        : s.key === "fase2"
                          ? data?.kpis.fase2
                          : data?.kpis.fase2_done;

            const active = stage === s.key;

            return (
              <button
                key={s.key}
                onClick={() => setStage(s.key)}
                className={`rounded-2xl p-4 text-left transition ${active ? "glass neon-ring" : "glass-2 hover:bg-white/10"}`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">{s.label}</div>
                <div className="mt-1 text-2xl font-bold">{value ?? 0}</div>
              </button>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <Facet
            title="Nichos"
            items={data?.facets.nicho ?? []}
            selected={nicho}
            onPick={(v) => {
              setNicho(v);
              setEstado("");
              setCidade("");
              setBairro("");
            }}
          />
          <Facet
            title="Estados"
            items={data?.facets.estado ?? []}
            selected={estado}
            onPick={(v) => {
              setEstado(v);
              setCidade("");
              setBairro("");
            }}
          />
          <Facet
            title="Cidades"
            items={data?.facets.cidade ?? []}
            selected={cidade}
            onPick={(v) => {
              setCidade(v);
              setBairro("");
            }}
          />
          <Facet
            title="Bairros"
            items={data?.facets.bairro ?? []}
            selected={bairro}
            onPick={(v) => setBairro(v)}
          />
        </section>

        <section className="mt-6 glass rounded-2xl p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Amostra de leads (50)</div>
              <div className="text-xs text-muted">Para validar filtros rapidamente. Depois criamos lista completa + detalhe.</div>
            </div>
            {loading ? (
              <div className="inline-flex items-center gap-2 text-xs text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Atualizando
              </div>
            ) : null}
          </div>

          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#070812]/90 text-xs uppercase text-slate-200 backdrop-blur">
                <tr>
                  <th className="px-2 py-2">Nome</th>
                  <th className="px-2 py-2">Telefone</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Nicho</th>
                  <th className="px-2 py-2">Cidade</th>
                  <th className="px-2 py-2">Bairro</th>
                </tr>
              </thead>
              <tbody>
                {(data?.sample ?? []).map((r: any) => (
                  <tr
                    key={String(r.id)}
                    className="cursor-pointer border-b border-white/10 hover:bg-white/5"
                    onClick={async () => {
                      try {
                        setLeadLoading(true);
                        setLeadError(null);
                        const qs = new URLSearchParams();
                        if (r.id_whatsapp) qs.set('id_whatsapp', String(r.id_whatsapp));
                        else qs.set('id', String(r.id));
                        const res = await fetch(`/api/crm/lead?${qs.toString()}`).then((x) => x.json());
                        if (res.error) throw new Error(res.error);
                        setOpenLead(res as LeadDetail);
                      } catch (e) {
                        setLeadError(e instanceof Error ? e.message : 'Erro ao abrir lead');
                      } finally {
                        setLeadLoading(false);
                      }
                    }}
                  >
                    <td className="px-2 py-2">
                      <div className="font-semibold">{r.nome}</div>
                      <div className="text-xs text-muted truncate">{r.endereco}</div>
                    </td>
                    <td className="px-2 py-2">{r.telefone ?? "-"}</td>
                    <td className="px-2 py-2">{r.status ?? "-"}</td>
                    <td className="px-2 py-2">{r.nicho ?? "-"}</td>
                    <td className="px-2 py-2">{r.cidade ?? "-"}</td>
                    <td className="px-2 py-2">{r.bairro ?? "-"}</td>
                  </tr>
                ))}
                {!loading && !(data?.sample ?? []).length ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-6 text-center text-muted">
                      Sem resultados com os filtros atuais.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
        {/* Lead drawer (responsive):
            - Mobile: abre abaixo da tabela como continuação da página.
            - Desktop (lg+): abre como drawer lateral com overlay.
        */}
        {openLead ? (
          <div className={useDrawer ? "fixed inset-0 z-[100]" : "mt-6"}>
            {/* Overlay só no desktop real */}
            {useDrawer ? (
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setOpenLead(null)}
              />
            ) : null}

            <div
              className={
                useDrawer
                  ? "glass absolute right-0 top-0 h-full w-full max-w-[640px] overflow-y-auto p-5 shadow-[0_20px_80px_rgba(0,0,0,0.7)]"
                  : "glass max-w-full p-4 shadow-[0_20px_80px_rgba(0,0,0,0.7)]"
              }
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">Lead</div>
                  <div className="text-xl font-bold tracking-tight">{openLead.lead?.Nome ?? openLead.lead?.nome ?? "—"}</div>
                  <div className="mt-1 text-xs text-muted">
                    {openLead.lead?.Cidade ?? ""} {openLead.lead?.Estado ? `· ${openLead.lead?.Estado}` : ""}
                  </div>
                </div>

                <button
                  onClick={() => setOpenLead(null)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                >
                  Fechar
                </button>
              </div>

              {leadError ? (
                <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
                  {leadError}
                </div>
              ) : null}

              <div className="grid min-w-0 gap-3">
                <div className="glass-2 max-w-full rounded-2xl p-4">
                  <div className="text-sm font-semibold">Dados do lead</div>
                  {/* Mobile: não deixar estourar a página. Preferimos quebrar strings longas.
                      (Scroll horizontal é opcional e não pode empurrar o layout.) */}
                  <div className="mt-2 w-full max-w-full overflow-x-auto text-sm" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="min-w-0 space-y-1">
                      <div className="break-all">
                        <span className="text-muted">Telefone:</span>{" "}
                        <span>{openLead.lead?.Telefone ?? "—"}</span>
                      </div>
                      <div className="break-all">
                        <span className="text-muted">Status:</span>{" "}
                        <span>{openLead.lead?.Status ?? "—"}</span>
                      </div>
                      <div className="break-all">
                        <span className="text-muted">Nicho:</span>{" "}
                        <span>{openLead.lead?.nicho ?? "—"}</span>
                      </div>
                      <div className="break-words">
                        <span className="text-muted">Endereço:</span>{" "}
                        <span>{openLead.lead?.["Endereço"] ?? "—"}</span>
                      </div>
                      <div className="break-all">
                        <span className="text-muted">Website:</span>{" "}
                        <span>{openLead.lead?.Website ?? "—"}</span>
                      </div>
                      <div className="break-all">
                        <span className="text-muted">id_whatsapp:</span>{" "}
                        <span>{openLead.lead?.id_whatsapp ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-2 max-w-full rounded-2xl p-4">
                  <div className="text-sm font-semibold">Funil (FUNIL_ATIVO)</div>
                  <div className="mt-2 w-full max-w-full overflow-x-auto text-sm" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="min-w-0 space-y-1">
                      <div className="break-all">
                        <span className="text-muted">Fase do Funil:</span>{" "}
                        <span>{openLead.funil?.["Fase do Funil"] ?? "—"}</span>
                      </div>
                      <div className="break-all">
                        <span className="text-muted">Classificação:</span>{" "}
                        <span>{openLead.funil?.["Classificação do Lead"] ?? "—"}</span>
                      </div>
                      <div className="break-all">
                        <span className="text-muted">Venda ou Teste grátis:</span>{" "}
                        <span>
                          {typeof openLead.funil?.["Venda ou Teste gratis"] === "string"
                            ? openLead.funil?.["Venda ou Teste gratis"]
                            : JSON.stringify(openLead.funil?.["Venda ou Teste gratis"] ?? "—")}
                        </span>
                      </div>
                      <div className="break-all">
                        <span className="text-muted">Informação de ativação:</span>{" "}
                        <span>{openLead.funil?.["Informacao de ativacao"] ?? "—"}</span>
                      </div>
                      <div className="pt-2 text-xs text-muted">(Mostrando a linha inteira do FUNIL_ATIVO para este id_whatsapp.)</div>
                    </div>
                  </div>
                </div>

                <div className="glass-2 rounded-2xl p-4">
                  <div className="text-sm font-semibold">JSON completo</div>
                  <pre className="mt-2 max-h-[320px] max-w-full overflow-auto whitespace-pre-wrap break-words">{JSON.stringify(openLead, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
  );
}
