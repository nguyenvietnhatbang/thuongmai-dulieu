'use client';

import { useState, useEffect } from 'react';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
}

interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  departmentId: string | null;
  departmentName: string | null;
  status: 'active' | 'locked' | 'inactive';
  roleIds: string[];
}

interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
}

export function AdminClient({}: { currentUser: UserSession }) {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'rbac'>('users');
  const [loading, setLoading] = useState(true);
  
  // Data lists
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [roleForm, setRoleForm] = useState({ code: '', name: '', description: '', isActive: true });
  const [userForm, setUserForm] = useState({
    email: '',
    fullName: '',
    password: '',
    departmentId: '',
    status: 'active',
    roleIds: [] as string[]
  });

  // RBAC active role
  const [activeRoleId, setActiveRoleId] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      const json = await res.json();
      if (json.success) {
        setRoles(json.data.roles);
        setDepartments(json.data.departments || []);
        setPermissions(json.data.permissions);
        setRolePermissions(json.data.rolePermissions);
        setUsers(json.data.users);
        
        if (!activeRoleId && json.data.roles.length > 0) {
          const firstRole = json.data.roles[0].id;
          setActiveRoleId(firstRole);
        }
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

  // Update selected permissions list when active role changes or rolePermissions is loaded
  useEffect(() => {
    if (activeRoleId) {
      const activeBindings = rolePermissions
        .filter(rp => rp.roleId === activeRoleId)
        .map(rp => rp.permissionCode);
      setSelectedPermissions(activeBindings);
    }
  }, [activeRoleId, rolePermissions]);

  // Toggle permission checkbox
  const handlePermissionToggle = (code: string) => {
    if (selectedPermissions.includes(code)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== code));
    } else {
      setSelectedPermissions([...selectedPermissions, code]);
    }
  };

  // Save role permissions
  const handleSaveRolePermissions = async () => {
    if (!activeRoleId) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRolePermissions',
          roleId: activeRoleId,
          permissions: selectedPermissions
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Cập nhật quyền của vai trò thành công! Vui lòng làm mới trang hoặc chuyển vai trò để thấy thay đổi.');
        
        // Refresh local bindings
        setRolePermissions(prev => {
          const cleared = prev.filter(rp => rp.roleId !== activeRoleId);
          const added = selectedPermissions.map(code => ({ roleId: activeRoleId, permissionCode: code }));
          return [...cleared, ...added];
        });
      } else {
        alert(json.error || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi lưu cấu hình');
    }
  };

  const handleNewUserRoleToggle = (roleId: string) => {
    setUserForm(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  const openCreateRole = () => {
    setEditingRoleId(null);
    setRoleForm({ code: '', name: '', description: '', isActive: true });
    setIsRoleFormOpen(true);
  };

  const openEditRole = (role: RoleRecord) => {
    setEditingRoleId(role.id);
    setRoleForm({
      code: role.code,
      name: role.name,
      description: role.description || '',
      isActive: role.isActive
    });
    setIsRoleFormOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingRoleId ? 'updateRole' : 'createRole',
          roleId: editingRoleId,
          ...roleForm
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsRoleFormOpen(false);
        setEditingRoleId(null);
        setRoleForm({ code: '', name: '', description: '', isActive: true });
        await fetchAdminData();
        if (json.data?.id) setActiveRoleId(json.data.id);
      } else {
        alert(json.error || 'Lưu vai trò thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi tạo vai trò');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: RoleRecord) => {
    if (!confirm(`Xóa vai trò "${role.name}"? Các gán quyền và gán user liên quan sẽ bị gỡ.`)) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteRole', roleId: role.id })
      });
      const json = await res.json();
      if (json.success) {
        if (activeRoleId === role.id) setActiveRoleId('');
        await fetchAdminData();
      } else {
        alert(json.error || 'Xóa vai trò thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi xóa vai trò');
    } finally {
      setSaving(false);
    }
  };

  const openCreateUser = () => {
    setEditingUserId(null);
    setUserForm({ email: '', fullName: '', password: '', departmentId: '', status: 'active', roleIds: [] });
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
      roleIds: user.roleIds
    });
    setIsUserFormOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingUserId ? 'updateUser' : 'createUser',
          userId: editingUserId,
          ...userForm
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsUserFormOpen(false);
        setEditingUserId(null);
        setUserForm({ email: '', fullName: '', password: '', departmentId: '', status: 'active', roleIds: [] });
        await fetchAdminData();
      } else {
        alert(json.error || 'Lưu người dùng thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi tạo người dùng');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: AdminUserRecord) => {
    if (!confirm(`Xóa người dùng "${user.fullName}"? Tài khoản sẽ bị vô hiệu hóa và gỡ vai trò.`)) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteUser', userId: user.id })
      });
      const json = await res.json();
      if (json.success) {
        await fetchAdminData();
      } else {
        alert(json.error || 'Xóa người dùng thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi xóa người dùng');
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by module
  const modules = Array.from(new Set(permissions.map(p => p.module)));

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Quản trị Phân quyền (RBAC Admin)</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Quản lý phân quyền chi tiết cho từng vai trò và chỉ định vai trò hoạt động cho tài khoản nhân viên.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-sm font-semibold">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Người dùng
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'roles' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Vai trò
        </button>
        <button
          onClick={() => setActiveTab('rbac')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'rbac' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Phân quyền
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2 glass-panel rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-xs">Đang tải thông tin phân quyền...</p>
        </div>
      ) : (
        <>
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="glass-panel rounded-xl overflow-hidden border border-border">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-slate-50 px-6 py-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Người dùng hệ thống</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Tạo tài khoản nội bộ và gán vai trò RBAC cho nhân viên.</p>
                </div>
                <button
                  type="button"
                  onClick={openCreateUser}
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer"
                >
                  + Tạo người dùng
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                      <th className="px-6 py-4">Họ và tên</th>
                      <th className="px-6 py-4">Địa chỉ Email</th>
                      <th className="px-6 py-4">Phòng ban</th>
                      <th className="px-6 py-4">Tài khoản chính</th>
                      <th className="px-6 py-4">Vai trò gán hiện tại</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => {
                      // Get names of user roles
                      const userRoleNames = u.roleIds.map((rId: string) => {
                        const found = roles.find(r => r.id === rId);
                        return found ? found.name : '';
                      }).filter(Boolean);

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-foreground">{u.fullName}</td>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{u.email}</td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">{u.departmentName || '-'}</td>
                          <td className="px-6 py-4 text-xs font-semibold">
                            <span className={`px-2 py-0.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {u.status === 'active' ? 'Đang hoạt động' : u.status === 'locked' ? 'Đã khóa' : 'Ngừng hoạt động'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-700">
                            {userRoleNames.length > 0 ? userRoleNames.join(', ') : 'Chưa gán vai trò'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditUser(u)}
                                className="px-3 py-1.5 rounded-lg bg-secondary text-primary font-bold text-xs hover:bg-primary/10 transition-all cursor-pointer"
                              >
                                Xem/Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={saving}
                                className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition-all cursor-pointer disabled:opacity-60"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROLES TAB */}
          {activeTab === 'roles' && (
            <div className="glass-panel rounded-xl overflow-hidden border border-border">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-slate-50 px-6 py-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Vai trò RBAC</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Tạo, xem, sửa, vô hiệu hóa hoặc xóa vai trò. Quyền chi tiết được gán ở tab Phân quyền.</p>
                </div>
                <button
                  type="button"
                  onClick={openCreateRole}
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer"
                >
                  + Tạo vai trò
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                      <th className="px-6 py-4">Vai trò</th>
                      <th className="px-6 py-4">Mô tả</th>
                      <th className="px-6 py-4">Loại</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {roles.map(role => (
                      <tr key={role.id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{role.name}</p>
                          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{role.code}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground max-w-md">{role.description || '-'}</td>
                        <td className="px-6 py-4 text-xs font-semibold">
                          {role.isSystem ? 'Hệ thống' : 'Tùy chỉnh'}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold">
                          <span className={`px-2 py-0.5 rounded-full ${
                            role.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {role.isActive ? 'Đang dùng' : 'Tạm tắt'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditRole(role)}
                              className="px-3 py-1.5 rounded-lg bg-secondary text-primary font-bold text-xs hover:bg-primary/10 transition-all cursor-pointer"
                            >
                              Xem/Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role)}
                              disabled={saving || role.isSystem}
                              className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PERMISSIONS TAB */}
          {activeTab === 'rbac' && (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
              <div className="glass-panel p-4 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chọn vai trò</h3>
                <div className="space-y-1 max-h-[65vh] overflow-y-auto pr-1">
                  {roles.filter(role => role.isActive).map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setActiveRoleId(role.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        activeRoleId === role.id
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15'
                          : 'hover:bg-accent text-slate-700 hover:text-foreground'
                      }`}
                    >
                      <p className="leading-tight">{role.name}</p>
                      <p className={`text-[10px] mt-0.5 truncate leading-none ${activeRoleId === role.id ? 'text-primary-foreground/70' : 'text-slate-400'}`}>
                        {role.code}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl space-y-5">
                <div className="flex justify-between items-start gap-4 border-b border-border pb-4">
                  <div>
                    <h3 className="font-bold text-foreground">
                      Phân quyền cho: {roles.find(r => r.id === activeRoleId)?.name || 'Chưa chọn vai trò'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mô tả quyền là thông tin chính; mã quyền chỉ dùng để đối soát kỹ thuật.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveRolePermissions}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 transition-all cursor-pointer shrink-0"
                  >
                    Lưu phân quyền
                  </button>
                </div>

                <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
                  {modules.map((mod) => {
                    const modPerms = permissions.filter(p => p.module === mod);
                    return (
                      <div key={mod} className="space-y-2.5">
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider bg-slate-100 px-3 py-2 rounded-lg">
                          {mod}
                        </h4>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                          {modPerms.map((perm) => (
                            <label
                              key={perm.code}
                              className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-slate-50/70 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm.code)}
                                onChange={() => handlePermissionToggle(perm.code)}
                                className="mt-0.5 rounded border-slate-350 text-primary focus:ring-primary cursor-pointer h-4 w-4 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground leading-snug">{perm.description || 'Chưa có mô tả quyền'}</p>
                                <p className="text-[10px] text-muted-foreground mt-1 leading-none font-mono truncate">{perm.code}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ROLE FORM MODAL */}
      {isRoleFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-foreground">{editingRoleId ? 'Xem/Sửa vai trò RBAC' : 'Tạo vai trò RBAC'}</h2>
              <button onClick={() => setIsRoleFormOpen(false)} className="text-slate-400 hover:text-foreground cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã vai trò *</label>
                <input
                  required
                  value={roleForm.code}
                  onChange={e => setRoleForm({ ...roleForm, code: e.target.value })}
                  placeholder="sales_supervisor"
                  className="premium-input"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Chỉ dùng chữ thường, số và dấu gạch dưới.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên vai trò *</label>
                <input
                  required
                  value={roleForm.name}
                  onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="Trưởng nhóm kinh doanh"
                  className="premium-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả</label>
                <textarea
                  value={roleForm.description}
                  onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Phạm vi sử dụng của vai trò..."
                  className="premium-input min-h-24"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={roleForm.isActive}
                  onChange={e => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                  className="rounded border-slate-350 text-primary focus:ring-primary cursor-pointer h-4 w-4"
                />
                Cho phép gán vai trò này
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsRoleFormOpen(false)} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-70 cursor-pointer">
                  {editingRoleId ? 'Lưu vai trò' : 'Tạo vai trò'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER FORM MODAL */}
      {isUserFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-foreground">{editingUserId ? 'Xem/Sửa tài khoản người dùng' : 'Tạo tài khoản người dùng'}</h2>
              <button onClick={() => setIsUserFormOpen(false)} className="text-slate-400 hover:text-foreground cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ tên *</label>
                  <input
                    required
                    value={userForm.fullName}
                    onChange={e => setUserForm({ ...userForm, fullName: e.target.value })}
                    className="premium-input"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email đăng nhập *</label>
                  <input
                    required
                    type="email"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className="premium-input"
                    placeholder="user@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{editingUserId ? 'Đổi mật khẩu' : 'Mật khẩu ban đầu *'}</label>
                  <input
                    required={!editingUserId}
                    type="password"
                    minLength={8}
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    className="premium-input"
                    placeholder={editingUserId ? 'Để trống nếu không đổi' : 'Tối thiểu 8 ký tự'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phòng ban</label>
                  <select
                    value={userForm.departmentId}
                    onChange={e => setUserForm({ ...userForm, departmentId: e.target.value })}
                    className="premium-input"
                  >
                    <option value="">Chưa gán phòng ban</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trạng thái</label>
                  <select
                    value={userForm.status}
                    onChange={e => setUserForm({ ...userForm, status: e.target.value })}
                    className="premium-input"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="locked">Đã khóa</option>
                    <option value="inactive">Ngừng hoạt động</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Vai trò RBAC</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {roles.map(role => (
                    <label key={role.id} className="flex items-center gap-3 p-2.5 border border-border rounded-lg hover:bg-slate-50/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={userForm.roleIds.includes(role.id)}
                        onChange={() => handleNewUserRoleToggle(role.id)}
                        className="rounded border-slate-350 text-primary focus:ring-primary cursor-pointer h-4 w-4"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{role.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-none font-mono">{role.code}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsUserFormOpen(false)} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-70 cursor-pointer">
                  {editingUserId ? 'Lưu người dùng' : 'Tạo người dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
