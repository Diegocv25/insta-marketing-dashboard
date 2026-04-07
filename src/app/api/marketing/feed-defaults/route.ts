import { NextRequest, NextResponse } from "next/server";
import { normalizeFeedFormatDefaults, readFeedFormatDefaults, saveFeedFormatDefaults } from "@/lib/marketing";
import { FeedFormatDefault } from "@/lib/types";

export async function GET() {
  try {
    const data = await readFeedFormatDefaults();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar padrões de feed" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const next = normalizeFeedFormatDefaults(body);
    const saved = await saveFeedFormatDefaults(next);
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar padrões de feed" },
      { status: 500 },
    );
  }
}
