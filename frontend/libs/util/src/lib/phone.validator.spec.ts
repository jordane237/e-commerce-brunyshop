import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { cameroonPhoneValidator } from './phone.validator';

describe('cameroonPhoneValidator', () => {
  it('accepts Cameroon mobile numbers in international format', () => {
    expect(cameroonPhoneValidator(new FormControl('+237699123456'))).toBeNull();
  });

  it('rejects malformed numbers', () => {
    expect(cameroonPhoneValidator(new FormControl('699123456'))).toEqual({ cameroonPhone: true });
  });
});
