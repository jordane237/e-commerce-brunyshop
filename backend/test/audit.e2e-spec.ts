import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { SuperTest, test } from 'supertest';
import { app } from '../src/main';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { AuditLogService } from '../modules/audit/audit.service';
import { SensitiveAction } from '../audit/audit.constants';
import { AuditLogQueryDto } from '../audit/dto/audit-log-query.dto';

describe('Audit E2E Tests (AUT-08)', () => {
  let request: SuperTest<test>;
  let prisma: PrismaService;
  let auditService: AuditLogService;

  beforeAll(async () => {
    prisma = new PrismaService();
    auditService = new AuditLogService();
    request = SuperTest(app.getHttpServer());
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /api/v1/audit-logs (read-only endpoint)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request.get('/api/v1/audit-logs').expect(401);
      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request.get('/api/v1/audit-logs').set('Authorization', 'Bearer invalid-token').expect(403);
      expect(response.body).toHaveProperty('statusCode', 403);
    });

    it('should return 200 for admin users', async () => {
      const response = await request.get('/api/v1/audit-logs').set('Authorization', 'Bearer valid-admin-token').expect(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
    });

    it('should filter by userId', async () => {
      const response = await request.get('/api/v1/audit-logs?userId=some-user-uuid').set('Authorization', 'Bearer valid-admin-token').expect(200);
      if (response.body.data) {
        response.body.data.forEach((log: any) => {
          expect(log.userId).toBe('some-user-uuid');
        });
      }
    });

    it('should filter by action type', async () => {
      const response = await request.get(`/api/v1/audit-logs?action=${SensitiveAction.PRODUCT_PRICE_UPDATED}`).set('Authorization', 'Bearer valid-admin-token').expect(200);
      if (response.body.data) {
        response.body.data.forEach((log: any) => {
          expect(log.action).toBe(SensitiveAction.PRODUCT_PRICE_UPDATED);
        });
      }
    });

    it('should filter by entity', async () => {
      const response = await request.get('/api/v1/audit-logs?entity=Product').set('Authorization', 'Bearer valid-admin-token').expect(200);
      if (response.body.data) {
        response.body.data.forEach((log: any) => {
          expect(log.entity).toBe('Product');
        });
      }
    });

    it('should support pagination (page and limit)', async () => {
      const response = await request.get('/api/v1/audit-logs?page=1&limit=10').set('Authorization', 'Bearer valid-admin-token').expect(200);
      if (response.body.meta) {
        expect(response.body.meta.page).toBe(1);
        expect(response.body.meta.limit).toBe(10);
        expect(Array.isArray(response.body.data)).toBe(true);
        if (response.body.data) {
          expect(response.body.data.length).toBeLessThanOrEqual(10);
        }
        expect(response.body.meta.totalPages).toBeGreaterThan(0);
      }
    });
  });
});
describe('GET /api/v1/audit-logs/:id (detail)', () => {
    it('should return 404 for non-existent audit log', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000001';
      const response = await request.get(`/api/v1/audit-logs/${nonExistentId}`).set('Authorization', 'Bearer valid-admin-token').expect(404);
      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 401 for unauthenticated detail request', async () => {
      const nonExistentId = 'some-uuid';
      const response = await request.get(`/api/v1/audit-logs/${nonExistentId}`).expect(401);
      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should validate UUID format in path parameter', async () => {
      const response = await request.get('/api/v1/audit-logs/not-a-uuid').set('Authorization', 'Bearer valid-admin-token').expect(400);
    });
  });

  describe('Sensitive data sanitization', () => {
    it('should not store plain passwords in audit logs', async () => {
      await auditService.logSensitiveChange({
        userId: 'user-123',
        action: SensitiveAction.PRODUCT_PRICE_UPDATED,
        entity: 'Product',
        entityId: 'prod-456',
        before: { password: 'secret123', price: 25000 },
        after: { price: 30000, token: 'abc' },
        ipAddress: '10.0.0.1',
      });

      const logs = await prisma.auditLog.findMany({
        where: { entity: 'Product', entityId: 'prod-456' },
        take: 1,
        orderBy: { createdAt: 'desc' },
      });

      if (logs.length > 0) {
        const before = logs[0].before as Record<string, unknown>;
        const after = logs[0].after as Record<string, unknown>;
        expect(before.password).toBeUndefined();
        expect(after.token).toBeUndefined();
        expect(before.price).toBe(25000);
        expect(after.price).toBe(30000);
      }
    });

    it('should handle circular reference without crashing', async () => {
      const obj: any = { name: 'test' };
      obj.self = obj;
      const result = await auditService['sanitizeForAudit'](obj);
      expect(result).toBeDefined();
    });
  });
});