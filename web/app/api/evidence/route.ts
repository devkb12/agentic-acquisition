import { searchEvidence } from "@/lib/feed";
import { fail, ok } from "@/lib/respond";

export const maxDuration = 60;

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const int = (v: string | null, d: number, max: number) => Math.min(max, Math.max(1, Number.parseInt(v ?? "", 10) || d));
  try {
    return ok(
      await searchEvidence({
        q: (p.get("q") ?? "").slice(0, 200),
        status: p.get("status") ?? "",
        field: p.get("field") ?? "",
        includeSample: p.get("sample") === "1",
        page: int(p.get("page"), 1, 10_000),
        pageSize: int(p.get("pageSize"), 50, 200),
      }),
    );
  } catch (err) {
    return fail(err);
  }
}
