import { NextRequest, NextResponse } from "next/server";
import { updateCreativeAssets } from "@/lib/marketing";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = await updateCreativeAssets(id, body ?? {});
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar assets" },
      { status: 500 },
    );
  }
}
