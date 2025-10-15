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

        if (
          data &&
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

        const formattedData = Array.isArray(data) ? data : [data];

        return {
          status,
          results: formattedData.length,
          data: formattedData,
        };
      }),
    );
  }
}
