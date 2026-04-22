import { readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { NextRequest, NextResponse } from "next/server";

const WORKSPACE_ROOT = "/root/.openclaw/workspace";
const STATIC_MARKETING_BASE = "https://insta-marketing-dashboard.vercel.app/generated";

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
    if (!absolute.startsWith(WORKSPACE_ROOT)) {
      return NextResponse.json({ error: "path inválido" }, { status: 400 });
    }

    const filename = basename(absolute);
    const download = req.nextUrl.searchParams.get("download") === "1";
    const relative = absolute.replace(`${WORKSPACE_ROOT}/`, "");

    const isRuntimeAsset = relative.startsWith("marketing/project/runtime/rendered/") || relative.startsWith("marketing/project/runtime/video/");
    const isGeneratedAsset = relative.startsWith("generated/rendered/") || relative.startsWith("generated/video/");

    if (isRuntimeAsset || isGeneratedAsset) {
      const publicRelative = relative
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
        ? [join(WORKSPACE_ROOT, relative), join(WORKSPACE_ROOT, 'repos/insta-marketing-dashboard/public', relative)]
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
