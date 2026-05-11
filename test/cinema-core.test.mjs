import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";

import {
  createJwt,
  verifyJwt,
} from "../lib/auth.js";

import {
  buildSeatMap,
  getAvailableSeatCount,
  validateReservationInput,
  validateScreeningInput,
  validateUserInput,
} from "../lib/cinema-core.js";

describe("reservation validation", () => {
  it("normalizes and accepts a complete reservation request", () => {
    const result = validateReservationInput({
      customerName: "  Teszt Elek  ",
      email: "ELEK@EXAMPLE.COM",
      movieId: 1,
      screeningId: 2,
      seatNumber: " b7 ",
    });

    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, {});
    assert.equal(result.reservation.customerName, "Teszt Elek");
    assert.equal(result.reservation.email, "elek@example.com");
    assert.equal(result.reservation.seatNumber, "B7");
  });

  it("rejects missing contact data and invalid seats", () => {
    const result = validateReservationInput({
      customerName: "A",
      email: "rossz-email",
      movieId: 0,
      screeningId: Number.NaN,
      seatNumber: "Z9",
    });

    assert.equal(result.isValid, false);
    assert.equal(Object.keys(result.errors).length, 5);
  });
});

describe("seat map", () => {
  it("marks reserved seats and calculates remaining capacity", () => {
    const reservations = [{ seatNumber: "A1" }, { seatNumber: "C8" }];
    const seatMap = buildSeatMap(reservations);

    assert.equal(seatMap.length, 4);
    assert.equal(seatMap[0].seats[0].isReserved, true);
    assert.equal(seatMap[2].seats[7].isReserved, true);
    assert.equal(seatMap[1].seats[2].isReserved, false);
    assert.equal(getAvailableSeatCount(reservations), 30);
  });
});

describe("account and admin validation", () => {
  it("validates registration data for user accounts", () => {
    const result = validateUserInput({
      name: "Mozi Admin",
      email: "ADMIN@EXAMPLE.TEST",
      password: "strong-password",
    });

    assert.equal(result.isValid, true);
    assert.equal(result.user.email, "admin@example.test");
  });

  it("rejects incomplete screening management input", () => {
    const result = validateScreeningInput({
      movieId: 1,
      startsAt: "not-a-date",
      room: "",
      ticketPrice: 100,
    });

    assert.equal(result.isValid, false);
    assert.deepEqual(Object.keys(result.errors), ["startsAt", "room", "ticketPrice"]);
  });
});

describe("jwt authentication", () => {
  it("signs and verifies user identity claims", () => {
    process.env.JWT_SECRET = randomBytes(24).toString("hex");

    const token = createJwt({
      id: 7,
      name: "Teszt User",
      email: "teszt@example.com",
      role: "admin",
    });
    const claims = verifyJwt(token);

    assert.equal(claims.sub, "7");
    assert.equal(claims.email, "teszt@example.com");
    assert.equal(claims.role, "admin");
  });
});
