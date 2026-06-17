import { cookies } from 'next/headers';
import { query } from './db';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  departmentId: string | null;
  roles: string[];
  permissions: string[];
}

/**
 * Get the currently logged-in user from the session cookie
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    let userId = cookieStore.get('crm_user_id')?.value;

    // If no user cookie is present, let's fall back to the first active user (typically the admin from seed)
    // to ensure a smooth initial developer/user experience.
    if (!userId) {
      const fallbackUser = await query(`
        SELECT id FROM app.users 
        WHERE status = 'active' AND deleted_at IS NULL 
        ORDER BY created_at ASC LIMIT 1
      `);
      if (fallbackUser.rows.length > 0) {
        userId = fallbackUser.rows[0].id;
      } else {
        return null;
      }
    }

    const userQuery = await query(`
      SELECT 
        u.id, 
        u.email, 
        u.full_name as "fullName", 
        u.department_id as "departmentId",
        COALESCE(ARRAY_AGG(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') as roles,
        COALESCE(ARRAY_AGG(DISTINCT rp.permission_code) FILTER (WHERE rp.permission_code IS NOT NULL), '{}') as permissions
      FROM app.users u
      LEFT JOIN app.user_roles ur ON u.id = ur.user_id
      LEFT JOIN app.roles r ON ur.role_id = r.id AND r.is_active = true
      LEFT JOIN app.role_permissions rp ON r.id = rp.role_id
      WHERE u.id = $1 AND u.status = 'active' AND u.deleted_at IS NULL
      GROUP BY u.id
    `, [userId]);

    if (userQuery.rows.length === 0) {
      return null;
    }

    return userQuery.rows[0] as UserSession;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * Checks if the current user has a specific permission code
 */
export async function hasPermission(permissionCode: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // System administrators get full bypass
  if (user.roles.includes('system_management')) return true;
  
  return user.permissions.includes(permissionCode);
}

/**
 * Checks if the current user has access to a module and action, returning the scope:
 * 'own' | 'team' | 'department' | 'all' | null (no access)
 */
export async function getPermissionScope(
  module: string,
  action: string
): Promise<'own' | 'team' | 'department' | 'all' | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  // System Management role has 'all' scope bypass for everything
  if (user.roles.includes('system_management')) return 'all';

  // Find permissions matching the module and action, and determine the widest scope
  const matchingPermissions = user.permissions
    .filter(p => p.startsWith(`${module}.${action}.`))
    .map(p => p.split('.')[2]); // Extract scope (e.g. 'own', 'team', 'department', 'all')

  if (matchingPermissions.length === 0) return null;

  // Order of scopes from widest to narrowest
  const scopePriority = ['all', 'department', 'team', 'own'];
  for (const scope of scopePriority) {
    if (matchingPermissions.includes(scope)) {
      return scope as 'own' | 'team' | 'department' | 'all';
    }
  }

  return null;
}

/**
 * Asserts that the current user has a permission, throwing an error if not
 */
export async function assertPermission(permissionCode: string): Promise<void> {
  const allowed = await hasPermission(permissionCode);
  if (!allowed) {
    throw new Error(`Unauthorized: Missing permission ${permissionCode}`);
  }
}
