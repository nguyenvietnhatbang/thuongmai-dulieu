'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Contract, PaymentMilestone } from '@/features/contracts/services/contract.service';
import { ContractDetailDrawer } from '../components/ContractDetailDrawer';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export function ContractDetailClient({
  contractId,
  currentUser,
}: {
  contractId: string;
  currentUser: UserSession;
}) {
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [error, setError] = useState('');
  const [collectingMilestoneId, setCollectingMilestoneId] = useState<string | null>(null);
  const [paymentInput, setPaymentInput] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState('');

  const canSign = currentUser.roles.includes('system_management') || currentUser.permissions.includes('contracts.sign.all');
  const canCollect = currentUser.roles.includes('system_management') || currentUser.permissions.includes('receivables.update_status.all');

  const loadContractDetails = async () => {
    setDetailLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/contracts/${contractId}`);
      const json = await res.json();
      if (json.success) {
        setContract(json.data);
        setNotesInput(json.data.notes || '');
      } else {
        setError(json.error || 'Không tải được hồ sơ hợp đồng.');
      }
    } catch (err) {
      console.error('Failed to load contract details:', err);
      setError('Không tải được hồ sơ hợp đồng.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadContractDetails();
  }, [contractId]);

  const handleUpdateContract = async (id: string, body: { status?: string; notes?: string }) => {
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        setIsEditingNotes(false);
        await loadContractDetails();
      } else {
        alert(json.error || 'Không cập nhật được hợp đồng');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi cập nhật hợp đồng');
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

  const handleChangeStatus = (targetContract: Contract, status: string) => {
    const label = getStatusText(status);
    if (!confirm(`Chuyển hợp đồng "${targetContract.contractNumber}" sang trạng thái "${label}"?`)) return;
    handleUpdateContract(targetContract.id, { status });
  };

  const handleSignContract = async (id: string) => {
    if (!confirm('Xác nhận ký kết hợp đồng này? Hệ thống sẽ tự động khởi tạo dự án triển khai liên đới.')) return;
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'signed' })
      });
      const json = await res.json();
      if (json.success) {
        alert('Hợp đồng đã ký thành công! Dự án triển khai mới đã được tự động tạo.');
        await loadContractDetails();
      } else {
        alert(json.error || 'Failed to sign contract');
      }
    } catch (err) {
      console.error(err);
      alert('Error signing contract');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
        await loadContractDetails();
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

  if (!detailLoading && (error || !contract)) {
    return (
      <div className="h-full rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-4 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-bold text-foreground">Không mở được hồ sơ hợp đồng</h1>
          <p className="text-sm text-muted-foreground">{error || 'Hợp đồng không tồn tại hoặc bạn không có quyền truy cập.'}</p>
        </div>
        <button
          onClick={() => router.push('/contracts')}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/95 cursor-pointer"
        >
          Quay lại danh sách hợp đồng
        </button>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="h-full rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-xs text-muted-foreground">Đang tải hồ sơ hợp đồng...</p>
      </div>
    );
  }

  return (
    <ContractDetailDrawer
      mode="page"
      contract={contract}
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
      onClose={() => router.push('/contracts')}
      onSignContract={handleSignContract}
      onChangeStatus={handleChangeStatus}
      onRecordPayment={handleRecordPayment}
      onUpdateContract={handleUpdateContract}
      setCollectingMilestoneId={setCollectingMilestoneId}
      setPaymentInput={setPaymentInput}
      setIsEditingNotes={setIsEditingNotes}
      setNotesInput={setNotesInput}
    />
  );
}
