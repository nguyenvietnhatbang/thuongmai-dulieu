'use client';

import { usePathname } from 'next/navigation';

export function HeaderTitle() {
  const pathname = usePathname();

  // Helper to map pathname to Title and Breadcrumb
  const getHeaderInfo = (path: string) => {
    switch (path) {
      case '/':
        return { title: 'Dashboard chức năng', breadcrumb: 'Hệ thống / Chức năng' };
      case '/dashboard-reports':
        return { title: 'Dashboard báo cáo', breadcrumb: 'Hệ thống / Biểu đồ báo cáo' };
      case '/customers':
        return { title: 'Khách hàng', breadcrumb: 'Trang chủ > Khách hàng' };
      case '/opportunities':
        return { title: 'Cơ hội bán hàng', breadcrumb: 'Trang chủ > Cơ hội bán hàng' };
      case '/quotes':
        return { title: 'Báo giá', breadcrumb: 'Trang chủ > Báo giá dịch vụ' };
      case '/contracts':
        return { title: 'Hợp đồng', breadcrumb: 'Trang chủ > Hợp đồng & Đợt thanh toán' };
      case '/projects':
        return { title: 'Dự án & Công việc', breadcrumb: 'Trang chủ > Triển khai dự án' };
      case '/customer-care':
        return { title: 'Chăm sóc định kỳ', breadcrumb: 'Trang chủ > Chăm sóc khách hàng' };
      case '/inventory':
        return { title: 'Quản lý tồn kho', breadcrumb: 'Trang chủ > Quản lý tồn kho' };
      case '/purchases':
        return { title: 'Mua hàng & Nhập kho', breadcrumb: 'Trang chủ > Mua hàng & Nhập kho' };
      case '/masters':
        return { title: 'Danh mục cơ sở', breadcrumb: 'Trang chủ > Danh mục cơ sở' };
      case '/receivables':
        return { title: 'Công nợ thu chi', breadcrumb: 'Trang chủ > Công nợ phải thu' };
      case '/reports':
        return { title: 'Báo cáo', breadcrumb: 'Trang chủ > Báo cáo thương mại' };
      case '/admin':
        return { title: 'Quản trị phân quyền', breadcrumb: 'Trang chủ > Cấu hình & Hệ thống > Phân quyền' };
      case '/settings':
        return { title: 'Cấu hình công ty', breadcrumb: 'Trang chủ > Cấu hình & Hệ thống > Công ty' };
      default:
        return { title: 'Tổng quan', breadcrumb: 'Hệ thống / Tổng quan' };
    }
  };

  const { title, breadcrumb } = getHeaderInfo(pathname);

  return (
    <div className="min-w-0">
      <h2 className="text-base font-bold text-foreground leading-tight truncate">{title}</h2>
      <div className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate">{breadcrumb}</div>
    </div>
  );
}
