import { existsSync, mkdirSync } from "node:fs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";

const DEFAULT_DB_PATH = join(
  /* turbopackIgnore: true */ process.cwd(),
  ".data",
  "cineseat.sqlite",
);
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  runtime_minutes INTEGER NOT NULL,
  rating TEXT NOT NULL,
  poster_tone TEXT NOT NULL,
  synopsis TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS screenings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER NOT NULL,
  starts_at TEXT NOT NULL,
  room TEXT NOT NULL,
  ticket_price INTEGER NOT NULL,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  screening_id INTEGER NOT NULL,
  seat_number TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (screening_id) REFERENCES screenings(id) ON DELETE CASCADE,
  UNIQUE (screening_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_screenings_movie_id ON screenings(movie_id);
CREATE INDEX IF NOT EXISTS idx_reservations_screening_id ON reservations(screening_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_expires_at ON sessions(token, expires_at);
`;

const SEED_SQL = `
INSERT INTO movies (id, title, genre, runtime_minutes, rating, poster_tone, synopsis)
VALUES
  (1, 'Neon Város', 'sci-fi dráma', 118, '16+', 'cyan', 'Egy éjszakai futár titkos üzenetet talál, amely megváltoztatja a város energiahuzalozását.'),
  (2, 'Holdfény Expressz', 'kaland', 104, '12+', 'gold', 'Egy régi mozdony utasai minden állomáson egy másik évtizedbe érkeznek.'),
  (3, 'A Csendes Terem', 'thriller', 96, '16+', 'rose', 'Egy filmszínház utolsó vetítésén a nézők rájönnek, hogy a vásznon látható történet róluk szól.');

INSERT INTO screenings (id, movie_id, starts_at, room, ticket_price)
VALUES
  (1, 1, '2026-05-11T18:00:00', 'Lumiere terem', 2490),
  (2, 1, '2026-05-11T21:00:00', 'Lumiere terem', 2690),
  (3, 2, '2026-05-12T17:30:00', 'Apollo terem', 2290),
  (4, 2, '2026-05-12T20:15:00', 'Apollo terem', 2490),
  (5, 3, '2026-05-13T19:00:00', 'Noir terem', 2590);

INSERT INTO reservations (customer_name, email, movie_id, screening_id, seat_number)
VALUES
  ('Demo Anna', 'anna@example.com', 1, 1, 'B4'),
  ('Demo Bela', 'bela@example.com', 1, 1, 'B5'),
  ('Demo Csilla', 'csilla@example.com', 2, 3, 'C3');
`;

const DEMO_MOVIE_TRANSLATIONS = [
  {
    id: 1,
    title: "Neon Város",
    genre: "sci-fi dráma",
    synopsis:
      "Egy éjszakai futár titkos üzenetet talál, amely megváltoztatja a város energiahuzalozását.",
  },
  {
    id: 2,
    title: "Holdfény Expressz",
    genre: "kaland",
    synopsis:
      "Egy régi mozdony utasai minden állomáson egy másik évtizedbe érkeznek.",
  },
  {
    id: 3,
    title: "A Csendes Terem",
    genre: "thriller",
    synopsis:
      "Egy filmszínház utolsó vetítésén a nézők rájönnek, hogy a vásznon látható történet róluk szól.",
  },
];

let database;

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
  return process.env.DATABASE_PATH || DEFAULT_DB_PATH;
}

export function getDatabase() {
  if (database) {
    return database;
  }

  const databasePath = getDatabasePath();
  mkdirSync(dirname(databasePath), { recursive: true });

  const shouldSeed = !existsSync(databasePath);
  database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec(SCHEMA_SQL);
  try {
    database.exec("ALTER TABLE reservations ADD COLUMN user_id INTEGER;");
  } catch {
    // Existing databases already have the column.
  }

  const movieCount = database.prepare("SELECT COUNT(*) AS count FROM movies").get().count;
  if (shouldSeed || movieCount === 0) {
    database.exec(SEED_SQL);
  }

  syncDemoMovieTranslations(database);
  UserModel.ensureDefaultUsers();

  return database;
}

function syncDemoMovieTranslations(db) {
  const statement = db.prepare(
    `UPDATE movies
        SET title = ?, genre = ?, synopsis = ?
      WHERE id = ?`,
  );

  for (const movie of DEMO_MOVIE_TRANSLATIONS) {
    statement.run(movie.title, movie.genre, movie.synopsis, movie.id);
  }
}

export function resetDatabaseForTests(testDatabasePath) {
  process.env.DATABASE_PATH = testDatabasePath;
  if (database) {
    database.close();
  }
  database = undefined;
  return getDatabase();
}

export class MovieModel {
  static findAllWithScreenings() {
    const db = getDatabase();
    const movies = db
      .prepare(
        `SELECT id, title, genre, runtime_minutes AS runtimeMinutes, rating, poster_tone AS posterTone,
                synopsis
           FROM movies
          ORDER BY title`,
      )
      .all();

    const screeningsByMovieId = db
      .prepare(
        `SELECT s.id,
                s.movie_id AS movieId,
                s.starts_at AS startsAt,
                s.room,
                s.ticket_price AS ticketPrice,
                COUNT(r.id) AS reservedSeatCount
           FROM screenings s
           LEFT JOIN reservations r ON r.screening_id = s.id
          GROUP BY s.id
          ORDER BY s.starts_at`,
      )
      .all()
      .reduce((groups, screening) => {
        const group = groups.get(screening.movieId) ?? [];
        group.push(screening);
        groups.set(screening.movieId, group);
        return groups;
      }, new Map());

    return movies.map((movie) => ({
      ...movie,
      screenings: screeningsByMovieId.get(movie.id) ?? [],
    }));
  }

  static exists(movieId) {
    const row = getDatabase().prepare("SELECT id FROM movies WHERE id = ?").get(movieId);
    return Boolean(row);
  }

  static create({ title, genre, runtimeMinutes, rating, posterTone, synopsis }) {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO movies (title, genre, runtime_minutes, rating, poster_tone, synopsis)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(title, genre, runtimeMinutes, rating, posterTone, synopsis);

    const id = db.prepare("SELECT last_insert_rowid() AS id").get().id;
    return db
      .prepare(
        `SELECT id, title, genre, runtime_minutes AS runtimeMinutes, rating,
                poster_tone AS posterTone, synopsis
           FROM movies
          WHERE id = ?`,
      )
      .get(id);
  }

  static update(movieId, { title, genre, runtimeMinutes, rating, posterTone, synopsis }) {
    const db = getDatabase();
    const result = db
      .prepare(
        `UPDATE movies
            SET title = ?, genre = ?, runtime_minutes = ?, rating = ?,
                poster_tone = ?, synopsis = ?
          WHERE id = ?`,
      )
      .run(title, genre, runtimeMinutes, rating, posterTone, synopsis, movieId);

    return result.changes > 0;
  }
}

export class ScreeningModel {
  static findById(screeningId) {
    return getDatabase()
      .prepare(
        `SELECT id, movie_id AS movieId, starts_at AS startsAt, room, ticket_price AS ticketPrice
           FROM screenings
          WHERE id = ?`,
      )
      .get(screeningId);
  }

  static create({ movieId, startsAt, room, ticketPrice }) {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO screenings (movie_id, starts_at, room, ticket_price)
       VALUES (?, ?, ?, ?)`,
    ).run(movieId, startsAt, room, ticketPrice);

    const id = db.prepare("SELECT last_insert_rowid() AS id").get().id;
    return this.findById(id);
  }
}

export class ReservationModel {
  static findAll() {
    return getDatabase()
      .prepare(
        `SELECT r.id,
                r.customer_name AS customerName,
                r.email,
                r.seat_number AS seatNumber,
                r.created_at AS createdAt,
                m.title AS movieTitle,
                s.starts_at AS startsAt,
                s.room
           FROM reservations r
           JOIN movies m ON m.id = r.movie_id
           JOIN screenings s ON s.id = r.screening_id
          ORDER BY r.created_at DESC`,
      )
      .all();
  }

  static findByUser(userId) {
    return getDatabase()
      .prepare(
        `SELECT r.id,
                r.customer_name AS customerName,
                r.email,
                r.seat_number AS seatNumber,
                r.created_at AS createdAt,
                m.title AS movieTitle,
                s.starts_at AS startsAt,
                s.room
           FROM reservations r
           JOIN movies m ON m.id = r.movie_id
           JOIN screenings s ON s.id = r.screening_id
          WHERE r.user_id = ?
          ORDER BY r.created_at DESC`,
      )
      .all(userId);
  }

  static findByScreening(screeningId) {
    return getDatabase()
      .prepare(
        `SELECT id, seat_number AS seatNumber
           FROM reservations
          WHERE screening_id = ?
          ORDER BY seat_number`,
      )
      .all(screeningId);
  }

  static create({ customerName, email, movieId, screeningId, seatNumber, userId = null }) {
    const db = getDatabase();
    const insert = db.prepare(
      `INSERT INTO reservations (user_id, customer_name, email, movie_id, screening_id, seat_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );

    insert.run(userId, customerName, email, movieId, screeningId, seatNumber);
    const id = db.prepare("SELECT last_insert_rowid() AS id").get().id;

    return db
      .prepare(
        `SELECT id,
                customer_name AS customerName,
                email,
                movie_id AS movieId,
                screening_id AS screeningId,
                user_id AS userId,
                seat_number AS seatNumber,
                created_at AS createdAt
           FROM reservations
          WHERE id = ?`,
      )
      .get(id);
  }
}

export class UserModel {
  static ensureDefaultUsers() {
    const db = getDatabase();
    const count = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
    if (count > 0) return;

    this.create({
      name: "Admin User",
      email: "admin@cineseat.local",
      password: "admin123",
      role: "admin",
    });
    this.create({
      name: "Demo User",
      email: "demo@cineseat.local",
      password: "demo123",
      role: "customer",
    });
  }

  static create({ name, email, password, role = "customer" }) {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, ?)`,
    ).run(name, email, hashPassword(password), role);

    const id = db.prepare("SELECT last_insert_rowid() AS id").get().id;
    return this.findById(id);
  }

  static findById(userId) {
    return getDatabase()
      .prepare(
        `SELECT id, name, email, role, created_at AS createdAt
           FROM users
          WHERE id = ?`,
      )
      .get(userId);
  }

  static findByEmailWithPassword(email) {
    return getDatabase()
      .prepare(
        `SELECT id, name, email, password_hash AS passwordHash, role,
                created_at AS createdAt
           FROM users
          WHERE email = ?`,
      )
      .get(email);
  }

  static verifyCredentials(email, password) {
    const user = this.findByEmailWithPassword(email);
    if (!user || !verifyPassword(password, user.passwordHash)) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}

export class SessionModel {
  static create(userId) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    getDatabase()
      .prepare(
        `INSERT INTO sessions (token, user_id, expires_at)
         VALUES (?, ?, ?)`,
      )
      .run(token, userId, expiresAt);

    return { token, expiresAt };
  }

  static findUserByToken(token) {
    if (!token) return null;

    const session = getDatabase()
      .prepare(
        `SELECT user_id AS userId, expires_at AS expiresAt
           FROM sessions
          WHERE token = ? AND expires_at > datetime('now')`,
      )
      .get(token);

    if (!session) return null;

    const user = UserModel.findById(session.userId);
    return user ? { ...user, sessionExpiresAt: session.expiresAt } : null;
  }

  static delete(token) {
    if (!token) return;
    getDatabase().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
}
