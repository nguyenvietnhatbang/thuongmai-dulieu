import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { query, transaction } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('roles.configure.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Fetch all roles
    const rolesRes = await query('SELECT id, code, name, description, is_active as "isActive" FROM app.roles ORDER BY code ASC');
    
    // Fetch all permissions
    const permissionsRes = await query('SELECT code, module, action, scope, description FROM app.permissions ORDER BY module ASC, code ASC');

    // Fetch current bindings
    const bindingsRes = await query('SELECT role_id as "roleId", permission_code as "permissionCode" FROM app.role_permissions');

    // Fetch users with their roles for assignment
    const usersRes = await query(`
      SELECT 
        u.id, u.email, u.full_name as "fullName", u.status,
        COALESCE(ARRAY_AGG(ur.role_id) FILTER (WHERE ur.role_id IS NOT NULL), '{}') as "roleIds"
      FROM app.users u
      LEFT JOIN app.user_roles ur ON u.id = ur.user_id
      WHERE u.deleted_at IS NULL
      GROUP BY u.id
      ORDER BY u.full_name ASC
    `);

    return NextResponse.json({
      success: true,
      data: {
        roles: rolesRes.rows,
        permissions: permissionsRes.rows,
        rolePermissions: bindingsRes.rows,
        users: usersRes.rows
      }
    });
  } catch (error: any) {
    console.error('API Admin GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('roles.configure.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { action, roleId, permissions, userId, roleIds } = body;

    // Action 1: Update role permissions mapping
    if (action === 'updateRolePermissions') {
      if (!roleId || !Array.isArray(permissions)) {
        return NextResponse.json({ success: false, error: 'roleId and permissions array are required' }, { status: 400 });
      }

      await transaction(async (client) => {
        // Clear existing
        await client.query('DELETE FROM app.role_permissions WHERE role_id = $1', [roleId]);
        
        // Insert new bindings
        for (const code of permissions) {
          await client.query('INSERT INTO app.role_permissions (role_id, permission_code) VALUES ($1, $2)', [roleId, code]);
        }

        // Audit log
        await client.query(`
          INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
          VALUES ($1, 'update_role_permissions', 'role', $2, $3)
        `, [user.id, roleId, JSON.stringify({ count: permissions.length })]);
      });

      return NextResponse.json({ success: true, message: 'Role permissions updated successfully' });
    }

    // Action 2: Update user roles assignment
    if (action === 'updateUserRoles') {
      if (!userId || !Array.isArray(roleIds)) {
        return NextResponse.json({ success: false, error: 'userId and roleIds array are required' }, { status: 400 });
      }

      await transaction(async (client) => {
        // Clear existing
        await client.query('DELETE FROM app.user_roles WHERE user_id = $1', [userId]);

        // Insert new assignments
        for (const rId of roleIds) {
          await client.query('INSERT INTO app.user_roles (user_id, role_id) VALUES ($1, $2)', [userId, rId]);
        }

        // Audit log
        await client.query(`
          INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
          VALUES ($1, 'update_user_roles', 'user', $2, $3)
        `, [user.id, userId, JSON.stringify({ rolesCount: roleIds.length })]);
      });

      return NextResponse.json({ success: true, message: 'User roles updated successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('API Admin POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
