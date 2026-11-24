import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/database.module';
import { AuditLogService } from '../../audit/audit.service';
import type { AdminDeliveryZoneDto } from './dto/admin-delivery-zone.dto';
import type { CreateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import type { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto';
import type { AdminDeliveryZonesQueryDto } from './dto/admin-delivery-zones-query.dto';
import { DELIVERY_MODES, type DeliveryModeValue } from './delivery-modes';

const DELIVERY_ZONE_AUDIT_ACTIONS = {
  CREATED: 'DELIVERY_ZONE_CREATED',
  UPDATED: 'DELIVERY_ZONE_UPDATED',
  DELETED: 'DELIVERY_ZONE_DELETED',
} as const;

export interface DeliveryZoneActor {
  userId: string;
  ip?: string;
  userAgent?: string;
}

interface DeliveryZoneRow {
  id: string;
  name: string;
  description: string | null;
  cities: string[];
  fee: number;
  estimatedDays: number;
  modes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AdminDeliveryZonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list(query: AdminDeliveryZonesQueryDto = {}): Promise<AdminDeliveryZoneDto[]> {
    const zones = await this.prisma.deliveryZone.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    const normalizedSearch = query.search?.trim().toLocaleLowerCase('fr');
    const normalizedCity = query.city?.trim().toLocaleLowerCase('fr');

    return zones
      .filter((zone) => {
        if (query.isActive !== undefined && zone.isActive !== query.isActive) return false;
        if (query.mode !== undefined && !zone.modes.includes(query.mode as never)) return false;
        if (normalizedCity !== undefined && normalizedCity !== '') {
          if (!zone.cities.some((city) => city.trim().toLocaleLowerCase('fr') === normalizedCity)) {
            return false;
          }
        }
        if (normalizedSearch !== undefined && normalizedSearch !== '') {
          const haystack = [zone.name, zone.description ?? '', ...zone.cities]
            .join(' ')
            .toLocaleLowerCase('fr');
          if (!haystack.includes(normalizedSearch)) return false;
        }
        return true;
      })
      .map((zone) => this.toDto(zone));
  }

  async get(id: string): Promise<AdminDeliveryZoneDto> {
    const zone = await this.prisma.deliveryZone.findUnique({ where: { id } });
    if (zone === null) this.throwNotFound();
    return this.toDto(zone);
  }

  async create(
    dto: CreateDeliveryZoneDto,
    actor: DeliveryZoneActor,
  ): Promise<AdminDeliveryZoneDto> {
    const data = this.normalizeCreate(dto);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const zone = await tx.deliveryZone.create({ data });
        await this.audit(tx, actor, {
          action: DELIVERY_ZONE_AUDIT_ACTIONS.CREATED,
          entity: 'DeliveryZone',
          entityId: zone.id,
          after: this.snapshot(zone),
        });
        return zone;
      });

      return this.toDto(created);
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  async update(
    id: string,
    dto: UpdateDeliveryZoneDto,
    actor: DeliveryZoneActor,
  ): Promise<AdminDeliveryZoneDto> {
    const existing = await this.prisma.deliveryZone.findUnique({ where: { id } });
    if (existing === null) this.throwNotFound();

    const data = this.normalizeUpdate(dto, existing);
    if (Object.keys(data).length === 0) {
      return this.toDto(existing);
    }

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const zone = await tx.deliveryZone.update({
          where: { id },
          data,
        });
        await this.audit(tx, actor, {
          action: DELIVERY_ZONE_AUDIT_ACTIONS.UPDATED,
          entity: 'DeliveryZone',
          entityId: id,
          before: this.snapshot(existing),
          after: this.snapshot(zone),
        });
        return zone;
      });

      return this.toDto(updated);
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  async remove(id: string, actor: DeliveryZoneActor): Promise<void> {
    const existing = await this.prisma.deliveryZone.findUnique({
      where: { id },
      include: { _count: { select: { shipments: true } } },
    });
    if (existing === null) this.throwNotFound();

    if (existing._count.shipments > 0) {
      throw new ConflictException({
        code: 'DELIVERY_ZONE_IN_USE',
        message: 'Cette zone est utilisée par des livraisons et ne peut pas être supprimée.',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryZone.delete({ where: { id } });
      await this.audit(tx, actor, {
        action: DELIVERY_ZONE_AUDIT_ACTIONS.DELETED,
        entity: 'DeliveryZone',
        entityId: id,
        before: this.snapshot(existing),
      });
    });
  }

  private normalizeCreate(dto: CreateDeliveryZoneDto): {
    name: string;
    description: string | null;
    cities: string[];
    fee: number;
    estimatedDays: number;
    modes: DeliveryModeValue[];
    isActive: boolean;
  } {
    const cities = this.normalizeCities(dto.cities);
    const modes = this.normalizeModes(dto.modes);

    return {
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      cities,
      fee: dto.fee,
      estimatedDays: dto.estimatedDays,
      modes,
      isActive: dto.isActive ?? true,
    };
  }

  private normalizeUpdate(
    dto: UpdateDeliveryZoneDto,
    existing: DeliveryZoneRow,
  ): Prisma.DeliveryZoneUpdateInput {
    const data: Prisma.DeliveryZoneUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.cities !== undefined) data.cities = this.normalizeCities(dto.cities);
    if (dto.fee !== undefined) data.fee = dto.fee;
    if (dto.estimatedDays !== undefined) data.estimatedDays = dto.estimatedDays;
    if (dto.modes !== undefined) data.modes = this.normalizeModes(dto.modes);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    // Avoid writing an identical update: simpler and clearer for audit.
    if (
      data.name === existing.name &&
      data.description === existing.description &&
      JSON.stringify(data.cities ?? existing.cities) === JSON.stringify(existing.cities) &&
      (data.fee ?? existing.fee) === existing.fee &&
      (data.estimatedDays ?? existing.estimatedDays) === existing.estimatedDays &&
      JSON.stringify(data.modes ?? existing.modes) === JSON.stringify(existing.modes) &&
      (data.isActive ?? existing.isActive) === existing.isActive
    ) {
      return {};
    }

    return data;
  }

  private normalizeCities(cities: string[]): string[] {
    const normalized = cities.map((city) => city.trim()).filter((city) => city.length > 0);
    if (normalized.length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Au moins une ville desservie est requise.',
      });
    }
    if (
      new Set(normalized.map((city) => city.toLocaleLowerCase('fr'))).size !== normalized.length
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Les villes desservies ne doivent pas contenir de doublons.',
      });
    }
    return normalized;
  }

  private normalizeModes(modes: string[]): DeliveryModeValue[] {
    const normalized = [
      ...new Set(modes.map((mode) => mode.trim().toUpperCase())),
    ] as DeliveryModeValue[];
    if (normalized.length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Au moins un mode de livraison est requis.',
      });
    }
    if (normalized.some((mode) => !DELIVERY_MODES.includes(mode))) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Mode de livraison invalide.',
      });
    }
    return normalized;
  }

  private toDto(zone: DeliveryZoneRow): AdminDeliveryZoneDto {
    return {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      cities: zone.cities,
      fee: zone.fee,
      estimatedDays: zone.estimatedDays,
      modes: zone.modes,
      isActive: zone.isActive,
      createdAt: zone.createdAt.toISOString(),
      updatedAt: zone.updatedAt.toISOString(),
    };
  }

  private snapshot(zone: DeliveryZoneRow): Prisma.InputJsonValue {
    return {
      name: zone.name,
      description: zone.description,
      cities: zone.cities,
      fee: zone.fee,
      estimatedDays: zone.estimatedDays,
      modes: zone.modes,
      isActive: zone.isActive,
    } as Prisma.InputJsonValue;
  }

  private async audit(
    client: Prisma.TransactionClient,
    actor: DeliveryZoneActor,
    event: {
      action: string;
      entity: string;
      entityId: string;
      before?: Prisma.InputJsonValue;
      after?: Prisma.InputJsonValue;
    },
  ): Promise<void> {
    await this.auditLog.record(client, {
      userId: actor.userId,
      ip: actor.ip,
      userAgent: actor.userAgent,
      ...event,
    });
  }

  private throwNotFound(): never {
    throw new NotFoundException({
      code: 'DELIVERY_ZONE_NOT_FOUND',
      message: 'Zone de livraison introuvable.',
    });
  }

  private rethrowWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'DELIVERY_ZONE_NAME_ALREADY_EXISTS',
          message: 'Une zone de livraison porte déjà ce nom.',
        });
      }
      if (error.code === 'P2025') this.throwNotFound();
    }
    throw error;
  }
}
