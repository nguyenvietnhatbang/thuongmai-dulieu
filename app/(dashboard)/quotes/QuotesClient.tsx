'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Quote } from '@/features/quotes/services/quote.service';
import { Customer } from '@/features/customers/services/customer.service';
import { ListToolbar } from '@/components/ui/ListControls';
import { QuotesTable } from './components/QuotesTable';
import { QuoteCreateModal } from './components/QuoteCreateModal';
import { getStatusBadge, getStatusText } from './components/QuoteDetailDrawer';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export function QuotesClient({
  currentUser,
  initialOpportunityId
}: {
  currentUser: UserSession;
  initialOpportunityId?: string;
}) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canCreate = currentUser.roles.includes('system_management') || currentUser.permissions.includes('quotes.create.all');

  const fetchQuotes = async () => {
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

      const res = await fetch(`/api/quotes?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setQuotes(json.data);
        setTotal(json.pagination?.total || json.data.length);
      }
    } catch (err) {
      console.error('Failed to load quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const custRes = await fetch('/api/customers?limit=100');
      const custJson = await custRes.json();
      if (custJson.success) setCustomers(custJson.data);

      const oppRes = await fetch('/api/opportunities?limit=100');
      const oppJson = await oppRes.json();
      if (oppJson.success) setOpportunities(oppJson.data);
    } catch (err) {
      console.error('Failed to load dropdown data:', err);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [search, statusFilter, page, sort, order]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (initialOpportunityId) {
      setIsCreateOpen(true);
    }
  }, [initialOpportunityId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
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

  const handleCreateQuote = async (quoteData: any) => {
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });
      const json = await res.json();
      if (json.success) {
        if (!json.data?.id) {
          alert('Báo giá đã được gửi nhưng hệ thống không trả về mã hồ sơ. Vui lòng tải lại danh sách để kiểm tra.');
          await fetchQuotes();
          return false;
        }

        router.push(`/quotes/${json.data.id}`);
        return true;
      }
      alert(json.error || 'Failed to create quote');
      return false;
    } catch (err) {
      console.error(err);
      alert('Error creating quote');
      return false;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="flex h-full w-full items-stretch overflow-hidden gap-6">
      <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-6">
        <ListToolbar
          search={search}
          searchPlaceholder="Tìm theo số báo giá, mã, khách..."
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          onSearchSubmit={handleSearchSubmit}
          showSearchButton={false}
          onReset={handleResetFilters}
          filters={[
            {
              value: statusFilter,
              placeholder: '-- Tất cả trạng thái --',
              onChange: (value) => { setStatusFilter(value); setPage(1); },
              options: [
                { value: 'draft', label: 'Bản nháp' },
                { value: 'sent', label: 'Đã gửi khách' },
                { value: 'revision_requested', label: 'Yêu cầu chỉnh sửa' },
                { value: 'approved', label: 'Đã phê duyệt' },
                { value: 'rejected', label: 'Bị từ chối' },
                { value: 'converted', label: 'Đã chuyển hợp đồng' },
              ],
            },
          ]}
          rightSlot={
            canCreate && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold shadow-md shadow-primary/15 transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Tạo báo giá</span>
              </button>
            )
          }
        />

        <QuotesTable
          quotes={quotes}
          loading={loading}
          page={page}
          limit={limit}
          total={total}
          sort={sort}
          order={order}
          formatCurrency={formatCurrency}
          getStatusBadge={getStatusBadge}
          getStatusText={getStatusText}
          onSort={handleSort}
          onPageChange={setPage}
          onOpenQuote={(quoteId) => router.push(`/quotes/${quoteId}`)}
        />

        <QuoteCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          customers={customers}
          opportunities={opportunities}
          prefilledOpportunityId={initialOpportunityId}
          formatCurrency={formatCurrency}
          onCreate={handleCreateQuote}
        />
      </div>
    </div>
  );
}
