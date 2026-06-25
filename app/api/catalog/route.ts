import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import {
  createCatalogItem,
  deactivateCatalogItem,
  getCatalogCategories,
  getCatalogItems,
  updateCatalogItem,
} from '@/features/catalog/services/catalog.service';

export const dynamic = 'force-dynamic';

function normalizeCode(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function canConfigureCatalog(userRoles: string[]) {
  return userRoles.includes('system_management') || await hasPermission('catalog.configure.all');
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const group = normalizeCode(searchParams.get('group'));
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    if (group) {
      const items = await getCatalogItems({ group, activeOnly });
      return NextResponse.json({ success: true, data: items });
    }

    const categories = await getCatalogCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('API Catalog GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch catalog data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await canConfigureCatalog(user.roles))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const groupCode = normalizeCode(body.groupCode || body.group);
    const code = normalizeCode(body.code);
    const name = normalizeText(body.name);
    const description = normalizeText(body.description);
    const sortOrder = Number(body.sortOrder || 0);

    if (!groupCode || !code || !/^[a-z0-9_]+$/.test(code) || !name) {
      return NextResponse.json({
        success: false,
        error: 'groupCode, valid code, and name are required',
      }, { status: 400 });
    }

    const item = await createCatalogItem({
      groupCode,
      code,
      name,
      description: description || null,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      isActive: body.isActive !== false,
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('API Catalog POST error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to create catalog item' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await canConfigureCatalog(user.roles))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const id = normalizeText(body.id);
    const code = body.code === undefined ? undefined : normalizeCode(body.code);
    const name = body.name === undefined ? undefined : normalizeText(body.name);
    const description = body.description === undefined ? undefined : normalizeText(body.description);
    const sortOrder = body.sortOrder === undefined ? undefined : Number(body.sortOrder);

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    if (code !== undefined && (!code || !/^[a-z0-9_]+$/.test(code))) {
      return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 });
    }
    if (name !== undefined && !name) {
      return NextResponse.json({ success: false, error: 'name cannot be empty' }, { status: 400 });
    }

    const item = await updateCatalogItem({
      id,
      code,
      name,
      description: description === undefined ? undefined : description || null,
      sortOrder: sortOrder === undefined || !Number.isFinite(sortOrder) ? undefined : sortOrder,
      isActive: body.isActive,
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('API Catalog PATCH error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to update catalog item' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await canConfigureCatalog(user.roles))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = normalizeText(searchParams.get('id'));
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    await deactivateCatalogItem(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Catalog DELETE error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to deactivate catalog item' }, { status: 500 });
  }
}
