'use client';

import { Drawer } from '@/components/ui/Drawer';

interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: 'active' | 'inactive';
}

interface SupplierDetailDrawerProps {
  isOpen: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SupplierDetailDrawer({
  isOpen,
  supplier,
  onClose,
  onEdit,
  onDelete,
}: SupplierDetailDrawerProps) {
  if (!supplier) return null;

  const renderContent = () => (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-2 gap-y-4 gap-x-2 border border-border p-4 rounded-xl bg-slate-50/50">
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Mã nhà cung cấp</p>
          <p className="font-mono font-bold text-primary mt-0.5">{supplier.code}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Tên nhà cung cấp</p>
          <p className="font-bold text-foreground mt-0.5">{supplier.name}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Số điện thoại</p>
          <p className="font-semibold text-foreground mt-0.5">{supplier.phone || '-'}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Email</p>
          <p className="font-semibold text-foreground mt-0.5">{supplier.email || '-'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Địa chỉ</p>
          <p className="font-semibold text-foreground mt-0.5">{supplier.address || '-'}</p>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 py-2 bg-secondary text-primary hover:bg-primary/5 border border-primary/20 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>Chỉnh sửa</span>
        </button>
        <button
          onClick={onDelete}
          className="py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Xóa bỏ</span>
        </button>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="w-full">
      <button
        onClick={onClose}
        className="w-full py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
      >
        Đóng bảng
      </button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      type="push"
      title="Chi tiết Nhà cung cấp"
      subtitle={
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            supplier.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {supplier.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
          </span>
        </div>
      }
      footer={renderFooter()}
    >
      {renderContent()}
    </Drawer>
  );
}
