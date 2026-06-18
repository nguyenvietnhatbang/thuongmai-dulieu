export interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  departmentId: string | null;
  departmentName: string | null;
  status: 'active' | 'locked' | 'inactive';
  roleIds: string[];
}

export interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface PermissionRecord {
  code: string;
  module: string;
  action: string;
  scope: string;
  description: string | null;
}

export interface RolePermissionRecord {
  roleId: string;
  permissionCode: string;
}

export interface UserFormState {
  email: string;
  fullName: string;
  password: string;
  departmentId: string;
  status: 'active' | 'locked' | 'inactive';
  roleIds: string[];
}

export interface RoleFormState {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface DepartmentFormState {
  code: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface CompanySettingsRecord {
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

export type CompanySettingsFormState = Omit<CompanySettingsRecord, 'id'>;

export type AdminTab = 'users' | 'roles' | 'rbac' | 'company';
export type SortDirection = 'asc' | 'desc';
