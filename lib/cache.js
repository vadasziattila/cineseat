import { createClient } from "redis";

const CACHE_PREFIX = "cineseat";
const MEMORY_CACHE_LIMIT = 200;
const REDIS_RETRY_DELAY_MS = 30_000;

const memoryCache = new Map();
let redisClientPromise;
let redisUnavailableUntil = 0;

function getRedisUrl() {
  if (process.env.REDIS_URL === "disabled") return null;
  return process.env.REDIS_URL || null;
}

function namespacedKey(key) {
  return `${CACHE_PREFIX}:${key}`;
}

function pruneMemoryCache() {
  while (memoryCache.size > MEMORY_CACHE_LIMIT) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
}

function getMemoryValue(key) {
  const item = memoryCache.get(key);
  if (!item) return undefined;

  if (item.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return undefined;
  }

  return item.value;
}

function setMemoryValue(key, value, ttlSeconds) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  pruneMemoryCache();
}

async function getRedisClient() {
  const redisUrl = getRedisUrl();
  if (!redisUrl || Date.now() < redisUnavailableUntil) return null;

  if (!redisClientPromise) {
    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 1000),
        reconnectStrategy: false,
      },
    });

    client.on("error", () => {
      redisUnavailableUntil = Date.now() + REDIS_RETRY_DELAY_MS;
      redisClientPromise = undefined;
    });

    redisClientPromise = client.connect().then(() => client);
  }

  try {
    return await redisClientPromise;
  } catch {
    redisUnavailableUntil = Date.now() + REDIS_RETRY_DELAY_MS;
    redisClientPromise = undefined;
    return null;
  }
}

export async function readCachedJson(key) {
  const cacheKey = namespacedKey(key);
  const memoryValue = getMemoryValue(cacheKey);
  if (memoryValue !== undefined) return memoryValue;

  const redis = await getRedisClient();
  if (redis) {
    const rawValue = await redis.get(cacheKey).catch(() => null);
    if (rawValue) {
      try {
        return JSON.parse(rawValue);
      } catch {
        await redis.del(cacheKey).catch(() => {});
      }
    }
  }

  return undefined;
}

export async function getCachedJson(key, ttlSeconds, loader) {
  const cachedValue = await readCachedJson(key);
  if (cachedValue !== undefined) return cachedValue;

  const cacheKey = namespacedKey(key);
  const redis = await getRedisClient();
  const loadedValue = await loader();
  setMemoryValue(cacheKey, loadedValue, ttlSeconds);

  if (redis) {
    await redis.set(cacheKey, JSON.stringify(loadedValue), { EX: ttlSeconds }).catch(() => {});
  }

  return loadedValue;
}

export async function setCachedJson(key, value, ttlSeconds) {
  const cacheKey = namespacedKey(key);
  setMemoryValue(cacheKey, value, ttlSeconds);

  const redis = await getRedisClient();
  if (redis) {
    await redis.set(cacheKey, JSON.stringify(value), { EX: ttlSeconds }).catch(() => {});
  }
}

export async function deleteCachedKey(key) {
  const cacheKey = namespacedKey(key);
  memoryCache.delete(cacheKey);

  const redis = await getRedisClient();
  if (redis) {
    await redis.del(cacheKey).catch(() => {});
  }
}

export async function clearCacheForTests() {
  memoryCache.clear();
  redisUnavailableUntil = 0;
}
