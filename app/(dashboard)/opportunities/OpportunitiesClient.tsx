'use client';

import { useState, useEffect } from 'react';
import { Opportunity } from '@/features/opportunities/services/opportunity.service';
import { Customer } from '@/features/customers/services/customer.service';
import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';

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
}

const STAGES = [
  { code: 'new', name: 'Mới tạo', color: 'border-blue-400 bg-blue-50/20 text-blue-700' },
  { code: 'consulting', name: 'Đang tư vấn', color: 'border-indigo-400 bg-indigo-50/20 text-indigo-700' },
  { code: 'info_sent', name: 'Đã gửi thông tin', color: 'border-purple-400 bg-purple-50/20 text-purple-700' },
  { code: 'waiting_quote', name: 'Chờ báo giá', color: 'border-amber-400 bg-amber-50/20 text-amber-700' },
  { code: 'quoted', name: 'Đã báo giá', color: 'border-teal-400 bg-teal-50/20 text-teal-700' },
  { code: 'paused', name: 'Tạm dừng', color: 'border-slate-400 bg-slate-50/20 text-slate-700' },
  { code: 'won', name: 'Thành công (Won)', color: 'border-emerald-400 bg-emerald-50/20 text-emerald-700' },
  { code: 'lost', name: 'Thất bại (Lost)', color: 'border-rose-400 bg-rose-50/20 text-rose-700' }
];

export function OpportunitiesClient({ currentUser }: { currentUser: UserSession }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<UserDropdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 20;

  // Modals & Drawer state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeOpp, setActiveOpp] = useState<Opportunity | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Forms
  const [newOpp, setNewOpp] = useState({
    code: '',
    customerId: '',
    title: '',
    needDescription: '',
    expectedValue: '',
    expectedCloseDate: '',
    ownerUserId: '',
    stage: 'new',
    notes: ''
  });
  const [editOpp, setEditOpp] = useState<Partial<Opportunity>>({});

  const canCreate = currentUser.roles.includes('system_management') || currentUser.permissions.includes('opportunities.create.all');

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort,
        order,
      });
      if (search) params.append('search', search);
      if (selectedStage) params.append('stage', selectedStage);

      const res = await fetch(`/api/opportunities?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOpportunities(json.data);
        setTotal(json.pagination?.total || json.data.length);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      // Fetch customers (unpaginated for select dropdown)
      const custRes = await fetch('/api/customers?limit=100');
      const custJson = await custRes.json();
      if (custJson.success) {
        setCustomers(custJson.data);
      }

      // Fetch active users
      const userRes = await fetch('/api/users');
      const userJson = await userRes.json();
      if (userJson.success) {
        setUsers(userJson.data);
      }
    } catch (err) {
      console.error('Failed to load dropdown datasets:', err);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [search, selectedStage, page, sort, order]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStage('');
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

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOpp)
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateOpen(false);
        setNewOpp({
          code: '',
          customerId: '',
          title: '',
          needDescription: '',
          expectedValue: '',
          expectedCloseDate: '',
          ownerUserId: '',
          stage: 'new',
          notes: ''
        });
        fetchOpportunities();
      } else {
        alert(json.error || 'Failed to create opportunity');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating opportunity');
    }
  };

  const handleUpdateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOpp) return;
    try {
      const res = await fetch(`/api/opportunities/${activeOpp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editOpp)
      });
      const json = await res.json();
      if (json.success) {
        setIsEditing(false);
        setActiveOpp(json.data);
        fetchOpportunities();
      } else {
        alert(json.error || 'Failed to update opportunity');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating opportunity');
    }
  };

  const handleQuickUpdateStage = async (oppId: string, nextStage: string) => {
    try {
      const res = await fetch(`/api/opportunities/${oppId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage })
      });
      const json = await res.json();
      if (json.success) {
        fetchOpportunities();
      } else {
        alert(json.error || 'Failed to switch stage');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating stage');
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
    if (!confirm('Bạn có muốn xóa cơ hội này?')) return;
    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setActiveOpp(null);
        fetchOpportunities();
      } else {
        alert(json.error || 'Failed to delete opportunity');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting opportunity');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Phễu Cơ hội bán hàng</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Theo dõi tiến trình bán hàng, tư vấn dịch vụ và quản lý pipeline cơ hội.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle View Mode */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'pipeline'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pipeline (Kanban)
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bảng danh sách
            </button>
          </div>

          {canCreate && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold shadow-md shadow-primary/15 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tạo cơ hội mới</span>
            </button>
          )}
        </div>
      </div>

      <ListToolbar
        search={search}
        searchPlaceholder="Tìm theo tiêu đề, mã, khách..."
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        onSearchSubmit={handleSearchSubmit}
        showSearchButton={false}
        onReset={handleResetFilters}
        filters={[
          {
            value: selectedStage,
            placeholder: '-- Tất cả giai đoạn --',
            onChange: (value) => { setSelectedStage(value); setPage(1); },
            options: STAGES.map(stage => ({ value: stage.code, label: stage.name })),
          },
        ]}
      />

      {/* Main View Area */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-xs">Đang tải phễu cơ hội...</p>
        </div>
      ) : viewMode === 'pipeline' ? (
        /* Kanban Pipeline View */
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const oppsInStage = opportunities.filter(o => o.stage === stage.code);
            const stageTotalValue = oppsInStage.reduce((acc, curr) => acc + Number(curr.expectedValue), 0);

            return (
              <div key={stage.code} className="min-w-[260px] flex flex-col gap-3.5 shrink-0 bg-slate-50/70 p-3.5 rounded-xl border border-border">
                {/* Stage Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">{stage.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                      {oppsInStage.length} thẻ · {formatCurrency(stageTotalValue)}
                    </p>
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1"></span>
                </div>

                <div className="h-0.5 bg-border/50" />

                {/* Cards Container */}
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {oppsInStage.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-[11px] border border-dashed border-border rounded-lg bg-card/50">
                      Không có cơ hội
                    </div>
                  ) : (
                    oppsInStage.map((opp) => (
                      <div
                        key={opp.id}
                        onClick={() => { setActiveOpp(opp); setEditOpp(opp); setIsEditing(false); }}
                        className="glass-card bg-card border border-border p-3.5 rounded-xl flex flex-col justify-between gap-3 cursor-pointer"
                      >
                        <div>
                          <span className="font-mono text-[9px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                            {opp.code}
                          </span>
                          <h4 className="font-bold text-xs text-foreground mt-1.5 line-clamp-2">{opp.title}</h4>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-1 truncate">
                            Khách: {opp.customerName}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-none">
                            {formatCurrency(opp.expectedValue)}
                          </p>
                          <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                            <span>PM: {opp.ownerName ? opp.ownerName.split(' ')[0] : 'Chưa gán'}</span>
                            
                            {/* Fast stage action dropdown */}
                            <select
                              value={opp.stage}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleQuickUpdateStage(opp.id, e.target.value)}
                              className="bg-secondary text-[10px] rounded border-0 px-1 py-0.5 text-primary font-bold cursor-pointer"
                            >
                              {STAGES.map(s => (
                                <option key={s.code} value={s.code}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Standard Datatable View */
        <div className="glass-panel rounded-xl overflow-hidden border border-border">
          {opportunities.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p className="text-sm font-semibold">Chưa có cơ hội bán hàng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                    <th className="px-6 py-4"><SortableHeader label="Mã số" sortKey="code" activeSort={sort} order={order} onSort={handleSort} /></th>
                    <th className="px-6 py-4"><SortableHeader label="Tiêu đề cơ hội" sortKey="title" activeSort={sort} order={order} onSort={handleSort} /></th>
                    <th className="px-6 py-4"><SortableHeader label="Khách hàng" sortKey="customerName" activeSort={sort} order={order} onSort={handleSort} /></th>
                    <th className="px-6 py-4"><SortableHeader label="Giá trị dự kiến" sortKey="expectedValue" activeSort={sort} order={order} onSort={handleSort} /></th>
                    <th className="px-6 py-4"><SortableHeader label="Hạn chốt" sortKey="expectedCloseDate" activeSort={sort} order={order} onSort={handleSort} /></th>
                    <th className="px-6 py-4">Phụ trách</th>
                    <th className="px-6 py-4"><SortableHeader label="Giai đoạn" sortKey="stage" activeSort={sort} order={order} onSort={handleSort} /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {opportunities.map((opp) => (
                    <tr
                      key={opp.id}
                      onClick={() => { setActiveOpp(opp); setEditOpp(opp); setIsEditing(false); }}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{opp.code}</td>
                      <td className="px-6 py-4 font-bold text-foreground">{opp.title}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{opp.customerName}</td>
                      <td className="px-6 py-4 font-bold text-foreground">{formatCurrency(opp.expectedValue)}</td>
                      <td className="px-6 py-4 text-xs">
                        {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">{opp.ownerName || 'Chưa gán'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STAGES.find(s => s.code === opp.stage)?.color}`}>
                          {STAGES.find(s => s.code === opp.stage)?.name}
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
      )}

      {/* Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-xl rounded-2xl border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-foreground">Tạo cơ hội bán hàng mới</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-foreground cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateOpportunity} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã cơ hội *</label>
                  <input
                    type="text"
                    required
                    placeholder="OPP-001..."
                    value={newOpp.code}
                    onChange={(e) => setNewOpp({ ...newOpp, code: e.target.value })}
                    className="premium-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chọn Khách hàng *</label>
                  <select
                    required
                    value={newOpp.customerId}
                    onChange={(e) => setNewOpp({ ...newOpp, customerId: e.target.value })}
                    className="premium-input"
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề cơ hội *</label>
                <input
                  type="text"
                  required
                  placeholder="Gói thầu thiết kế phần mềm, cung ứng máy móc..."
                  value={newOpp.title}
                  onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
                  className="premium-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giá trị dự kiến (VND) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Mức ngân sách ước lượng"
                    value={newOpp.expectedValue}
                    onChange={(e) => setNewOpp({ ...newOpp, expectedValue: e.target.value })}
                    className="premium-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày dự kiến chốt</label>
                  <input
                    type="date"
                    value={newOpp.expectedCloseDate}
                    onChange={(e) => setNewOpp({ ...newOpp, expectedCloseDate: e.target.value })}
                    className="premium-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nhân viên phụ trách</label>
                  <select
                    value={newOpp.ownerUserId}
                    onChange={(e) => setNewOpp({ ...newOpp, ownerUserId: e.target.value })}
                    className="premium-input"
                  >
                    <option value="">-- Chọn nhân sự --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giai đoạn</label>
                  <select
                    value={newOpp.stage}
                    onChange={(e) => setNewOpp({ ...newOpp, stage: e.target.value })}
                    className="premium-input"
                  >
                    <option value="new">Mới tạo</option>
                    <option value="consulting">Đang tư vấn</option>
                    <option value="info_sent">Đã gửi thông tin</option>
                    <option value="waiting_quote">Chờ báo giá</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nhu cầu chi tiết</label>
                <textarea
                  placeholder="Khách hàng cần cung cấp giải pháp gì, thời gian giao hàng như thế nào..."
                  value={newOpp.needDescription}
                  onChange={(e) => setNewOpp({ ...newOpp, needDescription: e.target.value })}
                  className="premium-input h-16"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú thêm</label>
                <input
                  type="text"
                  placeholder="Thông tin đối thủ, tiến độ đàm phán..."
                  value={newOpp.notes}
                  onChange={(e) => setNewOpp({ ...newOpp, notes: e.target.value })}
                  className="premium-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                  Lưu cơ hội
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Opportunity Detail Drawer */}
      {activeOpp && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-fade-in">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {activeOpp.code}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STAGES.find(s => s.code === activeOpp.stage)?.color}`}>
                  {STAGES.find(s => s.code === activeOpp.stage)?.name}
                </span>
              </div>
              <h2 className="text-base font-bold text-foreground mt-2">{activeOpp.title}</h2>
            </div>
            
            <button
              onClick={() => setActiveOpp(null)}
              className="p-1 rounded-lg text-slate-400 hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isEditing ? (
              <form onSubmit={handleUpdateOpportunity} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề cơ hội</label>
                  <input
                    type="text"
                    required
                    value={editOpp.title || ''}
                    onChange={(e) => setEditOpp({ ...editOpp, title: e.target.value })}
                    className="premium-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giá trị dự tính (VND)</label>
                    <input
                      type="number"
                      required
                      value={editOpp.expectedValue || ''}
                      onChange={(e) => setEditOpp({ ...editOpp, expectedValue: Number(e.target.value) })}
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giai đoạn</label>
                    <select
                      value={editOpp.stage || 'new'}
                      onChange={(e) => setEditOpp({ ...editOpp, stage: e.target.value as any })}
                      className="premium-input"
                    >
                      {STAGES.map(s => (
                        <option key={s.code} value={s.code}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày chốt dự kiến</label>
                    <input
                      type="date"
                      value={editOpp.expectedCloseDate ? editOpp.expectedCloseDate.substring(0, 10) : ''}
                      onChange={(e) => setEditOpp({ ...editOpp, expectedCloseDate: e.target.value })}
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Người phụ trách</label>
                    <select
                      value={editOpp.ownerUserId || ''}
                      onChange={(e) => setEditOpp({ ...editOpp, ownerUserId: e.target.value })}
                      className="premium-input"
                    >
                      <option value="">-- Chọn nhân sự --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả nhu cầu</label>
                  <textarea
                    value={editOpp.needDescription || ''}
                    onChange={(e) => setEditOpp({ ...editOpp, needDescription: e.target.value })}
                    className="premium-input h-20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú nội bộ</label>
                  <textarea
                    value={editOpp.notes || ''}
                    onChange={(e) => setEditOpp({ ...editOpp, notes: e.target.value })}
                    className="premium-input h-16"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 border border-border text-xs font-semibold rounded bg-card hover:bg-muted cursor-pointer"
                  >
                    Hủy sửa
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/90 shadow cursor-pointer"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Khách hàng liên kết</p>
                    <p className="font-bold text-foreground mt-0.5">{activeOpp.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Doanh thu dự kiến</p>
                    <p className="font-bold text-primary mt-0.5">{formatCurrency(activeOpp.expectedValue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Hạn chốt dự tính</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {activeOpp.expectedCloseDate ? new Date(activeOpp.expectedCloseDate).toLocaleDateString('vi-VN') : 'Chưa lên ngày'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Người chịu trách nhiệm</p>
                    <p className="font-semibold text-foreground mt-0.5">{activeOpp.ownerName || 'Chưa gán'}</p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Mô tả nhu cầu khách hàng</p>
                  <p className="border border-border p-3 rounded-lg bg-slate-50/50 leading-relaxed whitespace-pre-line text-xs">
                    {activeOpp.needDescription || 'Không có mô tả nhu cầu chi tiết.'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Ghi chú tiến độ đàm phán</p>
                  <p className="border border-border p-3 rounded-lg bg-slate-50/50 leading-relaxed whitespace-pre-line text-xs">
                    {activeOpp.notes || 'Chưa có ghi chú bổ sung.'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-2 bg-secondary text-primary hover:bg-primary/5 border border-primary/20 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Chỉnh sửa cơ hội
                  </button>
                  <button
                    onClick={() => handleDeleteOpportunity(activeOpp.id)}
                    className="py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Xóa bỏ
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-slate-50/50 flex">
            <button
              onClick={() => setActiveOpp(null)}
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
