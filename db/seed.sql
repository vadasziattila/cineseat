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
