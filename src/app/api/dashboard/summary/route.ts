import { NextRequest, NextResponse } from "next/server";
import { fetchProfiles } from "@/lib/query";
import { isDueInFiveDays, normalizeStatus, planLabel } from "@/lib/billing";

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

    let normalized = rows.map((r) => ({ ...r, normalizedStatus: normalizeStatus(r) }));

    if (statusFilter && statusFilter !== "all") {
      normalized = normalized.filter((r) => r.normalizedStatus === statusFilter);
    }

    const isTesteGratis = (r: (typeof normalized)[number]) => {
      const subStatus = String(r.subscription?.status ?? "").toLowerCase();
      const cadStatus = String(r.cadastro?.status ?? "").toLowerCase();
      // Stripe-like
      if (subStatus === "trialing") return true;
      // Cadastro-side flag (case-insensitive)
      if (cadStatus.includes("teste") || cadStatus.includes("trial")) return true;
      return false;
    };

    const kpis = {
      total: normalized.length,
      ativos: normalized.filter((r) => r.normalizedStatus === "ativo").length,
      testeGratis: normalized.filter((r) => r.normalizedStatus === "ativo" && isTesteGratis(r)).length,
      atrasados: normalized.filter((r) => r.normalizedStatus === "atrasado").length,
      reembolsados: normalized.filter((r) => r.normalizedStatus === "reembolsado").length,
      venceEm5Dias: normalized.filter((r) => isDueInFiveDays(r)).length,
    };

    const byPlanMap = new Map<string, number>();
    for (const row of normalized) {
      const key = planLabel(row.plan_id);
      byPlanMap.set(key, (byPlanMap.get(key) ?? 0) + 1);
    }

    const byStatusMap = new Map<string, number>();
    for (const row of normalized) {
      const key = row.normalizedStatus;
      byStatusMap.set(key, (byStatusMap.get(key) ?? 0) + 1);
    }

    return NextResponse.json({
      kpis,
      byPlan: Array.from(byPlanMap.entries()).map(([name, value]) => ({ name, value })),
      byStatus: Array.from(byStatusMap.entries()).map(([name, value]) => ({ name, value })),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar resumo" },
      { status: 500 },
    );
  }
}
