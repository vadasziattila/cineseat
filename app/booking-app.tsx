"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { MemberPanel } from "./_components/member-panel";
import { Metric } from "./_components/metric";
import { MovieGrid } from "./_components/movie-grid";
import { ReservationForm } from "./_components/reservation-form";
import { ScreeningSeatPicker } from "./_components/screening-seat-picker";
import type {
  AuthMode,
  Movie,
  ReservationSummary,
  SeatRow,
  User,
} from "@/lib/cineseat-types";

const DEFAULT_AUTH_EMAIL = "demo@cineseat.local";
const DEFAULT_AUTH_PASSWORD = "demo123";

export default function BookingApp() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedScreeningId, setSelectedScreeningId] = useState<number | null>(null);
  const [seatMap, setSeatMap] = useState<SeatRow[]>([]);
  const [selectedSeat, setSelectedSeat] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState(DEFAULT_AUTH_EMAIL);
  const [authPassword, setAuthPassword] = useState(DEFAULT_AUTH_PASSWORD);
  const [myReservations, setMyReservations] = useState<ReservationSummary[]>([]);
  const [status, setStatus] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMovie = useMemo(
    () => movies.find((movie) => movie.id === selectedMovieId) ?? null,
    [movies, selectedMovieId],
  );

  const selectedScreening = useMemo(
    () =>
      selectedMovie?.screenings.find(
        (screening) => screening.id === selectedScreeningId,
      ) ?? null,
    [selectedMovie, selectedScreeningId],
  );

  useEffect(() => {
    void loadMovies();
    void loadCurrentUser();
  }, []);

  useEffect(() => {
    async function loadSeats() {
      if (!selectedScreeningId) return;

      const response = await fetch(`/api/reservations?screeningId=${selectedScreeningId}`);
      const data = (await response.json()) as { seatMap: SeatRow[] };
      setSeatMap(data.seatMap);
      setSelectedSeat("");
      setStatus("");
    }

    void loadSeats();
  }, [selectedScreeningId]);

  async function loadMovies() {
    const response = await fetch("/api/movies");
    const data = (await response.json()) as { movies: Movie[] };

    setMovies(data.movies);
    setSelectedMovieId((current) => current ?? data.movies[0]?.id ?? null);
    setSelectedScreeningId((current) => current ?? data.movies[0]?.screenings[0]?.id ?? null);
  }

  async function loadCurrentUser() {
    const response = await fetch("/api/auth/me");
    const data = (await response.json()) as { user: User | null };
    setUser(data.user);

    if (data.user) {
      setCustomerName(data.user.name);
      setEmail(data.user.email);
      await loadMyReservations();
    }
  }

  async function loadMyReservations() {
    const response = await fetch("/api/reservations?mine=1");
    if (!response.ok) {
      setMyReservations([]);
      return;
    }

    const data = (await response.json()) as { reservations: ReservationSummary[] };
    setMyReservations(data.reservations);
  }

  function selectMovie(movie: Movie) {
    setSelectedMovieId(movie.id);
    setSelectedScreeningId(movie.screenings[0]?.id ?? null);
  }

  function resetAuthForm() {
    setAuthMode("login");
    setAuthName("");
    setAuthEmail(DEFAULT_AUTH_EMAIL);
    setAuthPassword(DEFAULT_AUTH_PASSWORD);
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthStatus("");

    const response = await fetch(`/api/auth/${authMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: authName,
        email: authEmail,
        password: authPassword,
      }),
    });
    const data = (await response.json()) as { user?: User; message?: string };

    if (!response.ok || !data.user) {
      setAuthStatus(data.message ?? "Sikertelen belépés.");
      return;
    }

    setUser(data.user);
    setCustomerName(data.user.name);
    setEmail(data.user.email);
    resetAuthForm();
    setAuthStatus("Sikeres belépés.");
    await loadMyReservations();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCustomerName("");
    setEmail("");
    resetAuthForm();
    setMyReservations([]);
    setAuthStatus("Kijelentkezve.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMovie || !selectedScreening || !selectedSeat) {
      setStatus("Válassz filmet, időpontot és ülőhelyet.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");

    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        email,
        movieId: selectedMovie.id,
        screeningId: selectedScreening.id,
        seatNumber: selectedSeat,
      }),
    });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setStatus(data.message ?? "Nem sikerült a foglalás.");
      setIsSubmitting(false);
      return;
    }

    const [seatResponse] = await Promise.all([
      fetch(`/api/reservations?screeningId=${selectedScreening.id}`),
      loadMovies(),
      loadMyReservations(),
    ]);
    const seatData = (await seatResponse.json()) as { seatMap: SeatRow[] };
    setSeatMap(seatData.seatMap);
    setSelectedSeat("");
    setStatus(
      "Foglalás rögzítve. Bejelentkezett felhasználóknál megjelenik a saját foglalások között.",
    );
    setIsSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#171512]">
      <section className="mx-auto grid min-h-screen w-full max-w-[86rem] grid-cols-1 gap-8 px-5 py-6 md:grid-cols-[minmax(260px,0.82fr)_minmax(0,2.18fr)] lg:px-8">
        <aside className="flex flex-col border-b border-[#171512]/15 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#9a321b]">
              CineSeat
            </p>
            <h1 className="mt-5 max-w-[20rem] text-5xl font-black leading-[0.95] text-[#171512] sm:text-6xl md:text-[clamp(2.55rem,3.7vw,4rem)]">
              Mozijegy-foglalás egyetlen vászonról.
            </h1>
            <p className="mt-5 text-base leading-7 text-[#5d574f]">
              Filmek, vetítések, felhasználói foglalások és admin kezelés egy
              relációs adatbázisra építve.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 md:mt-auto md:grid-cols-1 md:pt-8">
            <Metric label="film" value={movies.length} />
            <Metric
              label="vetítés"
              value={movies.reduce((sum, movie) => sum + movie.screenings.length, 0)}
            />
            <Metric label="szék/terem" value={32} />
          </div>
        </aside>

        <div className="grid gap-6">
          <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
            <MovieGrid
              movies={movies}
              onSelectMovie={selectMovie}
              selectedMovieId={selectedMovieId}
            />

            <MemberPanel
              authEmail={authEmail}
              authMode={authMode}
              authName={authName}
              authPassword={authPassword}
              authStatus={authStatus}
              myReservations={myReservations}
              onAuth={handleAuth}
              onLogout={handleLogout}
              setAuthEmail={setAuthEmail}
              setAuthMode={setAuthMode}
              setAuthName={setAuthName}
              setAuthPassword={setAuthPassword}
              user={user}
            />
          </section>

          <section className="grid gap-6 bg-[#171512] p-4 text-[#fffdf8] md:p-6 lg:grid-cols-[1fr_370px]">
            <ScreeningSeatPicker
              onSelectScreening={setSelectedScreeningId}
              onSelectSeat={setSelectedSeat}
              seatMap={seatMap}
              selectedMovie={selectedMovie}
              selectedScreening={selectedScreening}
              selectedScreeningId={selectedScreeningId}
              selectedSeat={selectedSeat}
            />

            <ReservationForm
              customerName={customerName}
              email={email}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              selectedMovie={selectedMovie}
              selectedScreening={selectedScreening}
              selectedSeat={selectedSeat}
              setCustomerName={setCustomerName}
              setEmail={setEmail}
              status={status}
            />
          </section>
        </div>
      </section>
    </main>
  );
}
