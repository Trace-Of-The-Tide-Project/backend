import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
} from 'sequelize';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Error';

    // --- NestJS / HTTP exceptions ---
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        const resObj = res as any;
        message = resObj.message || message;
        error = resObj.error || error;
      }
    } else if (exception instanceof UniqueConstraintError) {
      status = HttpStatus.CONFLICT;
      error = 'Conflict';
      const fields = exception.errors.map((e) => `${e.path} already exists`);
      message = fields.length === 1 ? fields[0] : fields;
    } else if (exception instanceof ForeignKeyConstraintError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      message = 'Referenced record does not exist';
    } else if (exception instanceof ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Validation Error';
      message = exception.errors.map((e) => e.message);
    } else if (exception instanceof DatabaseError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Database Error';
      message = 'Invalid query or data format';

      // --- Generic errors ---
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    if (!(exception instanceof HttpException)) {
      console.error(`[${request.method}] ${request.url} →`, exception);
    }

    response.status(status).json({
      status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
