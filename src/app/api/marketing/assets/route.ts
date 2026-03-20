import { readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { NextRequest, NextResponse } from "next/server";

const WORKSPACE_ROOT = "/root/.openclaw/workspace";

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

    const data = await readFile(absolute);
    const filename = basename(absolute);
    const download = req.nextUrl.searchParams.get("download") === "1";
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentTypeFor(absolute),
        "Cache-Control": "public, max-age=60",
        ...(download ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar asset" },
      { status: 500 },
    );
  }
}
