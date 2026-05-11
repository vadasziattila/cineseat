# CineSeat

CineSeat egy Next.js alapú online mozi jegyfoglaló rendszer. A felhasználó filmeket és vetítési időpontokat böngészhet, kiválaszthatja a kívánt ülőhelyet, majd foglalást rögzíthet. Az alkalmazás SQLite relációs adatbázist használ, a szerveroldali adatkezelés pedig Prisma ORM-en keresztül történik.

## Fő funkciók

- Filmek és vetítések listázása
- Dinamikus ülésfoglalási térkép
- SSR-rel előrenderelt nyitóoldal jobb első betöltéshez és SEO-hoz
- Foglalás rögzítése névvel, e-mail címmel és ülőhellyel
- Felhasználói regisztráció és bejelentkezés
- JWT alapú autentikáció HTTP-only cookie-ban
- Saját foglalások megtekintése bejelentkezett felhasználóknak
- Külön admin felület filmek szerkesztéséhez, filmek és vetítések hozzáadásához
- Szerveroldali adatvalidáció és megfelelő HTTP státuszkódok
- Relációs adattárolás SQLite adatbázissal
- Automatizált unit tesztek
- Docker és docker-compose futtatási lehetőség

## Technológia

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma ORM SQLite adatbázissal
- Redis 7 (opcionális gyorsítótár, docker-compose alatt automatikusan fut)
- Node.js beépített tesztfuttató

## Telepítés és futtatás

```bash
bun install
cp .env.example .env
bun run prisma:generate
bun run prisma:push
bun run dev
```

Az alkalmazás alapértelmezés szerint a [http://localhost:3000](http://localhost:3000) címen érhető el.

A Prisma séma alapján az adatbázis a `bun run prisma:push` paranccsal hozható létre. Az útvonalat a `.env` fájlban lévő `DATABASE_URL` adja meg.

```bash
DATABASE_URL=file:./.data/cineseat.sqlite
```

Egyedi adatbázisútvonal a `.env` fájlban adható meg:

```bash
DATABASE_URL=file:/tmp/cineseat.sqlite
```

A JWT aláíró kulcsot kötelező a `JWT_SECRET` változóban megadni. Az alapértelmezett admin és demo felhasználók adatait szintén a `.env` fájlban lévő `DEFAULT_*` változók határozzák meg.

Redis gyorsítótár használatához állítsd be a `REDIS_URL` változót. Ha nincs Redis elérhető, állítsd `disabled` értékre, és az alkalmazás rövid életű memóriacache-t használ:

```bash
REDIS_URL=redis://localhost:6379
```

Az admin felület közvetlenül elérhető:

```bash
http://localhost:3000/admin
```

## Docker

```bash
docker compose up --build
```

A konténer a `3000` porton fut, az SQLite adatbázist a `cineseat-data` volume
őrzi meg, a Redis cache pedig külön `redis` szolgáltatásként indul.

## Tesztelés

```bash
bun run test
bun run lint
bun run build
```

## Adatbázis

Az adatbázis létrehozó scriptje:

- `db/schema.sql`
- `prisma/schema.prisma`

Kezdő adatok:

- `db/seed.sql`

Táblák:

- `movies`: filmek
- `screenings`: vetítési időpontok
- `users`: regisztrált felhasználók és adminok
- `reservations`: foglalások

## API végpontok

### `GET /api/movies`

Visszaadja a filmeket a hozzájuk tartozó vetítésekkel.

Példa válasz:

```json
{
  "movies": [
    {
      "id": 1,
      "title": "Neon Város",
      "genre": "sci-fi drama",
      "runtimeMinutes": 118,
      "rating": "16+",
      "screenings": []
    }
  ]
}
```

### `GET /api/reservations`

Visszaadja az összes foglalást.

### `GET /api/reservations?mine=1`

Visszaadja a bejelentkezett felhasználó saját foglalásait. Bejelentkezés nélkül `401` választ ad.

### `GET /api/reservations?screeningId=1`

Visszaadja egy vetítés foglalásait és az ülés térképet.

### `POST /api/reservations`

Új foglalást hoz létre.

Kérés:

```json
{
  "customerName": "Teszt Elek",
  "email": "teszt@example.com",
  "movieId": 1,
  "screeningId": 1,
  "seatNumber": "A1"
}
```

Lehetséges státuszkódok:

- `201`: foglalás létrejött
- `400`: hibás bemeneti adat
- `404`: nem létező film vagy vetítés
- `409`: az ülőhely már foglalt
- `500`: váratlan szerverhiba

### `POST /api/auth/register`

Új felhasználót hoz létre, majd JWT cookie-val bejelentkezteti.

```json
{
  "name": "Teszt Elek",
  "email": "teszt@example.com",
  "password": "titkos123"
}
```

### `POST /api/auth/login`

Bejelentkezés e-mail címmel és jelszóval.

```json
{
  "email": "demo@example.test",
  "password": "a .env fájlban megadott jelszó"
}
```

### `POST /api/auth/logout`

Törli az aktuális JWT cookie-t.

### `GET /api/auth/me`

Visszaadja az aktuális bejelentkezett felhasználót, vagy `null` értéket.

### `POST /api/admin/movies`

Admin jogosultsággal új filmet hoz létre.

```json
{
  "title": "Új film",
  "genre": "drama",
  "runtimeMinutes": 110,
  "rating": "12+",
  "posterTone": "cyan",
  "synopsis": "Rövid filmleírás legalább tíz karakterrel."
}
```

### `PUT /api/admin/movies/:id`

Admin jogosultsággal meglévő film adatait frissíti.

### `POST /api/admin/screenings`

Admin jogosultsággal új vetítést hoz létre.

```json
{
  "movieId": 1,
  "startsAt": "2026-05-14T19:00",
  "room": "Premier terem",
  "ticketPrice": 2490
}
```

## Projektkövetelmények teljesülése

- Legalább 2 API végpont: `GET /api/movies`, `GET/POST /api/reservations`
- Reszponzív kliensoldal: mobil és desktop nézetre készített CSS grid/flex layout
- Relációs adatbázis: SQLite, SQL séma és kapcsolatok
- SSR: a nyitóoldal szerveroldalon tölti be a filmeket és az első ülésképet
- Legalább 2 teszt: `test/cinema-core.test.mjs`
- Dokumentáció: ez a README
- SQL script: `db/schema.sql`
- Opcionális funkciók: JWT autentikáció, Prisma ORM, Redis caching, Docker konténerizáció
- A projektleírásban szereplő további funkciók: saját foglalások követése, admin film/vetítés kezelés, dinamikus ülésfoglalás
