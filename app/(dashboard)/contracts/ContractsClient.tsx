'use client';

import { useState, useEffect } from 'react';
import { Contract, PaymentMilestone } from '@/features/contracts/services/contract.service';
import { ListToolbar } from '@/components/ui/ListControls';
import { ContractCreateFormState, ContractCreateModal, ContractSelectOption } from './components/ContractCreateModal';
import { ContractDetailDrawer } from './components/ContractDetailDrawer';
import { ContractsTable } from './components/ContractsTable';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

const getDefaultDueDate = () => {
  const date = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
};

const buildInitialContractForm = (currentUserId: string): ContractCreateFormState => ({
  code: `HD-${Date.now()}`,
  contractNumber: `HD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`,
  customerId: '',
  quoteId: '',
  contractValue: '',
  ownerUserId: currentUserId,
  notes: '',
  milestoneName: 'Thanh toán hợp đồng 100%',
  milestoneDueDate: getDefaultDueDate(),
  milestoneAmount: ''
});

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
  const [customers, setCustomers] = useState<ContractSelectOption[]>([]);
  const [users, setUsers] = useState<ContractSelectOption[]>([]);
  const [approvedQuotes, setApprovedQuotes] = useState<ContractSelectOption[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState(buildInitialContractForm(currentUser.id));

  // Details
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Milestone payment recording
  const [collectingMilestoneId, setCollectingMilestoneId] = useState<string | null>(null);
  const [paymentInput, setPaymentInput] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState('');

  // Permissions
  const canCreate = currentUser.roles.includes('system_management') || currentUser.permissions.includes('contracts.create.all');
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
  }, [search, statusFilter, page, sort, order]);

  useEffect(() => {
    if (!canCreate) return;

    const fetchOptions = async () => {
      try {
        const [customersRes, usersRes, quotesRes] = await Promise.all([
          fetch('/api/customers?limit=100&sort=name&order=asc'),
          fetch('/api/users'),
          fetch('/api/quotes?limit=100&status=approved&sort=quoteNumber&order=desc')
        ]);
        const [customersJson, usersJson, quotesJson] = await Promise.all([
          customersRes.json(),
          usersRes.json(),
          quotesRes.json()
        ]);

        if (customersJson.success) setCustomers(customersJson.data);
        if (usersJson.success) setUsers(usersJson.data);
        if (quotesJson.success) setApprovedQuotes(quotesJson.data);
      } catch (error) {
        console.error('Failed to load contract form options:', error);
      }
    };

    fetchOptions();
  }, [canCreate]);

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

  const openCreateModal = () => {
    setCreateForm(buildInitialContractForm(currentUser.id));
    setIsCreateOpen(true);
  };

  const handleQuoteSelect = (quoteId: string) => {
    const selectedQuote = approvedQuotes.find((quote) => quote.id === quoteId);
    setCreateForm((current) => ({
      ...current,
      quoteId,
      customerId: selectedQuote?.customerId || current.customerId,
      contractValue: selectedQuote?.totalAmount ? String(selectedQuote.totalAmount) : current.contractValue,
      milestoneAmount: selectedQuote?.totalAmount ? String(selectedQuote.totalAmount) : current.milestoneAmount
    }));
  };

  const handleCreateContract = async (event: React.FormEvent) => {
    event.preventDefault();
    const contractValue = Number(createForm.contractValue);
    const milestoneAmount = Number(createForm.milestoneAmount || createForm.contractValue);

    if (!createForm.code || !createForm.contractNumber || !createForm.customerId || !Number.isFinite(contractValue) || contractValue <= 0) {
      alert('Vui lòng nhập mã, số hợp đồng, khách hàng và giá trị hợp đồng hợp lệ.');
      return;
    }

    if (!Number.isFinite(milestoneAmount) || milestoneAmount <= 0) {
      alert('Giá trị đợt thanh toán phải lớn hơn 0.');
      return;
    }

    setCreateSaving(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: createForm.code,
          contractNumber: createForm.contractNumber,
          customerId: createForm.customerId,
          quoteId: createForm.quoteId || null,
          contractValue,
          ownerUserId: createForm.ownerUserId || currentUser.id,
          notes: createForm.notes,
          milestones: [{
            name: createForm.milestoneName || 'Thanh toán hợp đồng 100%',
            dueDate: createForm.milestoneDueDate,
            amountDue: milestoneAmount
          }]
        })
      });
      const json = await res.json();

      if (!json.success) {
        alert(json.error || 'Không tạo được hợp đồng');
        return;
      }

      setIsCreateOpen(false);
      setCreateForm(buildInitialContractForm(currentUser.id));
      setPage(1);
      fetchContracts();
      loadContractDetails(json.data.id);
    } catch (error) {
      console.error(error);
      alert('Lỗi khi tạo hợp đồng');
    } finally {
      setCreateSaving(false);
    }
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
        setNotesInput(json.data.notes || '');
      }
    } catch (err) {
      console.error('Failed to load contract details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateContract = async (contractId: string, body: { status?: string; notes?: string }) => {
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        setIsEditingNotes(false);
        loadContractDetails(contractId);
        fetchContracts();
      } else {
        alert(json.error || 'Không cập nhật được hợp đồng');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi cập nhật hợp đồng');
    }
  };

  const handleChangeStatus = (contract: Contract, status: string) => {
    const label = getStatusText(status);
    if (!confirm(`Chuyển hợp đồng "${contract.contractNumber}" sang trạng thái "${label}"?`)) return;
    handleUpdateContract(contract.id, { status });
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Hợp đồng & Đợt thanh toán</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý vòng đời hợp đồng, theo dõi tiến độ thu tiền theo đợt và tự động đồng bộ dự án triển khai.
            Hợp đồng được chuyển đổi tự động khi báo giá được duyệt.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/95 cursor-pointer whitespace-nowrap"
          >
            + Hợp đồng
          </button>
        )}
      </div>

      <ListToolbar
        search={search}
        searchPlaceholder="Tìm theo số HĐ, mã, khách..."
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
              { value: 'negotiating', label: 'Đang đàm phán' },
              { value: 'signed', label: 'Đã ký kết' },
              { value: 'paused', label: 'Tạm dừng' },
              { value: 'cancelled', label: 'Đã hủy' },
              { value: 'completed', label: 'Hoàn tất' },
            ],
          },
        ]}
      />

      <ContractsTable
        contracts={contracts}
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
        onOpenContract={loadContractDetails}
      />

      {activeContract && (
        <ContractDetailDrawer
          contract={activeContract}
          detailLoading={detailLoading}
          canSign={canSign}
          canCollect={canCollect}
          collectingMilestoneId={collectingMilestoneId}
          paymentInput={paymentInput}
          isEditingNotes={isEditingNotes}
          notesInput={notesInput}
          formatCurrency={formatCurrency}
          getStatusBadge={getStatusBadge}
          getStatusText={getStatusText}
          getMilestoneStatusBadge={getMilestoneStatusBadge}
          getMilestoneStatusText={getMilestoneStatusText}
          onClose={() => setActiveContract(null)}
          onSignContract={handleSignContract}
          onChangeStatus={handleChangeStatus}
          onRecordPayment={handleRecordPayment}
          onUpdateContract={handleUpdateContract}
          setCollectingMilestoneId={setCollectingMilestoneId}
          setPaymentInput={setPaymentInput}
          setIsEditingNotes={setIsEditingNotes}
          setNotesInput={setNotesInput}
        />
      )}

      <ContractCreateModal
        isOpen={isCreateOpen}
        saving={createSaving}
        form={createForm}
        customers={customers}
        users={users}
        approvedQuotes={approvedQuotes}
        setForm={setCreateForm}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateContract}
        onQuoteSelect={handleQuoteSelect}
      />
    </div>
  );
}
