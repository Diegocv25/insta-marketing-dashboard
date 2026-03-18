import { NextRequest, NextResponse } from "next/server";
import { getSupabaseFunilAdmin } from "@/lib/supabaseFunilAdmin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const status = String(body?.status ?? "").trim().toLowerCase();
    const feedback = String(body?.feedback ?? "").trim() || null;

    if (!["aprovado", "reprovado"].includes(status)) {
      return NextResponse.json({ error: "status inválido" }, { status: 400 });
    }

    const { client, error } = getSupabaseFunilAdmin();
    if (!client) {
      return NextResponse.json({ error }, { status: 500 });
    }

    const { error: updateError } = await client
      .from("marketing_creatives")
      .update({ approval_status: status, feedback_latest: feedback })
      .eq("id", id);

    if (updateError) throw new Error(updateError.message);

    const { error: feedbackError } = await client
      .from("marketing_feedback")
      .insert({ creative_id: id, status, feedback, reviewer: "Diego" });

    if (feedbackError) throw new Error(feedbackError.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao registrar review" },
      { status: 500 },
    );
  }
}
