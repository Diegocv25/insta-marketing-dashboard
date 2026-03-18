import { NextRequest, NextResponse } from "next/server";
import { reviewCreative } from "@/lib/marketing";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const status = String(body?.status ?? "").trim().toLowerCase();
    const feedback = String(body?.feedback ?? "").trim() || null;

    if (status !== "aprovado" && status !== "reprovado") {
      return NextResponse.json({ error: "status inválido" }, { status: 400 });
    }

    const creative = await reviewCreative(id, status, feedback);
    return NextResponse.json({ ok: true, creative });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao registrar review" },
      { status: 500 },
    );
  }
}
