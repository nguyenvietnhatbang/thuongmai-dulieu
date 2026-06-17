'use client';

import { useState, useEffect } from 'react';
import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export function ReceivablesClient({ currentUser }: { currentUser: UserSession }) {
  const [receivables, setReceivables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('dueDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 20;

  // Collect modal
  const [activeCollect, setActiveCollect] = useState<any | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectNotes, setCollectNotes] = useState('');

  // Export History modal
  const [showExportHistory, setShowExportHistory] = useState(false);
  const [exportLogs, setExportLogs] = useState<any[]>([]);
  const [exportLogsLoading, setExportLogsLoading] = useState(false);

  // Permissions
  const canCollect = currentUser.roles.includes('system_management') || currentUser.permissions.includes('receivables.update_status.all');
  const canExport = currentUser.roles.includes('system_management') || currentUser.permissions.includes('reports.export.team');

  const fetchReceivables = async () => {
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

      const res = await fetch(`/api/receivables?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setReceivables(json.data);
        setTotal(json.pagination?.total || json.data.length);
      }
    } catch (error) {
      console.error('Error fetching receivables:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExportLogs = async () => {
    setExportLogsLoading(true);
    try {
      const res = await fetch('/api/receivables/exports');
      const json = await res.json();
      if (json.success) {
        setExportLogs(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch export logs:', err);
    } finally {
      setExportLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, [search, statusFilter, page, sort, order]);

  useEffect(() => {
    if (showExportHistory) {
      fetchExportLogs();
    }
  }, [showExportHistory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSort('dueDate');
    setOrder('asc');
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

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollect) return;

    try {
      const res = await fetch('/api/receivables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeCollect.id,
          amountPaid: Number(collectAmount),
          notes: collectNotes
        })
      });

      const json = await res.json();
      if (json.success) {
        alert('Ghi nhận thanh toán công nợ thành công!');
        setActiveCollect(null);
        setCollectAmount(0);
        setCollectNotes('');
        fetchReceivables();
      } else {
        alert(json.error || 'Thao tác thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Ghi nhận thất bại do lỗi hệ thống');
    }
  };

  const handleTriggerReminders = async () => {
    try {
      const res = await fetch('/api/receivables/trigger-reminders', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchReceivables();
      } else {
        alert(json.error || 'Failed to trigger reminders');
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering reminders');
    }
  };

  const handleRemindCollector = async (id: string) => {
    try {
      const res = await fetch('/api/receivables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'remind' })
      });
      const json = await res.json();
      if (json.success) {
        alert('Gửi nhắc nhở công nợ thành công!');
        fetchReceivables();
      } else {
        alert(json.error || 'Failed to send reminder');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending reminder');
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusFilter) params.append('status', statusFilter);

    // Trigger file download
    window.open(`/api/receivables/export?${params.toString()}`);
    // Wait a brief second to reload list, which will log the newly generated export
    setTimeout(() => {
      fetchReceivables();
    }, 1500);
  };

  // Helper formats
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'partially_paid': return 'bg-blue-50 text-blue-700 border-blue-150';
      case 'pending':
      case 'not_due': return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'due_soon': return 'bg-indigo-50 text-indigo-700 border-indigo-150';
      case 'due_today': return 'bg-amber-50 text-amber-700 border-amber-150';
      case 'overdue': return 'bg-rose-50 text-rose-700 border-rose-150';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Đã thu đủ';
      case 'partially_paid': return 'Thu một phần';
      case 'pending':
      case 'not_due': return 'Chưa đến hạn';
      case 'due_soon': return 'Sắp đến hạn';
      case 'due_today': return 'Hạn hôm nay';
      case 'overdue': return 'Quá hạn';
      default: return status;
    }
  };

  // Aggregations
  const totalAmountDue = receivables.reduce((acc, curr) => acc + Number(curr.amountDue), 0);
  const totalAmountPaid = receivables.reduce((acc, curr) => acc + Number(curr.amountPaid), 0);
  const totalRemaining = totalAmountDue - totalAmountPaid;
  const overdueCount = receivables.filter(r => r.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Quản lý Công nợ Phải thu</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Theo dõi kỳ hạn công nợ từ tiến độ thanh toán hợp đồng dịch vụ hoặc đơn bán hàng thương mại.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportHistory(true)}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold border border-slate-300 transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Lịch sử xuất file</span>
          </button>

          {canCollect && (
            <button
              onClick={handleTriggerReminders}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold border border-slate-700 transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3" />
              </svg>
              <span>Cập nhật nợ tự động</span>
            </button>
          )}

          {canExport && (
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-primary-foreground text-sm font-semibold shadow-md shadow-emerald-500/15 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Xuất Excel công nợ</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregated KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Tổng nợ phát sinh</p>
          <h3 className="text-xl font-extrabold text-foreground mt-1">{formatCurrency(totalAmountDue)}</h3>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Đã thu hồi</p>
          <h3 className="text-xl font-extrabold text-emerald-600 mt-1">{formatCurrency(totalAmountPaid)}</h3>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Còn phải thu</p>
          <h3 className="text-xl font-extrabold text-rose-600 mt-1">{formatCurrency(totalRemaining)}</h3>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Số khoản nợ quá hạn</p>
            <h3 className="text-xl font-extrabold text-rose-600 mt-1">{overdueCount} khoản</h3>
          </div>
          {overdueCount > 0 && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          )}
        </div>
      </div>

      <ListToolbar
        search={search}
        searchPlaceholder="Tìm theo mã nợ, khách hàng..."
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
              { value: 'not_due', label: 'Chưa đến hạn' },
              { value: 'due_soon', label: 'Sắp đến hạn' },
              { value: 'due_today', label: 'Đến hạn hôm nay' },
              { value: 'overdue', label: 'Quá hạn thanh toán' },
              { value: 'partially_paid', label: 'Đã thu một phần' },
              { value: 'paid', label: 'Đã hoàn tất thu nợ' },
            ],
          },
        ]}
      />

      {/* Main Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-border">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-xs">Đang tải sổ chi tiết công nợ...</p>
          </div>
        ) : receivables.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <svg className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold">Không tìm thấy khoản công nợ nào</p>
            <p className="text-xs mt-1 text-muted-foreground">Các khoản công nợ sẽ tự động phát sinh khi xác nhận xuất đơn bán hàng thương mại hoặc lập kỳ hạn thanh toán hợp đồng dịch vụ.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Mã nợ" sortKey="code" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Khách hàng" sortKey="customerName" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Nguồn gốc</th>
                  <th className="px-6 py-4"><SortableHeader label="Ngày đến hạn" sortKey="dueDate" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Tổng phải thu" sortKey="amountDue" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Đã thu</th>
                  <th className="px-6 py-4"><SortableHeader label="Còn lại" sortKey="remainingAmount" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-slate-700">Lần nhắc cuối</th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {receivables.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{r.code}</td>
                    <td className="px-6 py-4 font-bold text-foreground">{r.customerName}</td>
                    <td className="px-6 py-4">
                      {r.salesOrderCode ? (
                        <div className="text-xs">
                          <p className="font-semibold text-slate-700">Đơn hàng thương mại</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{r.salesOrderCode}</p>
                        </div>
                      ) : (
                        <div className="text-xs">
                          <p className="font-semibold text-slate-700">Hợp đồng dịch vụ</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{r.contractNumber}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">{r.dueDate}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{formatCurrency(r.amountDue)}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">{formatCurrency(r.amountPaid)}</td>
                    <td className="px-6 py-4 font-bold text-rose-600">{formatCurrency(r.remainingAmount)}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                      {r.lastRemindedAt ? new Date(r.lastRemindedAt).toLocaleString('vi-VN') : 'Chưa nhắc'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(r.status)}`}>
                        {getStatusText(r.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {r.status !== 'paid' ? (
                          <>
                            {canCollect && (
                              <button
                                onClick={() => {
                                  setActiveCollect(r);
                                  setCollectAmount(r.remainingAmount);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-secondary text-primary font-bold text-xs hover:bg-primary/10 transition-all cursor-pointer"
                              >
                                Thu tiền
                              </button>
                            )}
                            {['due_soon', 'due_today', 'overdue'].includes(r.status) && (
                              <button
                                onClick={() => handleRemindCollector(r.id)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all cursor-pointer"
                                title="Gửi thông báo nhắc nhợ đến nhân viên thu nợ"
                              >
                                Nhắc nợ
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold">Đã hoàn tất</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      {/* RECORD DEBT COLLECTION MODAL */}
      {activeCollect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-foreground">Ghi nhận Thu hồi Công nợ</h2>
              <button onClick={() => setActiveCollect(null)} className="text-slate-400 hover:text-foreground cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-border rounded-lg text-xs space-y-1">
              <p className="text-slate-500 font-bold uppercase">Khoản công nợ</p>
              <p className="font-bold text-foreground">{activeCollect.code} - {activeCollect.customerName}</p>
              <p className="text-slate-500 mt-1 font-bold uppercase">Tổng nợ hiện tại</p>
              <p className="text-sm font-extrabold text-rose-600">{formatCurrency(activeCollect.remainingAmount)}</p>
            </div>

            <form onSubmit={handleCollectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số tiền thực tế thu được *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={activeCollect.remainingAmount}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="premium-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú phiếu thu (diễn giải)</label>
                <textarea
                  placeholder="Khách hàng chuyển khoản qua tài khoản ngân hàng, tiền mặt..."
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  className="premium-input h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveCollect(null)}
                  className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer"
                >
                  Lưu phiếu thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT HISTORY LOGS MODAL */}
      {showExportHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border p-6 shadow-2xl space-y-4 animate-fade-in flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center shrink-0">
              <h2 className="text-base font-bold text-foreground">Lịch sử xuất file công nợ</h2>
              <button onClick={() => setShowExportHistory(false)} className="text-slate-400 hover:text-foreground cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {exportLogsLoading ? (
                <p className="text-xs text-muted-foreground text-center py-20 animate-pulse">Đang tải lịch sử xuất file...</p>
              ) : exportLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-20">Chưa có lượt xuất file công nợ nào.</p>
              ) : (
                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="min-w-full divide-y divide-border text-xs text-left">
                    <thead className="bg-slate-50/50 text-muted-foreground font-bold">
                      <tr>
                        <th className="p-3">Mã lượt</th>
                        <th className="p-3">Tên file</th>
                        <th className="p-3">Định dạng</th>
                        <th className="p-3">Người xuất</th>
                        <th className="p-3">Thời gian</th>
                        <th className="p-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {exportLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/30">
                          <td className="p-3 font-mono font-bold text-primary">{log.code}</td>
                          <td className="p-3 font-medium text-foreground truncate max-w-[150px]" title={log.fileName}>
                            {log.fileName || 'Chưa đặt tên'}
                          </td>
                          <td className="p-3 uppercase font-bold text-slate-600">{log.exportFormat}</td>
                          <td className="p-3 font-semibold text-slate-800">{log.createdBy || 'Hệ thống'}</td>
                          <td className="p-3 text-muted-foreground">{new Date(log.exportedAt).toLocaleString('vi-VN')}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              log.status === 'exported' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {log.status === 'exported' ? 'Đã xuất' : 'Đã hủy'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowExportHistory(false)}
                className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
