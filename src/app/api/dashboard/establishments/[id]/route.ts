import { NextRequest, NextResponse } from "next/server";
import { fetchProfileByEmail, fetchTimelineByEmail } from "@/lib/query";
import { normalizeStatus, planAmountCents, planLabel, toCurrency } from "@/lib/billing";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // id is the email (URL-encoded)
    const email = decodeURIComponent(id);
    const profile = await fetchProfileByEmail(email);
    if (!profile) return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 404 });

    const cadastro = profile.cadastro;
    const planId = profile.plan_id;

    const timeline = await fetchTimelineByEmail(profile.email);
    const last = profile.lastPaymentSession;

    const amountCents = (last?.amount_cents ?? planAmountCents(planId)) as number;

    const detail = {
      id: profile.email,
      estabelecimento: cadastro?.nome_estabelecimento || "Sem nome",
      proprietario: cadastro?.nome_proprietario || "-",
      email: profile.email,
      telefone: cadastro?.telefone || "-",
      endereco: cadastro?.endereco || "-",
      plano: planLabel(planId),
      status: normalizeStatus(profile),
      ultimo_evento: profile.ultimo_evento || "-",
      data_ultimo_evento: profile.data_ultimo_evento,
      valor: toCurrency(amountCents),
      provider: profile.subscription?.provider || "-",
      payload_raw: last?.payload_raw ?? profile.subscription?.meta ?? null,
      created_at: cadastro?.created_at ?? profile.subscription?.created_at ?? null,
    };

    const history = (timeline.length ? timeline : [last].filter(Boolean)).map((row: any) => ({
      id: row.id,
      created_at: row.created_at ?? row.data_ultimo_evento ?? profile.subscription?.updated_at ?? null,
      plano: planLabel(row.plan_id ?? planId),
      // timeline is informational only; keep status from profile (not from session)
      status: normalizeStatus(profile),
      ultimo_evento: row.ultimo_evento || "-",
      valor: toCurrency(row.amount_cents ?? amountCents),
      raw: row.payload_raw ?? null,
    }));

    return NextResponse.json({ detail, history });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao consultar estabelecimento" },
      { status: 500 },
    );
  }
}
