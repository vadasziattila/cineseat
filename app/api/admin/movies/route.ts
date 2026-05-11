import { requireAdmin } from "@/lib/auth";
import { deleteCachedKey } from "@/lib/cache";
import { MovieModel } from "@/lib/cinema-db";
import { validateMovieInput } from "@/lib/cinema-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ message: "Admin jogosultság szükséges." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const validation = validateMovieInput(body);

  if (!validation.isValid) {
    return Response.json(
      { message: "Hibás filmadatok.", errors: validation.errors },
      { status: 400 },
    );
  }

  const movie = await MovieModel.create(validation.movie);
  await deleteCachedKey("movies:with-screenings");
  return Response.json({ movie }, { status: 201 });
}
