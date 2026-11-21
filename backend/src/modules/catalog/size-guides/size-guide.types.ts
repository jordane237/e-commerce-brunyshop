export const SIZE_GUIDE_PUBLICS = ['men', 'women', 'kids'] as const;
export type SizeGuidePublic = (typeof SIZE_GUIDE_PUBLICS)[number];

export interface SizeGuideEntry {
  eu: number;
  us: number;
  uk: number;
  cm: number;
}

export type SizeGuideTable = Partial<Record<SizeGuidePublic, SizeGuideEntry[]>>;
