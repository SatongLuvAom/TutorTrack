import type { NextRequest } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 5_000;

function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function enforceBucketLimit(): void {
  while (buckets.size > MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value;
    if (typeof oldestKey !== "string") {
      return;
    }

    buckets.delete(oldestKey);
  }
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
  now = Date.now(),
}: RateLimitOptions): RateLimitResult {
  pruneExpiredBuckets(now);

  const current = buckets.get(key);
  const bucket =
    current && current.resetAt > now
      ? current
      : {
          count: 0,
          resetAt: now + windowMs,
        };

  bucket.count += 1;
  buckets.set(key, bucket);
  enforceBucketLimit();

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((bucket.resetAt - now) / 1000),
  );

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSeconds,
  };
}

export function getClientRateLimitKey(
  request: NextRequest,
  scope: string,
): string {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return `${scope}:${forwardedFor || realIp || "unknown"}`;
}
