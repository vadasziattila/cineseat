import type { FormEvent } from "react";

import type { AdminMovieDraft, Movie } from "@/lib/cineseat-types";

import { TextInput } from "./text-input";

interface MovieManagementPanelProps {
  editMovie: AdminMovieDraft;
  movies: Movie[];
  onSelectMovie: (movieId: number) => void;
  onUpdateMovie: (event: FormEvent<HTMLFormElement>) => void;
  selectedMovieId: number | null;
  setEditMovie: (value: AdminMovieDraft) => void;
}

export function MovieManagementPanel({
  editMovie,
  movies,
  onSelectMovie,
  onUpdateMovie,
  selectedMovieId,
  setEditMovie,
}: MovieManagementPanelProps) {
  return (
    <section className="grid gap-5 border border-[#171512]/15 bg-[#fffdf8] p-4 md:p-5 xl:grid-cols-[280px_1fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9a321b]">
          Filmállomány
        </p>
        <h2 className="mt-2 text-3xl font-black">Meglévő filmek</h2>
        <div className="mt-5 grid gap-2">
          {movies.map((movie) => (
            <button
              className={`border px-3 py-3 text-left text-sm transition ${
                selectedMovieId === movie.id
                  ? "border-[#171512] bg-[#171512] text-white"
                  : "border-[#171512]/15 hover:border-[#171512]/50"
              }`}
              key={movie.id}
              onClick={() => onSelectMovie(movie.id)}
              type="button"
            >
              <strong className="block text-base">{movie.title}</strong>
              <span className="mt-1 block text-xs uppercase tracking-[0.14em] opacity-75">
                {movie.genre} / {movie.runtimeMinutes} perc
              </span>
            </button>
          ))}
        </div>
      </div>

      <form className="grid content-start gap-3" onSubmit={onUpdateMovie}>
        <h3 className="text-lg font-black">Film szerkesztése</h3>
        <TextInput
          label="Cím"
          onChange={(title) => setEditMovie({ ...editMovie, title })}
          value={editMovie.title}
        />
        <TextInput
          label="Műfaj"
          onChange={(genre) => setEditMovie({ ...editMovie, genre })}
          value={editMovie.genre}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Perc"
            onChange={(value) =>
              setEditMovie({ ...editMovie, runtimeMinutes: Number(value) })
            }
            type="number"
            value={String(editMovie.runtimeMinutes)}
          />
          <TextInput
            label="Korhatár"
            onChange={(rating) => setEditMovie({ ...editMovie, rating })}
            value={editMovie.rating}
          />
        </div>
        <label className="grid gap-2 text-sm font-bold">
          Plakátszín
          <select
            className="h-11 border border-[#171512]/20 bg-white px-3 font-normal"
            onChange={(event) =>
              setEditMovie({ ...editMovie, posterTone: event.target.value })
            }
            value={editMovie.posterTone}
          >
            <option value="cyan">cyan</option>
            <option value="gold">gold</option>
            <option value="rose">rose</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Leírás
          <textarea
            className="min-h-28 border border-[#171512]/20 bg-white px-3 py-2 font-normal outline-none transition focus:border-[#171512]"
            onChange={(event) =>
              setEditMovie({ ...editMovie, synopsis: event.target.value })
            }
            value={editMovie.synopsis}
          />
        </label>
        <button
          className="h-11 bg-[#171512] font-black uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:bg-[#b7afa4]"
          disabled={!selectedMovieId}
          type="submit"
        >
          Film frissítése
        </button>
      </form>
    </section>
  );
}
