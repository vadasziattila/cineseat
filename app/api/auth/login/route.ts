import { SessionModel, UserModel } from "@/lib/cinema-db";
import { cacheSessionUser, createSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const user = UserModel.verifyCredentials(email, password);

  if (!user) {
    return Response.json(
      { message: "Hibás e-mail cím vagy jelszó." },
      { status: 401 },
    );
  }

  const session = SessionModel.create(user.id);
  await cacheSessionUser(session.token, user, session.expiresAt);
  return Response.json(
    { user },
    { headers: { "Set-Cookie": createSessionCookie(session.token, session.expiresAt) } },
  );
}
