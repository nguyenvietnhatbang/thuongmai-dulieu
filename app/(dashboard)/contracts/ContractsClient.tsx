'use client';

import { useState, useEffect } from 'react';
import { Contract, PaymentMilestone } from '@/features/contracts/services/contract.service';
import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export function ContractsClient({ currentUser }: { currentUser: UserSession }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 20;

  // Details
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Milestone payment recording
  const [collectingMilestoneId, setCollectingMilestoneId] = useState<string | null>(null);
  const [paymentInput, setPaymentInput] = useState('');

  // Permissions
  const canSign = currentUser.roles.includes('system_management') || currentUser.permissions.includes('contracts.sign.all');
  const canCollect = currentUser.roles.includes('system_management') || currentUser.permissions.includes('receivables.update_status.all');

  const fetchContracts = async () => {
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

      const res = await fetch(`/api/contracts?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setContracts(json.data);
        setTotal(json.pagination?.total || json.data.length);
      }
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [statusFilter, page, sort, order]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContracts();
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

  const loadContractDetails = async (contractId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}`);
      const json = await res.json();
      if (json.success) {
        setActiveContract(json.data);
      }
    } catch (err) {
      console.error('Failed to load contract details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSignContract = async (contractId: string) => {
    if (!confirm('Xác nhận ký kết hợp đồng này? Hệ thống sẽ tự động khởi tạo dự án triển khai liên đới.')) return;
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'signed' })
      });
      const json = await res.json();
      if (json.success) {
        alert('Hợp đồng đã ký thành công! Dự án triển khai mới đã được tự động tạo.');
        loadContractDetails(contractId);
        fetchContracts();
      } else {
        alert(json.error || 'Failed to sign contract');
      }
    } catch (err) {
      console.error(err);
      alert('Error signing contract');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent, milestone: PaymentMilestone) => {
    e.preventDefault();
    const amountPaid = Number(paymentInput);
    if (isNaN(amountPaid) || amountPaid < 0 || amountPaid > milestone.amountDue) {
      alert(`Số tiền nhập không hợp lệ! Vui lòng nhập từ 0 đến ${formatCurrency(milestone.amountDue)}`);
      return;
    }

    try {
      const res = await fetch(`/api/contracts/milestones/${milestone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaid })
      });
      const json = await res.json();
      if (json.success) {
        setCollectingMilestoneId(null);
        setPaymentInput('');
        if (activeContract) loadContractDetails(activeContract.id);
        fetchContracts();
      } else {
        alert(json.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating payment milestone');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'negotiating': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'signed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'paused': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'completed': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Bản nháp';
      case 'sent': return 'Đã gửi khách';
      case 'negotiating': return 'Đang đàm phán';
      case 'signed': return 'Đã ký kết';
      case 'paused': return 'Tạm dừng';
      case 'cancelled': return 'Đã hủy';
      case 'completed': return 'Hoàn tất';
      default: return status;
    }
  };

  const getMilestoneStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'partially_paid': return 'bg-amber-50 text-amber-700 border-amber-250';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getMilestoneStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ thu';
      case 'paid': return 'Đã thu đủ';
      case 'partially_paid': return 'Thu một phần';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Hợp đồng & Đợt thanh toán</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Quản lý vòng đời hợp đồng, theo dõi tiến độ thu tiền theo đợt và tự động đồng bộ dự án triển khai.
          Hợp đồng được chuyển đổi tự động khi báo giá được duyệt.
        </p>
      </div>

      <ListToolbar
        search={search}
        searchPlaceholder="Tìm theo số HĐ, mã, khách..."
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
              { value: 'negotiating', label: 'Đang đàm phán' },
              { value: 'signed', label: 'Đã ký kết' },
              { value: 'paused', label: 'Tạm dừng' },
              { value: 'cancelled', label: 'Đã hủy' },
              { value: 'completed', label: 'Hoàn tất' },
            ],
          },
        ]}
      />

      {/* Contracts Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-border">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-xs">Đang tải danh sách hợp đồng...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-sm font-semibold">Chưa có hợp đồng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Số Hợp đồng" sortKey="contractNumber" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Khách hàng" sortKey="customerName" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Giá trị hợp đồng" sortKey="contractValue" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Ngày ký" sortKey="signedDate" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Đồng bộ dự án</th>
                  <th className="px-6 py-4">Người phụ trách</th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={handleSort} /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contracts.map((ctr) => (
                  <tr
                    key={ctr.id}
                    onClick={() => loadContractDetails(ctr.id)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{ctr.contractNumber}</td>
                    <td className="px-6 py-4 font-bold text-foreground">{ctr.customerName}</td>
                    <td className="px-6 py-4 font-bold text-foreground">{formatCurrency(ctr.contractValue)}</td>
                    <td className="px-6 py-4 text-xs">{ctr.signedDate ? new Date(ctr.signedDate).toLocaleDateString('vi-VN') : 'Chưa ký'}</td>
                    <td className="px-6 py-4">
                      {ctr.projectCreated ? (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1 w-fit">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Đã tạo dự án
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1 w-fit">
                          Chờ ký kết
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{ctr.ownerName || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(ctr.status)}`}>
                        {getStatusText(ctr.status)}
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

      {/* Contract Details Drawer */}
      {activeContract && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-fade-in">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {activeContract.contractNumber}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(activeContract.status)}`}>
                  {getStatusText(activeContract.status)}
                </span>
              </div>
              <h2 className="text-base font-bold text-foreground mt-2">Chi tiết Hợp đồng</h2>
            </div>
            
            <button
              onClick={() => setActiveContract(null)}
              className="p-1 rounded-lg text-slate-400 hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {detailLoading ? (
              <p className="text-center py-12 text-xs text-muted-foreground">Đang tải thông tin hợp đồng...</p>
            ) : (
              <div className="space-y-6">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-y-3 text-xs border border-border p-4 rounded-xl bg-slate-50/50">
                  <div>
                    <span className="block text-[9px] text-muted-foreground font-bold uppercase">Khách hàng</span>
                    <span className="font-bold text-foreground mt-0.5">{activeContract.customerName}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-muted-foreground font-bold uppercase">Tổng giá trị</span>
                    <span className="font-bold text-primary mt-0.5">{formatCurrency(activeContract.contractValue)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-muted-foreground font-bold uppercase">Ngày ký hợp đồng</span>
                    <span className="font-semibold text-foreground mt-0.5">
                      {activeContract.signedDate ? new Date(activeContract.signedDate).toLocaleDateString('vi-VN') : 'Chưa ký kết'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-muted-foreground font-bold uppercase">Nhân sự quản lý HĐ</span>
                    <span className="font-semibold text-foreground mt-0.5">{activeContract.ownerName || '-'}</span>
                  </div>
                </div>

                {/* Project Status trigger display */}
                <div className="border border-border rounded-xl p-4 bg-slate-50/30 space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Đồng bộ triển khai dự án</h3>
                  
                  {activeContract.projectCreated ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600 leading-normal">
                        Dự án phụ trách triển khai kỹ thuật đã được **tự động khởi tạo** khi hợp đồng chuyển sang trạng thái đã ký.
                      </p>
                      <a
                        href="/projects"
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>Đi tới không gian công việc dự án</span>
                        <span>&rarr;</span>
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600 leading-normal">
                        Hợp đồng này chưa được ký kết chính thức.
                      </p>
                      {activeContract.status !== 'signed' && activeContract.status !== 'cancelled' && canSign && (
                        <button
                          onClick={() => handleSignContract(activeContract.id)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow shadow-emerald-100 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Ký kết & Khởi tạo dự án</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Milestones Progress Tracker */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Đợt thanh toán & Tiến trình thu hồi nợ</h3>
                  
                  {activeContract.milestones?.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Không tìm thấy đợt thanh toán nào cho hợp đồng này.</p>
                  ) : (
                    <div className="space-y-4">
                      {activeContract.milestones?.map((mil) => {
                        const progress = (mil.amountPaid / mil.amountDue) * 100;
                        const isCollectOpen = collectingMilestoneId === mil.id;

                        return (
                          <div key={mil.id} className="border border-border rounded-xl p-3.5 space-y-3 bg-card">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-xs text-foreground">{mil.name}</h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  Hạn đóng tiền: {new Date(mil.dueDate).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getMilestoneStatusBadge(mil.status)}`}>
                                {getMilestoneStatusText(mil.status)}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                                <span>Đã thu: {formatCurrency(mil.amountPaid)}</span>
                                <span>Tổng: {formatCurrency(mil.amountDue)} ({progress.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }}></div>
                              </div>
                            </div>

                            {/* Payment record editor form */}
                            {isCollectOpen ? (
                              <form onSubmit={(e) => handleRecordPayment(e, mil)} className="flex items-center gap-2 pt-2 border-t border-border/50">
                                <div className="flex-1">
                                  <input
                                    type="number"
                                    required
                                    placeholder="Nhập số tiền đã thu..."
                                    value={paymentInput}
                                    onChange={(e) => setPaymentInput(e.target.value)}
                                    className="premium-input py-1 text-xs font-mono"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  className="px-2.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded hover:bg-primary/95 cursor-pointer"
                                >
                                  Lưu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCollectingMilestoneId(null)}
                                  className="px-2.5 py-1.5 border border-border text-xs font-bold rounded hover:bg-muted cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </form>
                            ) : (
                              mil.status !== 'paid' && canCollect && (
                                <button
                                  onClick={() => { setCollectingMilestoneId(mil.id); setPaymentInput(mil.amountPaid.toString()); }}
                                  className="text-[10px] font-bold text-primary hover:underline pt-1 cursor-pointer block"
                                >
                                  Ghi nhận số tiền thanh toán &rarr;
                                </button>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú điều khoản</h3>
                  <p className="text-xs border border-border p-3 rounded-lg bg-slate-50/50 whitespace-pre-line leading-relaxed">
                    {activeContract.notes || 'Không có ghi chú nào khác.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer close */}
          <div className="p-6 border-t border-border bg-slate-50/50 flex">
            <button
              onClick={() => setActiveContract(null)}
              className="flex-1 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
            >
              Đóng bảng Hợp đồng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
