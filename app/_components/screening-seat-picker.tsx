import { formatDateTime } from "@/lib/cineseat-format";
import type { Movie, Screening, SeatRow } from "@/lib/cineseat-types";

interface ScreeningSeatPickerProps {
  onSelectScreening: (screeningId: number) => void;
  onSelectSeat: (seatNumber: string) => void;
  seatMap: SeatRow[];
  selectedMovie: Movie | null;
  selectedScreening: Screening | null;
  selectedScreeningId: number | null;
  selectedSeat: string;
}

export function ScreeningSeatPicker({
  onSelectScreening,
  onSelectSeat,
  seatMap,
  selectedMovie,
  selectedScreening,
  selectedScreeningId,
  selectedSeat,
}: ScreeningSeatPickerProps) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#e9bc58]">
            Vetítések
          </p>
          <h2 className="mt-2 text-3xl font-black">
            {selectedMovie?.title ?? "Betöltés..."}
          </h2>
        </div>
        {selectedScreening ? (
          <p className="border border-white/20 px-3 py-2 text-sm">
            {selectedScreening.room} / {selectedScreening.ticketPrice} Ft
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
        {selectedMovie?.screenings.map((screening) => (
          <button
            className={`min-w-[170px] border px-4 py-3 text-left transition ${
              selectedScreeningId === screening.id
                ? "border-[#e9bc58] bg-[#e9bc58] text-[#171512]"
                : "border-white/20 text-white hover:border-white/60"
            }`}
            key={screening.id}
            onClick={() => onSelectScreening(screening.id)}
            type="button"
          >
            <span className="block text-lg font-black">
              {formatDateTime(screening.startsAt)}
            </span>
            <span className="mt-1 block text-xs uppercase tracking-[0.18em]">
              {32 - screening.reservedSeatCount} szabad hely
            </span>
          </button>
        ))}
      </div>

      <div className="mt-7">
        <div className="mx-auto mb-5 h-2 max-w-lg bg-[#fffdf8] shadow-[0_12px_35px_rgba(255,253,248,0.35)]" />
        <div className="grid gap-2">
          {seatMap.map((row) => (
            <div
              className="grid grid-cols-[24px_repeat(8,minmax(28px,1fr))] items-center gap-2"
              key={row.row}
            >
              <span className="text-sm font-bold text-white/55">{row.row}</span>
              {row.seats.map((seat) => (
                <button
                  aria-label={`Ülőhely ${seat.seatNumber}`}
                  className={`aspect-square min-h-8 border text-xs font-black transition ${
                    seat.isReserved
                      ? "cursor-not-allowed border-white/10 bg-white/10 text-white/25"
                      : selectedSeat === seat.seatNumber
                        ? "border-[#e9bc58] bg-[#e9bc58] text-[#171512]"
                        : "border-white/25 bg-transparent text-white hover:border-[#e9bc58]"
                  }`}
                  disabled={seat.isReserved}
                  key={seat.seatNumber}
                  onClick={() => onSelectSeat(seat.seatNumber)}
                  type="button"
                >
                  {seat.seatNumber}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
