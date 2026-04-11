import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Centralized cooldown/rate-limit service.
 *
 * Uses Redis when REDIS_URL is set (horizontally scalable),
 * otherwise falls back to an in-memory Map with periodic cleanup.
 */
@Injectable()
export class CooldownService implements OnModuleDestroy {
  private readonly logger = new Logger(CooldownService.name);
  private redis: Redis | null = null;
  private memoryStore = new Map<string, number>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      this.redis.connect().catch((err) => {
        this.logger.warn(
          `Redis connection failed, falling back to in-memory: ${err.message}`,
        );
        this.redis = null;
      });
      this.logger.log('Cooldown service using Redis');
    } else {
      this.logger.log(
        'Cooldown service using in-memory store (set REDIS_URL for horizontal scaling)',
      );
    }

    // Periodic cleanup for in-memory store (every 5 minutes)
    this.cleanupInterval = setInterval(() => {
      if (!this.redis) {
        const now = Date.now();
        for (const [key, timestamp] of this.memoryStore) {
          // Remove entries older than 2 minutes (well past any cooldown)
          if (now - timestamp > 120_000) this.memoryStore.delete(key);
        }
      }
    }, 300_000);
  }

  async onModuleDestroy() {
    clearInterval(this.cleanupInterval);
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Enforce a cooldown. Throws 429 if the cooldown is still active.
   *
   * @param namespace - Category prefix (e.g. 'reset', 'verification')
   * @param key       - Identifier within the namespace (e.g. email or userId)
   * @param cooldownSeconds - Cooldown duration in seconds
   */
  async enforce(
    namespace: string,
    key: string,
    cooldownSeconds: number,
  ): Promise<void> {
    const fullKey = `cooldown:${namespace}:${key.toLowerCase()}`;

    if (this.redis) {
      // SET NX with TTL — atomic, no race conditions
      const set = await this.redis.set(
        fullKey,
        '1',
        'EX',
        cooldownSeconds,
        'NX',
      );
      if (!set) {
        const ttl = await this.redis.ttl(fullKey);
        throw new HttpException(
          `Please wait ${ttl > 0 ? ttl : cooldownSeconds} seconds before retrying`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } else {
      // In-memory fallback
      const lastRequest = this.memoryStore.get(fullKey);
      if (lastRequest) {
        const elapsed = (Date.now() - lastRequest) / 1000;
        if (elapsed < cooldownSeconds) {
          const remaining = Math.ceil(cooldownSeconds - elapsed);
          throw new HttpException(
            `Please wait ${remaining} seconds before retrying`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }
      this.memoryStore.set(fullKey, Date.now());
    }
  }

  /**
   * Clear a cooldown entry (e.g. if the email send fails and we want to allow a retry).
   */
  async clear(namespace: string, key: string): Promise<void> {
    const fullKey = `cooldown:${namespace}:${key.toLowerCase()}`;
    if (this.redis) {
      await this.redis.del(fullKey);
    } else {
      this.memoryStore.delete(fullKey);
    }
  }
}
