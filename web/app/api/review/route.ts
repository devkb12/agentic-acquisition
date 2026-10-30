import { saveReview } from "@/lib/feed";
import { asDecision } from "@/lib/fit";
import { fail, ok } from "@/lib/respond";

const text = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").slice(0, n).trim();

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const decision = asDecision(b.decision);
  const input = {
    companyId: text(b.companyId, 200),
    companyName: text(b.companyName, 200),
    corrections: text(b.corrections, 1000),
    notes: text(b.notes, 2000),
    reviewer: text(b.reviewer, 80),
  };
  const problem = !input.companyId
    ? "Missing firm id."
    : !decision
      ? "Choose a decision."
      : !input.reviewer
        ? "Add your name."
        : !input.notes
          ? "Add a short rationale."
          : null;
  if (problem || !decision) return Response.json({ error: problem }, { status: 400 });
  try {
    await saveReview({ ...input, decision });
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
