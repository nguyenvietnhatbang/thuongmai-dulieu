'use client';

import { useMemo, useState } from 'react';
import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';
import { AdminUserRecord, DepartmentRecord, RoleRecord, SortDirection } from './types';
import { compareText, paginate, toggleSort } from './list-utils';

interface UsersTabProps {
  users: AdminUserRecord[];
  roles: RoleRecord[];
  departments: DepartmentRecord[];
  saving: boolean;
  onCreateUser: () => void;
  onEditUser: (user: AdminUserRecord) => void;
  onDeleteUser: (user: AdminUserRecord) => void;
}

const LIMIT = 10;

export function UsersTab({ users, roles, departments, saving, onCreateUser, onEditUser, onDeleteUser }: UsersTabProps) {
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('fullName');
  const [order, setOrder] = useState<SortDirection>('asc');

  const getRoleNames = (roleIds: string[]) => roleIds
    .map(roleId => roles.find(role => role.id === roleId)?.name || '')
    .filter(Boolean);

  const filteredUsers = useMemo(() => {
    const query = submittedSearch.trim().toLowerCase();
    return users
      .filter(user => !statusFilter || user.status === statusFilter)
      .filter(user => !departmentFilter || user.departmentId === departmentFilter)
      .filter(user => !roleFilter || user.roleIds.includes(roleFilter))
      .filter(user => {
        if (!query) return true;
        const roleNames = getRoleNames(user.roleIds).join(' ');
        return [user.fullName, user.email, user.departmentName || '', roleNames]
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        if (sort === 'email') return compareText(a.email, b.email, order);
        if (sort === 'department') return compareText(a.departmentName, b.departmentName, order);
        if (sort === 'status') return compareText(a.status, b.status, order);
        if (sort === 'roles') return compareText(getRoleNames(a.roleIds).join(', '), getRoleNames(b.roleIds).join(', '), order);
        return compareText(a.fullName, b.fullName, order);
      });
  }, [users, statusFilter, departmentFilter, roleFilter, submittedSearch, sort, order, roles]);

  const pageItems = paginate(filteredUsers, page, LIMIT);

  const handleSort = (nextSort: string) => {
    const next = toggleSort(sort, order, nextSort);
    setSort(next.sort);
    setOrder(next.order);
  };

  const resetFilters = () => {
    setSearch('');
    setSubmittedSearch('');
    setStatusFilter('');
    setDepartmentFilter('');
    setRoleFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <ListToolbar
        search={search}
        searchPlaceholder="Tìm người dùng..."
        onSearchChange={(value) => {
          setSearch(value);
          setSubmittedSearch(value);
          setPage(1);
        }}
        onSearchSubmit={(event) => {
          event.preventDefault();
        }}
        showSearchButton={false}
        searchClassName="!w-56"
        filters={[
          {
            value: statusFilter,
            placeholder: 'Tất cả trạng thái',
            onChange: (value) => { setStatusFilter(value); setPage(1); },
            className: '!w-40',
            options: [
              { value: 'active', label: 'Đang hoạt động' },
              { value: 'locked', label: 'Đã khóa' },
              { value: 'inactive', label: 'Ngừng hoạt động' },
            ],
          },
          {
            value: departmentFilter,
            placeholder: 'Tất cả phòng ban',
            onChange: (value) => { setDepartmentFilter(value); setPage(1); },
            className: '!w-44',
            options: departments.map(dept => ({ value: dept.id, label: dept.name })),
          },
          {
            value: roleFilter,
            placeholder: 'Tất cả vai trò',
            onChange: (value) => { setRoleFilter(value); setPage(1); },
            className: '!w-40',
            options: roles.map(role => ({ value: role.id, label: role.name })),
          },
        ]}
        onReset={resetFilters}
        rightSlot={(
          <button type="button" onClick={onCreateUser} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer">
            + Tạo người dùng
          </button>
        )}
      />

      <div className="glass-panel rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                <th className="px-6 py-4"><SortableHeader label="Họ và tên" sortKey="fullName" activeSort={sort} order={order} onSort={handleSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Email" sortKey="email" activeSort={sort} order={order} onSort={handleSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Phòng ban" sortKey="department" activeSort={sort} order={order} onSort={handleSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={handleSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Vai trò" sortKey="roles" activeSort={sort} order={order} onSort={handleSort} /></th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageItems.map((user) => {
                const roleNames = getRoleNames(user.roleIds);
                return (
                  <tr key={user.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">{user.fullName}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{user.departmentName || '-'}</td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      <span className={`px-2 py-0.5 rounded-full ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {user.status === 'active' ? 'Đang hoạt động' : user.status === 'locked' ? 'Đã khóa' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{roleNames.length > 0 ? roleNames.join(', ') : 'Chưa gán vai trò'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => onEditUser(user)} className="px-3 py-1.5 rounded-lg bg-secondary text-primary font-bold text-xs hover:bg-primary/10 transition-all cursor-pointer">Xem/Sửa</button>
                        <button onClick={() => onDeleteUser(user)} disabled={saving} className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition-all cursor-pointer disabled:opacity-60">Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">Không tìm thấy người dùng phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} limit={LIMIT} total={filteredUsers.length} onPageChange={setPage} alwaysShow />
      </div>
    </div>
  );
}
