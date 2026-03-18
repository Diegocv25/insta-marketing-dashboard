import { NextResponse } from "next/server";
import { getSupabaseFunilAdmin } from "@/lib/supabaseFunilAdmin";

export async function GET() {
  try {
    const { client, error } = getSupabaseFunilAdmin();
    if (!client) {
      return NextResponse.json({ error }, { status: 500 });
    }

    const { data: project, error: projectError } = await client
      .from("marketing_projects")
      .select("*")
      .eq("slug", "nexus-instagram-marketing")
      .single();

    if (projectError) throw new Error(projectError.message);

    const [tasksRes, creativesRes] = await Promise.all([
      client
        .from("marketing_tasks")
        .select("*")
        .eq("project_id", project.id)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
      client
        .from("marketing_creatives")
        .select("*")
        .eq("project_id", project.id)
        .order("delivery_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    if (tasksRes.error) throw new Error(tasksRes.error.message);
    if (creativesRes.error) throw new Error(creativesRes.error.message);

    const tasks = tasksRes.data ?? [];
    const creatives = creativesRes.data ?? [];

    const summary = {
      totalTasks: tasks.length,
      totalCreatives: creatives.length,
      pendentes: creatives.filter((c: any) => c.approval_status === "pendente").length,
      aprovados: creatives.filter((c: any) => c.approval_status === "aprovado").length,
      reprovados: creatives.filter((c: any) => c.approval_status === "reprovado").length,
      productCount: creatives.filter((c: any) => c.theme_mode === "product").length,
      brandCount: creatives.filter((c: any) => c.theme_mode === "brand").length,
    };

    return NextResponse.json({ project, tasks, creatives, summary, updatedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar overview de marketing" },
      { status: 500 },
    );
  }
}
