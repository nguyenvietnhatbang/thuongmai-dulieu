import { query, transaction } from '@/lib/db';

export interface CompanySettings {
  id: string | null;
  companyName: string;
  navName: string;
  shortName: string;
  navSubtitle: string;
  taxCode: string;
  address: string;
  hotline: string;
  email: string;
  website: string;
  representativeName: string;
  representativeTitle: string;
}

export interface CompanySettingsInput {
  companyName: string;
  navName: string;
  shortName: string;
  navSubtitle?: string;
  taxCode?: string;
  address?: string;
  hotline?: string;
  email?: string;
  website?: string;
  representativeName?: string;
  representativeTitle?: string;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: null,
  companyName: 'CÔNG TY PHÁT TRIỂN THƯƠNG MẠI FREELAND',
  navName: 'Freeland CRM',
  shortName: 'FL',
  navSubtitle: 'Commerce Edition',
  taxCode: '',
  address: 'Toà nhà Lotte, 54 Liễu Giai, Ba Đình, Hà Nội',
  hotline: '1900-XXXX',
  email: 'crm@freeland.vn',
  website: 'freeland.vn',
  representativeName: '',
  representativeTitle: 'Đại diện pháp luật',
};

interface CompanySettingsRow {
  id: string;
  companyName: string;
  navName: string;
  shortName: string;
  navSubtitle: string | null;
  taxCode: string | null;
  address: string | null;
  hotline: string | null;
  email: string | null;
  website: string | null;
  representativeName: string | null;
  representativeTitle: string | null;
}

function mapCompanySettings(row: CompanySettingsRow | undefined): CompanySettings {
  if (!row) return DEFAULT_COMPANY_SETTINGS;

  return {
    id: row.id,
    companyName: row.companyName,
    navName: row.navName,
    shortName: row.shortName,
    navSubtitle: row.navSubtitle || '',
    taxCode: row.taxCode || '',
    address: row.address || '',
    hotline: row.hotline || '',
    email: row.email || '',
    website: row.website || '',
    representativeName: row.representativeName || '',
    representativeTitle: row.representativeTitle || '',
  };
}

function isMissingTableError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '42P01';
}

export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const result = await query<CompanySettingsRow>(`
      SELECT
        id,
        company_name as "companyName",
        nav_name as "navName",
        short_name as "shortName",
        nav_subtitle as "navSubtitle",
        tax_code as "taxCode",
        address,
        hotline,
        email,
        website,
        representative_name as "representativeName",
        representative_title as "representativeTitle"
      FROM app.company_settings
      WHERE singleton_key = 'default'
      LIMIT 1
    `);

    return mapCompanySettings(result.rows[0]);
  } catch (error) {
    if (isMissingTableError(error)) return DEFAULT_COMPANY_SETTINGS;
    throw error;
  }
}

export function buildCompanyContactLine(settings: CompanySettings) {
  return [
    settings.hotline ? `Hotline: ${settings.hotline}` : '',
    settings.email ? `Email: ${settings.email}` : '',
    settings.website ? `Website: ${settings.website}` : '',
  ].filter(Boolean).join(' | ');
}

export async function updateCompanySettings(input: CompanySettingsInput, updatedBy: string): Promise<CompanySettings> {
  return transaction(async (client) => {
    const result = await client.query<CompanySettingsRow>(`
      INSERT INTO app.company_settings (
        singleton_key,
        company_name,
        nav_name,
        short_name,
        nav_subtitle,
        tax_code,
        address,
        hotline,
        email,
        website,
        representative_name,
        representative_title,
        updated_by
      )
      VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (singleton_key) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        nav_name = EXCLUDED.nav_name,
        short_name = EXCLUDED.short_name,
        nav_subtitle = EXCLUDED.nav_subtitle,
        tax_code = EXCLUDED.tax_code,
        address = EXCLUDED.address,
        hotline = EXCLUDED.hotline,
        email = EXCLUDED.email,
        website = EXCLUDED.website,
        representative_name = EXCLUDED.representative_name,
        representative_title = EXCLUDED.representative_title,
        updated_by = EXCLUDED.updated_by
      RETURNING
        id,
        company_name as "companyName",
        nav_name as "navName",
        short_name as "shortName",
        nav_subtitle as "navSubtitle",
        tax_code as "taxCode",
        address,
        hotline,
        email,
        website,
        representative_name as "representativeName",
        representative_title as "representativeTitle"
    `, [
      input.companyName,
      input.navName,
      input.shortName,
      input.navSubtitle || null,
      input.taxCode || null,
      input.address || null,
      input.hotline || null,
      input.email || null,
      input.website || null,
      input.representativeName || null,
      input.representativeTitle || null,
      updatedBy,
    ]);

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'update_company_settings', 'company_settings', $2, $3)
    `, [updatedBy, result.rows[0].id, JSON.stringify({ companyName: input.companyName, navName: input.navName })]);

    return mapCompanySettings(result.rows[0]);
  });
}
