import { NextRequest, NextResponse } from "next/server";
import { fetchCreativeDetail, reviewCreative } from "@/lib/marketing";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await fetchCreativeDetail(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar entrega" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const action = body?.action;
    if (action !== "approved" && action !== "rejected") {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
    const mapped = action === "approved" ? "aprovado" : "reprovado";
    const data = await reviewCreative(id, mapped, body?.feedback || null);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar feedback" },
      { status: 500 },
    );
  }
}
