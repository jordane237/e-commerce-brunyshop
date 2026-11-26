/**
 * Identité légale de l'éditeur — MKT-01.
 *
 * ⚠️ CNT-03 n'a pas livré les informations d'identification. Les champs
 * inconnus portent un placeholder explicite : aucune valeur n'est inventée.
 * Ils doivent être complétés par le propriétaire puis validés par un juriste
 * avant toute mise en production.
 */
export interface LegalInfo {
  readonly companyName: string;
  readonly tradeName: string;
  readonly address: string;
  readonly city: string;
  readonly phone: string;
  readonly email: string;
  readonly taxId: string;
  readonly tradeRegister: string;
  readonly publisher: string;
  readonly hostName: string;
  readonly hostAddress: string;
  readonly hostContact: string;
  readonly lastUpdated: string;
  readonly lastUpdatedIso: string;
  readonly version: string;
}

export const LEGAL_PLACEHOLDER = '[À fournir par le propriétaire]';

export const LEGAL_INFO: LegalInfo = {
  companyName: 'BRUNY SHOPPING SARL',
  tradeName: 'BRUNY SHOPPING',
  address: LEGAL_PLACEHOLDER,
  city: 'Douala',
  phone: LEGAL_PLACEHOLDER,
  email: 'support@brunyshop.cm',
  taxId: LEGAL_PLACEHOLDER,
  tradeRegister: LEGAL_PLACEHOLDER,
  publisher: LEGAL_PLACEHOLDER,
  hostName: LEGAL_PLACEHOLDER,
  hostAddress: LEGAL_PLACEHOLDER,
  hostContact: LEGAL_PLACEHOLDER,
  lastUpdated: '10 novembre 2026',
  lastUpdatedIso: '2026-11-10',
  version: '1.0',
};
