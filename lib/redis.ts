import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "ioredis";

import { env } from "@/lib/env";

// TODO: creating this client this way yields errors when building
//       as if it was trying to establish a connection, which is not good
const redis = new Redis(env.REDIS_PORT_NUMBER, env.REDIS_HOST, {
  password: env.REDIS_PASSWORD,
});

export async function getJson<T = unknown>(key: string) {
  try {
    const value = (await redis.call("JSON.GET", key, "$")) as
      | string
      | undefined;

    if (value) {
      return JSON.parse(value) as T;
    }
  } catch (err) {}

  return null;
}

export async function setJson<T = unknown>(
  key: string,
  value: T,
  { ex }: { ex: number },
) {
  await redis.call("JSON.SET", key, "$", JSON.stringify(value));
  await redis.expire(key, ex);

  return value;
}

const redisRateLimitAdapter = {
  sadd: <TData>(key: string, ...members: TData[]) =>
    redis.sadd(key, ...members.map((m) => String(m))),
  hset: <TValue>(key: string, obj: Record<string, TValue>) =>
    redis.hset(key, obj),
  eval: async <TArgs extends unknown[], TData = unknown>(
    script: string,
    keys: string[],
    args: TArgs,
  ) =>
    redis.eval(
      script,
      keys.length,
      ...keys,
      ...(args ?? []).map((a) => String(a)),
    ) as Promise<TData>,
};

export const ratelimit = {
  abuse: new Ratelimit({
    redis: redisRateLimitAdapter,
    limiter: Ratelimit.slidingWindow(5, "10 s"),
  }),
  free: new Ratelimit({
    redis: redisRateLimitAdapter,
    limiter: Ratelimit.slidingWindow(30, "1 d"),
  }),
};
