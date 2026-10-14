// Server-side password policy (cachier §10.2): Argon2id hashing elsewhere,
// minimum 10 characters, common passwords refused, never logged.
import { BadRequestException } from '@nestjs/common';

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

// Top common passwords (leaked-list style, lowercase). Refused even when the
// length rule is satisfied.
const COMMON_PASSWORDS = new Set([
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password1',
  'password123',
  'passw0rd',
  'p@ssw0rd',
  'p@ssword123',
  'qwerty',
  'qwerty123',
  'qwertyuiop',
  'azerty',
  'azertyuiop',
  'iloveyou',
  'admin123',
  'administrator',
  'letmein',
  'welcome',
  'welcome1',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'sunshine',
  'princess',
  'trustno1',
  'abc123',
  'abcd1234',
  'a1b2c3d4',
  'superman',
  'starwars',
  'whatever',
  'freedom',
  'computer',
  'internet',
  'soccer',
  'harley',
  'ranger',
  'buster',
  'thomas',
  'hunter',
  'michelle',
  'charlie',
  'jordan23',
  'michael1',
  'jennifer',
  'jessica',
  'shadow',
  'master',
  'summer2024',
  'winter2024',
  'autumn2024',
  'spring2024',
  'changeme',
  'letmein123',
  'test1234',
  'testtest',
  'demo1234',
  'root1234',
  'default',
  'secret123',
  'login1234',
  'access123',
  'hello1234',
  'welcome123',
  'brandnew1',
  'iloveyou1',
  'football1',
  'basketball1',
  'chocolate1',
  'strawberry1',
  'liverpool',
  'manchester',
  'arsenal123',
  'barcelona1',
  'realmadrid',
  'juventus1',
  'internet1',
  'starwars1',
  'pokemon123',
  'minecraft1',
  'fortnite123',
  'sunshine1',
  'flowerpower',
  'iloveu23',
  'butterfly1',
  'diamond123',
  'phoenix123',
  'nothing123',
  'nopassword',
  'bestpassword',
  'longpassword',
  'temporary1',
  'temporary123',
  'changeit',
  'changeit123',
  'newpassword',
  'newpassword1',
  'mypassword1',
  'yourpassword',
  'userpassword',
  'shopbruny2026',
  'brunyshop2026',
  'bruny1234',
  'brunyshop',
]);

export type PasswordIssueCode = 'TOO_SHORT' | 'TOO_LONG' | 'TOO_COMMON' | 'NOT_ENOUGH_VARIETY';

export interface PasswordIssue {
  code: PasswordIssueCode;
  message: string;
}

// Returns every failed rule; empty array = acceptable password.
export function checkPassword(password: string): PasswordIssue[] {
  const issues: PasswordIssue[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push({
      code: 'TOO_SHORT',
      message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    });
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    issues.push({
      code: 'TOO_LONG',
      message: `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`,
    });
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    issues.push({
      code: 'TOO_COMMON',
      message: 'Ce mot de passe est trop courant, choisissez-en un autre.',
    });
  }
  const classes =
    Number(/[a-z]/.test(password)) +
    Number(/[A-Z]/.test(password)) +
    Number(/[0-9]/.test(password)) +
    Number(/[^a-zA-Z0-9]/.test(password));
  if (classes < 2) {
    issues.push({
      code: 'NOT_ENOUGH_VARIETY',
      message: 'Mélangez au moins deux catégories : minuscules, majuscules, chiffres, symboles.',
    });
  }
  return issues;
}

// Throws 400 with every violation (never includes the password itself).
export function assertPasswordStrength(password: string): void {
  const issues = checkPassword(password);
  if (issues.length > 0) {
    throw new BadRequestException({
      code: 'WEAK_PASSWORD',
      message: 'Mot de passe trop faible.',
      errors: issues.map((issue) => issue.code),
    });
  }
}
