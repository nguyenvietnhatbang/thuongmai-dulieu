'use client';

import { useState } from 'react';
import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface SalesOrder {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  contactName?: string | null;
  saleDate: string;
  expectedDeliveryDate?: string | null;
  warehouseName?: string | null;
  paymentDueDate?: string | null;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: 'draft' | 'confirmed' | 'delivered' | 'partially_paid' | 'paid' | 'cancelled';
}

interface SalesOrdersTabProps {
  salesOrders: SalesOrder[];
  customers: any[];
  products: any[];
  warehouses: any[];
  search: string;
  status: string;
  page: number;
  total: number;
  sort: string;
  order: 'asc' | 'desc';
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
  onPageChange: (page: number) => void;
  onSort: (sortKey: string) => void;
  formatCurrency: (val: number) => string;
  onViewDetails: (type: 'sales', id: string) => void;
  onCreateSalesOrder: (data: any) => Promise<boolean>;
}

export function SalesOrdersTab({
  salesOrders,
  customers,
  products,
  warehouses,
  search,
  status,
  page,
  total,
  sort,
  order,
  onSearchChange,
  onStatusChange,
  onReset,
  onPageChange,
  onSort,
  formatCurrency,
  onViewDetails,
  onCreateSalesOrder
}: SalesOrdersTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const [newSo, setNewSo] = useState({
    code: '',
    customerId: '',
    saleDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    warehouseId: '',
    paymentDueDate: '',
    paidAmount: 0,
    notes: '',
    items: [{ productId: '', warehouseId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]
  });

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...newSo.items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[index].unitCode = prod.unitCode;
      }
    }

    setNewSo({ ...newSo, items: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSo.customerId) {
      alert('Vui lòng chọn khách hàng!');
      return;
    }
    if (newSo.items.some(it => !it.productId || (!it.warehouseId && !newSo.warehouseId) || it.quantity <= 0)) {
      alert('Vui lòng chọn sản phẩm, kho xuất và số lượng lớn hơn 0!');
      return;
    }
    const ok = await onCreateSalesOrder(newSo);
    if (ok) {
      setIsOpen(false);
      setNewSo({
        code: '',
        customerId: '',
        saleDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        warehouseId: '',
        paymentDueDate: '',
        paidAmount: 0,
        notes: '',
        items: [{ productId: '', warehouseId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]
      });
    }
  };

  const limit = 10;

  return (
    <div className="space-y-4">
      <ListToolbar
        search={search}
        searchPlaceholder="Tìm mã đơn, khách hàng..."
        onSearchChange={onSearchChange}
        onSearchSubmit={(event) => event.preventDefault()}
        showSearchButton={false}
        searchClassName="!w-64"
        filters={[
          {
            value: status,
            placeholder: 'Tất cả trạng thái',
            onChange: onStatusChange,
            options: [
              { value: 'draft', label: 'Bản nháp' },
              { value: 'confirmed', label: 'Đã xuất kho' },
              { value: 'partially_paid', label: 'Thu một phần' },
              { value: 'paid', label: 'Đã trả đủ' },
              { value: 'cancelled', label: 'Đã hủy' },
            ],
            className: '!w-40',
          },
        ]}
        onReset={onReset}
        rightSlot={(
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-xs font-semibold shadow-sm cursor-pointer"
          >
            + Đơn bán hàng
          </button>
        )}
      />

      <div className="glass-panel border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-6 py-4"><SortableHeader label="Mã đơn" sortKey="code" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Khách hàng" sortKey="customerName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Ngày bán" sortKey="saleDate" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Ngày giao" sortKey="expectedDeliveryDate" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">Kho xuất</th>
                <th className="px-6 py-4">Hạn thanh toán</th>
                <th className="px-6 py-4"><SortableHeader label="Tổng tiền" sortKey="totalAmount" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Đã thanh toán" sortKey="paidAmount" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Còn nợ" sortKey="debtAmount" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {salesOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Không có đơn bán hàng phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                salesOrders.map((so) => (
                  <tr key={so.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{so.code}</td>
                    <td className="px-6 py-4 font-bold text-foreground">{so.customerName}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{so.saleDate}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{so.expectedDeliveryDate || '-'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{so.warehouseName || '-'}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{so.paymentDueDate || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{formatCurrency(so.totalAmount)}</td>
                    <td className="px-6 py-4 text-xs font-medium text-emerald-600">{formatCurrency(so.paidAmount)}</td>
                    <td className="px-6 py-4 text-xs font-medium text-rose-600">{formatCurrency(so.debtAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        so.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                        so.status === 'partially_paid' ? 'bg-blue-50 text-blue-700 border-blue-150' :
                        so.status === 'confirmed' ? 'bg-indigo-50 text-indigo-700 border-indigo-150' :
                        'bg-amber-50 text-amber-700 border-amber-150'
                      }`}>
                        {so.status === 'paid' ? 'Đã trả đủ' :
                         so.status === 'partially_paid' ? 'Thu một phần' :
                         so.status === 'confirmed' ? 'Đã xuất kho' : 'Mới tạo (Draft)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => onViewDetails('sales', so.id)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} limit={limit} total={total} onPageChange={onPageChange} alwaysShow />
      </div>

      {/* SO CREATION MODAL */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Lập đơn bán hàng & Trừ kho" maxWidthClass="max-w-[min(96rem,calc(100vw-2rem))]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã đơn bán hàng *</label>
              <input type="text" required placeholder="SO-001..." value={newSo.code} onChange={e => setNewSo({...newSo, code: e.target.value})} className="premium-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khách hàng *</label>
              <SearchableSelect
                value={newSo.customerId}
                placeholder="-- Chọn khách hàng --"
                searchPlaceholder="Tìm tên, mã khách hàng..."
                options={customers.map(c => ({
                  value: c.id,
                  label: `${c.name} (${c.code})`,
                  description: c.email || c.phone || c.customerType,
                }))}
                onChange={(customerId) => setNewSo({...newSo, customerId})}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày bán hàng</label>
              <input type="date" value={newSo.saleDate} onChange={e => setNewSo({...newSo, saleDate: e.target.value})} className="premium-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày giao dự kiến</label>
              <input type="date" value={newSo.expectedDeliveryDate} onChange={e => setNewSo({...newSo, expectedDeliveryDate: e.target.value})} className="premium-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kho xuất mặc định</label>
              <select value={newSo.warehouseId} onChange={e => setNewSo({...newSo, warehouseId: e.target.value})} className="premium-input">
                <option value="">-- Theo từng dòng hàng --</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hạn thanh toán</label>
              <input type="date" value={newSo.paymentDueDate} onChange={e => setNewSo({...newSo, paymentDueDate: e.target.value})} className="premium-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số tiền đã thu trước *</label>
              <input type="number" required placeholder="Số tiền đã thanh toán..." min={0} value={newSo.paidAmount} onChange={e => setNewSo({...newSo, paidAmount: Number(e.target.value)})} className="premium-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú</label>
            <input type="text" placeholder="Diễn giải đơn hàng" value={newSo.notes} onChange={e => setNewSo({...newSo, notes: e.target.value})} className="premium-input" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-border pb-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Danh sách dòng xuất hàng</h3>
              <button type="button" onClick={() => setNewSo({...newSo, items: [...newSo.items, { productId: '', warehouseId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]})} className="text-xs font-bold text-primary hover:underline cursor-pointer">
                + Thêm dòng
              </button>
            </div>
            <div className="space-y-2 overflow-x-auto pb-1">
              {newSo.items.map((it, idx) => (
                <div key={idx} className="grid min-w-[980px] grid-cols-[minmax(18rem,1fr)_minmax(14rem,0.8fr)_7rem_10rem_2.5rem] gap-2 items-center">
                  <SearchableSelect
                    value={it.productId}
                    placeholder="-- Sản phẩm --"
                    searchPlaceholder="Tìm sản phẩm..."
                    options={products.map(p => ({
                      value: p.id,
                      label: `${p.name} (${p.code})`,
                      description: p.unitCode,
                    }))}
                    onChange={(productId) => handleLineChange(idx, 'productId', productId)}
                  />
                  <SearchableSelect
                    value={it.warehouseId}
                    placeholder="-- Kho xuất --"
                    searchPlaceholder="Tìm kho..."
                    options={warehouses.map(w => ({
                      value: w.id,
                      label: w.name,
                      description: w.code,
                    }))}
                    onChange={(warehouseId) => handleLineChange(idx, 'warehouseId', warehouseId)}
                  />
                  <input type="number" required placeholder="SL" min={1} value={it.quantity} onChange={e => handleLineChange(idx, 'quantity', Number(e.target.value))} className="premium-input" />
                  <input type="number" required placeholder="Đơn giá" min={0} value={it.unitPrice} onChange={e => handleLineChange(idx, 'unitPrice', Number(e.target.value))} className="premium-input" />
                  <button type="button" onClick={() => setNewSo({...newSo, items: newSo.items.filter((_, i) => i !== idx)})} className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 cursor-pointer">Tạo đơn bán hàng</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
