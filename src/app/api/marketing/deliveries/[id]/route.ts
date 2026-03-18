import { NextRequest, NextResponse } from "next/server";
import { fetchDelivery, updateDeliveryFeedback } from "@/lib/marketing";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await fetchDelivery(Number(id));
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
    const data = await updateDeliveryFeedback(Number(id), action, body?.feedback);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar feedback" },
      { status: 500 },
    );
  }
}
