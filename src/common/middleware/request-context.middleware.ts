import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Simple context holder (we’ll enhance this later with JWT auth)
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Here we attach a mock user (in real app, extract from JWT)
    req['currentUser'] = {
      id: 'mock-admin-id',
      email: 'admin@example.com',
    };
    next();
  }
}
