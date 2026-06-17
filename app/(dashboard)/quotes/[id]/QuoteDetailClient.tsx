'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Quote } from '@/features/quotes/services/quote.service';
import { QuoteDetailDrawer } from '../components/QuoteDetailDrawer';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export function QuoteDetailClient({
  quoteId,
  currentUser,
}: {
  quoteId: string;
  currentUser: UserSession;
}) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [error, setError] = useState('');

  const canApprove = currentUser.roles.includes('system_management') || currentUser.permissions.includes('quotes.approve.team');
  const canConvert = currentUser.roles.includes('system_management') || currentUser.permissions.includes('contracts.create.all');
  const canDelete = currentUser.roles.includes('system_management') || currentUser.permissions.includes('quotes.create.all');

  const loadQuoteDetails = async () => {
    setDetailLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/quotes/${quoteId}`);
      const json = await res.json();
      if (json.success) {
        setQuote(json.data);
      } else {
        setError(json.error || 'Không tải được hồ sơ báo giá.');
      }
    } catch (err) {
      console.error('Failed to load quote detail:', err);
      setError('Không tải được hồ sơ báo giá.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadQuoteDetails();
  }, [quoteId]);

  const handleSaveEditItems = async (termsNote: string, items: any[]) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termsNote,
          items
        })
      });
      const json = await res.json();
      if (json.success) {
        await loadQuoteDetails();
        return true;
      }
      alert(json.error || 'Failed to update quote items');
      return false;
    } catch (err) {
      console.error(err);
      alert('Error saving quote changes');
      return false;
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        await loadQuoteDetails();
      } else {
        alert(json.error || 'Failed to change quote status');
      }
    } catch (err) {
      console.error(err);
      alert('Error changing status');
    }
  };

  const handleConvertToContract = async (id: string) => {
    try {
      const res = await fetch(`/api/quotes/${id}/convert`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        await loadQuoteDetails();
      } else {
        alert(json.error || 'Failed to convert quote to contract');
      }
    } catch (err) {
      console.error(err);
      alert('Error converting quote');
    }
  };

  const handleDeleteQuote = async (targetQuote: Quote) => {
    if (!confirm(`Xóa báo giá "${targetQuote.quoteNumber}"? Chỉ báo giá nháp/yêu cầu sửa/bị từ chối mới được xóa.`)) return;
    try {
      const res = await fetch(`/api/quotes/${targetQuote.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        router.push('/quotes');
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

  if (!detailLoading && (error || !quote)) {
    return (
      <div className="h-full rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-4 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-bold text-foreground">Không mở được hồ sơ báo giá</h1>
          <p className="text-sm text-muted-foreground">{error || 'Báo giá không tồn tại hoặc bạn không có quyền truy cập.'}</p>
        </div>
        <button
          onClick={() => router.push('/quotes')}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/95 cursor-pointer"
        >
          Quay lại danh sách báo giá
        </button>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="h-full rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-xs text-muted-foreground">Đang tải hồ sơ báo giá...</p>
      </div>
    );
  }

  return (
    <QuoteDetailDrawer
      mode="page"
      activeQuote={quote}
      onClose={() => router.push('/quotes')}
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
  );
}
