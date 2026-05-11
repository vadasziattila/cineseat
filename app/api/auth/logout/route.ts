import {
  clearSessionCache,
  clearSessionCookie,
  getSessionCookieName,
  parseCookie,
} from "@/lib/auth";
import { SessionModel } from "@/lib/cinema-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = parseCookie(request.headers.get("cookie"), getSessionCookieName());
  SessionModel.delete(token);
  await clearSessionCache(token);

  return Response.json(
    { message: "Kijelentkezve." },
    { headers: { "Set-Cookie": clearSessionCookie() } },
  );
}
