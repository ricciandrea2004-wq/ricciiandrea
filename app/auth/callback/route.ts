import type { NextRequest } from "next/server";
import { GET as confirm } from "../confirm/route";

export const dynamic = "force-dynamic";

// Older links point here: same handling as /auth/confirm.
export function GET(request: NextRequest) {
  return confirm(request);
}
