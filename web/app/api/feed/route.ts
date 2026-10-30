import { getWorkspaceData } from "@/lib/feed";
import { fail, ok } from "@/lib/respond";

export const maxDuration = 60;

export async function GET() {
  try {
    return ok(await getWorkspaceData());
  } catch (err) {
    return fail(err);
  }
}
