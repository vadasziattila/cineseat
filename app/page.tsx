import BookingApp from "./booking-app";
import { buildSeatMap } from "@/lib/cinema-core";
import { MovieModel, ReservationModel } from "@/lib/cinema-db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CineSeat | Mozijegy-foglalás",
  description:
    "Böngéssz filmeket, válassz vetítést és foglalj ülőhelyet online a CineSeat mozijegy-foglaló rendszerben.",
};

export default async function Home() {
  const movies = await MovieModel.findAllWithScreenings();
  const initialScreeningId = movies[0]?.screenings[0]?.id ?? null;
  const initialReservations = initialScreeningId
    ? await ReservationModel.findByScreening(initialScreeningId)
    : [];

  return (
    <BookingApp
      initialMovies={movies}
      initialSeatMap={buildSeatMap(initialReservations)}
    />
  );
}
