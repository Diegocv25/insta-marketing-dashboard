import { NextRequest, NextResponse } from "next/server";
import { fetchProfiles } from "@/lib/query";
import { computeAccessUntil, normalizeStatus, planAmountCents, planLabel, toCurrency } from "@/lib/billing";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const statusFilter = sp.get("status");

    const rows = await fetchProfiles({
      from: sp.get("from"),
      to: sp.get("to"),
      plan: sp.get("plan"),
      q: sp.get("q"),
    });

    let mapped = rows.map((row) => {
      const normalizedStatus = normalizeStatus(row);
      const due = computeAccessUntil(row);
      const cadastro = row.cadastro;
      const planId = row.plan_id;
      const amountCents = row.amount_cents ?? planAmountCents(planId);

      return {
        id: row.email,
        nome_estabelecimento: cadastro?.nome_estabelecimento || "Sem nome",
        nome_proprietario: cadastro?.nome_proprietario || "-",
        user_email: row.email,
        telefone: cadastro?.telefone || "-",
        plan_id: planId,
        plan_label: planLabel(planId),
        status: normalizedStatus,
        ultimo_evento: row.ultimo_evento || "-",
        data_ultimo_evento: row.data_ultimo_evento,
        valor: toCurrency(amountCents),
        due_date: due?.toISOString() ?? null,
        created_at: cadastro?.created_at ?? row.subscription?.created_at ?? null,
      };
    });

    if (statusFilter && statusFilter !== "all") {
      mapped = mapped.filter((r) => r.status === statusFilter);
    }

    return NextResponse.json({
      items: mapped,
      total: mapped.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao listar estabelecimentos" },
      { status: 500 },
    );
  }
}
