import { NextResponse } from "next/server";
import { fetchMarketingOverview } from "@/lib/marketing";

export async function GET() {
  try {
    const data = await fetchMarketingOverview();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar overview de marketing" },
      { status: 500 },
    );
  }
}
