'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Customer } from '@/features/customers/services/customer.service';
import { CustomerDetailDrawer } from '../components/CustomerDetailDrawer';

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

export function CustomerDetailClient({
  customerId,
  currentUser,
}: {
  customerId: string;
  currentUser: UserSession;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [users, setUsers] = useState<UserDropdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canCreateContact = currentUser.roles.includes('system_management') || currentUser.permissions.includes('customers.create.all');
  const canUpdate = (target: Customer) => {
    if (currentUser.roles.includes('system_management')) return true;
    if (currentUser.permissions.includes('customers.update.own')) return target.ownerUserId === currentUser.id;
    return false;
  };

  const fetchCustomer = async () => {
    setError('');
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      const json = await res.json();
      if (json.success) {
        setCustomer(json.data);
      } else {
        setError(json.error || 'Không tải được hồ sơ khách hàng.');
      }
    } catch (err) {
      console.error('Customer detail fetch error:', err);
      setError('Không tải được hồ sơ khách hàng.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch (err) {
      console.error('Users fetch error:', err);
    }
  };

  useEffect(() => {
    fetchCustomer();
    fetchUsers();
  }, [customerId]);

  const handleUpdateCustomer = async (id: string, editCustomer: any) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCustomer),
      });
      const json = await res.json();
      if (json.success) {
        setCustomer(json.data);
        return json.data;
      }
      alert(json.error || 'Failed to update customer');
      return null;
    } catch (err) {
      console.error(err);
      alert('Error updating customer');
      return null;
    }
  };

  if (loading) {
    return (
      <div className="h-full rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-xs text-muted-foreground">Đang tải hồ sơ khách hàng...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="h-full rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-4 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-bold text-foreground">Không mở được hồ sơ khách hàng</h1>
          <p className="text-sm text-muted-foreground">{error || 'Khách hàng không tồn tại hoặc bạn không có quyền truy cập.'}</p>
        </div>
        <button
          onClick={() => router.push('/customers')}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/95 cursor-pointer"
        >
          Quay lại danh sách khách hàng
        </button>
      </div>
    );
  }

  return (
    <CustomerDetailDrawer
      mode="page"
      activeCustomer={customer}
      onClose={() => router.push('/customers')}
      users={users}
      canUpdate={canUpdate(customer)}
      canCreateContact={canCreateContact}
      onUpdateCustomer={handleUpdateCustomer}
    />
  );
}
