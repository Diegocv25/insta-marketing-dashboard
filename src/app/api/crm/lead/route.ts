import { NextRequest, NextResponse } from "next/server";
import { getSupabaseFunilAdmin } from "@/lib/supabaseFunilAdmin";

function norm(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const idWhatsapp = norm(sp.get("id_whatsapp"));
    const leadId = norm(sp.get("id"));

    const { client: supabaseFunilAdmin, error: envErr } = getSupabaseFunilAdmin();
    if (!supabaseFunilAdmin) {
      return NextResponse.json({ error: envErr }, { status: 500 });
    }

    if (!idWhatsapp && !leadId) {
      return NextResponse.json({ error: "Missing id_whatsapp or id" }, { status: 400 });
    }

    // Lead
    const leadQuery = supabaseFunilAdmin
      .from("LEADS_NICHOS_MISTO")
      .select('*')
      .limit(1);

    const { data: leadData, error: leadErr } = idWhatsapp
      ? await leadQuery.eq("id_whatsapp", idWhatsapp)
      : await leadQuery.eq("id", Number(leadId));

    if (leadErr) throw new Error(`LEADS_NICHOS_MISTO: ${leadErr.message}`);
    const lead = (leadData ?? [])[0] ?? null;

    const w = idWhatsapp || norm(lead?.id_whatsapp);

    // Funil row
    let funil = null;
    if (w) {
      const { data: funilData, error: funilErr } = await supabaseFunilAdmin
        .from("FUNIL_ATIVO")
        .select('*')
        .eq("id_whatsapp", w)
        .limit(1);
      if (funilErr) throw new Error(`FUNIL_ATIVO: ${funilErr.message}`);
      funil = (funilData ?? [])[0] ?? null;
    }

    return NextResponse.json({ lead, funil });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar lead" },
      { status: 500 },
    );
  }
}
