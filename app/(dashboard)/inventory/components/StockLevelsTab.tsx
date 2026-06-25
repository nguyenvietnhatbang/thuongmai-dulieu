'use client';

import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';

interface InventoryBalance {
  productId: string;
  productName: string;
  productCode: string;
  unitCode: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  averageCost: number;
  minQuantity: number;
}

interface StockLevelsTabProps {
  balances: InventoryBalance[];
  warehouses: Array<{ id: string; name: string }>;
  search: string;
  warehouseId: string;
  stockState: string;
  page: number;
  total: number;
  sort: string;
  order: 'asc' | 'desc';
  onSearchChange: (value: string) => void;
  onWarehouseChange: (value: string) => void;
  onStockStateChange: (value: string) => void;
  onReset: () => void;
  onPageChange: (page: number) => void;
  onSort: (sortKey: string) => void;
}

const LIMIT = 10;

export function StockLevelsTab({
  balances,
  warehouses,
  search,
  warehouseId,
  stockState,
  page,
  total,
  sort,
  order,
  onSearchChange,
  onWarehouseChange,
  onStockStateChange,
  onReset,
  onPageChange,
  onSort,
}: StockLevelsTabProps) {
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
            value: stockState,
            placeholder: 'Tình trạng',
            onChange: onStockStateChange,
            options: [
              { value: 'low', label: 'Tồn thấp' },
              { value: 'safe', label: 'An toàn' },
            ],
            className: '!w-32',
          },
        ]}
        onReset={onReset}
      />

      <div className="glass-panel border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-6 py-4"><SortableHeader label="Kho chứa" sortKey="warehouseName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Mã hàng" sortKey="productCode" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Tên hàng hóa" sortKey="productName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4 text-center"><SortableHeader label="Tồn thực tế" sortKey="quantityOnHand" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4 text-center">Đã giữ</th>
                <th className="px-6 py-4 text-center">Khả dụng</th>
                <th className="px-6 py-4 text-right">Giá vốn TB</th>
                <th className="px-6 py-4 text-center"><SortableHeader label="Định mức" sortKey="minQuantity" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">Trạng thái định mức</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {balances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Không có số dư kho phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                balances.map((b) => {
                  const isLow = b.quantityOnHand <= b.minQuantity;
                  return (
                    <tr key={`${b.productId}-${b.warehouseId}`} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{b.warehouseName}</td>
                      <td className="px-6 py-4 font-mono text-xs text-primary">{b.productCode}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{b.productName}</td>
                      <td className="px-6 py-4 text-center font-extrabold text-slate-800">{b.quantityOnHand} {b.unitCode}</td>
                      <td className="px-6 py-4 text-center font-medium text-slate-500">{b.reservedQuantity} {b.unitCode}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">{b.availableQuantity} {b.unitCode}</td>
                      <td className="px-6 py-4 text-right text-xs font-semibold text-slate-700">
                        {new Intl.NumberFormat('vi-VN').format(b.averageCost)}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-500">{b.minQuantity} {b.unitCode}</td>
                      <td className="px-6 py-4">
                        {isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1.5 w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            Tồn kho thấp!
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5 w-fit">
                            An toàn
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} limit={LIMIT} total={total} onPageChange={onPageChange} alwaysShow />
      </div>
    </div>
  );
}
