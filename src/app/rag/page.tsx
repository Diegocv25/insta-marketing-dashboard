export default function RagPage() {
  return (
    <main className="min-h-[calc(100vh-120px)] text-slate-100">
      <div className="mx-auto max-w-7xl px-0 py-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">RAG — Base de Conhecimento (Nexus)</h1>
            <p className="text-xs text-muted">Formulário para editar e publicar a base usada pela Emily.</p>
          </div>
          <a
            href="/rag/nexus_rag_config_v2.html"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10"
          >
            Abrir em nova aba
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
          <iframe src="/rag/nexus_rag_config_v2.html" className="h-[calc(100vh-180px)] w-full" />
        </div>
      </div>
    </main>
  );
}
