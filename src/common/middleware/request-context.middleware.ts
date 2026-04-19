import { Injectable, NestMiddleware } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    req['requestId'] = crypto.randomUUID?.() || Date.now().toString();
    req['requestTime'] = new Date();

    // Capture client IP — prefer X-Forwarded-For (set by load balancers/proxies)
    const forwarded = req.headers['x-forwarded-for'] as string;
    req['clientIp'] = forwarded
      ? forwarded.split(',')[0].trim()
      : req.socket?.remoteAddress || req.ip;

    next();
  }
}
