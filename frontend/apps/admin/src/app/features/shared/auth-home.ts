import { SessionService } from '@bruny/core';

/** Le LIVREUR n'a pas de dashboard : sa connexion mène à sa tournée. */
export function adminHomePath(session: Pick<SessionService, 'hasRole'>): string {
  return session.hasRole('LIVREUR') ? '/livraisons/mes-livraisons' : '/';
}
