import { Injectable, NestMiddleware } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {

    req['requestId'] = crypto.randomUUID?.() || Date.now().toString();
    req['requestTime'] = new Date();

    next();
  }
}