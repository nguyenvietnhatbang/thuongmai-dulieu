import { query, transaction } from '@/lib/db';

export interface CatalogItem {
  id: string;
  groupCode: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
}

export interface CatalogCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  items: CatalogItem[];
}

export async function getCatalogItems(params: {
  group?: string;
  activeOnly?: boolean;
}): Promise<CatalogItem[]> {
  const values: unknown[] = [];
  const where = ['1 = 1'];

  if (params.group) {
    values.push(params.group);
    where.push(`cc.code = $${values.length}`);
  }

  if (params.activeOnly !== false) {
    where.push('ci.is_active = true');
  }

  const res = await query(`
    SELECT
      ci.id,
      cc.code as "groupCode",
      ci.code,
      ci.name,
      ci.description,
      ci.sort_order as "sortOrder",
      ci.is_active as "isActive",
      ci.is_system as "isSystem"
    FROM app.catalog_items ci
    INNER JOIN app.catalog_categories cc ON ci.category_id = cc.id
    WHERE ${where.join(' AND ')}
    ORDER BY cc.code ASC, ci.sort_order ASC, ci.name ASC
  `, values);

  return res.rows as CatalogItem[];
}

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  const categoriesRes = await query(`
    SELECT id, code, name, description, is_system as "isSystem"
    FROM app.catalog_categories
    ORDER BY code ASC
  `);

  const items = await getCatalogItems({ activeOnly: false });
  return categoriesRes.rows.map(category => ({
    ...category,
    items: items.filter(item => item.groupCode === category.code),
  })) as CatalogCategory[];
}

export async function createCatalogItem(data: {
  groupCode: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  userId: string;
}): Promise<CatalogItem> {
  return transaction(async (client) => {
    const categoryRes = await client.query(
      'SELECT id FROM app.catalog_categories WHERE code = $1',
      [data.groupCode],
    );

    if (categoryRes.rows.length === 0) {
      throw new Error('Catalog group not found');
    }

    const itemRes = await client.query(`
      INSERT INTO app.catalog_items (
        category_id, code, name, description, sort_order, is_active, is_system
      )
      VALUES ($1, $2, $3, $4, $5, $6, false)
      RETURNING id
    `, [
      categoryRes.rows[0].id,
      data.code,
      data.name,
      data.description || null,
      data.sortOrder || 0,
      data.isActive !== false,
    ]);

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'create_catalog_item', 'catalog_item', $2, $3)
    `, [data.userId, itemRes.rows[0].id, JSON.stringify({ groupCode: data.groupCode, code: data.code })]);

    const finalRes = await client.query(`
      SELECT
        ci.id,
        cc.code as "groupCode",
        ci.code,
        ci.name,
        ci.description,
        ci.sort_order as "sortOrder",
        ci.is_active as "isActive",
        ci.is_system as "isSystem"
      FROM app.catalog_items ci
      INNER JOIN app.catalog_categories cc ON ci.category_id = cc.id
      WHERE ci.id = $1
    `, [itemRes.rows[0].id]);

    return finalRes.rows[0] as CatalogItem;
  });
}

export async function updateCatalogItem(data: {
  id: string;
  code?: string;
  name?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  userId: string;
}): Promise<CatalogItem> {
  return transaction(async (client) => {
    const values: unknown[] = [data.id];
    const setClauses = ['updated_at = NOW()'];
    const fieldMap: Record<string, string> = {
      code: 'code',
      name: 'name',
      description: 'description',
      sortOrder: 'sort_order',
      isActive: 'is_active',
    };

    Object.entries(data).forEach(([key, value]) => {
      const field = fieldMap[key];
      if (field && value !== undefined) {
        values.push(value === '' ? null : value);
        setClauses.push(`${field} = $${values.length}`);
      }
    });

    const itemRes = await client.query(`
      UPDATE app.catalog_items
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id
    `, values);

    if (itemRes.rows.length === 0) {
      throw new Error('Catalog item not found');
    }

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'update_catalog_item', 'catalog_item', $2, $3)
    `, [data.userId, data.id, JSON.stringify(data)]);

    const finalRes = await client.query(`
      SELECT
        ci.id,
        cc.code as "groupCode",
        ci.code,
        ci.name,
        ci.description,
        ci.sort_order as "sortOrder",
        ci.is_active as "isActive",
        ci.is_system as "isSystem"
      FROM app.catalog_items ci
      INNER JOIN app.catalog_categories cc ON ci.category_id = cc.id
      WHERE ci.id = $1
    `, [data.id]);

    return finalRes.rows[0] as CatalogItem;
  });
}

export async function deactivateCatalogItem(id: string, userId: string): Promise<void> {
  const res = await query(`
    UPDATE app.catalog_items
    SET is_active = false, updated_at = NOW()
    WHERE id = $1
  `, [id]);

  if ((res.rowCount ?? 0) === 0) {
    throw new Error('Catalog item not found');
  }

  await query(`
    INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
    VALUES ($1, 'deactivate_catalog_item', 'catalog_item', $2)
  `, [userId, id]);
}
