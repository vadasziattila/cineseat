import type { FormEvent } from "react";
import Link from "next/link";

import { formatDateTime } from "@/lib/cineseat-format";
import type { AuthMode, ReservationSummary, User } from "@/lib/cineseat-types";

import { StatusText } from "./status-text";
import { TextInput } from "./text-input";

interface MemberPanelProps {
  authEmail: string;
  authMode: AuthMode;
  authName: string;
  authPassword: string;
  authStatus: string;
  myReservations: ReservationSummary[];
  onAuth: (event: FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
  setAuthEmail: (value: string) => void;
  setAuthMode: (value: AuthMode) => void;
  setAuthName: (value: string) => void;
  setAuthPassword: (value: string) => void;
  user: User | null;
}

export function MemberPanel({
  authEmail,
  authMode,
  authName,
  authPassword,
  authStatus,
  myReservations,
  onAuth,
  onLogout,
  setAuthEmail,
  setAuthMode,
  setAuthName,
  setAuthPassword,
  user,
}: MemberPanelProps) {
  return (
    <section className="grid content-start gap-4 border border-[#171512]/15 bg-[#fffdf8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9a321b]">
            Fiók
          </p>
          <h2 className="mt-2 text-2xl font-black">
            {user ? user.name : "Belépés"}
          </h2>
        </div>
        {user ? (
          <button
            className="border border-[#171512]/20 px-3 py-2 text-xs font-black uppercase tracking-[0.16em]"
            onClick={onLogout}
            type="button"
          >
            Kilépés
          </button>
        ) : null}
      </div>

      {!user ? (
        <form className="grid gap-3" onSubmit={onAuth}>
          <div className="grid grid-cols-2 border border-[#171512]/15">
            <button
              className={`h-10 text-xs font-black uppercase tracking-[0.16em] ${
                authMode === "login" ? "bg-[#171512] text-white" : ""
              }`}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              Belépés
            </button>
            <button
              className={`h-10 text-xs font-black uppercase tracking-[0.16em] ${
                authMode === "register" ? "bg-[#171512] text-white" : ""
              }`}
              onClick={() => setAuthMode("register")}
              type="button"
            >
              Regisztráció
            </button>
          </div>
          {authMode === "register" ? (
            <TextInput label="Név" onChange={setAuthName} value={authName} />
          ) : null}
          <TextInput label="E-mail" onChange={setAuthEmail} value={authEmail} />
          <TextInput
            label="Jelszó"
            onChange={setAuthPassword}
            type="password"
            value={authPassword}
          />
          <button className="h-11 bg-[#171512] font-black uppercase tracking-[0.16em] text-white">
            {authMode === "login" ? "Belépés" : "Regisztráció"}
          </button>
        </form>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm text-[#5d574f]">{user.email} / {user.role}</p>
          {user.role === "admin" ? (
            <Link
              className="bg-[#171512] px-3 py-2 text-center text-xs font-black uppercase tracking-[0.16em] text-white"
              href="/admin"
            >
              Admin felület
            </Link>
          ) : null}
          <div className="grid gap-2">
            {myReservations.length === 0 ? (
              <p className="border border-[#171512]/15 p-3 text-sm text-[#6f675e]">
                Még nincs saját foglalás.
              </p>
            ) : (
              myReservations.map((reservation) => (
                <div
                  className="border border-[#171512]/15 p-3 text-sm"
                  key={reservation.id}
                >
                  <strong>{reservation.movieTitle}</strong>
                  <p className="mt-1 text-[#6f675e]">
                    {formatDateTime(reservation.startsAt)} / {reservation.room} /{" "}
                    {reservation.seatNumber}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {authStatus ? <StatusText>{authStatus}</StatusText> : null}
    </section>
  );
}
