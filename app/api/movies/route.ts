import { MovieModel } from "@/lib/cinema-db";
import { getCachedJson } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const movies = await getCachedJson("movies:with-screenings", 30, () =>
    MovieModel.findAllWithScreenings(),
  );
  return Response.json({ movies });
}
