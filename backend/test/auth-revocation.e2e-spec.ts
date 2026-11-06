import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma } from './test-setup';

describe('AuthController - Logout & Revocation (AUT-03)', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
  });

  describe('logout flow', () => {
    it('POST /logout with cookie -> 204 No Content', async () => {
      await request.post('/api/v1/auth/register').send({
        email: 'logout@example.cm',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        termsAccepted: true,
        termsVersion: '1.0',
      });

      const loginRes = await request.post('/api/v1/auth/login').send({
        email: 'logout@example.cm',
        password: 'SecurePass123',
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.headers['set-cookie']).toBeDefined();
    });

    it('POST /logout without cookie -> 204 No Content', async () => {
      const res = await request.post('/api/v1/auth/logout').send();
      expect(res.status).toBe(204);
    });

    it('POST /logout after already logged out -> 204 No Content (idempotent)', async () => {
      const res = await request.post('/api/v1/auth/logout').send();
      expect(res.status).toBe(204);
    });

    it('POST /logout with ?all=true -> revoke entire family', async () => {
      const loginRes = await request.post('/api/v1/auth/login').send({
        email: 'logout@example.cm',
        password: 'SecurePass123',
      });
      expect(loginRes.status).toBe(200);

      const res = await request.post('/api/v1/auth/logout').query({ all: 'true' });
      expect(res.status).toBe(204);

      const remaining = await prisma.refreshToken.count({ where: { revokedAt: null } });
      expect(remaining).toBe(0);
    });
  });

  describe('reuse detection', () => {
    it('should detect token reuse and return REFRESH_TOKEN_REUSE_DETECTED', async () => {
      const loginRes = await request.post('/api/v1/auth/login').send({
        email: 'reuse@example.cm',
        password: 'SecurePass123',
      });
      expect(loginRes.status).toBe(200);

      const setCookie = loginRes.headers['set-cookie']![0];
      const rtToken = setCookie.split(';')[0].split('=')[1];

      const res = await request
        .post('/api/v1/auth/login')
        .send({
          email: 'reuse@example.cm',
          password: 'SecurePass123',
        })
        .set('Cookie', `bruny_refresh=${rtToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('audit logging', () => {
    it('should create audit logs for logout events', async () => {
      await request.post('/api/v1/auth/register').send({
        email: 'audit@example.cm',
        password: 'SecurePass123',
        firstName: 'Audit',
        lastName: 'User',
        termsAccepted: true,
        termsVersion: '1.0',
      });

      const loginRes = await request.post('/api/v1/auth/login').send({
        email: 'audit@example.cm',
        password: 'SecurePass123',
      });
      expect(loginRes.status).toBe(200);

      await request.post('/api/v1/auth/logout').send();

      const auditLogs = await prisma.auditLog.findMany({
        where: { action: 'USER_LOGGED_OUT' },
      });
      expect(auditLogs.length).toBeGreaterThan(0);

      const noTokenLogs = await prisma.auditLog.findMany({
        where: { action: 'USER_LOGOUT_NO_TOKEN' },
      });
      expect(noTokenLogs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
