import {
  MovieModel,
  ReservationModel,
  ScreeningModel,
} from "@/lib/cinema-db";
import { buildSeatMap, validateReservationInput } from "@/lib/cinema-core";
import { getCurrentUser } from "@/lib/auth";
import { deleteCachedKey } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const screeningId = Number(url.searchParams.get("screeningId"));
  const mine = url.searchParams.get("mine") === "1";

  if (mine) {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ message: "Bejelentkezés szükséges." }, { status: 401 });
    }

    return Response.json({ reservations: ReservationModel.findByUser(user.id) });
  }

  if (Number.isInteger(screeningId) && screeningId > 0) {
    const reservations = ReservationModel.findByScreening(screeningId);
    return Response.json({
      reservations,
      seatMap: buildSeatMap(reservations),
    });
  }

  return Response.json({ reservations: ReservationModel.findAll() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateReservationInput(body);

  if (!validation.isValid) {
    return Response.json(
      { message: "Hibás foglalási adatok.", errors: validation.errors },
      { status: 400 },
    );
  }

  const { reservation } = validation;
  const screening = ScreeningModel.findById(reservation.screeningId);

  if (!MovieModel.exists(reservation.movieId) || !screening) {
    return Response.json(
      { message: "A kiválasztott film vagy vetítés nem található." },
      { status: 404 },
    );
  }

  if (screening.movieId !== reservation.movieId) {
    return Response.json(
      { message: "A vetítés nem ehhez a filmhez tartozik." },
      { status: 400 },
    );
  }

  const user = await getCurrentUser(request);

  try {
    const createdReservation = ReservationModel.create({
      ...reservation,
      userId: user?.id ?? null,
    });
    await deleteCachedKey("movies:with-screenings");
    return Response.json({ reservation: createdReservation }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return Response.json(
        { message: "Ez az ülőhely már foglalt erre a vetítésre." },
        { status: 409 },
      );
    }

    return Response.json(
      { message: "Nem sikerült létrehozni a foglalást." },
      { status: 500 },
    );
  }
}
