import { NextRequest, NextResponse } from "next/server";
import { saveCreativeCuration } from "@/lib/marketing";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = await saveCreativeCuration(id, body ?? {});
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao registrar curadoria" },
      { status: 500 },
    );
  }
}
