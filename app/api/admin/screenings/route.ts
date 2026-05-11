import { requireAdmin } from "@/lib/auth";
import { deleteCachedKey } from "@/lib/cache";
import { MovieModel, ScreeningModel } from "@/lib/cinema-db";
import { validateScreeningInput } from "@/lib/cinema-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ message: "Admin jogosultság szükséges." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const validation = validateScreeningInput(body);

  if (!validation.isValid) {
    return Response.json(
      { message: "Hibás vetítési adatok.", errors: validation.errors },
      { status: 400 },
    );
  }

  if (!(await MovieModel.exists(validation.screening.movieId))) {
    return Response.json({ message: "A film nem található." }, { status: 404 });
  }

  const screening = await ScreeningModel.create(validation.screening);
  await deleteCachedKey("movies:with-screenings");

  return Response.json({ screening }, { status: 201 });
}
