import { NextResponse } from "next/server";
import { fetchTomorrowResearchPlan } from "@/lib/marketing";

export async function GET() {
  try {
    const data = await fetchTomorrowResearchPlan();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar plano de pesquisa" },
      { status: 500 },
    );
  }
}
