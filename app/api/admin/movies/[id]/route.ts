import { requireAdmin } from "@/lib/auth";
import { deleteCachedKey } from "@/lib/cache";
import { MovieModel } from "@/lib/cinema-db";
import { validateMovieInput } from "@/lib/cinema-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return Response.json({ message: "Admin jogosultság szükséges." }, { status: 403 });
  }

  const { id } = await context.params;
  const movieId = Number(id);
  const body = await request.json().catch(() => null);
  const validation = validateMovieInput(body);

  if (!Number.isInteger(movieId) || movieId < 1) {
    return Response.json({ message: "Érvénytelen filmazonosító." }, { status: 400 });
  }

  if (!validation.isValid) {
    return Response.json(
      { message: "Hibás filmadatok.", errors: validation.errors },
      { status: 400 },
    );
  }

  if (!(await MovieModel.update(movieId, validation.movie))) {
    return Response.json({ message: "A film nem található." }, { status: 404 });
  }

  await deleteCachedKey("movies:with-screenings");
  return Response.json({ message: "Film frissítve." });
}
