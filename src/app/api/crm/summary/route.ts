import { NextRequest, NextResponse } from "next/server";
import { getSupabaseFunilAdmin } from "@/lib/supabaseFunilAdmin";

type LeadRow = {
  id: number;
  Estado: string;
  Cidade: string;
  Bairros: string;
  "Endereço": string;
  Nome: string;
  Telefone: string | null;
  Website: string | null;
  Status: string;
  nicho: string | null;
  id_whatsapp: string | null;
};

type FunilRow = {
  id: number;
  id_whatsapp: string;
  "Fase do Funil": string | null;
  "Classificação do Lead": string | null;
  "Informacao de ativacao": string | null;
  "Venda ou Teste gratis": string | null;
};

function norm(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const stage = norm(sp.get("stage"));
    const nicho = norm(sp.get("nicho"));
    const estado = norm(sp.get("estado"));
    const cidade = norm(sp.get("cidade"));
    const bairro = norm(sp.get("bairro"));

    const { client: supabaseFunilAdmin, error: envErr } = getSupabaseFunilAdmin();
    if (!supabaseFunilAdmin) {
      return NextResponse.json({ error: envErr }, { status: 500 });
    }

    // Supabase/PostgREST may be configured with a max rows cap (commonly 1000).
    // Fetch in pages to avoid silent truncation.
    const fetchAll = async <T,>(
      table: string,
      select: string,
      pageSize = 1000,
      hardCap = 20000,
    ): Promise<T[]> => {
      const out: T[] = [];
      for (let offset = 0; offset < hardCap; offset += pageSize) {
        const { data, error } = await supabaseFunilAdmin
          .from(table)
          .select(select)
          .range(offset, offset + pageSize - 1);
        if (error) throw new Error(`${table}: ${error.message}`);
        const rows = (data ?? []) as T[];
        out.push(...rows);
        if (rows.length < pageSize) break;
      }
      return out;
    };

    const leadsData = await fetchAll<LeadRow>(
      "LEADS_NICHOS_MISTO",
      'id,Estado,Cidade,Bairros,"Endereço",Nome,Telefone,Website,Status,nicho,id_whatsapp',
    );

    const funilData = await fetchAll<FunilRow>(
      "FUNIL_ATIVO",
      'id,id_whatsapp,"Fase do Funil","Classificação do Lead","Informacao de ativacao","Venda ou Teste gratis"',
    );

    let leads = (leadsData ?? []) as LeadRow[];

    // Apply dimension filters first
    if (nicho) leads = leads.filter((l) => norm(l.nicho).toLowerCase() === nicho.toLowerCase());
    if (estado) leads = leads.filter((l) => norm(l.Estado).toLowerCase() === estado.toLowerCase());
    if (cidade) leads = leads.filter((l) => norm(l.Cidade).toLowerCase() === cidade.toLowerCase());
    if (bairro) leads = leads.filter((l) => norm(l.Bairros).toLowerCase() === bairro.toLowerCase());

    const funilByWhats = new Map<string, FunilRow>();
    for (const f of (funilData ?? []) as FunilRow[]) {
      const key = norm(f.id_whatsapp);
      if (!key) continue;
      if (!funilByWhats.has(key)) funilByWhats.set(key, f);
    }

    const isInvalid = (l: LeadRow) => !norm(l.Telefone) || !norm(l.Status);
    const isAguardando = (l: LeadRow) => norm(l.Status).toLowerCase() === "aguardando";
    const isEnviado = (l: LeadRow) => norm(l.Status).toLowerCase() === "enviado";

    const isRetornou = (l: LeadRow) => {
      const w = norm(l.id_whatsapp);
      return w ? funilByWhats.has(w) : false;
    };

    const isFase2 = (l: LeadRow) => {
      const w = norm(l.id_whatsapp);
      const f = w ? funilByWhats.get(w) : null;
      return norm(f?.["Fase do Funil"]).toLowerCase() === "fase 2";
    };

    const isFechamentoTesteGratis = (l: LeadRow) => {
      const w = norm(l.id_whatsapp);
      const f = w ? funilByWhats.get(w) : null;
      return !!norm(f?.["Venda ou Teste gratis"]);
    };

    const stagePred: Record<string, (l: LeadRow) => boolean> = {
      all: () => true,
      extraidos: () => true,
      aguardando: isAguardando,
      enviado: isEnviado,
      invalidos: isInvalid,
      retornaram: isRetornou,
      fase2: isFase2,
      fase2_done: isFechamentoTesteGratis,
    };

    const pred = stage && stagePred[stage] ? stagePred[stage] : stagePred.all;
    const filtered = leads.filter(pred);

    // Facets for drilldown
    const facet = (keyFn: (l: LeadRow) => string) => {
      const map = new Map<string, number>();
      for (const l of filtered) {
        const k = norm(keyFn(l));
        if (!k) continue;
        map.set(k, (map.get(k) ?? 0) + 1);
      }
      return Array.from(map.entries())
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 50);
    };

    const kpis = {
      total_extraidos: leads.length,
      aguardando: leads.filter(isAguardando).length,
      enviado: leads.filter(isEnviado).length,
      invalidos: leads.filter(isInvalid).length,
      retornaram: leads.filter(isRetornou).length,
      fase2: leads.filter(isFase2).length,
      fase2_done: leads.filter(isFechamentoTesteGratis).length,
    };

    return NextResponse.json({
      kpis,
      context: { stage: stage || "all", nicho, estado, cidade, bairro },
      facets: {
        nicho: facet((l) => l.nicho ?? ""),
        estado: facet((l) => l.Estado),
        cidade: facet((l) => l.Cidade),
        bairro: facet((l) => l.Bairros),
      },
      sample: filtered.slice(0, 50).map((l) => ({
        id: l.id,
        nome: l.Nome,
        telefone: l.Telefone,
        status: l.Status,
        nicho: l.nicho,
        estado: l.Estado,
        cidade: l.Cidade,
        bairro: l.Bairros,
        endereco: l["Endereço"],
        id_whatsapp: l.id_whatsapp,
      })),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar resumo CRM" },
      { status: 500 },
    );
  }
}
