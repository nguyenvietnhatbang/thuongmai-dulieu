'use client';

import { useState, useEffect } from 'react';
import { Quote } from '@/features/quotes/services/quote.service';
import { Customer } from '@/features/customers/services/customer.service';
import { ListToolbar } from '@/components/ui/ListControls';
import { QuotesTable } from './components/QuotesTable';
import { QuoteCreateModal } from './components/QuoteCreateModal';
import { QuoteDetailDrawer, getStatusBadge, getStatusText } from './components/QuoteDetailDrawer';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export function QuotesClient({ currentUser }: { currentUser: UserSession }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 20;

  // Modals / Drawer
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Permissions
  const canCreate = currentUser.roles.includes('system_management') || currentUser.permissions.includes('quotes.create.all');
  const canApprove = currentUser.roles.includes('system_management') || currentUser.permissions.includes('quotes.approve.team');
  const canConvert = currentUser.roles.includes('system_management') || currentUser.permissions.includes('contracts.create.all');
  const canDelete = canCreate;

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

  const loadQuoteDetails = async (quoteId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`);
      const json = await res.json();
      if (json.success) {
        const q = json.data as Quote;
        setActiveQuote(q);
      }
    } catch (err) {
      console.error('Failed to load quote detail:', err);
    } finally {
      setDetailLoading(false);
    }
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
        fetchQuotes();
        return true;
      } else {
        alert(json.error || 'Failed to create quote');
        return false;
      }
    } catch (err) {
      console.error(err);
      alert('Error creating quote');
      return false;
    }
  };

  const handleSaveEditItems = async (termsNote: string, items: any[]) => {
    if (!activeQuote) return false;
    try {
      const res = await fetch(`/api/quotes/${activeQuote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termsNote,
          items
        })
      });
      const json = await res.json();
      if (json.success) {
        loadQuoteDetails(activeQuote.id);
        fetchQuotes();
        return true;
      } else {
        alert(json.error || 'Failed to update quote items');
        return false;
      }
    } catch (err) {
      console.error(err);
      alert('Error saving quote changes');
      return false;
    }
  };

  const handleUpdateStatus = async (quoteId: string, status: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        loadQuoteDetails(quoteId);
        fetchQuotes();
      } else {
        alert(json.error || 'Failed to change quote status');
      }
    } catch (err) {
      console.error(err);
      alert('Error changing status');
    }
  };

  const handleConvertToContract = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/convert`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        loadQuoteDetails(quoteId);
        fetchQuotes();
      } else {
        alert(json.error || 'Failed to convert quote to contract');
      }
    } catch (err) {
      console.error(err);
      alert('Error converting quote');
    }
  };

  const handleDeleteQuote = async (quote: Quote) => {
    if (!confirm(`Xóa báo giá "${quote.quoteNumber}"? Chỉ báo giá nháp/yêu cầu sửa/bị từ chối mới được xóa.`)) return;
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setActiveQuote(null);
        fetchQuotes();
      } else {
        alert(json.error || json.details || 'Không xóa được báo giá');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa báo giá');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Báo giá dịch vụ</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lập báo giá hạng mục, tính thuế VAT, quản lý lịch sử điều chỉnh phiên bản và xuất hợp đồng.
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
            <span>Tạo báo giá</span>
          </button>
        )}
      </div>

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
        onOpenQuote={loadQuoteDetails}
      />

      <QuoteCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        customers={customers}
        opportunities={opportunities}
        formatCurrency={formatCurrency}
        onCreate={handleCreateQuote}
      />

      <QuoteDetailDrawer
        activeQuote={activeQuote}
        onClose={() => setActiveQuote(null)}
        detailLoading={detailLoading}
        canDelete={canDelete}
        canApprove={canApprove}
        canConvert={canConvert}
        formatCurrency={formatCurrency}
        onSaveEdit={handleSaveEditItems}
        onUpdateStatus={handleUpdateStatus}
        onConvertToContract={handleConvertToContract}
        onDeleteQuote={handleDeleteQuote}
      />
    </div>
  );
}
