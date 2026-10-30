import { getFirmDetail } from "@/lib/feed";
import { fail, ok } from "@/lib/respond";

export const maxDuration = 60;

export async function GET(_req: Request, ctx: RouteContext<"/api/firms/[id]">) {
  try {
    const { id } = await ctx.params;
    const firm = await getFirmDetail(decodeURIComponent(id));
    if (!firm) return Response.json({ error: "No researched firm has that id." }, { status: 404 });
    return ok(firm);
  } catch (err) {
    return fail(err);
  }
}
