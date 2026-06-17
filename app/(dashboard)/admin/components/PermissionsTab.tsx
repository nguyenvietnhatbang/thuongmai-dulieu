'use client';

import { useMemo, useState } from 'react';
import { ListToolbar } from '@/components/ui/ListControls';
import { PermissionRecord, RoleRecord } from './types';

interface PermissionsTabProps {
  roles: RoleRecord[];
  permissions: PermissionRecord[];
  activeRoleId: string;
  selectedPermissions: string[];
  onRoleChange: (roleId: string) => void;
  onPermissionToggle: (code: string) => void;
  onSave: () => void;
}

export function PermissionsTab({
  roles,
  permissions,
  activeRoleId,
  selectedPermissions,
  onRoleChange,
  onPermissionToggle,
  onSave,
}: PermissionsTabProps) {
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');

  const modules = useMemo(() => Array.from(new Set(permissions.map(p => p.module))).sort(), [permissions]);
  const scopes = useMemo(() => Array.from(new Set(permissions.map(p => p.scope))).sort(), [permissions]);

  const filteredPermissions = useMemo(() => {
    const query = submittedSearch.trim().toLowerCase();
    return permissions
      .filter(permission => !moduleFilter || permission.module === moduleFilter)
      .filter(permission => !scopeFilter || permission.scope === scopeFilter)
      .filter(permission => {
        if (!query) return true;
        return [permission.description || '', permission.code, permission.module, permission.action, permission.scope]
          .join(' ')
          .toLowerCase()
          .includes(query);
      });
  }, [permissions, moduleFilter, scopeFilter, submittedSearch]);

  const groupedModules = Array.from(new Set(filteredPermissions.map(permission => permission.module))).sort();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <div className="glass-panel p-4 rounded-xl space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chọn vai trò</h3>
        <div className="space-y-1 max-h-[65vh] overflow-y-auto pr-1">
          {roles.filter(role => role.isActive).map((role) => (
            <button
              key={role.id}
              onClick={() => onRoleChange(role.id)}
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

      <div className="space-y-4">
        <ListToolbar
          search={search}
          searchPlaceholder="Tìm quyền..."
          onSearchChange={(value) => {
            setSearch(value);
            setSubmittedSearch(value);
          }}
          onSearchSubmit={(event) => {
            event.preventDefault();
          }}
          showSearchButton={false}
          searchClassName="!w-56"
          filters={[
            {
              value: moduleFilter,
              placeholder: 'Tất cả module',
              onChange: setModuleFilter,
              className: '!w-40',
              options: modules.map(module => ({ value: module, label: module })),
            },
            {
              value: scopeFilter,
              placeholder: 'Tất cả phạm vi',
              onChange: setScopeFilter,
              className: '!w-36',
              options: scopes.map(scope => ({ value: scope, label: scope })),
            },
          ]}
          onReset={() => {
            setSearch('');
            setSubmittedSearch('');
            setModuleFilter('');
            setScopeFilter('');
          }}
          rightSlot={<button onClick={onSave} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 transition-all cursor-pointer shrink-0">Lưu phân quyền</button>}
        />

        <div className="glass-panel p-6 rounded-xl space-y-5">
          <div className="border-b border-border pb-4">
            <h3 className="font-bold text-foreground">
              Phân quyền cho: {roles.find(r => r.id === activeRoleId)?.name || 'Chưa chọn vai trò'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mô tả quyền là thông tin chính; mã quyền chỉ dùng để đối soát kỹ thuật.
            </p>
          </div>

          <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
            {groupedModules.map((mod) => {
              const modPerms = filteredPermissions.filter(permission => permission.module === mod);
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
                          onChange={() => onPermissionToggle(perm.code)}
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
            {filteredPermissions.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">Không tìm thấy quyền phù hợp.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
