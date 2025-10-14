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
                // If the handler already returns the unified format, skip reformatting
                if (
                    data &&
                    typeof data === 'object' &&
                    'status' in data &&
                    'data' in data
                ) {
                    return data;
                }

                // Extract HTTP status from the context
                const status = context.switchToHttp().getResponse().statusCode || 200;

                // Handle cases where data could be a single object or array
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
