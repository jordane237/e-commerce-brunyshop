import 'reflect-metadata';

import type { ArgumentsHost } from '@nestjs/common';
import {
  BadRequestException,
  HttpException,
  Logger as NestLogger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NormalizedErrorBody } from './all-exceptions.filter';
import { AllExceptionsFilter } from './all-exceptions.filter';

interface Captured {
  status?: number;
  body?: NormalizedErrorBody;
}

function configFor(nodeEnv: string): ConfigService {
  return {
    get: (key: string): string | undefined => (key === 'NODE_ENV' ? nodeEnv : undefined),
  } as unknown as ConfigService;
}

function catchWith(
  filter: AllExceptionsFilter,
  exception: unknown,
  request: Record<string, unknown>,
): Captured {
  const captured: Captured = {};
  const response = {
    status: (code: number): typeof response => {
      captured.status = code;
      return response;
    },
    json: (body: NormalizedErrorBody): typeof response => {
      captured.body = body;
      return response;
    },
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  filter.catch(exception, host);
  return captured;
}

describe('AllExceptionsFilter', () => {
  beforeEach(() => {
    // Le filtre journalise chaque erreur : silencieux pendant les tests.
    vi.spyOn(NestLogger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('produit exactement les 6 champs normalisés (CA4)', () => {
    const filter = new AllExceptionsFilter(configFor('development'));
    const { status, body } = catchWith(filter, new UnauthorizedException('Non autorisé'), {
      url: '/api/v1/auth/login',
      headers: { 'x-request-id': 'req-abc' },
    });

    expect(status).toBe(401);
    expect(body).toBeDefined();
    expect(Object.keys(body ?? {}).sort()).toEqual(
      ['code', 'errors', 'message', 'requestId', 'statusCode', 'timestamp'].sort(),
    );
    expect(body).toMatchObject({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Non autorisé',
      errors: [],
      requestId: 'req-abc',
    });
    // timestamp : chaîne ISO réellement décodable.
    expect(Number.isNaN(Date.parse(body?.timestamp ?? ''))).toBe(false);
  });

  it('conserve le code métier porté par la payload (INVALID_CREDENTIALS…)', () => {
    const filter = new AllExceptionsFilter(configFor('development'));
    const exception = new HttpException(
      { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Identifiants invalides' },
      401,
    );
    const { body } = catchWith(filter, exception, { url: '/api/v1/auth/login', headers: {} });

    expect(body?.code).toBe('INVALID_CREDENTIALS');
    expect(body?.message).toBe('Identifiants invalides');
    expect(body?.statusCode).toBe(401);
  });

  it("déduit le code du statut quand la payload n'en porte pas", () => {
    const filter = new AllExceptionsFilter(configFor('development'));
    // Nest 12 ne fournit plus d'exception 429 nominative : HttpException nu.
    const cases: Array<[HttpException, string, number]> = [
      [new NotFoundException('Introuvable'), 'NOT_FOUND', 404],
      [new HttpException('Trop de requêtes', 429), 'RATE_LIMITED', 429],
    ];

    for (const [exception, code, statusCode] of cases) {
      const { body } = catchWith(filter, exception, { url: '/api/v1/x', headers: {} });
      expect(body?.code).toBe(code);
      expect(body?.statusCode).toBe(statusCode);
    }
  });

  it('transforme les erreurs class-validator en tableau errors{field,message}', () => {
    const filter = new AllExceptionsFilter(configFor('development'));
    const exception = new BadRequestException({
      statusCode: 400,
      message: [
        { property: 'email', constraints: { isEmail: 'adresse invalide' } },
        { property: 'nom', constraints: { isNotEmpty: 'ne peut pas être vide' } },
      ],
    });
    const { status, body } = catchWith(filter, exception, {
      url: '/api/v1/auth/register',
      headers: {},
    });

    expect(status).toBe(400);
    // codeFor(400) = BAD_REQUEST (VALIDATION_ERROR est réservé au 422).
    expect(body?.code).toBe('BAD_REQUEST');
    expect(body?.message).toBe('adresse invalide, ne peut pas être vide');
    expect(body?.errors).toEqual([
      { field: 'email', message: 'adresse invalide' },
      { field: 'nom', message: 'ne peut pas être vide' },
    ]);
  });

  it('accepte aussi le tableau de chaînes renvoyé par forbidNonWhitelisted', () => {
    const filter = new AllExceptionsFilter(configFor('development'));
    const exception = new BadRequestException({
      statusCode: 400,
      message: ['champX ne doit pas exister', 'champY ne doit pas exister'],
    });
    const { body } = catchWith(filter, exception, { url: '/api/v1/x', headers: {} });

    expect(body?.message).toBe('champX ne doit pas exister, champY ne doit pas exister');
    expect(body?.errors).toEqual([]);
  });

  it('limite toute erreur non-HttpException à INTERNAL_ERROR (500)', () => {
    const filter = new AllExceptionsFilter(configFor('development'));
    const { status, body } = catchWith(filter, new Error('boom détail technique'), {
      url: '/api/v1/x',
      headers: {},
    });

    expect(status).toBe(500);
    // String(exception) en dev : préfixe de classe inclus, stack exclue.
    expect(body).toMatchObject({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Error: boom détail technique',
      errors: [],
    });
  });

  it('masque les détails techniques en production (message générique)', () => {
    const filter = new AllExceptionsFilter(configFor('production'));
    const { status, body } = catchWith(filter, new Error('connexion postgres://… refusée'), {
      url: '/api/v1/x',
      headers: {},
    });

    expect(status).toBe(500);
    expect(body?.message).toBe('An error occurred while processing your request.');
    expect(body?.message).not.toContain('postgres');
  });

  it('en production, masque le message de la HttpException mais garde le code métier', () => {
    const filter = new AllExceptionsFilter(configFor('production'));
    const exception = new HttpException(
      { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'mot de passe incorrect' },
      401,
    );
    const { body } = catchWith(filter, exception, { url: '/api/v1/auth/login', headers: {} });

    expect(body?.message).toBe('An error occurred while processing your request.');
    expect(body?.code).toBe('INVALID_CREDENTIALS');
  });

  it("requestId : request.id d'abord, puis en-tête X-Request-Id, puis unknown", () => {
    const filter = new AllExceptionsFilter(configFor('development'));

    const fromId = catchWith(filter, new Error('x'), {
      id: 'via-request-id',
      headers: { 'x-request-id': 'via-header' },
    });
    expect(fromId.body?.requestId).toBe('via-request-id');

    const fromHeader = catchWith(filter, new Error('x'), {
      headers: { 'x-request-id': 'via-header' },
    });
    expect(fromHeader.body?.requestId).toBe('via-header');

    const fallback = catchWith(filter, new Error('x'), { headers: {} });
    expect(fallback.body?.requestId).toBe('unknown');
  });

  it("ne remonte jamais la stack d'exception dans le corps", () => {
    const failure = new TypeError("undefined n'est pas une fonction");

    const devBody = catchWith(new AllExceptionsFilter(configFor('development')), failure, {
      url: '/api/v1/x',
      headers: {},
    }).body;
    // En dev, le message agrégé reste, mais aucune frame de stack.
    expect(JSON.stringify(devBody)).not.toContain('.js:');

    const prodBody = catchWith(new AllExceptionsFilter(configFor('production')), failure, {
      url: '/api/v1/x',
      headers: {},
    }).body;
    expect(JSON.stringify(prodBody)).not.toContain('.js:');
    expect(JSON.stringify(prodBody)).not.toContain('TypeError');
  });
});
