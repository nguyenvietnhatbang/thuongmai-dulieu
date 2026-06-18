'use client';

import { useMemo, useState } from 'react';
import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';
import { DepartmentRecord, RoleRecord, SortDirection } from './types';
import { compareText, paginate, toggleSort } from './list-utils';

interface RolesDepartmentsTabProps {
  roles: RoleRecord[];
  departments: DepartmentRecord[];
  saving: boolean;
  onCreateRole: () => void;
  onEditRole: (role: RoleRecord) => void;
  onDeleteRole: (role: RoleRecord) => void;
  onCreateDepartment: () => void;
  onEditDepartment: (department: DepartmentRecord) => void;
  onDeleteDepartment: (department: DepartmentRecord) => void;
}

const LIMIT = 8;

export function RolesDepartmentsTab({
  roles,
  departments,
  saving,
  onCreateRole,
  onEditRole,
  onDeleteRole,
  onCreateDepartment,
  onEditDepartment,
  onDeleteDepartment,
}: RolesDepartmentsTabProps) {
  const [roleSearch, setRoleSearch] = useState('');
  const [submittedRoleSearch, setSubmittedRoleSearch] = useState('');
  const [roleStatus, setRoleStatus] = useState('');
  const [roleType, setRoleType] = useState('');
  const [rolePage, setRolePage] = useState(1);
  const [roleSort, setRoleSort] = useState('name');
  const [roleOrder, setRoleOrder] = useState<SortDirection>('asc');

  const [deptSearch, setDeptSearch] = useState('');
  const [submittedDeptSearch, setSubmittedDeptSearch] = useState('');
  const [deptStatus, setDeptStatus] = useState('');
  const [deptPage, setDeptPage] = useState(1);
  const [deptSort, setDeptSort] = useState('name');
  const [deptOrder, setDeptOrder] = useState<SortDirection>('asc');

  const filteredRoles = useMemo(() => {
    const query = submittedRoleSearch.trim().toLowerCase();
    return roles
      .filter(role => !roleStatus || (roleStatus === 'active' ? role.isActive : !role.isActive))
      .filter(role => !roleType || (roleType === 'system' ? role.isSystem : !role.isSystem))
      .filter(role => {
        if (!query) return true;
        return [role.name, role.code, role.description || ''].join(' ').toLowerCase().includes(query);
      })
      .sort((a, b) => {
        if (roleSort === 'code') return compareText(a.code, b.code, roleOrder);
        if (roleSort === 'type') return compareText(a.isSystem ? 'system' : 'custom', b.isSystem ? 'system' : 'custom', roleOrder);
        if (roleSort === 'status') return compareText(a.isActive ? 'active' : 'inactive', b.isActive ? 'active' : 'inactive', roleOrder);
        return compareText(a.name, b.name, roleOrder);
      });
  }, [roles, roleStatus, roleType, submittedRoleSearch, roleSort, roleOrder]);

  const filteredDepartments = useMemo(() => {
    const query = submittedDeptSearch.trim().toLowerCase();
    return departments
      .filter(dept => !deptStatus || dept.status === deptStatus)
      .filter(dept => !query || [dept.name, dept.code].join(' ').toLowerCase().includes(query))
      .sort((a, b) => {
        if (deptSort === 'code') return compareText(a.code, b.code, deptOrder);
        if (deptSort === 'status') return compareText(a.status, b.status, deptOrder);
        return compareText(a.name, b.name, deptOrder);
      });
  }, [departments, deptStatus, submittedDeptSearch, deptSort, deptOrder]);

  const roleItems = paginate(filteredRoles, rolePage, LIMIT);
  const deptItems = paginate(filteredDepartments, deptPage, LIMIT);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-6">
      <div className="space-y-4">
        <ListToolbar
          search={roleSearch}
          searchPlaceholder="Tìm vai trò..."
          onSearchChange={(value) => {
            setRoleSearch(value);
            setSubmittedRoleSearch(value);
            setRolePage(1);
          }}
          onSearchSubmit={(event) => {
            event.preventDefault();
          }}
          showSearchButton={false}
          searchClassName="!w-44"
          filters={[
            {
              value: roleStatus,
              placeholder: 'Tất cả trạng thái',
              onChange: (value) => { setRoleStatus(value); setRolePage(1); },
              className: '!w-40',
              options: [
                { value: 'active', label: 'Đang dùng' },
                { value: 'inactive', label: 'Tạm tắt' },
              ],
            },
            {
              value: roleType,
              placeholder: 'Tất cả loại',
              onChange: (value) => { setRoleType(value); setRolePage(1); },
              className: '!w-32',
              options: [
                { value: 'system', label: 'Hệ thống' },
                { value: 'custom', label: 'Tùy chỉnh' },
              ],
            },
          ]}
          onReset={() => {
            setRoleSearch('');
            setSubmittedRoleSearch('');
            setRoleStatus('');
            setRoleType('');
            setRolePage(1);
          }}
          rightSlot={<button type="button" onClick={onCreateRole} className="px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer">+ Role</button>}
        />

        <div className="glass-panel rounded-xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="px-5 py-4"><SortableHeader label="Vai trò" sortKey="name" activeSort={roleSort} order={roleOrder} onSort={(next) => { const s = toggleSort(roleSort, roleOrder, next); setRoleSort(s.sort); setRoleOrder(s.order); }} /></th>
                  <th className="px-5 py-4">Mô tả</th>
                  <th className="px-5 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={roleSort} order={roleOrder} onSort={(next) => { const s = toggleSort(roleSort, roleOrder, next); setRoleSort(s.sort); setRoleOrder(s.order); }} /></th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roleItems.map(role => (
                  <tr key={role.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-foreground">{role.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{role.code}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{role.isSystem ? 'Hệ thống' : 'Tùy chỉnh'}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground max-w-md">{role.description || '-'}</td>
                    <td className="px-5 py-4 text-xs font-semibold">
                      <span className={`px-2 py-0.5 rounded-full ${role.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {role.isActive ? 'Đang dùng' : 'Tạm tắt'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => onEditRole(role)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Sửa vai trò"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteRole(role)}
                          disabled={saving || role.isSystem}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Xóa vai trò"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {roleItems.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">Không tìm thấy vai trò phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
          <PaginationControls page={rolePage} limit={LIMIT} total={filteredRoles.length} onPageChange={setRolePage} alwaysShow />
        </div>
      </div>

      <div className="space-y-4">
        <ListToolbar
          search={deptSearch}
          searchPlaceholder="Tìm phòng ban..."
          onSearchChange={(value) => {
            setDeptSearch(value);
            setSubmittedDeptSearch(value);
            setDeptPage(1);
          }}
          onSearchSubmit={(event) => {
            event.preventDefault();
          }}
          showSearchButton={false}
          searchClassName="!w-48"
          filters={[
            {
              value: deptStatus,
              placeholder: 'Tất cả trạng thái',
              onChange: (value) => { setDeptStatus(value); setDeptPage(1); },
              className: '!w-40',
              options: [
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Tạm tắt' },
              ],
            },
          ]}
          onReset={() => {
            setDeptSearch('');
            setSubmittedDeptSearch('');
            setDeptStatus('');
            setDeptPage(1);
          }}
          rightSlot={<button type="button" onClick={onCreateDepartment} className="px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer">+ Phòng ban</button>}
        />

        <div className="glass-panel rounded-xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="px-5 py-4"><SortableHeader label="Phòng ban" sortKey="name" activeSort={deptSort} order={deptOrder} onSort={(next) => { const s = toggleSort(deptSort, deptOrder, next); setDeptSort(s.sort); setDeptOrder(s.order); }} /></th>
                  <th className="px-5 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={deptSort} order={deptOrder} onSort={(next) => { const s = toggleSort(deptSort, deptOrder, next); setDeptSort(s.sort); setDeptOrder(s.order); }} /></th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deptItems.map(dept => (
                  <tr key={dept.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-foreground">{dept.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{dept.code}</p>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold">
                      <span className={`px-2 py-0.5 rounded-full ${dept.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {dept.status === 'active' ? 'Hoạt động' : 'Tạm tắt'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => onEditDepartment(dept)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Sửa phòng ban"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteDepartment(dept)}
                          disabled={saving}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
                          title="Xóa phòng ban"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {deptItems.length === 0 && <tr><td colSpan={3} className="px-5 py-12 text-center text-sm text-muted-foreground">Không tìm thấy phòng ban phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
          <PaginationControls page={deptPage} limit={LIMIT} total={filteredDepartments.length} onPageChange={setDeptPage} alwaysShow />
        </div>
      </div>
    </div>
  );
}
