import { UserModel } from "@/lib/cinema-db";
import { createJwt, createSessionCookie } from "@/lib/auth";
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
    const user = await UserModel.create(validation.user);
    const token = createJwt(user);

    return Response.json(
      { user },
      {
        status: 201,
        headers: { "Set-Cookie": createSessionCookie(token) },
      },
    );
  } catch (error) {
    if (error instanceof Error && (error.message.includes("Unique") || error.message.includes("P2002"))) {
      return Response.json(
        { message: "Ezzel az e-mail címmel már van felhasználó." },
        { status: 409 },
      );
    }

    return Response.json({ message: "Nem sikerült a regisztráció." }, { status: 500 });
  }
}
