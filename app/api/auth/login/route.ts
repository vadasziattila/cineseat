import { UserModel } from "@/lib/cinema-db";
import { createJwt, createSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const user = await UserModel.verifyCredentials(email, password);

  if (!user) {
    return Response.json(
      { message: "Hibás e-mail cím vagy jelszó." },
      { status: 401 },
    );
  }

  const token = createJwt(user);
  return Response.json(
    { user },
    { headers: { "Set-Cookie": createSessionCookie(token) } },
  );
}
