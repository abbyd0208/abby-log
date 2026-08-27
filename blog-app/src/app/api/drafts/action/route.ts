import {
  assertDev,
  createDraft,
  publish,
  safeSlug,
  unpublish,
  DraftEditError,
} from "@/lib/draft-edit";
import { getSeed } from "@/lib/seeds";
import type { DraftSource } from "@/lib/drafts";

type Body = {
  action?: "publish" | "unpublish" | "create";
  slug?: string;
  source?: DraftSource;
  title?: string;
  seedId?: string;
};

export async function POST(request: Request) {
  try {
    assertDev();
    const body = (await request.json()) as Body;

    switch (body.action) {
      case "publish": {
        const source = body.source === "archive" ? "archive" : "content";
        return Response.json({ ok: true, slug: publish(safeSlug(body.slug), source) });
      }

      case "unpublish":
        return Response.json({ ok: true, slug: unpublish(safeSlug(body.slug)) });

      case "create": {
        const seed = body.seedId ? getSeed(body.seedId) : undefined;
        if (seed?.blocked) {
          throw new DraftEditError(`這題 manifest 判定不公開：${seed.blockedReason}`);
        }
        const slug = createDraft({
          slug: safeSlug(body.slug),
          title: body.title ?? seed?.title ?? seed?.topic ?? "",
          seedRaw: seed?.raw,
        });
        return Response.json({ ok: true, slug });
      }

      default:
        throw new DraftEditError(`未知的 action：${String(body.action)}`);
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "未知錯誤" },
      { status: error instanceof DraftEditError ? 400 : 500 },
    );
  }
}
