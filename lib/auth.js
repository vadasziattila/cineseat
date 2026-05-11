import { createHash } from "node:crypto";

import { SessionModel } from "./cinema-db.js";
import { deleteCachedKey, readCachedJson, setCachedJson } from "./cache.js";

const SESSION_COOKIE = "cineseat_session";
const SESSION_CACHE_PREFIX = "session";

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function parseCookie(header, name) {
  return String(header ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function sessionCacheKey(token) {
  return `${SESSION_CACHE_PREFIX}:${createHash("sha256").update(token).digest("hex")}`;
}

function secondsUntil(value) {
  return Math.max(1, Math.floor((new Date(value).getTime() - Date.now()) / 1000));
}

function publicUser(user) {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.sessionExpiresAt;
  return safeUser;
}

export async function getCurrentUser(request) {
  const token = parseCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token) return null;

  const cachedUser = await readCachedJson(sessionCacheKey(token));
  if (cachedUser !== undefined) return cachedUser;

  const user = SessionModel.findUserByToken(token);
  if (!user) return null;

  const safeUser = publicUser(user);
  await setCachedJson(sessionCacheKey(token), safeUser, secondsUntil(user.sessionExpiresAt));
  return safeUser;
}

export async function requireAdmin(request) {
  const user = await getCurrentUser(request);
  return user?.role === "admin" ? user : null;
}

export async function cacheSessionUser(token, user, expiresAt) {
  await setCachedJson(sessionCacheKey(token), publicUser(user), secondsUntil(expiresAt));
}

export async function clearSessionCache(token) {
  if (!token) return;
  await deleteCachedKey(sessionCacheKey(token));
}

export function createSessionCookie(token, expiresAt) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(
    expiresAt,
  ).toUTCString()}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
