'use client';

import { useState, useEffect } from 'react';
import { Quote, QuoteItem } from '@/features/quotes/services/quote.service';
import { Customer } from '@/features/customers/services/customer.service';
import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';

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
  const [activeQuoteItems, setActiveQuoteItems] = useState<QuoteItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [newQuote, setNewQuote] = useState({
    code: '',
    quoteNumber: '',
    customerId: '',
    opportunityId: '',
    quoteDate: new Date().toISOString().substring(0, 10),
    termsNote: '',
    items: [] as any[]
  });

  const [editTermsNote, setEditTermsNote] = useState('');
  const [editItems, setEditItems] = useState<any[]>([]);

  // Permissions
  const canCreate = currentUser.roles.includes('system_management') || currentUser.permissions.includes('quotes.create.all');
  const canApprove = currentUser.roles.includes('system_management') || currentUser.permissions.includes('quotes.approve.team');
  const canConvert = currentUser.roles.includes('system_management') || currentUser.permissions.includes('contracts.create.all');

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
  }, [statusFilter, page, sort, order]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuotes();
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
        setActiveQuoteItems(q.items || []);
        setEditTermsNote(q.termsNote || '');
        setEditItems(q.items || []);
      }
    } catch (err) {
      console.error('Failed to load quote detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuote.items.length === 0) {
      alert('Vui lòng thêm ít nhất một hạng mục báo giá!');
      return;
    }
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuote)
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateOpen(false);
        setNewQuote({
          code: '',
          quoteNumber: '',
          customerId: '',
          opportunityId: '',
          quoteDate: new Date().toISOString().substring(0, 10),
          termsNote: '',
          items: []
        });
        fetchQuotes();
      } else {
        alert(json.error || 'Failed to create quote');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating quote');
    }
  };

  const handleSaveEditItems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuote) return;
    if (editItems.length === 0) {
      alert('Báo giá phải có ít nhất một hạng mục!');
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${activeQuote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termsNote: editTermsNote,
          items: editItems
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsEditing(false);
        loadQuoteDetails(activeQuote.id);
        fetchQuotes();
      } else {
        alert(json.error || 'Failed to update quote items');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving quote changes');
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

  // UI calculations
  const calculateTotal = (itemsList: any[]) => {
    const subtotal = itemsList.reduce((acc, curr) => acc + (Number(curr.quantity || 0) * Number(curr.unitPrice || 0)), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const newQuoteCalculations = calculateTotal(newQuote.items);
  const editQuoteCalculations = calculateTotal(editItems);

  // Form helper methods
  const addLineItem = (isEdit: boolean) => {
    const newItem = { itemName: '', description: '', unitCode: 'item', quantity: 1, unitPrice: 0 };
    if (isEdit) {
      setEditItems([...editItems, newItem]);
    } else {
      setNewQuote({ ...newQuote, items: [...newQuote.items, newItem] });
    }
  };

  const removeLineItem = (idx: number, isEdit: boolean) => {
    if (isEdit) {
      setEditItems(editItems.filter((_, i) => i !== idx));
    } else {
      setNewQuote({ ...newQuote, items: newQuote.items.filter((_, i) => i !== idx) });
    }
  };

  const updateLineFieldValue = (idx: number, field: string, value: any, isEdit: boolean) => {
    const targetList = isEdit ? [...editItems] : [...newQuote.items];
    targetList[idx] = { ...targetList[idx], [field]: value };
    if (isEdit) {
      setEditItems(targetList);
    } else {
      setNewQuote({ ...newQuote, items: targetList });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'revision_requested': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'converted': return 'bg-violet-50 text-violet-700 border-violet-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Bản nháp';
      case 'sent': return 'Đã gửi khách';
      case 'revision_requested': return 'Yêu cầu sửa';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Bị từ chối';
      case 'converted': return 'Đã ký HĐ';
      default: return status;
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
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
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

      {/* Quotes Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-border">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-xs">Đang tải danh sách báo giá...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-sm font-semibold">Chưa có báo giá nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Số báo giá" sortKey="quoteNumber" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Khách hàng" sortKey="customerName" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Ngày báo" sortKey="quoteDate" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Tổng tiền (gồm VAT)" sortKey="totalAmount" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Phiên bản</th>
                  <th className="px-6 py-4">Người lập</th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={handleSort} /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => loadQuoteDetails(q.id)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{q.quoteNumber}</td>
                    <td className="px-6 py-4 font-bold text-foreground">{q.customerName}</td>
                    <td className="px-6 py-4 text-xs">{new Date(q.quoteDate).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4 font-bold text-foreground">{formatCurrency(q.totalAmount)}</td>
                    <td className="px-6 py-4 text-xs font-mono text-center">v{q.revisionNumber}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{q.quotedByName || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(q.status)}`}>
                        {getStatusText(q.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      {/* Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-3xl rounded-2xl border border-border p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-foreground">Lập báo giá dịch vụ mới</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-foreground cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Mã nội bộ *</label>
                  <input
                    type="text"
                    required
                    placeholder="Q-001, BGDV-01..."
                    value={newQuote.code}
                    onChange={(e) => setNewQuote({ ...newQuote, code: e.target.value })}
                    className="premium-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Số báo giá *</label>
                  <input
                    type="text"
                    required
                    placeholder="QUO-2026-0001..."
                    value={newQuote.quoteNumber}
                    onChange={(e) => setNewQuote({ ...newQuote, quoteNumber: e.target.value })}
                    className="premium-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Ngày lập *</label>
                  <input
                    type="date"
                    required
                    value={newQuote.quoteDate}
                    onChange={(e) => setNewQuote({ ...newQuote, quoteDate: e.target.value })}
                    className="premium-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Chọn Khách hàng *</label>
                  <select
                    required
                    value={newQuote.customerId}
                    onChange={(e) => setNewQuote({ ...newQuote, customerId: e.target.value })}
                    className="premium-input"
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Chọn Cơ hội liên quan</label>
                  <select
                    value={newQuote.opportunityId}
                    onChange={(e) => setNewQuote({ ...newQuote, opportunityId: e.target.value })}
                    className="premium-input"
                  >
                    <option value="">-- Chọn cơ hội bán hàng --</option>
                    {opportunities.map(o => (
                      <option key={o.id} value={o.id}>{o.title} ({o.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items Editor */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Hạng mục chi tiết</h3>
                  <button
                    type="button"
                    onClick={() => addLineItem(false)}
                    className="px-2.5 py-1 text-xs bg-secondary text-primary font-bold rounded hover:bg-primary/10 transition-all cursor-pointer"
                  >
                    + Thêm hạng mục
                  </button>
                </div>

                <div className="border border-border rounded-xl p-3 bg-slate-50/50 space-y-3">
                  {newQuote.items.length === 0 ? (
                    <p className="text-center py-6 text-xs text-muted-foreground">Chưa có hạng mục nào được thêm.</p>
                  ) : (
                    <div className="space-y-3">
                      {newQuote.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border-b border-border/50 pb-3 last:border-0 last:pb-0">
                          <div className="md:col-span-4">
                            <label className="block text-[9px] text-muted-foreground font-semibold mb-1">Tên hạng mục *</label>
                            <input
                              type="text"
                              required
                              placeholder="Thiết kế UI, Lập trình..."
                              value={item.itemName}
                              onChange={(e) => updateLineFieldValue(idx, 'itemName', e.target.value, false)}
                              className="premium-input py-1 text-xs"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-[9px] text-muted-foreground font-semibold mb-1">Mô tả chi tiết</label>
                            <input
                              type="text"
                              placeholder="Mô tả công việc"
                              value={item.description}
                              onChange={(e) => updateLineFieldValue(idx, 'description', e.target.value, false)}
                              className="premium-input py-1 text-xs"
                            />
                          </div>
                          <div className="md:col-span-1.5">
                            <label className="block text-[9px] text-muted-foreground font-semibold mb-1">ĐVT</label>
                            <select
                              value={item.unitCode}
                              onChange={(e) => updateLineFieldValue(idx, 'unitCode', e.target.value, false)}
                              className="premium-input py-1 text-xs"
                            >
                              <option value="item">Cái</option>
                              <option value="hour">Giờ</option>
                              <option value="day">Ngày</option>
                              <option value="package">Gói</option>
                            </select>
                          </div>
                          <div className="md:col-span-1.5">
                            <label className="block text-[9px] text-muted-foreground font-semibold mb-1">Số lượng *</label>
                            <input
                              type="number"
                              required
                              min="0.001"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => updateLineFieldValue(idx, 'quantity', Number(e.target.value), false)}
                              className="premium-input py-1 text-xs font-mono"
                            />
                          </div>
                          <div className="md:col-span-2 flex items-center gap-2">
                            <div className="flex-1">
                              <label className="block text-[9px] text-muted-foreground font-semibold mb-1">Đơn giá *</label>
                              <input
                                type="number"
                                required
                                value={item.unitPrice}
                                onChange={(e) => updateLineFieldValue(idx, 'unitPrice', Number(e.target.value), false)}
                                className="premium-input py-1 text-xs font-mono"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLineItem(idx, false)}
                              className="text-rose-600 hover:bg-rose-50 p-1.5 rounded mt-5 cursor-pointer"
                              title="Xóa dòng"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Terms Note */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Điều khoản & Ghi chú thanh toán</label>
                <textarea
                  placeholder="Thanh toán 50% sau khi ký hợp đồng, 50% sau khi nghiệm thu bàn giao..."
                  value={newQuote.termsNote}
                  onChange={(e) => setNewQuote({ ...newQuote, termsNote: e.target.value })}
                  className="premium-input h-16 text-xs"
                />
              </div>

              {/* Price Calculations Panel */}
              <div className="border border-border rounded-xl p-4 bg-slate-50 flex justify-between items-center text-xs">
                <span className="font-semibold text-muted-foreground">Tính toán chi phí</span>
                <div className="flex gap-6 font-semibold">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Chưa thuế:</span>
                    <span className="text-foreground text-sm font-mono">{formatCurrency(newQuoteCalculations.subtotal)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Thuế VAT (10%):</span>
                    <span className="text-foreground text-sm font-mono">{formatCurrency(newQuoteCalculations.tax)}</span>
                  </div>
                  <div>
                    <span className="text-primary block text-[10px] uppercase">Tổng cộng:</span>
                    <span className="text-primary text-base font-mono font-extrabold">{formatCurrency(newQuoteCalculations.total)}</span>
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
                >
                  Lưu báo giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quote Details Drawer */}
      {activeQuote && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-fade-in">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {activeQuote.quoteNumber} (v{activeQuote.revisionNumber})
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(activeQuote.status)}`}>
                  {getStatusText(activeQuote.status)}
                </span>
              </div>
              <h2 className="text-base font-bold text-foreground mt-2">Báo giá: {activeQuote.customerName}</h2>
            </div>
            
            <button
              onClick={() => setActiveQuote(null)}
              className="p-1 rounded-lg text-slate-400 hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {detailLoading ? (
              <p className="text-center py-12 text-xs text-muted-foreground">Đang tải hạng mục...</p>
            ) : isEditing ? (
              /* Line item editor */
              <form onSubmit={handleSaveEditItems} className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase">Hạng mục chi tiết</h3>
                    <button
                      type="button"
                      onClick={() => addLineItem(true)}
                      className="px-2 py-1 bg-secondary text-primary font-bold text-xs rounded hover:bg-primary/5 cursor-pointer"
                    >
                      + Thêm hạng mục
                    </button>
                  </div>

                  <div className="border border-border rounded-xl p-3 bg-slate-50 space-y-3">
                    {editItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-end border-b border-border/50 pb-3 last:border-0 last:pb-0">
                        <div className="col-span-5">
                          <label className="block text-[8px] font-bold text-slate-600 uppercase mb-0.5">Tên hạng mục *</label>
                          <input
                            type="text"
                            required
                            value={item.itemName}
                            onChange={(e) => updateLineFieldValue(idx, 'itemName', e.target.value, true)}
                            className="premium-input py-1 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[8px] font-bold text-slate-600 uppercase mb-0.5">ĐVT</label>
                          <select
                            value={item.unitCode}
                            onChange={(e) => updateLineFieldValue(idx, 'unitCode', e.target.value, true)}
                            className="premium-input py-1 text-xs"
                          >
                            <option value="item">Cái</option>
                            <option value="hour">Giờ</option>
                            <option value="day">Ngày</option>
                            <option value="package">Gói</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[8px] font-bold text-slate-600 uppercase mb-0.5">SL *</label>
                          <input
                            type="number"
                            required
                            min="0.001"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => updateLineFieldValue(idx, 'quantity', Number(e.target.value), true)}
                            className="premium-input py-1 text-xs font-mono"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <div className="flex-1">
                            <label className="block text-[8px] font-bold text-slate-600 uppercase mb-0.5">Đơn giá *</label>
                            <input
                              type="number"
                              required
                              value={item.unitPrice}
                              onChange={(e) => updateLineFieldValue(idx, 'unitPrice', Number(e.target.value), true)}
                              className="premium-input py-1 text-xs font-mono"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLineItem(idx, true)}
                            className="text-rose-600 hover:bg-rose-50 p-1.5 rounded cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú & Điều khoản thanh toán</label>
                  <textarea
                    value={editTermsNote}
                    onChange={(e) => setEditTermsNote(e.target.value)}
                    className="premium-input h-16 text-xs"
                  />
                </div>

                {/* Real-time Calculation Panel for edit items */}
                <div className="border border-border rounded-xl p-3 bg-slate-50 flex justify-between items-center text-xs">
                  <span className="font-semibold text-muted-foreground">Ước tính thay đổi (v{activeQuote.revisionNumber + 1})</span>
                  <div className="flex gap-4 font-semibold">
                    <span>VAT: {formatCurrency(editQuoteCalculations.tax)}</span>
                    <span className="text-primary">Tổng: {formatCurrency(editQuoteCalculations.total)}</span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 border border-border text-xs font-semibold rounded bg-card hover:bg-muted cursor-pointer"
                  >
                    Hủy chỉnh sửa
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/95 shadow cursor-pointer"
                  >
                    Lưu phiên bản mới
                  </button>
                </div>
              </form>
            ) : (
              /* Detail View Mode */
              <div className="space-y-6">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-y-3 text-xs border border-border p-4 rounded-xl bg-slate-50/50">
                  <div>
                    <span className="block text-[9px] text-muted-foreground font-bold uppercase">Ngày Lập</span>
                    <span className="font-semibold text-foreground mt-0.5">
                      {new Date(activeQuote.quoteDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-muted-foreground font-bold uppercase">Người lập báo giá</span>
                    <span className="font-semibold text-foreground mt-0.5">{activeQuote.quotedByName || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-muted-foreground font-bold uppercase">Cơ hội bán hàng</span>
                    <span className="font-semibold text-foreground mt-0.5">{activeQuote.opportunityTitle || 'Khách liên hệ trực tiếp'}</span>
                  </div>
                  {activeQuote.approvedBy && (
                    <div>
                      <span className="block text-[9px] text-muted-foreground font-bold uppercase">Người duyệt</span>
                      <span className="font-semibold text-foreground mt-0.5">
                        {activeQuote.approvedByName} ({new Date(activeQuote.approvedAt!).toLocaleDateString('vi-VN')})
                      </span>
                    </div>
                  )}
                </div>

                {/* Line Items Table */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-2">Bảng kê chi tiết hạng mục</h3>
                  <div className="border border-border rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-border font-bold text-slate-600">
                          <th className="px-4 py-3">Hạng mục</th>
                          <th className="px-4 py-3">ĐVT</th>
                          <th className="px-4 py-3 text-right">Số lượng</th>
                          <th className="px-4 py-3 text-right">Đơn giá</th>
                          <th className="px-4 py-3 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {activeQuoteItems.map((item, index) => (
                          <tr key={item.id || index} className="hover:bg-slate-50/20">
                            <td className="px-4 py-3">
                              <p className="font-bold text-foreground">{item.itemName}</p>
                              {item.description && <p className="text-[10px] text-muted-foreground">{item.description}</p>}
                            </td>
                            <td className="px-4 py-3 capitalize">{item.unitCode === 'hour' ? 'Giờ' : item.unitCode === 'day' ? 'Ngày' : item.unitCode === 'package' ? 'Gói' : 'Cái'}</td>
                            <td className="px-4 py-3 text-right font-mono font-medium">{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-foreground">{formatCurrency(item.lineTotal)}</td>
                          </tr>
                        ))}
                        {/* Totals row */}
                        <tr className="bg-slate-50/50 font-bold border-t border-border">
                          <td colSpan={3} className="px-4 py-3">Cộng chưa thuế</td>
                          <td colSpan={2} className="px-4 py-3 text-right font-mono">{formatCurrency(activeQuote.subtotalAmount)}</td>
                        </tr>
                        <tr className="bg-slate-50/50 font-bold">
                          <td colSpan={3} className="px-4 py-3">Thuế VAT (10%)</td>
                          <td colSpan={2} className="px-4 py-3 text-right font-mono">{formatCurrency(activeQuote.taxAmount)}</td>
                        </tr>
                        <tr className="bg-primary/5 font-extrabold text-primary border-t border-primary/20">
                          <td colSpan={3} className="px-4 py-3">TỔNG TIỀN THANH TOÁN</td>
                          <td colSpan={2} className="px-4 py-3 text-right font-mono text-sm">{formatCurrency(activeQuote.totalAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Terms Note */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-1">Điều kiện thanh toán</h3>
                  <p className="border border-border p-3 rounded-lg bg-slate-50/50 whitespace-pre-line text-xs">
                    {activeQuote.termsNote || 'Thanh toán theo tiến độ nghiệm thu hoặc thỏa thuận hợp đồng.'}
                  </p>
                </div>

                {/* Action buttons (Approvals and edits) */}
                <div className="flex gap-2">
                  {/* Approval block */}
                  {activeQuote.status === 'draft' || activeQuote.status === 'sent' ? (
                    <>
                      {canApprove && (
                        <button
                          onClick={() => handleUpdateStatus(activeQuote.id, 'approved')}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-200 transition-all cursor-pointer"
                        >
                          Phê duyệt báo giá
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateStatus(activeQuote.id, 'sent')}
                        className="py-2 px-3 bg-secondary text-primary border border-primary/20 hover:bg-primary/5 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Gửi khách hàng
                      </button>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="py-2 px-3 border border-border text-slate-700 hover:bg-muted text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Sửa hạng mục
                      </button>
                    </>
                  ) : null}

                  {/* Convert Approved Quote to Contract */}
                  {activeQuote.status === 'approved' && (
                    <>
                      {canConvert && (
                        <button
                          onClick={() => handleConvertToContract(activeQuote.id)}
                          className="w-full py-2 bg-gradient-to-r from-primary to-violet-600 hover:opacity-95 text-white text-xs font-semibold rounded-lg shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>Ký hợp đồng dịch vụ</span>
                          <span>&rarr;</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer close */}
          <div className="p-6 border-t border-border bg-slate-50/50 flex">
            <button
              onClick={() => setActiveQuote(null)}
              className="flex-1 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
            >
              Đóng bảng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
