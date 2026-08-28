import {
  assertDev,
  readRaw,
  safeSlug,
  writeRaw,
  DraftEditError,
} from "@/lib/draft-edit";
import type { DraftSource } from "@/lib/drafts";

function asSource(value: unknown): DraftSource {
  if (value === "content" || value === "archive") return value;
  throw new DraftEditError(`不合法的 source：${String(value)}`);
}

function fail(error: unknown) {
  return Response.json(
    { error: error instanceof Error ? error.message : "未知錯誤" },
    { status: error instanceof DraftEditError ? 400 : 500 },
  );
}

export async function GET(request: Request) {
  try {
    assertDev();
    const params = new URL(request.url).searchParams;
    const slug = safeSlug(params.get("slug"));
    const source = asSource(params.get("source"));
    return Response.json({ slug, source, raw: readRaw(slug, source) });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertDev();
    const body = (await request.json()) as {
      slug?: string;
      source?: string;
      raw?: string;
    };
    const slug = safeSlug(body.slug);
    const source = asSource(body.source);
    writeRaw(slug, source, body.raw ?? "");
    return Response.json({ ok: true, slug, source });
  } catch (error) {
    return fail(error);
  }
}
