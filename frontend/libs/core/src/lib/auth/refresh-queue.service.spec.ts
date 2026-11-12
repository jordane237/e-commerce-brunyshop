import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, tap } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastService } from '../http/toast.service';
import { SessionService, type SessionUser } from '../session/session.service';
import { AuthService } from './auth.service';
import { RefreshQueueService } from './refresh-queue.service';

const USER: SessionUser = {
  id: 'user-1',
  email: 'admin@bruny.test',
  phone: null,
  firstName: 'Awa',
  lastName: 'Nkeng',
  status: 'ACTIVE',
  roles: ['ADMIN'],
};

describe('RefreshQueueService (TEC-12, CA #1)', () => {
  let queue: RefreshQueueService;
  let session: SessionService;
  let refresh$: Subject<{ accessToken: string }>;
  let refresh: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let toast: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    refresh$ = new Subject<{ accessToken: string }>();
    refresh = vi.fn(() =>
      refresh$.pipe(tap((response) => session.setAccessToken(response.accessToken))),
    );
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        RefreshQueueService,
        SessionService,
        ToastService,
        { provide: AuthService, useValue: { refresh } },
        { provide: Router, useValue: { url: '/produits', navigate } },
      ],
    });
    queue = TestBed.inject(RefreshQueueService);
    session = TestBed.inject(SessionService);
    toast = vi.spyOn(TestBed.inject(ToastService), 'error');
    session.setSession('old-token', USER);
  });

  function enqueue() {
    const request = new HttpRequest('GET', '/api/v1/me');
    const next = vi.fn((_req: HttpRequest<unknown>) => of(new HttpResponse({ status: 200 })));
    const result = queue.enqueue(request, next as unknown as HttpHandlerFn);
    return { result, next };
  }

  it('ne déclenche qu’un seul refresh pour trois 401 concurrents et rejoue les trois requêtes', () => {
    const calls = [enqueue(), enqueue(), enqueue()];
    const values: number[] = [];
    for (const call of calls) {
      call.result.subscribe((event) => {
        if (event instanceof HttpResponse) values.push(event.status);
      });
    }

    expect(refresh).toHaveBeenCalledTimes(1);
    refresh$.next({ accessToken: 'new-token' });
    refresh$.complete();

    expect(calls.map((call) => call.next.mock.calls.length)).toEqual([1, 1, 1]);
    expect(calls[0].next.mock.calls[0][0].headers.get('Authorization')).toBe('Bearer new-token');
    expect(values).toEqual([200, 200, 200]);
  });

  it('efface la session, alerte et redirige quand le refresh échoue', () => {
    const calls = [enqueue(), enqueue()];
    const errors: unknown[] = [];
    for (const call of calls)
      call.result.subscribe({ error: (error: unknown) => errors.push(error) });

    refresh$.error(new Error('refresh failed'));

    expect(errors).toHaveLength(2);
    expect(session.isAuthenticated()).toBe(false);
    expect(toast).toHaveBeenCalledWith('Votre session a expiré. Reconnectez-vous.');
    expect(navigate).toHaveBeenCalledWith(['/connexion'], {
      queryParams: { returnUrl: '/produits' },
    });
  });

  it('ne rejoue pas la requête si le refresh ne fournit pas de jeton', () => {
    const { result, next } = enqueue();
    let failed = false;
    result.subscribe({ error: () => (failed = true) });

    refresh$.next({ accessToken: '' });
    refresh$.complete();

    expect(failed).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });

  it('reste utilisable après un échec (pas de verrou permanent)', () => {
    const first = enqueue();
    first.result.subscribe({ error: () => undefined });
    refresh$.error(new Error('expired'));

    const secondRefresh = new Subject<{ accessToken: string }>();
    refresh.mockImplementation(() =>
      secondRefresh.pipe(tap((response) => session.setAccessToken(response.accessToken))),
    );
    const second = enqueue();
    second.result.subscribe();
    secondRefresh.next({ accessToken: 'new-token' });
    secondRefresh.complete();

    expect(second.next).toHaveBeenCalledTimes(1);
  });
});
