// Global exception filter: every error follows the same normalized shape and
// never leaks technical details in production.
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  type ValidationError,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

export interface NormalizedErrorBody {
  statusCode: number;
  code: string;
  message: string;
  errors: Array<{ field: string; message: string }>;
  requestId: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();
    const isProduction = this.config.get('NODE_ENV') === 'production';

    const { status, code, message, errors } = this.normalize(exception, isProduction);

    const body: NormalizedErrorBody = {
      statusCode: status,
      code,
      message,
      errors,
      requestId: request.id ?? String(request.headers['x-request-id'] ?? 'unknown'),
      timestamp: new Date().toISOString(),
    };

    this.logger.error({ err: exception }, `request failed ${request.url}`);
    response.status(status).json(body);
  }

  private normalize(
    exception: unknown,
    isProduction: boolean,
  ): {
    status: number;
    code: string;
    message: string;
    errors: NormalizedErrorBody['errors'];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const validationErrors = (payload as { message?: ValidationError[] }).message;
      const errors = Array.isArray(validationErrors)
        ? validationErrors.map((e) => ({
            field: e.property ?? '',
            message: Object.values(e.constraints ?? {}).join(', '),
          }))
        : [];
      return {
        status,
        code: this.codeFor(status),
        message: isProduction
          ? 'An error occurred while processing your request.'
          : ((payload as { message?: string }).message ?? exception.message),
        errors,
      };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'An error occurred while processing your request.'
        : String(exception),
      errors: [],
    };
  }

  private codeFor(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return map[status] ?? 'ERROR';
  }
}
