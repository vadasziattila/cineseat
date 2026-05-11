import type { FormEvent } from "react";

import { formatDateTime } from "@/lib/cineseat-format";
import type { Movie, Screening } from "@/lib/cineseat-types";

import { StatusText } from "./status-text";
import { SummaryLine } from "./summary-line";
import { TextInput } from "./text-input";

interface ReservationFormProps {
  customerName: string;
  email: string;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  selectedMovie: Movie | null;
  selectedScreening: Screening | null;
  selectedSeat: string;
  setCustomerName: (value: string) => void;
  setEmail: (value: string) => void;
  status: string;
}

export function ReservationForm({
  customerName,
  email,
  isSubmitting,
  onSubmit,
  selectedMovie,
  selectedScreening,
  selectedSeat,
  setCustomerName,
  setEmail,
  status,
}: ReservationFormProps) {
  return (
    <form
      className="grid content-start gap-4 bg-[#fffdf8] p-4 text-[#171512]"
      onSubmit={onSubmit}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9a321b]">
          Foglalás
        </p>
        <h2 className="mt-2 text-3xl font-black">Jegy rögzítése</h2>
      </div>

      <TextInput label="Név" onChange={setCustomerName} value={customerName} />
      <TextInput label="E-mail" onChange={setEmail} type="email" value={email} />

      <div className="grid gap-2 border border-[#171512]/15 p-3 text-sm">
        <SummaryLine label="Film" value={selectedMovie?.title ?? "-"} />
        <SummaryLine
          label="Időpont"
          value={selectedScreening ? formatDateTime(selectedScreening.startsAt) : "-"}
        />
        <SummaryLine label="Ülőhely" value={selectedSeat || "-"} />
      </div>

      <button
        className="h-12 bg-[#9a321b] px-4 font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#171512] disabled:cursor-not-allowed disabled:bg-[#b7afa4]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Rögzítés..." : "Foglalás"}
      </button>

      {status ? <StatusText>{status}</StatusText> : null}
    </form>
  );
}
