import { describe, expect, it } from 'vitest';

import { checkPassword, PASSWORD_MIN_LENGTH } from './password';

describe('checkPassword', () => {
  it('refuse les mots de passe trop courts', () => {
    const issues = checkPassword('Ab3!xY9');
    expect(issues.map((issue) => issue.code)).toContain('TOO_SHORT');
  });

  it('refuse les mots de passe courants même longs', () => {
    const issues = checkPassword('password123');
    expect(issues.map((issue) => issue.code)).toContain('TOO_COMMON');
    expect(checkPassword('Password123'.toLowerCase())).toContainEqual(
      expect.objectContaining({ code: 'TOO_COMMON' }),
    );
  });

  it('refuse une seule catégorie de caractères', () => {
    const issues = checkPassword('abcdefghij'.padEnd(PASSWORD_MIN_LENGTH, 'k'));
    expect(issues.map((issue) => issue.code)).toContain('NOT_ENOUGH_VARIETY');
  });

  it('accepte un mot de passe robuste', () => {
    expect(checkPassword('Kx7#mQ2$vLp9')).toEqual([]);
  });

  it('ne contient jamais la valeur du mot de passe dans les messages', () => {
    const issues = checkPassword('secretsecret');
    for (const issue of issues) {
      expect(issue.message).not.toContain('secretsecret');
    }
  });
});
