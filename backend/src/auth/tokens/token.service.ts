import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/database.module';
import { randomBytes, createHmac } from 'crypto';

export type RevokeReason =
  | 'ROTATION'
  | 'REUSE_DETECTED'
  | 'EXPIRED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'SUSPENDED';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /// generateAccessToken -------------------------------------------------------
  async generateAccessToken(user: {
    id: string;
    email: string | null;
    roles: string[];
  }): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      typ: 'access' as const,
      iat: Math.floor(Date.now() / 1000),
    };
    const expiresIn = this.config.get<number>('JWT_ACCESS_TTL') ?? 900; // 15 min en secondes
    return this.jwt.sign(payload, { expiresIn: `${expiresIn}s` });
  }

  /// generateRefreshToken -------------------------------------------------------
  async generateRefreshToken(
    userId: string,
    family: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ token: string; expiresAt: Date }> {
    const rawToken = randomBytes(64).toString('base64url');
    const tokenHash = createHmac('sha256', rawToken).digest('hex');
    const ttl = this.config.get<string>('REFRESH_TOKEN_TTL') ?? '30d';
    const expiresAt = new Date(Date.now() + this.ttlToMs(ttl));

    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId: family, // Prisma field is familyId
        tokenHash,
        expiresAt,
        ip: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
      },
    });

    return { token: rawToken, expiresAt };
  }

  /// rotateRefreshToken -------------------------------------------------------
  async rotateRefreshToken(
    tokenPlain: string,
    family: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{
    accessToken: string;
    refreshToken: string; // en clair, pour le controller/cookie
    userId: string;
  }> {
    const tokenHash = createHmac('sha256', tokenPlain).update(tokenPlain).digest('hex');

    const result = await this.prisma.$transaction(async (tx) => {
      const record = await tx.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!record) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      if (record.revokedAt) {
        // Rejeté : révocation complète de la famille
        await tx.refreshToken.updateMany({
          where: { familyId: record.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new Error('REFRESH_TOKEN_REUSE_DETECTED');
      }

      if (record.expiresAt.getTime() <= Date.now()) {
        await tx.refreshToken.updateMany({
          where: { familyId: record.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new Error('REFRESH_TOKEN_EXPIRED');
      }

      // Rotation valide : révocation du présent token
      await tx.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });

      // Création d'un nouveau token dans la même famille
      const newRawToken = randomBytes(64).toString('base64url');
      const newTokenHash = createHmac('sha256', newRawToken).digest('hex');
      const newTtl = this.config.get<string>('REFRESH_TOKEN_TTL') ?? '30d';
      await tx.refreshToken.create({
        data: {
          userId: record.userId,
          familyId: record.familyId, // Utiliser familyId ici aussi
          tokenHash: newTokenHash,
          expiresAt: new Date(Date.now() + this.ttlToMs(newTtl)),
          ip: meta.ipAddress ?? null,
          userAgent: meta.userAgent ?? null,
        },
      });

      const accessToken = await this.jwt.sign(
        // this.jwt, pas tx.jwt
        { sub: record.userId, email: '', roles: [], typ: 'access' },
        { expiresIn: `${this.config.get<number>('JWT_ACCESS_TTL') ?? 900}s` },
      );

      return {
        accessToken,
        refreshToken: newRawToken,
        userId: record.userId,
      };
    });

    return result;
  }

  /// revokeRefreshTokenByHash -------------------------------------------------------
  /// Révoque un RefreshToken par son hash (utilisé par logout et detectAndHandleReuse).
  /// Idempotent : si déjà révoqué, retourne 0 sans erreur.
  async revokeRefreshTokenByHash(tokenHash: string, reason: RevokeReason): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  /// revokeRefreshToken -------------------------------------------------------
  /// Révoque un RefreshToken par son hash (utilisé par logout).
  /// Idempotent : si déjà révoqué, retourne 0 sans erreur.
  async revokeRefreshToken(tokenPlain: string): Promise<void> {
    const tokenHash = createHmac('sha256', tokenPlain).update(tokenPlain).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  /// detectAndHandleReuse -------------------------------------------------------
  /// Appelée lorsqu'on présente un token déjà révoqué.
  /// - Si trouvé et déjà révoqué : révoke toute la famille avec REUSE_DETECTED, create AuditLog, throw.
  /// - Si introuvable : throw INVALID_REFRESH_TOKEN (tentative random, pas un rejeu).
  async detectAndHandleReuse(
    tokenHash: string,
    _meta: { ipAddress?: string; userAgent?: string },
  ): Promise<never> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!record) {
      // Token inconnu = tentative random, pas un rejeu
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    if (record.revokedAt) {
      // Token déjà révoqué → rejeu détecté : révoque TOUTE la famille
      const _revokedCount = await this.revokeFamilyWithReason(
        record.familyId,
        'REUSE_DETECTED',
        meta,
      );

      // AuditLog REFRESH_TOKEN_REUSE_DETECTED
      // Note : l'audit est créé dans le service AuthService via DI, pas ici directement
      // pour respecter la règle no-restricted-imports (pas d'import cross-module direct).
      // Le controller/service appellant déclenchera l'audit après cet throw.
      throw new Error('REFRESH_TOKEN_REUSE_DETECTED');
    }

    // Token trouvé mais pas encore révoqué : ce n'est pas un rejeu, c'est un token valide
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  /// revokeFamilyWithReason -------------------------------------------------------
  /// Version enrichie de revokeFamily qui accepte un reason et retourne le nombre de tokens révoqués.
  private async revokeFamilyWithReason(
    family: string,
    reason: RevokeReason,
    _meta: { ipAddress?: string; userAgent?: string },
  ): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { familyId: family, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
    return result.count;
  }

  /// revokeAllForUser -------------------------------------------------------
  /// revokeAllForUser -------------------------------------------------------
  /// Revoque TOUS les refresh tokens d'un utilisateur (utile pour changement de mot de passe,
  /// suspension, logout de tous les appareils).
  /// Retourne le nombre de tokens revoques.
  async revokeAllForUser(userId: string, reason: RevokeReason): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
    return result.count;
  }

  /// ttlToMs -------------------------------------------------------
  private ttlToMs(ttl: string): number {
    const match = ttl.match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * multipliers[unit];
  }
}
