import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { query } from './db';
import { verifyPassword } from './password';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  departmentId: string | null;
  roles: string[];
  permissions: string[];
}

const SESSION_COOKIE = 'crm_user_session';
const LEGACY_USER_COOKIE = 'crm_user_id';

function getSessionSecret(): string {
  return process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.DATABASE_URL ||
    'dev-only-session-secret';
}

function signSessionUserId(userId: string): string {
  return createHmac('sha256', getSessionSecret()).update(userId).digest('hex');
}

export function createSessionValue(userId: string): string {
  return `${userId}.${signSessionUserId(userId)}`;
}

function verifySessionValue(value: string | undefined): string | null {
  if (!value) return null;

  const [userId, signature] = value.split('.');
  if (!userId || !signature) return null;

  const expected = signSessionUserId(userId);
  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  return timingSafeEqual(signatureBuffer, expectedBuffer) ? userId : null;
}

/**
 * Get the current active user's id without loading roles and permissions.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const userId = verifySessionValue(cookieStore.get(SESSION_COOKIE)?.value);
    if (!userId) return null;

    const userQuery = await query<{ id: string }>(`
      SELECT id
      FROM app.users
      WHERE id = $1 AND status = 'active' AND deleted_at IS NULL
      LIMIT 1
    `, [userId]);

    return userQuery.rows[0]?.id ?? null;
  } catch (error) {
    console.error('Error verifying current user id:', error);
    return null;
  }
}

/**
 * Get the currently logged-in user from the session cookie
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const userId = verifySessionValue(cookieStore.get(SESSION_COOKIE)?.value);
    if (!userId) return null;

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

export async function authenticateUser(email: string, password: string): Promise<UserSession | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const userResult = await query<{
    id: string;
    passwordHash: string | null;
  }>(`
    SELECT id, password_hash as "passwordHash"
    FROM app.users
    WHERE lower(email) = $1
      AND status = 'active'
      AND deleted_at IS NULL
    LIMIT 1
  `, [normalizedEmail]);

  if (userResult.rows.length === 0) return null;

  const user = userResult.rows[0];
  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) return null;

  return getUserSessionById(user.id);
}

async function getUserSessionById(userId: string): Promise<UserSession | null> {
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
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function getLegacyUserCookieName(): string {
  return LEGACY_USER_COOKIE;
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
