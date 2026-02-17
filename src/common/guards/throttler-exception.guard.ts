import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const response = context.switchToHttp().getResponse();

    const retryAfter = Math.ceil(throttlerLimitDetail.ttl ?? 60);

    response.status(429).json({
      statusCode: 429,
      message: `Too many requests. Please wait ${retryAfter} seconds before retrying.`,
      retryAfter,
      limit: throttlerLimitDetail.limit,
      ttl: throttlerLimitDetail.ttl,
      key: throttlerLimitDetail.key,
    });
  }
}
