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
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => onEditUser(user)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Chỉnh sửa người dùng"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteUser(user)}
                          disabled={saving}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-60"
                          title="Xóa người dùng"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
