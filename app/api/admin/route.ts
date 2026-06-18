import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') ||
      await hasPermission('roles.configure.all') ||
      await hasPermission('users.update.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Fetch all roles
    const rolesRes = await query('SELECT id, code, name, description, is_system as "isSystem", is_active as "isActive" FROM app.roles ORDER BY code ASC');
    
    // Fetch all permissions
    const permissionsRes = await query('SELECT code, module, action, scope, description FROM app.permissions ORDER BY module ASC, code ASC');

    // Fetch current bindings
    const bindingsRes = await query('SELECT role_id as "roleId", permission_code as "permissionCode" FROM app.role_permissions');

    const departmentsRes = await query(`
      SELECT id, code, name, status
      FROM app.departments
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `);

    // Fetch users with their roles for assignment
    const usersRes = await query(`
      SELECT 
        u.id, u.email, u.full_name as "fullName", u.department_id as "departmentId", d.name as "departmentName", u.status,
        COALESCE(ARRAY_AGG(ur.role_id) FILTER (WHERE ur.role_id IS NOT NULL), '{}') as "roleIds"
      FROM app.users u
      LEFT JOIN app.departments d ON u.department_id = d.id
      LEFT JOIN app.user_roles ur ON u.id = ur.user_id
      WHERE u.deleted_at IS NULL
      GROUP BY u.id, d.name
      ORDER BY u.full_name ASC
    `);

    return NextResponse.json({
      success: true,
      data: {
        roles: rolesRes.rows,
        departments: departmentsRes.rows,
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

    const body = await request.json();
    const { action, roleId, permissions, userId, roleIds } = body;
    const canManageRoles = user.roles.includes('system_management') || await hasPermission('roles.configure.all');
    const canManageUsers = user.roles.includes('system_management') || await hasPermission('users.update.all');
    const roleActions = new Set([
      'createRole',
      'updateRole',
      'deleteRole',
      'updateRolePermissions',
      'createDepartment',
      'updateDepartment',
      'deleteDepartment',
    ]);
    const userActions = new Set(['createUser', 'updateUser', 'deleteUser', 'updateUserRoles']);

    if (roleActions.has(action) && !canManageRoles) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (userActions.has(action) && !canManageUsers) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (!roleActions.has(action) && !userActions.has(action)) {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

    if (action === 'createRole') {
      const code = typeof body.code === 'string' ? body.code.trim().toLowerCase() : '';
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const description = typeof body.description === 'string' ? body.description.trim() : '';
      const isActive = body.isActive !== false;

      if (!code || !/^[a-z0-9_]+$/.test(code)) {
        return NextResponse.json({ success: false, error: 'Mã vai trò chỉ gồm chữ thường, số và dấu gạch dưới.' }, { status: 400 });
      }
      if (!name) {
        return NextResponse.json({ success: false, error: 'Tên vai trò là bắt buộc.' }, { status: 400 });
      }

      const roleRes = await query(`
        INSERT INTO app.roles (code, name, description, is_system, is_active)
        VALUES ($1, $2, $3, false, $4)
        RETURNING id, code, name, description, is_active as "isActive"
      `, [code, name, description || null, isActive]);

      await query(`
        INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        VALUES ($1, 'create_role', 'role', $2, $3)
      `, [user.id, roleRes.rows[0].id, JSON.stringify({ code })]);

      return NextResponse.json({ success: true, data: roleRes.rows[0] }, { status: 201 });
    }

    if (action === 'createUser') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const departmentId = typeof body.departmentId === 'string' && body.departmentId ? body.departmentId : null;
      const status = body.status === 'inactive' || body.status === 'locked' ? body.status : 'active';
      const newRoleIds = Array.isArray(roleIds) ? roleIds.filter((id: unknown) => typeof id === 'string') : [];

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ success: false, error: 'Email không hợp lệ.' }, { status: 400 });
      }
      if (!fullName) {
        return NextResponse.json({ success: false, error: 'Họ tên là bắt buộc.' }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json({ success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự.' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      const createdUser = await transaction(async (client) => {
        const userRes = await client.query(`
          INSERT INTO app.users (email, password_hash, full_name, department_id, status)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, email, full_name as "fullName", department_id as "departmentId", status
        `, [email, passwordHash, fullName, departmentId, status]);

        for (const newRoleId of newRoleIds) {
          await client.query('INSERT INTO app.user_roles (user_id, role_id) VALUES ($1, $2)', [userRes.rows[0].id, newRoleId]);
        }

        await client.query(`
          INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
          VALUES ($1, 'create_user', 'user', $2, $3)
        `, [user.id, userRes.rows[0].id, JSON.stringify({ email, rolesCount: newRoleIds.length })]);

        return userRes.rows[0];
      });

      return NextResponse.json({ success: true, data: createdUser }, { status: 201 });
    }

    if (action === 'createDepartment') {
      const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const status = body.status === 'inactive' ? 'inactive' : 'active';

      if (!code || !/^[A-Z0-9_]+$/.test(code)) {
        return NextResponse.json({ success: false, error: 'Mã phòng ban chỉ gồm chữ in hoa, số và dấu gạch dưới.' }, { status: 400 });
      }
      if (!name) {
        return NextResponse.json({ success: false, error: 'Tên phòng ban là bắt buộc.' }, { status: 400 });
      }

      const deptRes = await query(`
        INSERT INTO app.departments (code, name, status)
        VALUES ($1, $2, $3)
        RETURNING id, code, name, status
      `, [code, name, status]);

      await query(`
        INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        VALUES ($1, 'create_department', 'department', $2, $3)
      `, [user.id, deptRes.rows[0].id, JSON.stringify({ code })]);

      return NextResponse.json({ success: true, data: deptRes.rows[0] }, { status: 201 });
    }

    if (action === 'updateDepartment') {
      const departmentId = typeof body.departmentId === 'string' ? body.departmentId : '';
      const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const status = body.status === 'inactive' ? 'inactive' : 'active';

      if (!departmentId) {
        return NextResponse.json({ success: false, error: 'departmentId is required' }, { status: 400 });
      }
      if (!code || !/^[A-Z0-9_]+$/.test(code)) {
        return NextResponse.json({ success: false, error: 'Mã phòng ban chỉ gồm chữ in hoa, số và dấu gạch dưới.' }, { status: 400 });
      }
      if (!name) {
        return NextResponse.json({ success: false, error: 'Tên phòng ban là bắt buộc.' }, { status: 400 });
      }

      const deptRes = await query(`
        UPDATE app.departments
        SET code = $2, name = $3, status = $4
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id, code, name, status
      `, [departmentId, code, name, status]);

      if (deptRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy phòng ban.' }, { status: 404 });
      }

      await query(`
        INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        VALUES ($1, 'update_department', 'department', $2, $3)
      `, [user.id, departmentId, JSON.stringify({ code })]);

      return NextResponse.json({ success: true, data: deptRes.rows[0] });
    }

    if (action === 'deleteDepartment') {
      const departmentId = typeof body.departmentId === 'string' ? body.departmentId : '';
      if (!departmentId) {
        return NextResponse.json({ success: false, error: 'departmentId is required' }, { status: 400 });
      }

      const usageRes = await query('SELECT COUNT(*)::int as count FROM app.users WHERE department_id = $1 AND deleted_at IS NULL', [departmentId]);
      if (usageRes.rows[0].count > 0) {
        return NextResponse.json({ success: false, error: 'Phòng ban đang có người dùng, không thể xóa.' }, { status: 400 });
      }

      await query(`
        UPDATE app.departments
        SET deleted_at = NOW(), status = 'inactive'
        WHERE id = $1 AND deleted_at IS NULL
      `, [departmentId]);

      await query(`
        INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        VALUES ($1, 'delete_department', 'department', $2, '{}'::jsonb)
      `, [user.id, departmentId]);

      return NextResponse.json({ success: true });
    }

    if (action === 'updateRole') {
      const targetRoleId = typeof roleId === 'string' ? roleId : '';
      const code = typeof body.code === 'string' ? body.code.trim().toLowerCase() : '';
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const description = typeof body.description === 'string' ? body.description.trim() : '';
      const isActive = body.isActive !== false;

      if (!targetRoleId) {
        return NextResponse.json({ success: false, error: 'roleId is required' }, { status: 400 });
      }
      if (!code || !/^[a-z0-9_]+$/.test(code)) {
        return NextResponse.json({ success: false, error: 'Mã vai trò chỉ gồm chữ thường, số và dấu gạch dưới.' }, { status: 400 });
      }
      if (!name) {
        return NextResponse.json({ success: false, error: 'Tên vai trò là bắt buộc.' }, { status: 400 });
      }

      const roleRes = await query(`
        UPDATE app.roles
        SET code = $2, name = $3, description = $4, is_active = $5
        WHERE id = $1
        RETURNING id, code, name, description, is_system as "isSystem", is_active as "isActive"
      `, [targetRoleId, code, name, description || null, isActive]);

      if (roleRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy vai trò.' }, { status: 404 });
      }

      await query(`
        INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        VALUES ($1, 'update_role', 'role', $2, $3)
      `, [user.id, targetRoleId, JSON.stringify({ code })]);

      return NextResponse.json({ success: true, data: roleRes.rows[0] });
    }

    if (action === 'deleteRole') {
      const targetRoleId = typeof roleId === 'string' ? roleId : '';
      if (!targetRoleId) {
        return NextResponse.json({ success: false, error: 'roleId is required' }, { status: 400 });
      }

      const roleRes = await query('SELECT id, is_system FROM app.roles WHERE id = $1', [targetRoleId]);
      if (roleRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy vai trò.' }, { status: 404 });
      }
      if (roleRes.rows[0].is_system) {
        return NextResponse.json({ success: false, error: 'Không thể xóa vai trò hệ thống.' }, { status: 400 });
      }

      await transaction(async (client) => {
        await client.query('DELETE FROM app.role_permissions WHERE role_id = $1', [targetRoleId]);
        await client.query('DELETE FROM app.user_roles WHERE role_id = $1', [targetRoleId]);
        await client.query('DELETE FROM app.roles WHERE id = $1', [targetRoleId]);
        await client.query(`
          INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
          VALUES ($1, 'delete_role', 'role', $2, '{}'::jsonb)
        `, [user.id, targetRoleId]);
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'updateUser') {
      const targetUserId = typeof userId === 'string' ? userId : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const departmentId = typeof body.departmentId === 'string' && body.departmentId ? body.departmentId : null;
      const status = body.status === 'inactive' || body.status === 'locked' ? body.status : 'active';
      const newRoleIds = Array.isArray(roleIds) ? roleIds.filter((id: unknown) => typeof id === 'string') : [];

      if (!targetUserId) {
        return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ success: false, error: 'Email không hợp lệ.' }, { status: 400 });
      }
      if (!fullName) {
        return NextResponse.json({ success: false, error: 'Họ tên là bắt buộc.' }, { status: 400 });
      }
      if (password && password.length < 8) {
        return NextResponse.json({ success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự.' }, { status: 400 });
      }

      await transaction(async (client) => {
        if (password) {
          const passwordHash = await hashPassword(password);
          await client.query(`
            UPDATE app.users
            SET email = $2, password_hash = $3, full_name = $4, department_id = $5, status = $6
            WHERE id = $1 AND deleted_at IS NULL
          `, [targetUserId, email, passwordHash, fullName, departmentId, status]);
        } else {
          await client.query(`
            UPDATE app.users
            SET email = $2, full_name = $3, department_id = $4, status = $5
            WHERE id = $1 AND deleted_at IS NULL
          `, [targetUserId, email, fullName, departmentId, status]);
        }

        await client.query('DELETE FROM app.user_roles WHERE user_id = $1', [targetUserId]);
        for (const newRoleId of newRoleIds) {
          await client.query('INSERT INTO app.user_roles (user_id, role_id) VALUES ($1, $2)', [targetUserId, newRoleId]);
        }

        await client.query(`
          INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
          VALUES ($1, 'update_user', 'user', $2, $3)
        `, [user.id, targetUserId, JSON.stringify({ email, rolesCount: newRoleIds.length, passwordChanged: Boolean(password) })]);
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'deleteUser') {
      const targetUserId = typeof userId === 'string' ? userId : '';
      if (!targetUserId) {
        return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
      }
      if (targetUserId === user.id) {
        return NextResponse.json({ success: false, error: 'Không thể xóa chính tài khoản đang đăng nhập.' }, { status: 400 });
      }

      await transaction(async (client) => {
        await client.query(`
          UPDATE app.users
          SET deleted_at = NOW(), status = 'inactive'
          WHERE id = $1 AND deleted_at IS NULL
        `, [targetUserId]);
        await client.query('DELETE FROM app.user_roles WHERE user_id = $1', [targetUserId]);
        await client.query(`
          INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
          VALUES ($1, 'delete_user', 'user', $2, '{}'::jsonb)
        `, [user.id, targetUserId]);
      });

      return NextResponse.json({ success: true });
    }

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
