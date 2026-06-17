'use client';

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
  search: string;
  formatCurrency: (val: number) => string;
}

export function MovementsTab({ movements, search, formatCurrency }: MovementsTabProps) {
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
      <div className="flex bg-slate-50/50 border border-border rounded-xl p-3 text-xs font-bold text-slate-700">
        Nhật ký biến động kho hàng (Thẻ kho)
      </div>

      <div className="glass-panel border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Kho hàng</th>
                <th className="px-6 py-4">Loại biến động</th>
                <th className="px-6 py-4 text-center">Số lượng thay đổi</th>
                <th className="px-6 py-4 text-right">Đơn giá trị</th>
                <th className="px-6 py-4">Người thực hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movements
                .filter(m => m.productName.toLowerCase().includes(search.toLowerCase()) || m.productCode.toLowerCase().includes(search.toLowerCase()) || m.warehouseName.toLowerCase().includes(search.toLowerCase()))
                .map((m) => (
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
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
