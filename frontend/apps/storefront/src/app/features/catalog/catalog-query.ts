/**
 * Mapping URL ↔ filtres du catalogue (CAT-08).
 *
 * Ce module est volontairement pur (aucune dépendance Angular) : il porte
 * toutes les règles de sérialisation et de validation, ce qui permet de les
 * tester sans DOM ni Router. L'URL reste l'unique source de vérité : le store
 * ne navigue jamais et se contente de charger ce que la page lui transmet.
 */

/** Le backend CAT-02 n'expose que ces quatre tris. */
export type CatalogSort = 'newest' | 'price_asc' | 'price_desc' | 'name';

export const CATALOG_SORTS: readonly CatalogSort[] = ['newest', 'price_asc', 'price_desc', 'name'];

export const SORT_LABELS: Record<CatalogSort, string> = {
  newest: 'Nouveautés',
  price_asc: 'Prix croissant',
  price_desc: 'Prix décroissant',
  name: 'Nom (A–Z)',
};

/**
 * Taille de page. 12 est un multiple de 2, 3 et 4 (grille mobile/tablette/
 * desktop), reste sous la limite backend de 48 et permet de démontrer la
 * pagination avec les 20 produits du seed.
 */
export const CATALOG_PAGE_SIZE = 12;

export interface CatalogFilters {
  category?: string;
  brand?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  promo?: boolean;
  q?: string;
  sort: CatalogSort;
  page: number;
}

export interface QueryParamsLike {
  get(name: string): string | null;
}

export type CatalogFilterKey =
  | 'category'
  | 'brand'
  | 'size'
  | 'color'
  | 'price'
  | 'inStock'
  | 'promo'
  | 'q';

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  sort: 'newest',
  page: 1,
};

const LIMITS = {
  category: 100,
  brand: 100,
  size: 20,
  color: 40,
  q: 100,
} as const;

function readString(params: QueryParamsLike, key: keyof typeof LIMITS): string | undefined {
  const raw = params.get(key)?.trim();
  if (!raw) return undefined;
  return raw.slice(0, LIMITS[key]);
}

function readInteger(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) return undefined;
  return parsed;
}

function readBoolean(value: string | null): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export function isCatalogSort(value: string | null): value is CatalogSort {
  return value !== null && (CATALOG_SORTS as readonly string[]).includes(value);
}

export function parseCatalogFilters(params: QueryParamsLike): CatalogFilters {
  const page = readInteger(params.get('page'));
  const rawSort = params.get('sort');
  const minPrice = readInteger(params.get('minPrice'));
  const maxPrice = readInteger(params.get('maxPrice'));
  // Un intervalle inversé est une erreur de saisie, pas une erreur serveur :
  // on le remet dans l'ordre plutôt que de renvoyer une liste vide.
  const swapped = minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice;

  return {
    category: readString(params, 'category'),
    brand: readString(params, 'brand'),
    size: readString(params, 'size'),
    color: readString(params, 'color'),
    minPrice: swapped ? maxPrice : minPrice,
    maxPrice: swapped ? minPrice : maxPrice,
    inStock: readBoolean(params.get('inStock')),
    promo: readBoolean(params.get('promo')),
    q: readString(params, 'q'),
    sort: isCatalogSort(rawSort) ? rawSort : DEFAULT_CATALOG_FILTERS.sort,
    page: page !== undefined && page >= 1 ? page : 1,
  };
}

/**
 * Sérialise uniquement ce qui diffère des valeurs par défaut : pas de
 * `sort=newest`, `page=1` ni `limit` dans l'URL.
 */
export function toCatalogQueryParams(filters: CatalogFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.category) params['category'] = filters.category;
  if (filters.brand) params['brand'] = filters.brand;
  if (filters.size) params['size'] = filters.size;
  if (filters.color) params['color'] = filters.color;
  if (filters.minPrice !== undefined) params['minPrice'] = String(filters.minPrice);
  if (filters.maxPrice !== undefined) params['maxPrice'] = String(filters.maxPrice);
  if (filters.inStock !== undefined) params['inStock'] = String(filters.inStock);
  if (filters.promo !== undefined) params['promo'] = String(filters.promo);
  if (filters.q) params['q'] = filters.q;
  if (filters.sort !== DEFAULT_CATALOG_FILTERS.sort) params['sort'] = filters.sort;
  if (filters.page > 1) params['page'] = String(filters.page);
  return params;
}

/**
 * Applique une modification de filtre et revient en page 1, sauf quand la
 * modification ne concerne que la pagination.
 */
export function withFilterPatch(
  filters: CatalogFilters,
  patch: Partial<CatalogFilters>,
): CatalogFilters {
  const next: CatalogFilters = { ...filters, ...patch };
  if (!('page' in patch)) next.page = 1;
  return next;
}

/** Retire un filtre (le prix retire ses deux bornes) et revient en page 1. */
export function withoutFilter(filters: CatalogFilters, key: CatalogFilterKey): CatalogFilters {
  const next: CatalogFilters = { ...filters, page: 1 };
  if (key === 'price') {
    delete next.minPrice;
    delete next.maxPrice;
  } else {
    delete next[key];
  }
  return next;
}

/** Réinitialise les filtres en conservant le tri courant. */
export function resetCatalogFilters(filters: CatalogFilters): CatalogFilters {
  return { sort: filters.sort, page: 1 };
}

/** Nombre de filtres actifs, hors tri et pagination. */
export function countActiveFilters(filters: CatalogFilters): number {
  let count = 0;
  if (filters.category) count += 1;
  if (filters.brand) count += 1;
  if (filters.size) count += 1;
  if (filters.color) count += 1;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count += 1;
  if (filters.inStock === true) count += 1;
  if (filters.promo === true) count += 1;
  if (filters.q) count += 1;
  return count;
}

export function hasSameFilters(
  left: CatalogFilters,
  right: CatalogFilters,
  options: { ignorePage?: boolean } = {},
): boolean {
  const normalize = (filters: CatalogFilters): string =>
    JSON.stringify({ ...filters, ...(options.ignorePage ? { page: 1 } : {}) });
  return normalize(left) === normalize(right);
}

/** Libellé lisible d'une valeur de couleur brute (`NOIR` → `Noir`). */
export function colorLabel(value: string): string {
  const lower = value.toLocaleLowerCase('fr-FR');
  return lower.charAt(0).toLocaleUpperCase('fr-FR') + lower.slice(1);
}
