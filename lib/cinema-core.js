export const SEAT_ROWS = ["A", "B", "C", "D"];
export const SEATS_PER_ROW = 8;

export function getSeatCatalog() {
  return SEAT_ROWS.flatMap((row) =>
    Array.from({ length: SEATS_PER_ROW }, (_, index) => `${row}${index + 1}`),
  );
}

export function isValidSeat(seatNumber) {
  return getSeatCatalog().includes(String(seatNumber).toUpperCase());
}

export function normalizeReservationInput(input) {
  return {
    customerName: String(input?.customerName ?? "").trim(),
    email: String(input?.email ?? "").trim().toLowerCase(),
    movieId: Number(input?.movieId),
    screeningId: Number(input?.screeningId),
    seatNumber: String(input?.seatNumber ?? "").trim().toUpperCase(),
  };
}

export function normalizeUserInput(input) {
  return {
    name: String(input?.name ?? "").trim(),
    email: String(input?.email ?? "").trim().toLowerCase(),
    password: String(input?.password ?? ""),
  };
}

export function validateUserInput(input) {
  const user = normalizeUserInput(input);
  const errors = {};

  if (user.name.length < 2) {
    errors.name = "Adj meg legalább 2 karakteres nevet.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.email = "Adj meg érvényes e-mail címet.";
  }

  if (user.password.length < 6) {
    errors.password = "A jelszó legyen legalább 6 karakter.";
  }

  return {
    user,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function normalizeMovieInput(input) {
  return {
    title: String(input?.title ?? "").trim(),
    genre: String(input?.genre ?? "").trim(),
    runtimeMinutes: Number(input?.runtimeMinutes),
    rating: String(input?.rating ?? "").trim(),
    posterTone: String(input?.posterTone ?? "cyan").trim(),
    synopsis: String(input?.synopsis ?? "").trim(),
  };
}

export function validateMovieInput(input) {
  const movie = normalizeMovieInput(input);
  const errors = {};

  if (movie.title.length < 2) errors.title = "A film címe kötelező.";
  if (movie.genre.length < 2) errors.genre = "A műfaj kötelező.";
  if (!Number.isInteger(movie.runtimeMinutes) || movie.runtimeMinutes < 30) {
    errors.runtimeMinutes = "A játékidő legalább 30 perc legyen.";
  }
  if (movie.rating.length < 2) errors.rating = "Korhatár megadása kötelező.";
  if (!["cyan", "gold", "rose"].includes(movie.posterTone)) {
    errors.posterTone = "Ismeretlen plakatszin.";
  }
  if (movie.synopsis.length < 10) errors.synopsis = "Adj meg rövid leírást.";

  return { movie, errors, isValid: Object.keys(errors).length === 0 };
}

export function normalizeScreeningInput(input) {
  return {
    movieId: Number(input?.movieId),
    startsAt: String(input?.startsAt ?? "").trim(),
    room: String(input?.room ?? "").trim(),
    ticketPrice: Number(input?.ticketPrice),
  };
}

export function validateScreeningInput(input) {
  const screening = normalizeScreeningInput(input);
  const errors = {};

  if (!Number.isInteger(screening.movieId) || screening.movieId < 1) {
    errors.movieId = "Válassz filmet.";
  }
  if (!screening.startsAt || Number.isNaN(Date.parse(screening.startsAt))) {
    errors.startsAt = "Adj meg érvényes időpontot.";
  }
  if (screening.room.length < 2) errors.room = "A terem neve kötelező.";
  if (!Number.isInteger(screening.ticketPrice) || screening.ticketPrice < 500) {
    errors.ticketPrice = "A jegyár legalább 500 Ft legyen.";
  }

  return { screening, errors, isValid: Object.keys(errors).length === 0 };
}

export function validateReservationInput(input) {
  const reservation = normalizeReservationInput(input);
  const errors = {};

  if (reservation.customerName.length < 2) {
    errors.customerName = "Add meg a neved legalább 2 karakterrel.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reservation.email)) {
    errors.email = "Adj meg érvényes e-mail címet.";
  }

  if (!Number.isInteger(reservation.movieId) || reservation.movieId < 1) {
    errors.movieId = "Válassz filmet.";
  }

  if (!Number.isInteger(reservation.screeningId) || reservation.screeningId < 1) {
    errors.screeningId = "Válassz vetítési időpontot.";
  }

  if (!isValidSeat(reservation.seatNumber)) {
    errors.seatNumber = "Válassz érvényes ülőhelyet.";
  }

  return {
    reservation,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function buildSeatMap(reservations = []) {
  const reservedSeats = new Set(
    reservations.map((reservation) => String(reservation.seatNumber).toUpperCase()),
  );

  return SEAT_ROWS.map((row) => ({
    row,
    seats: Array.from({ length: SEATS_PER_ROW }, (_, index) => {
      const seatNumber = `${row}${index + 1}`;
      return {
        seatNumber,
        isReserved: reservedSeats.has(seatNumber),
      };
    }),
  }));
}

export function getAvailableSeatCount(reservations = []) {
  return getSeatCatalog().length - new Set(reservations.map((item) => item.seatNumber)).size;
}
