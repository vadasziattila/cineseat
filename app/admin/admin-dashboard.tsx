"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { AdminPanel } from "@/app/_components/admin-panel";
import { Metric } from "@/app/_components/metric";
import { MovieManagementPanel } from "@/app/_components/movie-management-panel";
import { StatusText } from "@/app/_components/status-text";
import { TextInput } from "@/app/_components/text-input";
import type {
  AdminMovieDraft,
  AdminScreeningDraft,
  Movie,
  User,
} from "@/lib/cineseat-types";

const EMPTY_MOVIE_DRAFT: AdminMovieDraft = {
  title: "",
  genre: "",
  runtimeMinutes: 100,
  rating: "12+",
  posterTone: "cyan",
  synopsis: "",
};

const EMPTY_SCREENING_DRAFT: AdminScreeningDraft = {
  movieId: "",
  startsAt: "2026-05-14T19:00",
  room: "Premier terem",
  ticketPrice: 2490,
};

function draftFromMovie(movie: Movie): AdminMovieDraft {
  return {
    title: movie.title,
    genre: movie.genre,
    runtimeMinutes: movie.runtimeMinutes,
    rating: movie.rating,
    posterTone: movie.posterTone,
    synopsis: movie.synopsis,
  };
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [editMovie, setEditMovie] = useState<AdminMovieDraft>(EMPTY_MOVIE_DRAFT);
  const [newMovie, setNewMovie] = useState<AdminMovieDraft>(EMPTY_MOVIE_DRAFT);
  const [newScreening, setNewScreening] =
    useState<AdminScreeningDraft>(EMPTY_SCREENING_DRAFT);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const selectedMovie = useMemo(
    () => movies.find((movie) => movie.id === selectedMovieId) ?? null,
    [movies, selectedMovieId],
  );

  useEffect(() => {
    void loadAdminContext();
  }, []);

  async function loadAdminContext() {
    setIsLoading(true);

    const response = await fetch("/api/auth/me");
    const data = (await response.json()) as { user: User | null };

    if (data.user?.role !== "admin") {
      setUser(null);
      setMovies([]);
      setSelectedMovieId(null);
      setEditMovie(EMPTY_MOVIE_DRAFT);
      setIsLoading(false);
      return;
    }

    setUser(data.user);
    await loadMovies();
    setIsLoading(false);
  }

  async function loadMovies() {
    const response = await fetch("/api/movies");
    const data = (await response.json()) as { movies: Movie[] };
    setMovies(data.movies);

    const nextSelectedMovie =
      data.movies.find((movie) => movie.id === selectedMovieId) ?? data.movies[0] ?? null;
    setSelectedMovieId(nextSelectedMovie?.id ?? null);
    setEditMovie(nextSelectedMovie ? draftFromMovie(nextSelectedMovie) : EMPTY_MOVIE_DRAFT);
  }

  function selectMovie(movieId: number) {
    const movie = movies.find((item) => item.id === movieId);
    setSelectedMovieId(movie?.id ?? null);
    setEditMovie(movie ? draftFromMovie(movie) : EMPTY_MOVIE_DRAFT);
    setAdminStatus("");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthStatus("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: authEmail,
        password: authPassword,
      }),
    });
    const data = (await response.json()) as { user?: User; message?: string };

    if (!response.ok || !data.user) {
      setAuthStatus(data.message ?? "Sikertelen belépés.");
      return;
    }

    if (data.user.role !== "admin") {
      await fetch("/api/auth/logout", { method: "POST" });
      setAuthStatus("Admin jogosultság szükséges.");
      return;
    }

    setUser(data.user);
    setAuthEmail("");
    setAuthPassword("");
    setAuthStatus("Sikeres admin belépés.");
    await loadMovies();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMovies([]);
    setSelectedMovieId(null);
    setEditMovie(EMPTY_MOVIE_DRAFT);
    setAuthStatus("Kijelentkezve.");
  }

  async function handleUpdateMovie(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMovieId) return;

    setAdminStatus("");

    const response = await fetch(`/api/admin/movies/${selectedMovieId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editMovie),
    });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setAdminStatus(data.message ?? "Nem sikerült frissíteni a filmet.");
      return;
    }

    setAdminStatus("Film frissítve.");
    await loadMovies();
  }

  async function handleCreateMovie(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminStatus("");

    const response = await fetch("/api/admin/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMovie),
    });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setAdminStatus(data.message ?? "Nem sikerült a film rögzítése.");
      return;
    }

    setNewMovie(EMPTY_MOVIE_DRAFT);
    setAdminStatus("Film hozzáadva.");
    await loadMovies();
  }

  async function handleCreateScreening(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminStatus("");

    const response = await fetch("/api/admin/screenings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newScreening,
        movieId: Number(newScreening.movieId || selectedMovieId),
      }),
    });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setAdminStatus(data.message ?? "Nem sikerült a vetítés rögzítése.");
      return;
    }

    setAdminStatus("Vetítés hozzáadva.");
    await loadMovies();
  }

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#171512]">
      <section className="mx-auto grid w-full max-w-[86rem] gap-6 px-5 py-6 lg:px-8">
        <header className="grid gap-4 border-b border-[#171512]/15 pb-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#9a321b]">
              CineSeat admin
            </p>
            <h1 className="mt-3 text-5xl font-black leading-none md:text-6xl">
              Admin felület
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#5d574f]">
              Filmek szerkesztése, új filmek és vetítések felvétele külön admin
              nézetben.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="border border-[#171512]/20 px-4 py-3 text-xs font-black uppercase tracking-[0.16em]"
              href="/"
            >
              Foglalási oldal
            </Link>
            {user ? (
              <button
                className="bg-[#171512] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white"
                onClick={handleLogout}
                type="button"
              >
                Kilépés
              </button>
            ) : null}
          </div>
        </header>

        {isLoading ? (
          <section className="border border-[#171512]/15 bg-[#fffdf8] p-5">
            <p className="text-lg font-black">Betöltés...</p>
          </section>
        ) : null}

        {!isLoading && !user ? (
          <section className="grid gap-5 border border-[#171512]/15 bg-[#fffdf8] p-5 md:grid-cols-[1fr_360px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9a321b]">
                Belépés
              </p>
              <h2 className="mt-2 text-3xl font-black">Admin azonosítás</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#5d574f]">
                Az admin felület csak admin szerepkörrel érhető el. A belépési
                adatokat a környezeti változók határozzák meg.
              </p>
            </div>
            <form className="grid content-start gap-3" onSubmit={handleLogin}>
              <TextInput label="E-mail" onChange={setAuthEmail} value={authEmail} />
              <TextInput
                label="Jelszó"
                onChange={setAuthPassword}
                type="password"
                value={authPassword}
              />
              <button className="h-11 bg-[#171512] font-black uppercase tracking-[0.16em] text-white">
                Admin belépés
              </button>
              {authStatus ? <StatusText>{authStatus}</StatusText> : null}
            </form>
          </section>
        ) : null}

        {!isLoading && user ? (
          <>
            <section className="grid gap-3 sm:grid-cols-3">
              <Metric label="film" value={movies.length} />
              <Metric
                label="vetítés"
                value={movies.reduce((sum, movie) => sum + movie.screenings.length, 0)}
              />
              <Metric label="kiválasztva" value={selectedMovie ? selectedMovie.id : 0} />
            </section>

            {adminStatus ? <StatusText>{adminStatus}</StatusText> : null}

            <MovieManagementPanel
              editMovie={editMovie}
              movies={movies}
              onSelectMovie={selectMovie}
              onUpdateMovie={handleUpdateMovie}
              selectedMovieId={selectedMovieId}
              setEditMovie={setEditMovie}
            />

            <AdminPanel
              adminStatus=""
              movies={movies}
              newMovie={newMovie}
              newScreening={newScreening}
              onCreateMovie={handleCreateMovie}
              onCreateScreening={handleCreateScreening}
              setNewMovie={setNewMovie}
              setNewScreening={setNewScreening}
            />
          </>
        ) : null}
      </section>
    </main>
  );
}
