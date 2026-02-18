import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const status = context.switchToHttp().getResponse().statusCode || 200;

        if (data === null || data === undefined) {
          return {
            status,
            results: 0,
            data: null,
          };
        }

        // Paginated responses from BaseService.findAll
        if (
          typeof data === 'object' &&
          'rows' in data &&
          'meta' in data
        ) {
          return {
            status,
            results: data.rows.length,
            data: data.rows,
            meta: data.meta,
          };
        }

        if (
          typeof data === 'object' &&
          !Array.isArray(data) &&
          'message' in data &&
          Object.keys(data).length <= 2
        ) {
          return {
            status,
            ...data,
          };
        }

        // Array responses
        if (Array.isArray(data)) {
          return {
            status,
            results: data.length,
            data,
          };
        }

        // Single object response
        return {
          status,
          results: 1,
          data,
        };
      }),
    );
  }
}