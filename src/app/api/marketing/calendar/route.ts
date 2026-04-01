import { NextRequest, NextResponse } from "next/server";
import { normalizeCalendarPayload, readCalendar, saveCalendar } from "@/lib/marketing";

export async function GET() {
  try {
    const data = await readCalendar();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar calendário" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const next = normalizeCalendarPayload(body);
    const saved = await saveCalendar(next);
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar calendário" },
      { status: 500 },
    );
  }
}
