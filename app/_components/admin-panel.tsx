import type { FormEvent } from "react";

import type {
  AdminMovieDraft,
  AdminScreeningDraft,
  Movie,
} from "@/lib/cineseat-types";

import { StatusText } from "./status-text";
import { TextInput } from "./text-input";

interface AdminPanelProps {
  adminStatus: string;
  movies: Movie[];
  newMovie: AdminMovieDraft;
  newScreening: AdminScreeningDraft;
  onCreateMovie: (event: FormEvent<HTMLFormElement>) => void;
  onCreateScreening: (event: FormEvent<HTMLFormElement>) => void;
  setNewMovie: (value: AdminMovieDraft) => void;
  setNewScreening: (value: AdminScreeningDraft) => void;
}

export function AdminPanel({
  adminStatus,
  movies,
  newMovie,
  newScreening,
  onCreateMovie,
  onCreateScreening,
  setNewMovie,
  setNewScreening,
}: AdminPanelProps) {
  return (
    <section className="grid gap-5 border border-[#171512]/15 bg-[#fffdf8] p-4 md:p-5 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9a321b]">
          Admin
        </p>
        <h2 className="mt-2 text-3xl font-black">Filmek és vetítések kezelése</h2>
      </div>

      <form className="grid gap-3" onSubmit={onCreateMovie}>
        <h3 className="text-lg font-black">Új film</h3>
        <TextInput
          label="Cím"
          onChange={(title) => setNewMovie({ ...newMovie, title })}
          value={newMovie.title}
        />
        <TextInput
          label="Műfaj"
          onChange={(genre) => setNewMovie({ ...newMovie, genre })}
          value={newMovie.genre}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Perc"
            onChange={(value) =>
              setNewMovie({ ...newMovie, runtimeMinutes: Number(value) })
            }
            type="number"
            value={String(newMovie.runtimeMinutes)}
          />
          <TextInput
            label="Korhatár"
            onChange={(rating) => setNewMovie({ ...newMovie, rating })}
            value={newMovie.rating}
          />
        </div>
        <label className="grid gap-2 text-sm font-bold">
          Plakátszín
          <select
            className="h-11 border border-[#171512]/20 bg-white px-3 font-normal"
            onChange={(event) =>
              setNewMovie({ ...newMovie, posterTone: event.target.value })
            }
            value={newMovie.posterTone}
          >
            <option value="cyan">cyan</option>
            <option value="gold">gold</option>
            <option value="rose">rose</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Leírás
          <textarea
            className="min-h-24 border border-[#171512]/20 bg-white px-3 py-2 font-normal outline-none transition focus:border-[#171512]"
            onChange={(event) =>
              setNewMovie({ ...newMovie, synopsis: event.target.value })
            }
            value={newMovie.synopsis}
          />
        </label>
        <button className="h-11 bg-[#171512] font-black uppercase tracking-[0.16em] text-white">
          Film mentése
        </button>
      </form>

      <form className="grid content-start gap-3" onSubmit={onCreateScreening}>
        <h3 className="text-lg font-black">Új vetítés</h3>
        <label className="grid gap-2 text-sm font-bold">
          Film
          <select
            className="h-11 border border-[#171512]/20 bg-white px-3 font-normal"
            onChange={(event) =>
              setNewScreening({ ...newScreening, movieId: event.target.value })
            }
            value={newScreening.movieId || movies[0]?.id || ""}
          >
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id}>
                {movie.title}
              </option>
            ))}
          </select>
        </label>
        <TextInput
          label="Időpont"
          onChange={(startsAt) => setNewScreening({ ...newScreening, startsAt })}
          type="datetime-local"
          value={newScreening.startsAt}
        />
        <TextInput
          label="Terem"
          onChange={(room) => setNewScreening({ ...newScreening, room })}
          value={newScreening.room}
        />
        <TextInput
          label="Jegyár"
          onChange={(value) =>
            setNewScreening({ ...newScreening, ticketPrice: Number(value) })
          }
          type="number"
          value={String(newScreening.ticketPrice)}
        />
        <button className="h-11 bg-[#9a321b] font-black uppercase tracking-[0.16em] text-white">
          Vetítés mentése
        </button>
        {adminStatus ? <StatusText>{adminStatus}</StatusText> : null}
      </form>
    </section>
  );
}
