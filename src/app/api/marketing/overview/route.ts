import { NextResponse } from "next/server";
import { fetchOverview } from "@/lib/marketing";

export async function GET() {
  try {
    const data = await fetchOverview();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar overview" },
      { status: 500 },
    );
  }
}
