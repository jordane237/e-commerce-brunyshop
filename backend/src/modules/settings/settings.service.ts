import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../infrastructure/database/database.module';

export const STOCK_LOW_DEFAULT_THRESHOLD_KEY = 'stock.low.defaultThreshold';
export const FALLBACK_STOCK_LOW_THRESHOLD = 5;

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Seuil global utilisé lorsqu'une variante n'en fournit pas explicitement.
   * Ordre : Setting en base > STOCK_LOW_THRESHOLD_DEFAULT > 5.
   * La valeur de la variante reste toujours prioritaire côté appelant.
   */
  async getStockLowThresholdDefault(): Promise<number> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: STOCK_LOW_DEFAULT_THRESHOLD_KEY },
      select: { value: true },
    });
    const fromDatabase = this.toPositiveInteger(setting?.value);
    if (fromDatabase !== null) return fromDatabase;

    const fromEnvironment = this.config.get<number>('app.stock.lowThresholdDefault');
    if (fromEnvironment !== undefined && Number.isInteger(fromEnvironment) && fromEnvironment > 0) {
      return fromEnvironment;
    }

    return FALLBACK_STOCK_LOW_THRESHOLD;
  }

  private toPositiveInteger(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      return null;
    }
    return value;
  }
}
