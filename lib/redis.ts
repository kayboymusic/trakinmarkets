import { Redis } from "@upstash/redis";
import type { FeedItem, TimeWindow } from "@/types";

let cached: Redis | null = null;

export function redis(): Redis | null {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  cached = new Redis({ url, token });
  return cached;
}

const FEED_KEY = (w: TimeWindow) => `feed:${w}`;

export async function getCachedFeed(window: TimeWindow): Promise<FeedItem[] | null> {
  const r = redis();
  if (!r) return null;
  return (await r.get<FeedItem[]>(FEED_KEY(window))) ?? null;
}

export async function setCachedFeed(window: TimeWindow, items: FeedItem[], ttl = 60) {
  const r = redis();
  if (!r) return;
  await r.set(FEED_KEY(window), items, { ex: ttl });
}

const ALERT_KEY = (marketId: string, w: TimeWindow) => `alerted:${marketId}:${w}`;

export async function wasAlerted(marketId: string, window: TimeWindow): Promise<boolean> {
  const r = redis();
  if (!r) return false;
  const v = await r.get(ALERT_KEY(marketId, window));
  return v !== null;
}

export async function markAlerted(
  marketId: string,
  window: TimeWindow,
  ttlSeconds: number,
): Promise<void> {
  const r = redis();
  if (!r) return;
  await r.set(ALERT_KEY(marketId, window), "1", { ex: ttlSeconds });
}
