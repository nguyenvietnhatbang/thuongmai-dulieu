'use client';

import { useState, useEffect } from 'react';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export function AdminClient({}: { currentUser: UserSession }) {
  const [activeTab, setActiveTab] = useState<'rbac' | 'users'>('rbac');
  const [loading, setLoading] = useState(true);
  
  // Data lists
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // RBAC active role
  const [activeRoleId, setActiveRoleId] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // User active edit
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      const json = await res.json();
      if (json.success) {
        setRoles(json.data.roles);
        setPermissions(json.data.permissions);
        setRolePermissions(json.data.rolePermissions);
        setUsers(json.data.users);
        
        // Default active role to the first non-admin role if possible
        if (json.data.roles.length > 0) {
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

  // Toggle user role checkbox
  const handleUserRoleToggle = (roleId: string) => {
    if (selectedUserRoles.includes(roleId)) {
      setSelectedUserRoles(selectedUserRoles.filter(id => id !== roleId));
    } else {
      setSelectedUserRoles([...selectedUserRoles, roleId]);
    }
  };

  // Save user roles assignment
  const handleSaveUserRoles = async () => {
    if (!activeUserId) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateUserRoles',
          userId: activeUserId,
          roleIds: selectedUserRoles
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Cập nhật vai trò người dùng thành công!');
        setActiveUserId(null);
        fetchAdminData();
      } else {
        alert(json.error || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi lưu vai trò');
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
          onClick={() => setActiveTab('rbac')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'rbac' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Ma Trận Phân Quyền Vai Trò
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Tài Khoản & Vai Trò
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2 glass-panel rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-xs">Đang tải thông tin phân quyền...</p>
        </div>
      ) : (
        <>
          {/* RBAC MATRIX TAB */}
          {activeTab === 'rbac' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Roles list panel */}
              <div className="glass-panel p-4 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh sách vai trò</h3>
                <div className="space-y-1">
                  {roles.map((role) => (
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

              {/* Permissions matrix panel */}
              <div className="md:col-span-3 glass-panel p-6 rounded-xl space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <div>
                      <h3 className="font-bold text-foreground">
                        Cấu hình quyền cho: {roles.find(r => r.id === activeRoleId)?.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tích chọn để cấp quyền thực hiện chức năng. Quyền lợi sẽ lưu trực tiếp vào cơ sở dữ liệu.
                      </p>
                    </div>
                    <button
                      onClick={handleSaveRolePermissions}
                      className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 transition-all cursor-pointer"
                    >
                      Lưu cấu hình vai trò
                    </button>
                  </div>

                  {/* Permissions Checklist Grouped by Module */}
                  <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
                    {modules.map((mod) => {
                      const modPerms = permissions.filter(p => p.module === mod);
                      return (
                        <div key={mod} className="space-y-2.5">
                          <h4 className="text-xs font-extrabold text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded">
                            Mô-đun: {mod}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
                            {modPerms.map((perm) => (
                              <label
                                key={perm.code}
                                className="flex items-start gap-3 p-2 border border-border rounded-lg hover:bg-slate-50/50 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.includes(perm.code)}
                                  onChange={() => handlePermissionToggle(perm.code)}
                                  className="mt-0.5 rounded border-slate-350 text-primary focus:ring-primary cursor-pointer h-4 w-4"
                                />
                                <div>
                                  <p className="text-xs font-bold text-slate-800 leading-tight">{perm.code}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{perm.description}</p>
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
            </div>
          )}

          {/* USER ROLES MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <div className="glass-panel rounded-xl overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                      <th className="px-6 py-4">Họ và tên</th>
                      <th className="px-6 py-4">Địa chỉ Email</th>
                      <th className="px-6 py-4">Tài khoản chính</th>
                      <th className="px-6 py-4">Vai trò gán hiện tại</th>
                      <th className="px-6 py-4 text-right">Phân vai trò</th>
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
                          <td className="px-6 py-4 text-xs font-semibold">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              {u.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-700">
                            {userRoleNames.length > 0 ? userRoleNames.join(', ') : 'Chưa gán vai trò'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setActiveUserId(u.id);
                                setSelectedUserRoles(u.roleIds);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-secondary text-primary font-bold text-xs hover:bg-primary/10 transition-all cursor-pointer"
                            >
                              Gán vai trò
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ASSIGN USER ROLE MODAL */}
      {activeUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-foreground">Giao vai trò người dùng</h2>
              <button onClick={() => setActiveUserId(null)} className="text-slate-400 hover:text-foreground cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-3 bg-slate-50 border border-border rounded-lg text-xs space-y-1">
              <p className="text-slate-500 font-bold uppercase">Người dùng</p>
              <p className="font-bold text-foreground">
                {users.find(u => u.id === activeUserId)?.fullName}
              </p>
              <p className="text-slate-500 font-mono text-[10px]">
                {users.find(u => u.id === activeUserId)?.email}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveUserRoles(); }} className="space-y-4">
              <div className="space-y-2 pr-1 max-h-56 overflow-y-auto">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Danh sách vai trò khả dụng</label>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-3 p-2.5 border border-border rounded-lg hover:bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserRoles.includes(role.id)}
                        onChange={() => handleUserRoleToggle(role.id)}
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
                <button
                  type="button"
                  onClick={() => setActiveUserId(null)}
                  className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer"
                >
                  Lưu vai trò
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
