'use client';

interface InventoryBalance {
  productId: string;
  productName: string;
  productCode: string;
  unitCode: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  minQuantity: number;
}

interface StockLevelsTabProps {
  balances: InventoryBalance[];
  search: string;
}

export function StockLevelsTab({ balances, search }: StockLevelsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex bg-slate-50/50 border border-border rounded-xl p-3 text-xs font-bold text-slate-700">
        Danh sách số dư kho thực tế
      </div>

      <div className="glass-panel border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-6 py-4">Kho chứa</th>
                <th className="px-6 py-4">Mã hàng</th>
                <th className="px-6 py-4">Tên hàng hóa</th>
                <th className="px-6 py-4 text-center">Tồn thực tế</th>
                <th className="px-6 py-4 text-center">Định mức</th>
                <th className="px-6 py-4">Trạng thái định mức</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {balances
                .filter(b => b.productName.toLowerCase().includes(search.toLowerCase()) || b.productCode.toLowerCase().includes(search.toLowerCase()) || b.warehouseName.toLowerCase().includes(search.toLowerCase()))
                .map((b, idx) => {
                  const isLow = b.quantityOnHand <= b.minQuantity;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{b.warehouseName}</td>
                      <td className="px-6 py-4 font-mono text-xs text-primary">{b.productCode}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{b.productName}</td>
                      <td className="px-6 py-4 text-center font-extrabold text-slate-800">{b.quantityOnHand} {b.unitCode}</td>
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
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
