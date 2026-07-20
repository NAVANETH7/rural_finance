import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const rawClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 1) {
        return new Error('Redis connection failed');
      }
      return 500; // retry after 500ms
    }
  }
});

let isRedisConnected = false;

rawClient.on('error', (err) => {
  isRedisConnected = false;
});

export const connectRedis = async (): Promise<void> => {
  try {
    await rawClient.connect();
    isRedisConnected = true;
    console.log('Redis Connected successfully.');
  } catch (error) {
    console.warn('Redis Connection Failed. Cache falling back to local memory store.');
    isRedisConnected = false;
  }
};

const localCache = new Map<string, string>();

export const redisClient = new Proxy(rawClient, {
  get(target, prop, receiver) {
    if (prop === 'get') {
      return async (key: string) => {
        if (isRedisConnected) {
          try {
            return await target.get(key);
          } catch {
            return localCache.get(key) || null;
          }
        }
        return localCache.get(key) || null;
      };
    }

    if (prop === 'set') {
      return async (key: string, value: string) => {
        localCache.set(key, value);
        if (isRedisConnected) {
          try {
            await target.set(key, value);
          } catch {}
        }
        return 'OK';
      };
    }

    if (prop === 'setEx') {
      return async (key: string, seconds: number, value: string) => {
        localCache.set(key, value);
        if (isRedisConnected) {
          try {
            await target.setEx(key, seconds, value);
          } catch {}
        }
        return 'OK';
      };
    }

    if (prop === 'del') {
      return async (key: string) => {
        localCache.delete(key);
        if (isRedisConnected) {
          try {
            await target.del(key);
          } catch {}
        }
        return 1;
      };
    }

    if (prop === 'disconnect') {
      return async () => {
        if (isRedisConnected) {
          try {
            await target.disconnect();
          } catch {}
        }
        isRedisConnected = false;
      };
    }

    return Reflect.get(target, prop, receiver);
  }
}) as any;
