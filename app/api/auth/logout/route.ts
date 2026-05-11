import { clearSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json(
    { message: "Kijelentkezve." },
    { headers: { "Set-Cookie": clearSessionCookie() } },
  );
}
