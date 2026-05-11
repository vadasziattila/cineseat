export type AuthMode = "login" | "register";
export type PosterTone = "cyan" | "gold" | "rose";

export interface Screening {
  id: number;
  movieId: number;
  startsAt: string;
  room: string;
  ticketPrice: number;
  reservedSeatCount: number;
}

export interface Movie {
  id: number;
  title: string;
  genre: string;
  runtimeMinutes: number;
  rating: string;
  posterTone: PosterTone;
  synopsis: string;
  screenings: Screening[];
}

export interface Seat {
  seatNumber: string;
  isReserved: boolean;
}

export interface SeatRow {
  row: string;
  seats: Seat[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "customer" | "admin";
}

export interface ReservationSummary {
  id: number;
  movieTitle: string;
  startsAt: string;
  room: string;
  seatNumber: string;
  createdAt: string;
}

export interface AdminMovieDraft {
  title: string;
  genre: string;
  runtimeMinutes: number;
  rating: string;
  posterTone: string;
  synopsis: string;
}

export interface AdminScreeningDraft {
  movieId: string;
  startsAt: string;
  room: string;
  ticketPrice: number;
}
