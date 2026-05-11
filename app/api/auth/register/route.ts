import { SessionModel, UserModel } from "@/lib/cinema-db";
import { cacheSessionUser, createSessionCookie } from "@/lib/auth";
import { validateUserInput } from "@/lib/cinema-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateUserInput(body);

  if (!validation.isValid) {
    return Response.json(
      { message: "Hibás regisztrációs adatok.", errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const user = UserModel.create(validation.user);
    const session = SessionModel.create(user.id);
    await cacheSessionUser(session.token, user, session.expiresAt);

    return Response.json(
      { user },
      {
        status: 201,
        headers: { "Set-Cookie": createSessionCookie(session.token, session.expiresAt) },
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return Response.json(
        { message: "Ezzel az e-mail címmel már van felhasználó." },
        { status: 409 },
      );
    }

    return Response.json({ message: "Nem sikerült a regisztráció." }, { status: 500 });
  }
}
