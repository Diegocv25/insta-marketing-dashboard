import { NextRequest, NextResponse } from "next/server";
import { fetchCreativeDetail } from "@/lib/marketing";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await fetchCreativeDetail(id);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar criativo" },
      { status: 500 },
    );
  }
}
