import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { prisma } from '../test-setup';

describe('AuthController - Registration (AUT-01)', () => {
  beforeEach(async () => {
    // Reset: clean User, AuditLog, Setting before each test
    await prisma.user.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.setting.deleteMany();
    await prisma.setting.create({ data: { key: 'terms.version', value: '1.0' } });
  });

  // Happy path
  it('POST /api/v1/auth/register with valid email + password + terms -> 201', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email: 'client@example.cm',
      password: 'SuperSecurePassword123',
      firstName: 'Jean',
      lastName: 'Dupont',
      termsAccepted: true,
      termsVersion: '1.0',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      message: expect.stringContaining('compte créé'),
      id: expect.any(String),
      emailMasked: 'c***@example.cm',
      phoneMasked: null,
      status: 'PENDING_VERIFICATION',
      createdAt: expect.any(String),
    });
  });

  // Duplicate email => neutral 201, DB unchanged (silent).
  it('POST /api/v1/auth/register with existing email => 201 neutral, DB unchanged', async () => {
    // First registration
    await request.post('/api/v1/auth/register').send({
      email: 'dup@example.cm',
      password: 'SuperSecurePassword123',
      firstName: 'Jean',
      lastName: 'Dupont',
      termsAccepted: true,
      termsVersion: '1.0',
    });
    const countBefore = await prisma.user.count({ where: { email: 'dup@example.cm' } });

    // Second registration with same email
    const res = await request.post('/api/v1/auth/register').send({
      email: 'dup@example.cm',
      password: 'AnotherSecurePassword456',
      firstName: 'Juan',
      lastName: 'Perez',
      termsAccepted: true,
      termsVersion: '1.0',
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.id).not.toBe('user-123');
    expect(res.body.emailMasked).toBe('d***@example.cm');
    const countAfter = await prisma.user.count({ where: { email: 'dup@example.cm' } });
    expect(countAfter).toBe(countBefore); // No new user
  });

  // Invalid phone format => 400 with errors.
  it('POST /api/v1/auth/register with invalid phone => 400', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      phone: '0612345678', // no +237
      password: 'SuperSecurePassword123',
      firstName: 'Jean',
      lastName: 'Dupont',
      termsAccepted: true,
      termsVersion: '1.0',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  // Short password => 400.
  it('POST /api/v1/auth/register with password < 10 chars => 400', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email: 'short@example.cm',
      password: 'abc1234', // 7 chars
      firstName: 'Jean',
      lastName: 'Dupont',
      termsAccepted: true,
      termsVersion: '1.0',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/au moins 10/);
  });

  // Weak password (blacklist) => 400 WEAK_PASSWORD.
  it('POST /api/v1/auth/register with weak password => 400 WEAK_PASSWORD', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email: 'weak@example.cm',
      password: 'password123', // in blacklist
      firstName: 'Jean',
      lastName: 'Dupont',
      termsAccepted: true,
      termsVersion: '1.0',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('WEAK_PASSWORD');
  });

  // Missing termsAccepted => 400.
  it('POST /api/v1/auth/register without termsAccepted => 400', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email: 'nogtv@example.cm',
      password: 'SuperSecurePassword123',
      firstName: 'Jean',
      lastName: 'Dupont',
      termsAccepted: false,
      termsVersion: '1.0',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TERMS_NOT_ACCEPTED');
  });

  // Terms version mismatch => 400.
  it('POST /api/v1/auth/register with termsVersion mismatch => 400', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email: 'mismatch@example.cm',
      password: 'SuperSecurePassword123',
      firstName: 'Jean',
      lastName: 'Dupont',
      termsAccepted: true,
      termsVersion: '0.9', // current is 1.0
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TERMS_VERSION_MISMATCH');
  });

  // Rate limit: 6 consecutive calls => 6th returns 429.
  it('POST /api/v1/auth/register with 6 fast calls => 6th returns 429', async () => {
    const payload = {
      email: 'ratelimit@example.cm',
      password: 'SuperSecurePassword123',
      firstName: 'Jean',
      lastName: 'Dupont',
      termsAccepted: true,
      termsVersion: '1.0',
    };
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await request.post('/api/v1/auth/register').send(payload);
      statuses.push(res.status);
    }
    expect(statuses[5]).toBe(429); // 6th call = 429
    expect(statuses[4]).not.toBe(429); // 5th call OK
  });

  // AuditLog creation on successful registration.
  it('should create AuditLog USER_REGISTERED on success', async () => {
    await request.post('/api/v1/auth/register').send({
      email: 'audit@example.cm',
      password: 'SuperSecurePassword123',
      firstName: 'Jean',
      lastName: 'Dupont',
      termsAccepted: true,
      termsVersion: '1.0',
    });
    const logs = await prisma.auditLog.findMany({ where: { action: 'USER_REGISTERED' } });
    expect(logs).toHaveLength(1);
    expect(logs[0].ip).toBeDefined();
    expect(logs[0].after).toMatchObject({ email: 'c***@example.cm' });
  });

  // AuditLog creation on duplicate (silent).
  it('should create AuditLog REGISTER_DUPLICATE_SILENT on duplicate', async () => {
    await request.post('/api/v1/auth/register').send({
      email: 'dup2@example.cm',
      password: 'SuperSecurePassword123',
      firstName: 'Jean',
      lastName: 'Dupont',
      termsAccepted: true,
      termsVersion: '1.0',
    });
    await request.post('/api/v1/auth/register').send({
      email: 'dup2@example.cm', // same email
      password: 'AnotherSecurePassword456',
      firstName: 'Juan',
      lastName: 'Perez',
      termsAccepted: true,
      termsVersion: '1.0',
    });
    const logs = await prisma.auditLog.findMany({ where: { action: 'USER_REGISTERED_DUPLICATE' } });
    expect(logs).toHaveLength(1);
    expect(logs[0].after).toMatchObject({ email: 'd***@example.cm' });
  });
});
