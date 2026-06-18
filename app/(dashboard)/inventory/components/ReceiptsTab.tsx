'use client';

import { useState } from 'react';
import { ListToolbar, PaginationControls, SortableHeader, PageTabs } from '@/components/ui/ListControls';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  totalAmount: number;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
}

interface StockReceipt {
  id: string;
  code: string;
  purchaseOrderId: string | null;
  purchaseOrderCode: string | null;
  warehouseId: string;
  warehouseName: string;
  receiptDate: string;
  totalAmount: number;
  status: 'draft' | 'confirmed' | 'cancelled';
}

interface ReceiptsTabProps {
  purchaseOrders: PurchaseOrder[];
  stockReceipts: StockReceipt[];
  products: any[];
  suppliers: any[];
  warehouses: any[];
  purchaseSearch: string;
  purchaseStatus: string;
  purchasePage: number;
  purchaseTotal: number;
  purchaseSort: string;
  purchaseOrder: 'asc' | 'desc';
  receiptSearch: string;
  receiptStatus: string;
  receiptPage: number;
  receiptTotal: number;
  receiptSort: string;
  receiptOrder: 'asc' | 'desc';
  onPurchaseSearchChange: (value: string) => void;
  onPurchaseStatusChange: (value: string) => void;
  onPurchaseReset: () => void;
  onPurchasePageChange: (page: number) => void;
  onPurchaseSort: (sortKey: string) => void;
  onReceiptSearchChange: (value: string) => void;
  onReceiptStatusChange: (value: string) => void;
  onReceiptReset: () => void;
  onReceiptPageChange: (page: number) => void;
  onReceiptSort: (sortKey: string) => void;
  formatCurrency: (val: number) => string;
  onViewDetails: (type: 'po' | 'receipt', id: string) => void;
  onCreatePo: (data: any) => Promise<boolean>;
  onCreateReceipt: (data: any) => Promise<boolean>;
  activeSubtab?: 'po' | 'receipt';
  onSubtabChange?: (subtab: 'po' | 'receipt') => void;
}

export function ReceiptsTab({
  purchaseOrders,
  stockReceipts,
  products,
  suppliers,
  warehouses,
  purchaseSearch,
  purchaseStatus,
  purchasePage,
  purchaseTotal,
  purchaseSort,
  purchaseOrder,
  receiptSearch,
  receiptStatus,
  receiptPage,
  receiptTotal,
  receiptSort,
  receiptOrder,
  onPurchaseSearchChange,
  onPurchaseStatusChange,
  onPurchaseReset,
  onPurchasePageChange,
  onPurchaseSort,
  onReceiptSearchChange,
  onReceiptStatusChange,
  onReceiptReset,
  onReceiptPageChange,
  onReceiptSort,
  formatCurrency,
  onViewDetails,
  onCreatePo,
  onCreateReceipt,
  activeSubtab,
  onSubtabChange
}: ReceiptsTabProps) {
  const [internalSubtab, setInternalSubtab] = useState<'po' | 'receipt'>('po');
  const subtab = activeSubtab ?? internalSubtab;
  const [isPoOpen, setIsPoOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // PO Form state
  const [newPo, setNewPo] = useState({
    code: '',
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]
  });

  // Receipt Form state
  const [newReceipt, setNewReceipt] = useState({
    code: '',
    purchaseOrderId: '',
    warehouseId: '',
    receiptDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]
  });

  const handlePoLineChange = (index: number, field: string, value: any) => {
    const updated = [...newPo.items];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-update unitCode if product changes
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[index].unitCode = prod.unitCode;
      }
    }
    
    setNewPo({ ...newPo, items: updated });
  };

  const handleReceiptLineChange = (index: number, field: string, value: any) => {
    const updated = [...newReceipt.items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[index].unitCode = prod.unitCode;
      }
    }

    setNewReceipt({ ...newReceipt, items: updated });
  };

  const handlePoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPo.supplierId) {
      alert('Vui lòng chọn nhà cung cấp!');
      return;
    }
    if (newPo.items.some(it => !it.productId || it.quantity <= 0)) {
      alert('Vui lòng chọn sản phẩm và nhập số lượng lớn hơn 0!');
      return;
    }
    const ok = await onCreatePo(newPo);
    if (ok) {
      setIsPoOpen(false);
      setNewPo({
        code: '',
        supplierId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]
      });
    }
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReceipt.warehouseId) {
      alert('Vui lòng chọn kho nhập!');
      return;
    }
    
    // If selecting a PO, copy items from PO
    const receiptData = { ...newReceipt };
    if (newReceipt.purchaseOrderId) {
      // Find PO details and populate items
      const po = purchaseOrders.find(p => p.id === newReceipt.purchaseOrderId);
      if (po) {
        // We need detailed items which are in activeDetail. Fetch PO items from API if needed,
        // but since we are doing it in parent component, let's let parent component fetch PO items or
        // let the API handle the copying (our backend createStockReceipt does NOT copy automatically,
        // it expects items in the payload). So we should fetch PO items or select PO.
        // Wait! In the original code, the parent component fetched the PO items.
        // Let's pass the PO items copy helper or handle it.
      }
    }

    const ok = await onCreateReceipt(receiptData);
    if (ok) {
      setIsReceiptOpen(false);
      setNewReceipt({
        code: '',
        purchaseOrderId: '',
        warehouseId: '',
        receiptDate: new Date().toISOString().split('T')[0],
        notes: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]
      });
    }
  };

  // If PO is selected in receipt form, try to auto-populate warehouse and copy items
  const handleReceiptPoSelect = async (poId: string) => {
    if (!poId) {
      setNewReceipt({ ...newReceipt, purchaseOrderId: '', items: [{ productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }] });
      return;
    }

    try {
      const res = await fetch(`/api/inventory/purchases/${poId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const poItems = json.data.items.map((it: any) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          unitCode: it.unitCode
        }));
        setNewReceipt({
          ...newReceipt,
          purchaseOrderId: poId,
          items: poItems
        });
      }
    } catch (err) {
      console.error('Error fetching PO items:', err);
    }
  };

  const limit = 10;

  const changeSubtab = (nextSubtab: 'po' | 'receipt') => {
    setInternalSubtab(nextSubtab);
    onSubtabChange?.(nextSubtab);
  };

  const handleSort = (nextSort: string) => {
    if (subtab === 'po') {
      onPurchaseSort(nextSort);
      return;
    }
    onReceiptSort(nextSort);
  };

  return (
    <div className="space-y-4">
      {/* Unified Tab Switcher with Add button in rightSlot */}
      <PageTabs
        tabs={[
          { id: 'po', label: `Đơn đặt mua (PO) (${purchaseOrders.length})` },
          { id: 'receipt', label: `Phiếu nhập kho (${stockReceipts.length})` },
        ]}
        active={subtab}
        onChange={changeSubtab}
        rightSlot={
          subtab === 'po' ? (
            <button
              onClick={() => setIsPoOpen(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-xs font-semibold shadow-sm cursor-pointer transition-all"
            >
              + Đơn mua hàng
            </button>
          ) : (
            <button
              onClick={() => setIsReceiptOpen(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-xs font-semibold shadow-sm cursor-pointer transition-all"
            >
              + Phiếu nhập kho
            </button>
          )
        }
      />

      <ListToolbar
        search={subtab === 'po' ? purchaseSearch : receiptSearch}
        searchPlaceholder={subtab === 'po' ? 'Tìm mã PO, nhà cung cấp...' : 'Tìm phiếu, PO, kho...'}
        onSearchChange={subtab === 'po' ? onPurchaseSearchChange : onReceiptSearchChange}
        onSearchSubmit={(event) => event.preventDefault()}
        showSearchButton={false}
        searchClassName="!w-64"
        filters={[
          {
            value: subtab === 'po' ? purchaseStatus : receiptStatus,
            placeholder: 'Tất cả trạng thái',
            onChange: subtab === 'po' ? onPurchaseStatusChange : onReceiptStatusChange,
            options: subtab === 'po'
              ? [
                { value: 'draft', label: 'Bản nháp' },
                { value: 'ordered', label: 'Đã đặt hàng' },
                { value: 'received', label: 'Đã nhập hàng' },
                { value: 'cancelled', label: 'Đã hủy' },
              ]
              : [
                { value: 'draft', label: 'Bản nháp' },
                { value: 'confirmed', label: 'Đã nhập kho' },
                { value: 'cancelled', label: 'Đã hủy' },
              ],
            className: '!w-40',
          },
        ]}
        onReset={subtab === 'po' ? onPurchaseReset : onReceiptReset}
      />

      <div className="glass-panel border border-border rounded-xl overflow-hidden">
        {subtab === 'po' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Mã PO" sortKey="code" activeSort={purchaseSort} order={purchaseOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Nhà cung cấp" sortKey="supplierName" activeSort={purchaseSort} order={purchaseOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Ngày đặt" sortKey="purchaseDate" activeSort={purchaseSort} order={purchaseOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Tổng giá trị" sortKey="totalAmount" activeSort={purchaseSort} order={purchaseOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={purchaseSort} order={purchaseOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Không có đơn mua phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{po.code}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{po.supplierName}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{po.purchaseDate}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{formatCurrency(po.totalAmount)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          po.status === 'received' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          po.status === 'draft' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-150'
                        }`}>
                          {po.status === 'received' ? 'Đã nhập hàng' : po.status === 'draft' ? 'Bản nháp' : 'Đã đặt hàng'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => onViewDetails('po', po.id)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Xem chi tiết PO"
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Số phiếu" sortKey="code" activeSort={receiptSort} order={receiptOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Theo PO</th>
                  <th className="px-6 py-4"><SortableHeader label="Kho nhập" sortKey="warehouseName" activeSort={receiptSort} order={receiptOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Ngày nhập" sortKey="receiptDate" activeSort={receiptSort} order={receiptOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Giá trị lô" sortKey="totalAmount" activeSort={receiptSort} order={receiptOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={receiptSort} order={receiptOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Không có phiếu nhập phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  stockReceipts.map((sr) => (
                    <tr key={sr.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{sr.code}</td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{sr.purchaseOrderCode || 'Nhập lẻ'}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{sr.warehouseName}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{sr.receiptDate}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{formatCurrency(sr.totalAmount)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          sr.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {sr.status === 'confirmed' ? 'Đã nhập kho' : 'Bản nháp (Chờ xác nhận)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => onViewDetails('receipt', sr.id)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Xem chi tiết phiếu"
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
        )}
        <PaginationControls
          page={subtab === 'po' ? purchasePage : receiptPage}
          limit={limit}
          total={subtab === 'po' ? purchaseTotal : receiptTotal}
          onPageChange={subtab === 'po' ? onPurchasePageChange : onReceiptPageChange}
          alwaysShow
        />
      </div>

      {/* PO CREATION MODAL */}
      <Modal isOpen={isPoOpen} onClose={() => setIsPoOpen(false)} title="Lập đơn đặt mua hàng (Purchase Order)" maxWidthClass="max-w-[min(96rem,calc(100vw-2rem))]">
        <form onSubmit={handlePoSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã PO *</label>
              <input type="text" required placeholder="PO-001..." value={newPo.code} onChange={e => setNewPo({...newPo, code: e.target.value})} className="premium-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nhà cung cấp *</label>
              <SearchableSelect
                value={newPo.supplierId}
                placeholder="-- Chọn NCC --"
                searchPlaceholder="Tìm nhà cung cấp..."
                options={suppliers.map(s => ({
                  value: s.id,
                  label: s.name,
                  description: s.code,
                }))}
                onChange={(supplierId) => setNewPo({...newPo, supplierId})}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày đặt hàng</label>
              <input type="date" value={newPo.purchaseDate} onChange={e => setNewPo({...newPo, purchaseDate: e.target.value})} className="premium-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú</label>
              <input type="text" placeholder="Ghi chú đơn hàng" value={newPo.notes} onChange={e => setNewPo({...newPo, notes: e.target.value})} className="premium-input" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-border pb-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Danh sách dòng hàng</h3>
              <button type="button" onClick={() => setNewPo({...newPo, items: [...newPo.items, { productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]})} className="text-xs font-bold text-primary hover:underline cursor-pointer">
                + Thêm dòng
              </button>
            </div>
            <div className="space-y-2 overflow-x-auto pb-1">
              {newPo.items.map((it, idx) => (
                <div key={idx} className="grid min-w-[760px] grid-cols-[minmax(18rem,1fr)_7rem_10rem_2.5rem] gap-2 items-center">
                  <SearchableSelect
                    value={it.productId}
                    placeholder="-- Sản phẩm --"
                    searchPlaceholder="Tìm sản phẩm..."
                    options={products.map(p => ({
                      value: p.id,
                      label: `${p.name} (${p.code})`,
                      description: p.unitCode,
                    }))}
                    onChange={(productId) => handlePoLineChange(idx, 'productId', productId)}
                  />
                  <input type="number" required placeholder="SL" min={1} value={it.quantity} onChange={e => handlePoLineChange(idx, 'quantity', Number(e.target.value))} className="premium-input" />
                  <input type="number" required placeholder="Đơn giá" min={0} value={it.unitPrice} onChange={e => handlePoLineChange(idx, 'unitPrice', Number(e.target.value))} className="premium-input" />
                  <button type="button" onClick={() => setNewPo({...newPo, items: newPo.items.filter((_, i) => i !== idx)})} className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsPoOpen(false)} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 cursor-pointer">Tạo đơn đặt mua</button>
          </div>
        </form>
      </Modal>

      {/* GOODS RECEIPT CREATION MODAL */}
      <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Lập phiếu nhập kho hàng (Goods Inward)" maxWidthClass="max-w-[min(96rem,calc(100vw-2rem))]">
        <form onSubmit={handleReceiptSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã phiếu nhập *</label>
              <input type="text" required placeholder="PNK-001..." value={newReceipt.code} onChange={e => setNewReceipt({...newReceipt, code: e.target.value})} className="premium-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kho nhập hàng *</label>
              <SearchableSelect
                value={newReceipt.warehouseId}
                placeholder="-- Chọn Kho --"
                searchPlaceholder="Tìm kho..."
                options={warehouses.map(w => ({
                  value: w.id,
                  label: w.name,
                  description: w.code,
                }))}
                onChange={(warehouseId) => setNewReceipt({...newReceipt, warehouseId})}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Theo đơn đặt mua (PO)</label>
              <SearchableSelect
                value={newReceipt.purchaseOrderId}
                placeholder="-- Nhập lẻ không theo PO --"
                searchPlaceholder="Tìm PO, nhà cung cấp..."
                options={purchaseOrders.filter(po => po.status !== 'received').map(po => ({
                  value: po.id,
                  label: `${po.code} (${po.supplierName})`,
                  description: po.purchaseDate,
                }))}
                onChange={handleReceiptPoSelect}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày lập phiếu</label>
              <input type="date" value={newReceipt.receiptDate} onChange={e => setNewReceipt({...newReceipt, receiptDate: e.target.value})} className="premium-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú</label>
            <input type="text" placeholder="Diễn giải nhập hàng" value={newReceipt.notes} onChange={e => setNewReceipt({...newReceipt, notes: e.target.value})} className="premium-input" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-border pb-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Danh sách hàng nhập kho</h3>
              {!newReceipt.purchaseOrderId && (
                <button type="button" onClick={() => setNewReceipt({...newReceipt, items: [...newReceipt.items, { productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]})} className="text-xs font-bold text-primary hover:underline cursor-pointer">
                  + Thêm dòng
                </button>
              )}
            </div>
            <div className="space-y-2 overflow-x-auto pb-1">
              {newReceipt.items.map((it, idx) => (
                <div key={idx} className="grid min-w-[760px] grid-cols-[minmax(18rem,1fr)_7rem_10rem_2.5rem] gap-2 items-center">
                  <SearchableSelect
                    value={it.productId}
                    placeholder="-- Sản phẩm --"
                    searchPlaceholder="Tìm sản phẩm..."
                    options={products.map(p => ({
                      value: p.id,
                      label: `${p.name} (${p.code})`,
                      description: p.unitCode,
                    }))}
                    onChange={(productId) => handleReceiptLineChange(idx, 'productId', productId)}
                    disabled={!!newReceipt.purchaseOrderId}
                  />
                  <input type="number" required placeholder="SL" min={1} value={it.quantity} onChange={e => handleReceiptLineChange(idx, 'quantity', Number(e.target.value))} disabled={!!newReceipt.purchaseOrderId} className="premium-input disabled:opacity-75" />
                  <input type="number" required placeholder="Đơn giá" min={0} value={it.unitPrice} onChange={e => handleReceiptLineChange(idx, 'unitPrice', Number(e.target.value))} disabled={!!newReceipt.purchaseOrderId} className="premium-input disabled:opacity-75" />
                  {!newReceipt.purchaseOrderId && (
                    <button type="button" onClick={() => setNewReceipt({...newReceipt, items: newReceipt.items.filter((_, i) => i !== idx)})} className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsReceiptOpen(false)} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 cursor-pointer">Lập phiếu nhập</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
