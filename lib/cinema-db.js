import { existsSync, mkdirSync } from "node:fs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { dirname } from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { optionalEnv, requiredEnv } from "./env.js";

const DEMO_MOVIES = [
  {
    id: 1,
    title: "Neon Város",
    genre: "sci-fi dráma",
    runtimeMinutes: 118,
    rating: "16+",
    posterTone: "cyan",
    synopsis:
      "Egy éjszakai futár titkos üzenetet talál, amely megváltoztatja a város energiahuzalozását.",
  },
  {
    id: 2,
    title: "Holdfény Expressz",
    genre: "kaland",
    runtimeMinutes: 104,
    rating: "12+",
    posterTone: "gold",
    synopsis:
      "Egy régi mozdony utasai minden állomáson egy másik évtizedbe érkeznek.",
  },
  {
    id: 3,
    title: "A Csendes Terem",
    genre: "thriller",
    runtimeMinutes: 96,
    rating: "16+",
    posterTone: "rose",
    synopsis:
      "Egy filmszínház utolsó vetítésén a nézők rájönnek, hogy a vásznon látható történet róluk szól.",
  },
];

const DEMO_SCREENINGS = [
  { id: 1, movieId: 1, startsAt: "2026-05-11T18:00:00.000Z", room: "Lumiere terem", ticketPrice: 2490 },
  { id: 2, movieId: 1, startsAt: "2026-05-11T21:00:00.000Z", room: "Lumiere terem", ticketPrice: 2690 },
  { id: 3, movieId: 2, startsAt: "2026-05-12T17:30:00.000Z", room: "Apollo terem", ticketPrice: 2290 },
  { id: 4, movieId: 2, startsAt: "2026-05-12T20:15:00.000Z", room: "Apollo terem", ticketPrice: 2490 },
  { id: 5, movieId: 3, startsAt: "2026-05-13T19:00:00.000Z", room: "Noir terem", ticketPrice: 2590 },
];

const DEMO_RESERVATIONS = [
  { customerName: "Demo Anna", email: "anna@example.com", movieId: 1, screeningId: 1, seatNumber: "B4" },
  { customerName: "Demo Bela", email: "bela@example.com", movieId: 1, screeningId: 1, seatNumber: "B5" },
  { customerName: "Demo Csilla", email: "csilla@example.com", movieId: 2, screeningId: 3, seatNumber: "C3" },
];

let prisma;
let seedPromise;

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash).split(":");
  if (!salt || !expectedHash) return false;

  const actualHash = hashPassword(password, salt).split(":")[1];
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(actualHash, "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function getDatabasePath() {
  const databasePath = optionalEnv("DATABASE_PATH");
  if (databasePath) return databasePath;

  const databaseUrl = requiredEnv("DATABASE_URL");
  if (databaseUrl?.startsWith("file:")) {
    return databaseUrl.slice("file:".length);
  }

  throw new Error("DATABASE_URL must use a file: SQLite URL.");
}

function getDefaultUsers() {
  return [
    {
      name: requiredEnv("DEFAULT_ADMIN_NAME"),
      email: requiredEnv("DEFAULT_ADMIN_EMAIL"),
      password: requiredEnv("DEFAULT_ADMIN_PASSWORD"),
      role: "admin",
    },
    {
      name: requiredEnv("DEFAULT_DEMO_NAME"),
      email: requiredEnv("DEFAULT_DEMO_EMAIL"),
      password: requiredEnv("DEFAULT_DEMO_PASSWORD"),
      role: "customer",
    },
  ];
}

function serializeDate(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapMovie(movie) {
  return movie
    ? {
        ...movie,
        screenings: movie.screenings?.map(mapScreening) ?? [],
      }
    : null;
}

function mapScreening(screening) {
  return screening
    ? {
        ...screening,
        startsAt: serializeDate(screening.startsAt),
      }
    : null;
}

function mapUser(user) {
  return user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: serializeDate(user.createdAt),
      }
    : null;
}

function mapReservation(reservation) {
  return reservation
    ? {
        ...reservation,
        createdAt: serializeDate(reservation.createdAt),
        startsAt: serializeDate(reservation.screening?.startsAt),
        movieTitle: reservation.movie?.title,
        room: reservation.screening?.room,
      }
    : null;
}

export function getPrisma() {
  if (prisma) return prisma;

  const databasePath = getDatabasePath();
  mkdirSync(/* turbopackIgnore: true */ dirname(databasePath), { recursive: true });

  const adapter = new PrismaBetterSqlite3({ url: databasePath });
  prisma = new PrismaClient({ adapter });
  return prisma;
}

export async function ensureSeedData() {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const db = getPrisma();
    const movieCount = await db.movie.count();

    if (movieCount === 0) {
      for (const movie of DEMO_MOVIES) {
        await db.movie.create({ data: movie });
      }

      for (const screening of DEMO_SCREENINGS) {
        await db.screening.create({
          data: {
            ...screening,
            startsAt: new Date(screening.startsAt),
          },
        });
      }

      for (const reservation of DEMO_RESERVATIONS) {
        await db.reservation.create({ data: reservation });
      }
    }

    for (const movie of DEMO_MOVIES) {
      await db.movie.update({
        where: { id: movie.id },
        data: {
          title: movie.title,
          genre: movie.genre,
          synopsis: movie.synopsis,
        },
      }).catch(() => {});
    }

    await UserModel.ensureDefaultUsers();
  })();

  return seedPromise;
}

export async function resetDatabaseForTests(testDatabasePath) {
  process.env.DATABASE_PATH = testDatabasePath;
  seedPromise = undefined;
  if (prisma) {
    await prisma.$disconnect();
  }
  prisma = undefined;
  return getPrisma();
}

export class MovieModel {
  static async findAllWithScreenings() {
    await ensureSeedData();
    const movies = await getPrisma().movie.findMany({
      include: {
        screenings: {
          include: {
            _count: {
              select: { reservations: true },
            },
          },
          orderBy: { startsAt: "asc" },
        },
      },
      orderBy: { title: "asc" },
    });

    return movies.map((movie) =>
      mapMovie({
        ...movie,
        screenings: movie.screenings.map((screening) => ({
          id: screening.id,
          movieId: screening.movieId,
          startsAt: screening.startsAt,
          room: screening.room,
          ticketPrice: screening.ticketPrice,
          reservedSeatCount: screening._count.reservations,
        })),
      }),
    );
  }

  static async exists(movieId) {
    await ensureSeedData();
    const row = await getPrisma().movie.findUnique({
      where: { id: movieId },
      select: { id: true },
    });
    return Boolean(row);
  }

  static async create({ title, genre, runtimeMinutes, rating, posterTone, synopsis }) {
    await ensureSeedData();
    return getPrisma().movie.create({
      data: { title, genre, runtimeMinutes, rating, posterTone, synopsis },
    });
  }

  static async update(movieId, { title, genre, runtimeMinutes, rating, posterTone, synopsis }) {
    await ensureSeedData();
    try {
      await getPrisma().movie.update({
        where: { id: movieId },
        data: { title, genre, runtimeMinutes, rating, posterTone, synopsis },
      });
      return true;
    } catch {
      return false;
    }
  }
}

export class ScreeningModel {
  static async findById(screeningId) {
    await ensureSeedData();
    return mapScreening(
      await getPrisma().screening.findUnique({
        where: { id: screeningId },
      }),
    );
  }

  static async create({ movieId, startsAt, room, ticketPrice }) {
    await ensureSeedData();
    return mapScreening(
      await getPrisma().screening.create({
        data: { movieId, startsAt: new Date(startsAt), room, ticketPrice },
      }),
    );
  }
}

export class ReservationModel {
  static async findAll() {
    await ensureSeedData();
    const reservations = await getPrisma().reservation.findMany({
      include: { movie: true, screening: true },
      orderBy: { createdAt: "desc" },
    });
    return reservations.map(mapReservation);
  }

  static async findByUser(userId) {
    await ensureSeedData();
    const reservations = await getPrisma().reservation.findMany({
      where: { userId },
      include: { movie: true, screening: true },
      orderBy: { createdAt: "desc" },
    });
    return reservations.map(mapReservation);
  }

  static async findByScreening(screeningId) {
    await ensureSeedData();
    return getPrisma().reservation.findMany({
      where: { screeningId },
      select: { id: true, seatNumber: true },
      orderBy: { seatNumber: "asc" },
    });
  }

  static async create({ customerName, email, movieId, screeningId, seatNumber, userId = null }) {
    await ensureSeedData();
    const reservation = await getPrisma().reservation.create({
      data: { userId, customerName, email, movieId, screeningId, seatNumber },
    });

    return {
      ...reservation,
      createdAt: serializeDate(reservation.createdAt),
    };
  }
}

export class UserModel {
  static async ensureDefaultUsers() {
    const db = getPrisma();
    const count = await db.user.count();
    if (count > 0) return;

    for (const user of getDefaultUsers()) {
      await this.create(user);
    }
  }

  static async create({ name, email, password, role = "customer" }) {
    const user = await getPrisma().user.create({
      data: { name, email, passwordHash: hashPassword(password), role },
    });
    return mapUser(user);
  }

  static async findById(userId) {
    await ensureSeedData();
    return mapUser(
      await getPrisma().user.findUnique({
        where: { id: userId },
      }),
    );
  }

  static async findByEmailWithPassword(email) {
    await ensureSeedData();
    return getPrisma().user.findUnique({
      where: { email },
    });
  }

  static async verifyCredentials(email, password) {
    const user = await this.findByEmailWithPassword(email);
    if (!user || !verifyPassword(password, user.passwordHash)) return null;
    return mapUser(user);
  }
}

export function databaseExists() {
  return existsSync(/* turbopackIgnore: true */ getDatabasePath());
}
