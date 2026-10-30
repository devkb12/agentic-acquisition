import { FeedError } from "@/lib/feed";

const NO_STORE = { "Cache-Control": "private, no-store" };

export function ok(data: unknown) {
  return Response.json(data, { headers: NO_STORE });
}

export function fail(err: unknown) {
  if (err instanceof FeedError) {
    const status = err.code === "not-configured" ? 503 : 502;
    return Response.json({ error: err.message, code: err.code }, { status, headers: NO_STORE });
  }
  console.error(err);
  return Response.json({ error: "Something went wrong reading the research data." }, { status: 500, headers: NO_STORE });
}
