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
