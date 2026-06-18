'use client';

import { useEffect, useState } from 'react';
import { AdminTabs } from './components/AdminTabs';
import { DepartmentFormModal } from './components/DepartmentFormModal';
import { PermissionsTab } from './components/PermissionsTab';
import { RoleFormModal } from './components/RoleFormModal';
import { RolesDepartmentsTab } from './components/RolesDepartmentsTab';
import { UserFormModal } from './components/UserFormModal';
import { UsersTab } from './components/UsersTab';
import {
  AdminTab,
  AdminUserRecord,
  DepartmentFormState,
  DepartmentRecord,
  PermissionRecord,
  RoleFormState,
  RolePermissionRecord,
  RoleRecord,
  UserFormState,
} from './components/types';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

const defaultRoleForm: RoleFormState = { code: '', name: '', description: '', isActive: true };
const defaultDepartmentForm: DepartmentFormState = { code: '', name: '', status: 'active' };
const defaultUserForm: UserFormState = {
  email: '',
  fullName: '',
  password: '',
  departmentId: '',
  status: 'active',
  roleIds: [],
};

export function AdminClient({ currentUser }: { currentUser: UserSession }) {
  const canManageUsers = currentUser.roles.includes('system_management') || currentUser.permissions.includes('users.update.all');
  const canManageRoles = currentUser.roles.includes('system_management') || currentUser.permissions.includes('roles.configure.all');
  const availableTabs: Array<{ id: AdminTab; label: string }> = [
    ...(canManageUsers ? [{ id: 'users' as const, label: 'Người dùng' }] : []),
    ...(canManageRoles ? [
      { id: 'roles' as const, label: 'Vai trò' },
      { id: 'rbac' as const, label: 'Phân quyền' },
    ] : []),
  ];
  const [activeTab, setActiveTab] = useState<AdminTab>(() => availableTabs[0]?.id || 'users');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionRecord[]>([]);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);

  const [activeRoleId, setActiveRoleId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [isDepartmentFormOpen, setIsDepartmentFormOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormState>(defaultRoleForm);
  const [departmentForm, setDepartmentForm] = useState<DepartmentFormState>(defaultDepartmentForm);
  const [userForm, setUserForm] = useState<UserFormState>(defaultUserForm);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      const json = await res.json();
      if (json?.success) {
        setRoles(json.data.roles);
        setDepartments(json.data.departments || []);
        setPermissions(json.data.permissions);
        setRolePermissions(json.data.rolePermissions);
        setUsers(json.data.users);
        setActiveRoleId(prev => prev || json.data.roles[0]?.id || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (!activeRoleId) {
      setSelectedPermissions([]);
      return;
    }

    setSelectedPermissions(
      rolePermissions
        .filter(binding => binding.roleId === activeRoleId)
        .map(binding => binding.permissionCode)
    );
  }, [activeRoleId, rolePermissions]);

  const postAdminAction = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  const handlePermissionToggle = (code: string) => {
    setSelectedPermissions(prev => (
      prev.includes(code) ? prev.filter(item => item !== code) : [...prev, code]
    ));
  };

  const handleSaveRolePermissions = async () => {
    if (!activeRoleId) return;

    setSaving(true);
    try {
      const json = await postAdminAction({
        action: 'updateRolePermissions',
        roleId: activeRoleId,
        permissions: selectedPermissions,
      });

      if (!json.success) {
        alert(json.error || 'Cập nhật phân quyền thất bại');
        return;
      }

      setRolePermissions(prev => [
        ...prev.filter(binding => binding.roleId !== activeRoleId),
        ...selectedPermissions.map(code => ({ roleId: activeRoleId, permissionCode: code })),
      ]);
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi lưu phân quyền');
    } finally {
      setSaving(false);
    }
  };

  const openCreateRole = () => {
    setEditingRoleId(null);
    setRoleForm(defaultRoleForm);
    setIsRoleFormOpen(true);
  };

  const openEditRole = (role: RoleRecord) => {
    setEditingRoleId(role.id);
    setRoleForm({
      code: role.code,
      name: role.name,
      description: role.description || '',
      isActive: role.isActive,
    });
    setIsRoleFormOpen(true);
  };

  const handleSaveRole = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const json = await postAdminAction({
        action: editingRoleId ? 'updateRole' : 'createRole',
        roleId: editingRoleId,
        ...roleForm,
      });

      if (!json.success) {
        alert(json.error || 'Lưu vai trò thất bại');
        return;
      }

      setIsRoleFormOpen(false);
      setEditingRoleId(null);
      setRoleForm(defaultRoleForm);
      await fetchAdminData();
      if (json.data?.id) setActiveRoleId(json.data.id);
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi lưu vai trò');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: RoleRecord) => {
    if (!confirm(`Xóa vai trò "${role.name}"? Các gán quyền và gán user liên quan sẽ bị gỡ.`)) return;

    setSaving(true);
    try {
      const json = await postAdminAction({ action: 'deleteRole', roleId: role.id });
      if (!json.success) {
        alert(json.error || 'Xóa vai trò thất bại');
        return;
      }

      if (activeRoleId === role.id) setActiveRoleId('');
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi xóa vai trò');
    } finally {
      setSaving(false);
    }
  };

  const openCreateDepartment = () => {
    setEditingDepartmentId(null);
    setDepartmentForm(defaultDepartmentForm);
    setIsDepartmentFormOpen(true);
  };

  const openEditDepartment = (department: DepartmentRecord) => {
    setEditingDepartmentId(department.id);
    setDepartmentForm({
      code: department.code,
      name: department.name,
      status: department.status,
    });
    setIsDepartmentFormOpen(true);
  };

  const handleSaveDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const json = await postAdminAction({
        action: editingDepartmentId ? 'updateDepartment' : 'createDepartment',
        departmentId: editingDepartmentId,
        ...departmentForm,
      });

      if (!json.success) {
        alert(json.error || 'Lưu phòng ban thất bại');
        return;
      }

      setIsDepartmentFormOpen(false);
      setEditingDepartmentId(null);
      setDepartmentForm(defaultDepartmentForm);
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi lưu phòng ban');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async (department: DepartmentRecord) => {
    if (!confirm(`Xóa phòng ban "${department.name}"? Chỉ phòng ban chưa có người dùng mới được xóa.`)) return;

    setSaving(true);
    try {
      const json = await postAdminAction({ action: 'deleteDepartment', departmentId: department.id });
      if (!json.success) {
        alert(json.error || 'Xóa phòng ban thất bại');
        return;
      }

      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi xóa phòng ban');
    } finally {
      setSaving(false);
    }
  };

  const openCreateUser = () => {
    setEditingUserId(null);
    setUserForm(defaultUserForm);
    setIsUserFormOpen(true);
  };

  const openEditUser = (user: AdminUserRecord) => {
    setEditingUserId(user.id);
    setUserForm({
      email: user.email,
      fullName: user.fullName,
      password: '',
      departmentId: user.departmentId || '',
      status: user.status,
      roleIds: user.roleIds,
    });
    setIsUserFormOpen(true);
  };

  const handleUserRoleToggle = (roleId: string) => {
    setUserForm(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const handleSaveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const json = await postAdminAction({
        action: editingUserId ? 'updateUser' : 'createUser',
        userId: editingUserId,
        ...userForm,
      });

      if (!json.success) {
        alert(json.error || 'Lưu người dùng thất bại');
        return;
      }

      setIsUserFormOpen(false);
      setEditingUserId(null);
      setUserForm(defaultUserForm);
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi lưu người dùng');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: AdminUserRecord) => {
    if (!confirm(`Xóa người dùng "${user.fullName}"? Tài khoản sẽ bị vô hiệu hóa và gỡ vai trò.`)) return;

    setSaving(true);
    try {
      const json = await postAdminAction({ action: 'deleteUser', userId: user.id });
      if (!json.success) {
        alert(json.error || 'Xóa người dùng thất bại');
        return;
      }

      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi xóa người dùng');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full w-full items-stretch overflow-hidden gap-6">
      <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-6">
        <AdminTabs activeTab={activeTab} tabs={availableTabs} onChange={setActiveTab} />

        {loading ? (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2 glass-panel rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-xs">Đang tải cấu hình hệ thống...</p>
          </div>
        ) : (
          <>
            {activeTab === 'users' && canManageUsers && (
            <UsersTab
              users={users}
              roles={roles}
              departments={departments}
              saving={saving}
              onCreateUser={openCreateUser}
              onEditUser={openEditUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'roles' && canManageRoles && (
            <RolesDepartmentsTab
              roles={roles}
              departments={departments}
              saving={saving}
              onCreateRole={openCreateRole}
              onEditRole={openEditRole}
              onDeleteRole={handleDeleteRole}
              onCreateDepartment={openCreateDepartment}
              onEditDepartment={openEditDepartment}
              onDeleteDepartment={handleDeleteDepartment}
            />
          )}

          {activeTab === 'rbac' && canManageRoles && (
            <PermissionsTab
              roles={roles}
              permissions={permissions}
              activeRoleId={activeRoleId}
              selectedPermissions={selectedPermissions}
              onRoleChange={setActiveRoleId}
              onPermissionToggle={handlePermissionToggle}
              onSave={handleSaveRolePermissions}
            />
          )}

        </>
      )}

      {isRoleFormOpen && (
        <RoleFormModal
          isOpen={isRoleFormOpen}
          isEditing={Boolean(editingRoleId)}
          saving={saving}
          form={roleForm}
          onChange={setRoleForm}
          onClose={() => setIsRoleFormOpen(false)}
          onSubmit={handleSaveRole}
        />
      )}

      {isDepartmentFormOpen && (
        <DepartmentFormModal
          isOpen={isDepartmentFormOpen}
          isEditing={Boolean(editingDepartmentId)}
          saving={saving}
          form={departmentForm}
          onChange={setDepartmentForm}
          onClose={() => setIsDepartmentFormOpen(false)}
          onSubmit={handleSaveDepartment}
        />
      )}

      {isUserFormOpen && (
        <UserFormModal
          isOpen={isUserFormOpen}
          isEditing={Boolean(editingUserId)}
          saving={saving}
          form={userForm}
          roles={roles}
          departments={departments}
          onChange={setUserForm}
          onRoleToggle={handleUserRoleToggle}
          onClose={() => setIsUserFormOpen(false)}
          onSubmit={handleSaveUser}
        />
      )}
    </div>
  </div>
  );
}
