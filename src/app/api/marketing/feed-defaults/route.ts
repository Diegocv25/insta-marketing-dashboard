import { NextRequest, NextResponse } from "next/server";
import { getSupabaseFunilAdmin } from "@/lib/supabaseFunilAdmin";

const PROJECT_SLUG = "nexus-instagram-marketing";

export async function GET() {
  try {
    const { client: funil, error } = getSupabaseFunilAdmin();
    if (!funil) throw new Error(error || "Supabase indisponível");

    const { data, error: fetchError } = await funil
      .from("marketing_feed_format_defaults")
      .select("*")
      .eq("project_slug", PROJECT_SLUG);

    if (fetchError) throw new Error(fetchError.message);

    // Transformar em objeto simples { monday: "carousel", tuesday: "reels", ... }
    const defaults: Record<string, string> = {};
    (data || []).forEach((row: { day_of_week: string; feed_format: string | null }) => {
      defaults[row.day_of_week] = row.feed_format || "";
    });

    return NextResponse.json({ defaults });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const defaults: Record<string, string> = body.defaults || {};

    const { client: funil, error } = getSupabaseFunilAdmin();
    if (!funil) throw new Error(error || "Supabase indisponível");

    const rows = Object.entries(defaults).map(([day, format]) => ({
      project_slug: PROJECT_SLUG,
      day_of_week: day,
      feed_format: format || null,
    }));

    const { error: upsertError } = await funil
      .from("marketing_feed_format_defaults")
      .upsert(rows, { onConflict: "project_slug,day_of_week" });

    if (upsertError) throw new Error(upsertError.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar" },
      { status: 500 }
    );
  }
}
