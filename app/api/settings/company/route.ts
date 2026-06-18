import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import {
  CompanySettingsInput,
  getCompanySettings,
  updateCompanySettings,
} from '@/features/settings/services/company-settings.service';

export const dynamic = 'force-dynamic';

const MAX_LENGTHS: Record<keyof CompanySettingsInput, number> = {
  companyName: 180,
  navName: 60,
  shortName: 8,
  navSubtitle: 80,
  taxCode: 40,
  address: 240,
  hotline: 40,
  email: 120,
  website: 120,
  representativeName: 120,
  representativeTitle: 120,
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function parseCompanySettings(body: Record<string, unknown>) {
  const input: CompanySettingsInput = {
    companyName: cleanText(body.companyName, MAX_LENGTHS.companyName),
    navName: cleanText(body.navName, MAX_LENGTHS.navName),
    shortName: cleanText(body.shortName, MAX_LENGTHS.shortName).toUpperCase(),
    navSubtitle: cleanText(body.navSubtitle, MAX_LENGTHS.navSubtitle),
    taxCode: cleanText(body.taxCode, MAX_LENGTHS.taxCode),
    address: cleanText(body.address, MAX_LENGTHS.address),
    hotline: cleanText(body.hotline, MAX_LENGTHS.hotline),
    email: cleanText(body.email, MAX_LENGTHS.email).toLowerCase(),
    website: cleanText(body.website, MAX_LENGTHS.website),
    representativeName: cleanText(body.representativeName, MAX_LENGTHS.representativeName),
    representativeTitle: cleanText(body.representativeTitle, MAX_LENGTHS.representativeTitle),
  };

  if (!input.companyName) return { error: 'Tên công ty là bắt buộc.' };
  if (!input.navName) return { error: 'Tên trên thanh điều hướng là bắt buộc.' };
  if (!input.shortName) return { error: 'Ký hiệu ngắn là bắt buộc.' };
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { error: 'Email công ty không hợp lệ.' };
  }

  return { input };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const settings = await getCompanySettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('API Company Settings GET error:', error);
    return NextResponse.json({ success: false, error: 'Không thể tải cấu hình công ty.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('settings.configure.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const parsed = parseCompanySettings(body);
    if ('error' in parsed) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const settings = await updateCompanySettings(parsed.input, user.id);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('API Company Settings PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Không thể lưu cấu hình công ty.' }, { status: 500 });
  }
}
