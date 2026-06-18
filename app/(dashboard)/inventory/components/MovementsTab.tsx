'use client';

import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';

interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  warehouseId: string;
  warehouseName: string;
  movementType: 'receipt' | 'sale' | 'adjustment';
  sourceType: string;
  sourceId: string;
  quantityDelta: number;
  unitCost: number;
  createdAt: string;
  createdByName: string;
}

interface MovementsTabProps {
  movements: InventoryMovement[];
  warehouses: Array<{ id: string; name: string }>;
  search: string;
  warehouseId: string;
  movementType: string;
  page: number;
  total: number;
  sort: string;
  order: 'asc' | 'desc';
  onSearchChange: (value: string) => void;
  onWarehouseChange: (value: string) => void;
  onMovementTypeChange: (value: string) => void;
  onReset: () => void;
  onPageChange: (page: number) => void;
  onSort: (sortKey: string) => void;
  formatCurrency: (val: number) => string;
  onExport: () => void;
}

const LIMIT = 10;

export function MovementsTab({
  movements,
  warehouses,
  search,
  warehouseId,
  movementType,
  page,
  total,
  sort,
  order,
  onSearchChange,
  onWarehouseChange,
  onMovementTypeChange,
  onReset,
  onPageChange,
  onSort,
  formatCurrency,
  onExport,
}: MovementsTabProps) {
  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'receipt': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'sale': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'adjustment': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getMovementTypeText = (type: string) => {
    switch (type) {
      case 'receipt': return 'Nhập kho';
      case 'sale': return 'Xuất kho (Bán)';
      case 'adjustment': return 'Điều chỉnh';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <ListToolbar
        search={search}
        searchPlaceholder="Tìm mã, tên hàng, kho..."
        onSearchChange={onSearchChange}
        onSearchSubmit={(event) => event.preventDefault()}
        showSearchButton={false}
        searchClassName="!w-64"
        filters={[
          {
            value: warehouseId,
            placeholder: 'Tất cả kho',
            onChange: onWarehouseChange,
            options: warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
            className: '!w-40',
          },
          {
            value: movementType,
            placeholder: 'Loại biến động',
            onChange: onMovementTypeChange,
            options: [
              { value: 'receipt', label: 'Nhập kho' },
              { value: 'sale', label: 'Xuất bán' },
              { value: 'adjustment', label: 'Điều chỉnh' },
              { value: 'return', label: 'Hoàn trả' },
            ],
            className: '!w-40',
          },
        ]}
        onReset={onReset}
        rightSlot={
          <button
            type="button"
            onClick={onExport}
            className="px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/15 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Xuất Excel
          </button>
        }
      />

      <div className="glass-panel border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-6 py-4"><SortableHeader label="Thời gian" sortKey="createdAt" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Sản phẩm" sortKey="productName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Kho hàng" sortKey="warehouseName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Loại biến động" sortKey="movementType" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4 text-center"><SortableHeader label="Số lượng" sortKey="quantityDelta" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4 text-right"><SortableHeader label="Đơn giá" sortKey="unitCost" activeSort={sort} order={order} onSort={onSort} align="right" /></th>
                <th className="px-6 py-4">Người thực hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Không có biến động kho phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs text-muted-foreground">{m.createdAt}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{m.productName}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{m.productCode}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{m.warehouseName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getMovementTypeBadge(m.movementType)}`}>
                        {getMovementTypeText(m.movementType)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-center font-extrabold ${m.quantityDelta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-800">{formatCurrency(m.unitCost)}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">{m.createdByName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} limit={LIMIT} total={total} onPageChange={onPageChange} alwaysShow />
      </div>
    </div>
  );
}
