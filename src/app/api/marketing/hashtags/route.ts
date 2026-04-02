import { NextRequest, NextResponse } from "next/server";
import { fetchWeekHashtagPlan, saveWeekHashtagPlan } from "@/lib/marketing";

export async function GET() {
  try {
    const data = await fetchWeekHashtagPlan();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar plano de hashtags" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = await saveWeekHashtagPlan(payload);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar plano de hashtags" },
      { status: 400 },
    );
  }
}
