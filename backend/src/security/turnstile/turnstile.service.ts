import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

import type { ApplicationConfig } from '../../config/configuration';
import type { TurnstileSettings } from '../../config/turnstile.settings';
import type { TurnstileVerifyResult } from './turnstile.types';

interface CloudflareResponse {
  success?: unknown;
  'error-codes'?: unknown;
}

const UNAVAILABLE_ERRORS = new Set(['internal-error', 'bad-request']);

@Injectable()
export class TurnstileService {
  private readonly settings: TurnstileSettings;

  constructor(
    config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    const application = config.get<ApplicationConfig>('app');
    if (application === undefined) {
      throw new Error('Application configuration missing for Turnstile.');
    }
    this.settings = application.turnstile;
  }

  isEnabled(): boolean {
    return this.settings.enabled;
  }

  async verifyToken(token: string, remoteIp?: string): Promise<TurnstileVerifyResult> {
    const normalized = token.trim();
    if (normalized === '') {
      return { success: false, reason: 'empty-token' };
    }
    if (normalized.length > 4096) {
      return { success: false, reason: 'invalid-token' };
    }
    if (!this.settings.enabled) {
      return { success: true, skipped: true };
    }
    if (this.settings.secretKey === null) {
      // Defensive: validation refuses to boot in this state when enabled.
      this.logUnavailable('missing-secret');
      return { success: false, unavailable: true, reason: 'internal-error' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.settings.timeoutMs);
    const body = new URLSearchParams({
      secret: this.settings.secretKey,
      response: normalized,
    });
    if (remoteIp !== undefined && remoteIp.trim() !== '') {
      body.set('remoteip', remoteIp.trim());
    }

    try {
      const response = await fetch(this.settings.verifyUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logUnavailable(`http-${response.status}`, normalized);
        return {
          success: false,
          unavailable: true,
          reason: 'http-error',
        };
      }

      let payload: CloudflareResponse;
      try {
        payload = (await response.json()) as CloudflareResponse;
      } catch {
        this.logUnavailable('invalid-json', normalized);
        return {
          success: false,
          unavailable: true,
          reason: 'invalid-response',
        };
      }

      const errorCodes = Array.isArray(payload['error-codes'])
        ? payload['error-codes'].filter((code): code is string => typeof code === 'string')
        : [];

      if (payload.success === true) {
        return { success: true };
      }

      if (errorCodes.some((code) => UNAVAILABLE_ERRORS.has(code))) {
        this.logUnavailable('cloudflare-internal-error', normalized, errorCodes);
        return {
          success: false,
          unavailable: true,
          reason: 'internal-error',
          errorCodes,
        };
      }

      this.logger.debug(
        {
          tokenPreview: this.preview(normalized),
          errorCodes,
        },
        'Turnstile rejected a token',
      );
      return {
        success: false,
        reason: 'invalid-token',
        errorCodes,
      };
    } catch (error: unknown) {
      const timedOut = error instanceof Error && error.name === 'AbortError';
      this.logUnavailable(timedOut ? 'timeout' : 'network', normalized);
      return {
        success: false,
        unavailable: true,
        reason: timedOut ? 'timeout' : 'network-error',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private logUnavailable(cause: string, token?: string, errorCodes?: string[]): void {
    this.logger.error(
      {
        alert: 'TURNSTILE_UNAVAILABLE',
        cause,
        ...(token !== undefined ? { tokenPreview: this.preview(token) } : {}),
        ...(errorCodes !== undefined ? { errorCodes } : {}),
      },
      'Turnstile verification is unavailable',
    );
  }

  private preview(token: string): string {
    return token.slice(0, 8);
  }
}
