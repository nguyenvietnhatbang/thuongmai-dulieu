'use client';

import { useState, useEffect } from 'react';
import { Customer } from '@/features/customers/services/customer.service';
import { ListToolbar } from '@/components/ui/ListControls';
import { CustomersTable } from './components/CustomersTable';
import { CustomerCreateModal } from './components/CustomerCreateModal';
import { CustomerDetailDrawer } from './components/CustomerDetailDrawer';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

interface UserDropdown {
  id: string;
  fullName: string;
  email: string;
}

export function CustomersClient({ currentUser }: { currentUser: UserSession }) {
  // Master lists & states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<UserDropdown[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // Modal / Drawer states
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Client Permission Queries
  const canCreate = currentUser.roles.includes('system_management') || currentUser.permissions.includes('customers.create.all');
  const canDelete = currentUser.roles.includes('system_management') || currentUser.permissions.includes('customers.delete.all');
  
  // Checks if user can update the given customer
  const canUpdate = (customer: Customer) => {
    if (currentUser.roles.includes('system_management')) return true;
    if (currentUser.permissions.includes('customers.update.own')) {
      return customer.ownerUserId === currentUser.id;
    }
    return false;
  };

  // Fetch Customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort,
        order,
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('customerType', typeFilter);

      const res = await fetch(`/api/customers?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
        setTotal(json.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Users (for owner assignments)
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (error) {
      console.error('Error fetching dropdown users:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter, typeFilter, sort, order]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setSort('createdAt');
    setOrder('desc');
    setPage(1);
  };

  const handleSort = (nextSort: string) => {
    if (sort === nextSort) {
      setOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(nextSort);
      setOrder('asc');
    }
    setPage(1);
  };

  const handleCreateCustomer = async (newCustomer: any) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      const json = await res.json();
      if (json.success) {
        fetchCustomers();
        return true;
      } else {
        alert(json.error || 'Failed to create customer');
        return false;
      }
    } catch (err) {
      console.error(err);
      alert('Error creating customer');
      return false;
    }
  };

  const handleUpdateCustomer = async (id: string, editCustomer: any) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCustomer),
      });
      const json = await res.json();
      if (json.success) {
        setActiveCustomer(json.data);
        fetchCustomers();
        return json.data;
      } else {
        alert(json.error || 'Failed to update customer');
        return null;
      }
    } catch (err) {
      console.error(err);
      alert('Error updating customer');
      return null;
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        if (activeCustomer?.id === id) {
          setActiveCustomer(null);
        }
        fetchCustomers();
      } else {
        alert(json.error || 'Failed to delete customer');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Quản lý Khách hàng</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lưu trữ danh sách khách hàng dịch vụ, khách hàng thương mại và người liên hệ trực thuộc.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold shadow-md shadow-primary/15 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm khách hàng</span>
          </button>
        )}
      </div>

      <ListToolbar
        search={search}
        searchPlaceholder="Tìm theo tên, mã, số ĐT..."
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
        onReset={handleResetFilters}
        filters={[
          {
            value: typeFilter,
            placeholder: '-- Loại khách --',
            onChange: (value) => { setTypeFilter(value); setPage(1); },
            options: [
              { value: 'service', label: 'Dịch vụ' },
              { value: 'commerce', label: 'Thương mại' },
              { value: 'both', label: 'Cả hai' },
            ],
          },
          {
            value: statusFilter,
            placeholder: '-- Trạng thái --',
            onChange: (value) => { setStatusFilter(value); setPage(1); },
            options: [
              { value: 'new', label: 'Mới' },
              { value: 'nurturing', label: 'Đang chăm sóc' },
              { value: 'active_project', label: 'Đang có dự án' },
              { value: 'paused', label: 'Tạm dừng' },
              { value: 'stopped', label: 'Ngừng hợp tác' },
            ],
          },
        ]}
      />

      <CustomersTable
        customers={customers}
        loading={loading}
        page={page}
        limit={limit}
        total={total}
        sort={sort}
        order={order}
        canDelete={canDelete}
        onSort={handleSort}
        onPageChange={setPage}
        onSelectCustomer={(c) => setActiveCustomer(c)}
        onEditCustomer={(c) => { setActiveCustomer(c); }}
        onDeleteCustomer={handleDeleteCustomer}
      />

      <CustomerCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        users={users}
        onCreate={handleCreateCustomer}
      />

      <CustomerDetailDrawer
        activeCustomer={activeCustomer}
        onClose={() => setActiveCustomer(null)}
        users={users}
        canUpdate={activeCustomer ? canUpdate(activeCustomer) : false}
        canCreateContact={canCreate}
        onUpdateCustomer={handleUpdateCustomer}
      />
    </div>
  );
}
