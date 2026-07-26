import { readFile } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";
import { NextRequest, NextResponse } from "next/server";

const WORKSPACE_ROOT = "/root/.openclaw/workspace";
const STATIC_MARKETING_BASE =
  process.env.MARKETING_ASSET_BASE_URL ||
  "https://insta-marketing-dashboard.vercel.app/generated";

function contentTypeFor(path: string) {
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".mp3")) return "audio/mpeg";
  if (path.endsWith(".mp4")) return "video/mp4";
  return "application/octet-stream";
}

export async function GET(req: NextRequest) {
  try {
    const relPath = req.nextUrl.searchParams.get("path");
    if (!relPath) {
      return NextResponse.json({ error: "path obrigatório" }, { status: 400 });
    }

    const absolute = resolve(join(WORKSPACE_ROOT, relPath));
    if (absolute !== WORKSPACE_ROOT && !absolute.startsWith(`${WORKSPACE_ROOT}${sep}`)) {
      return NextResponse.json({ error: "path inválido" }, { status: 400 });
    }

    const filename = basename(absolute);
    const download = req.nextUrl.searchParams.get("download") === "1";
    const workspaceRelative = relative(WORKSPACE_ROOT, absolute);

    const isRuntimeAsset = workspaceRelative.startsWith("marketing/project/runtime/rendered/") || workspaceRelative.startsWith("marketing/project/runtime/video/");
    const isGeneratedAsset = workspaceRelative.startsWith("generated/rendered/") || workspaceRelative.startsWith("generated/video/");

    if (isRuntimeAsset || isGeneratedAsset) {
      const publicRelative = workspaceRelative
        .replace(/^marketing\/project\/runtime\/rendered\//, "rendered/")
        .replace(/^marketing\/project\/runtime\/video\//, "video/")
        .replace(/^generated\/rendered\//, "rendered/")
        .replace(/^generated\/video\//, "video/");
      const target = `${STATIC_MARKETING_BASE}/${publicRelative}`;
      const upstream = await fetch(target, { cache: "no-store" });
      if (upstream.ok) {
        const filename = basename(publicRelative);
        const download = req.nextUrl.searchParams.get("download") === "1";
        const body = await upstream.arrayBuffer();
        return new NextResponse(body, {
          headers: {
            "Content-Type": upstream.headers.get("content-type") || contentTypeFor(publicRelative),
            "Cache-Control": "public, max-age=60",
            ...(download ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
          },
        });
      }

      const localCandidates = isGeneratedAsset
        ? [join(WORKSPACE_ROOT, workspaceRelative), join(process.cwd(), "public", workspaceRelative)]
        : [absolute];

      for (const candidate of localCandidates) {
        try {
          const body = await readFile(candidate);
          return new NextResponse(body, {
            headers: {
              "Content-Type": contentTypeFor(candidate),
              "Cache-Control": "public, max-age=60",
              ...(download ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
            },
          });
        } catch {}
      }

      return NextResponse.json({ error: "asset não publicado" }, { status: 404 });
    }

    return NextResponse.json({ error: "asset não publicado" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar asset" },
      { status: 500 },
    );
  }
}
