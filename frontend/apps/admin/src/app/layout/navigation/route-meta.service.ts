import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  url: string;
  current: boolean;
}

export interface RouteMeta {
  title: string;
  breadcrumbs: BreadcrumbItem[];
}

const EMPTY_META: RouteMeta = { title: '', breadcrumbs: [] };

/**
 * Lit `data.title` et `data.breadcrumb` sur la branche active de routes.
 * Le layout est persistant : on écoute donc `NavigationEnd` plutôt que de
 * figer les données à la création du composant.
 */
@Injectable()
export class RouteMetaService {
  private readonly router = inject(Router);
  private readonly state = signal<RouteMeta>(EMPTY_META);

  readonly title = computed(() => this.state().title);
  readonly breadcrumbs = computed(() => this.state().breadcrumbs);

  constructor() {
    this.state.set(this.read());
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.state.set(this.read()));
  }

  private read(): RouteMeta {
    let route = this.router.routerState.root;
    let url = '';
    let title = '';
    const crumbs: Array<{ label: string; url: string }> = [];

    while (route.firstChild) {
      route = route.firstChild;
      // Pendant l'activation initiale, un enfant peut ne pas encore avoir de
      // snapshot ; NavigationEnd fournira alors l'état complet.
      const snapshot = route.snapshot;
      if (!snapshot) break;

      for (const segment of snapshot.url) {
        url += `/${segment.path}`;
      }

      const data = snapshot.data as { title?: unknown; breadcrumb?: unknown };
      if (typeof data.title === 'string' && data.title !== '') title = data.title;
      if (typeof data.breadcrumb === 'string' && data.breadcrumb !== '') {
        const label = data.breadcrumb;
        const previous = crumbs[crumbs.length - 1];
        if (previous?.label !== label) crumbs.push({ label, url: url || '/' });
      }
    }

    const currentUrl = url || '/';
    if (currentUrl !== '/' && crumbs.every((crumb) => crumb.url !== '/')) {
      crumbs.unshift({ label: 'Accueil', url: '/' });
    }

    return {
      title,
      breadcrumbs: crumbs.map((crumb, index) => ({
        ...crumb,
        current: index === crumbs.length - 1,
      })),
    };
  }
}
