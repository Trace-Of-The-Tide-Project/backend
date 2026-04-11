import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

const DAILY_LIMIT = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

interface QuotaEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class UploadQuotaGuard implements CanActivate {
  private readonly store = new Map<string, QuotaEntry>();

  constructor() {
    // Clean expired entries every 10 minutes
    const timer = setInterval(
      () => {
        const now = Date.now();
        for (const [key, entry] of this.store) {
          if (now >= entry.resetAt) this.store.delete(key);
        }
      },
      10 * 60 * 1000,
    );
    timer.unref();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip =
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.ip ||
      request.socket?.remoteAddress;

    const now = Date.now();
    let entry = this.store.get(ip);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + DAY_MS };
      this.store.set(ip, entry);
    }

    entry.count++;

    if (entry.count > DAILY_LIMIT) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Daily upload limit (${DAILY_LIMIT}) exceeded. Try again in ${Math.ceil(retryAfter / 3600)} hours.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
