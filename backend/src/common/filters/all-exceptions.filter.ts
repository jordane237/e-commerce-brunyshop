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
      const payloadObject = (
        typeof payload === 'object' && payload !== null ? payload : {}
      ) as Record<string, unknown>;

      // Business codes (INVALID_CREDENTIALS, TOO_MANY_ATTEMPTS, ...) are
      // carried by the exception payload and must survive normalization.
      const customCode =
        typeof payloadObject['code'] === 'string' && payloadObject['code']
          ? payloadObject['code']
          : this.codeFor(status);

      const { message, errors } = this.readMessage(payloadObject['message'], exception.message);

      return {
        status,
        code: customCode,
        message: isProduction ? 'An error occurred while processing your request.' : message,
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

  // Payload messages arrive either as a plain string, an array of strings
  // (ValidationPipe default) or an array of class-validator errors.
  private readMessage(
    raw: unknown,
    fallback: string,
  ): { message: string; errors: NormalizedErrorBody['errors'] } {
    if (typeof raw === 'string') {
      return { message: raw, errors: [] };
    }
    if (Array.isArray(raw)) {
      const structured = raw.filter(
        (item): item is ValidationError =>
          typeof item === 'object' && item !== null && 'property' in item,
      );
      if (structured.length === raw.length && structured.length > 0) {
        return {
          message: structured
            .map((item) => Object.values(item.constraints ?? {}).join(', '))
            .join(', '),
          errors: structured.map((item) => ({
            field: item.property ?? '',
            message: Object.values(item.constraints ?? {}).join(', '),
          })),
        };
      }
      const lines = raw
        .map((item) => (typeof item === 'string' ? item : String(item)))
        .filter(Boolean);
      if (lines.length > 0) {
        return { message: lines.join(', '), errors: [] };
      }
    }
    return { message: fallback, errors: [] };
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
