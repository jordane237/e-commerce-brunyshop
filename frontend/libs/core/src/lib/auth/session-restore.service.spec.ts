import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { SessionRestoreService } from './session-restore.service';

describe('SessionRestoreService (TEC-12, CA #4/#5)', () => {
  it('restaure en browser', async () => {
    const restoreSession = vi.fn(() => of(true));
    TestBed.configureTestingModule({
      providers: [SessionRestoreService, { provide: AuthService, useValue: { restoreSession } }],
    });
    await TestBed.inject(SessionRestoreService).restore();
    expect(restoreSession).toHaveBeenCalledTimes(1);
  });

  it('ne fait rien en SSR', async () => {
    const restoreSession = vi.fn(() => of(true));
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        SessionRestoreService,
        { provide: AuthService, useValue: { restoreSession } },
      ],
    });
    await TestBed.inject(SessionRestoreService).restore();
    expect(restoreSession).not.toHaveBeenCalled();
  });
});
