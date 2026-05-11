import type { Movie, PosterTone } from "@/lib/cineseat-types";

const posterStyles: Record<PosterTone, string> = {
  cyan: "from-cyan-300 via-slate-900 to-lime-200",
  gold: "from-amber-200 via-orange-900 to-sky-200",
  rose: "from-rose-300 via-zinc-950 to-stone-200",
};

interface MovieGridProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  selectedMovieId: number | null;
}

export function MovieGrid({ movies, onSelectMovie, selectedMovieId }: MovieGridProps) {
  return (
    <div
      className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4"
      aria-label="Filmek"
    >
      {movies.map((movie) => (
        <button
          className={`group grid min-h-[290px] content-between border p-4 text-left transition ${
            selectedMovieId === movie.id
              ? "border-[#171512] bg-white shadow-[8px_8px_0_#171512]"
              : "border-[#171512]/15 bg-[#fffdf8] hover:border-[#171512]/45"
          }`}
          key={movie.id}
          onClick={() => onSelectMovie(movie)}
          type="button"
        >
          <div
            className={`h-28 bg-gradient-to-br ${posterStyles[movie.posterTone]} p-3 text-white`}
          >
            <span className="inline-flex border border-white/55 px-2 py-1 text-xs font-bold uppercase tracking-[0.22em]">
              {movie.rating}
            </span>
          </div>
          <div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#9a321b]">
              {movie.genre} / {movie.runtimeMinutes} perc
            </p>
            <h2 className="mt-2 text-[1.65rem] font-black leading-[1.04]">
              {movie.title}
            </h2>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#5d574f]">
              {movie.synopsis}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
