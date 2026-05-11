import { createHmac, timingSafeEqual } from "node:crypto";

import { UserModel } from "./cinema-db.js";
import { readCachedJson, setCachedJson } from "./cache.js";
import { requiredEnv } from "./env.js";

const AUTH_COOKIE = "cineseat_token";
const JWT_CACHE_PREFIX = "jwt";
const JWT_TTL_SECONDS = 60 * 60 * 24 * 7;

export function getSessionCookieName() {
  return AUTH_COOKIE;
}

export function parseCookie(header, name) {
  return String(header ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function getJwtSecret() {
  return requiredEnv("JWT_SECRET");
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlJson(value) {
  return base64UrlEncode(JSON.stringify(value));
}

function signJwtPart(value) {
  return createHmac("sha256", getJwtSecret()).update(value).digest("base64url");
}

function jwtCacheKey(token) {
  return `${JWT_CACHE_PREFIX}:${createHmac("sha256", getJwtSecret()).update(token).digest("hex")}`;
}

function publicUser(user) {
  return user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }
    : null;
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createJwt(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlJson({
    sub: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + JWT_TTL_SECONDS,
  });
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${signJwtPart(unsignedToken)}`;
}

export function verifyJwt(token) {
  const [header, payload, signature] = String(token ?? "").split(".");
  if (!header || !payload || !signature) return null;

  const expectedSignature = signJwtPart(`${header}.${payload}`);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!claims.sub || Number(claims.exp) <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

export async function getCurrentUser(request) {
  const token = parseCookie(request.headers.get("cookie"), AUTH_COOKIE);
  if (!token) return null;

  const cachedUser = await readCachedJson(jwtCacheKey(token));
  if (cachedUser !== undefined) return cachedUser;

  const claims = verifyJwt(token);
  if (!claims) return null;

  const user = await UserModel.findById(Number(claims.sub));
  const safeUser = publicUser(user);
  if (safeUser) {
    await setCachedJson(jwtCacheKey(token), safeUser, JWT_TTL_SECONDS);
  }
  return safeUser;
}

export async function requireAdmin(request) {
  const user = await getCurrentUser(request);
  return user?.role === "admin" ? user : null;
}

export function createSessionCookie(token) {
  return `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${JWT_TTL_SECONDS}`;
}

export function clearSessionCookie() {
  return `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
