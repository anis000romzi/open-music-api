import { createClient, RedisClientType } from 'redis';
import { ICacheService } from '../interfaces/ICacheService';

export class RedisCacheService implements ICacheService {
  private _client: RedisClientType;

  constructor() {
    this._client = createClient({
      socket: {
        host: process.env.REDIS_SERVER,
      },
    }) as RedisClientType;

    this._client.on('error', (error: Error) => {
      console.error(error);
    });

    this._client.connect();
  }

  async set(
    key: string,
    value: string,
    expirationInSecond: number = 1800,
  ): Promise<void> {
    await this._client.set(key, value, { EX: expirationInSecond });
  }

  async get(key: string): Promise<string> {
    const result = await this._client.get(key);
    if (result === null) throw new Error('Cache not found');
    return result;
  }

  delete(key: string): Promise<number> {
    return this._client.del(key);
  }
}
