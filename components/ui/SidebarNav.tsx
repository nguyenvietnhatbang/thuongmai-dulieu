'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
  requiredAnyPermission?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
  requiredAnyPermission?: string[];
}

interface SidebarNavProps {
  currentUser: {
    roles: string[];
    permissions: string[];
  };
}

export function SidebarNav({ currentUser }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const hasAnyPermission = (permissionsToCheck?: string[]) => {
    if (!permissionsToCheck || permissionsToCheck.length === 0) return true;
    if (currentUser.roles.includes('system_management')) return true;
    return permissionsToCheck.some(perm => currentUser.permissions.includes(perm));
  };

  const sections: NavSection[] = [
    {
      title: "Kinh doanh / CRM",
      requiredAnyPermission: [
        'customers.view.own', 'customers.view.team', 'customers.view.all',
        'opportunities.view.own',
        'quotes.view.team',
        'contracts.view.team'
      ],
      items: [
        {
          name: "Khách hàng",
          href: "/customers",
          permission: "customers.view.own",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )
        },
        {
          name: "Cơ hội bán hàng",
          href: "/opportunities",
          permission: "opportunities.view.own",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )
        },
        {
          name: "Báo giá",
          href: "/quotes",
          permission: "quotes.view.team",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        },
        {
          name: "Hợp đồng",
          href: "/contracts",
          permission: "contracts.view.team",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        }
      ]
    },
    {
      title: "Triển khai & Chăm sóc",
      requiredAnyPermission: [
        'projects.view.team', 'tasks.view.own', 'customer_care.view.own'
      ],
      items: [
        {
          name: "Dự án & Công việc",
          href: "/projects",
          permission: "projects.view.team",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          )
        },
        {
          name: "Lịch trình hoạt động",
          href: "/schedules",
          permission: "projects.view.team",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        },
        {
          name: "Chăm sóc định kỳ",
          href: "/customer-care",
          permission: "customer_care.view.own",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )
        }
      ]
    },
    {
      title: "Thương mại & Kho",
      requiredAnyPermission: [
        'suppliers.view.all', 'inventory.view.all',
        'purchases.create.all', 'stock_receipts.create.all', 'sales_orders.create.all',
        'receivables.view.team', 'reports.view.team'
      ],
      items: [
        {
          name: "Quản lý tồn kho",
          href: "/inventory",
          permission: "inventory.view.all",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          )
        },
        {
          name: "Mua & Nhập kho",
          href: "/purchases",
          permission: "inventory.view.all",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          )
        },
        {
          name: "Danh mục cơ sở",
          href: "/masters",
          permission: "inventory.view.all",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          )
        },
        {
          name: "Công nợ thu chi",
          href: "/receivables",
          permission: "receivables.view.team",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          name: "Báo cáo",
          href: "/reports",
          permission: "reports.view.team",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m4 6V7m4 10v-4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )
        }
      ]
    },
    {
      title: "Cấu hình & Hệ thống",
      requiredAnyPermission: [
        'users.update.all', 'roles.configure.all', 'settings.configure.all'
      ],
      items: [
        {
          name: "Quản trị phân quyền",
          href: "/admin",
          requiredAnyPermission: ['users.update.all', 'roles.configure.all'],
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          )
        },
        {
          name: "Cấu hình công ty",
          href: "/settings",
          permission: "settings.configure.all",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4 6 3v15M9 9h1m-1 4h1m4-4h1m-1 4h1M9 21v-4h6v4" />
            </svg>
          )
        }
      ]
    }
  ];

  // Helper to color-code section headers based on title
  const getSectionHeaderColor = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('kinh doanh') || t.includes('crm')) return 'text-emerald-400';
    if (t.includes('triển khai') || t.includes('chăm sóc')) return 'text-pink-400';
    if (t.includes('thương mại') || t.includes('kho')) return 'text-cyan-400';
    if (t.includes('cấu hình') || t.includes('hệ thống') || t.includes('quản trị')) return 'text-sky-400';
    return 'text-slate-400';
  };

  const isLinkActive = (href: string) => {
    if (pendingHref) {
      return pendingHref === href || (href !== '/' && pendingHref.startsWith(href));
    }
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const prefetchRoute = (href: string) => {
    if (href !== pathname) router.prefetch(href);
  };

  return (
    <nav className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-80px)]">
      {/* Dashboard link (always visible) */}
      <div className="space-y-1">
        <Link
          href="/"
          prefetch
          onClick={() => setPendingHref('/')}
          onMouseEnter={() => prefetchRoute('/')}
          onFocus={() => prefetchRoute('/')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group cursor-pointer ${
            isLinkActive('/')
              ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-500/10'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg
            className={`w-5 h-5 transition-colors ${
              isLinkActive('/') ? 'text-white' : 'text-slate-400 group-hover:text-white'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          <span>Dashboard</span>
        </Link>
        <Link
          href="/dashboard-reports"
          prefetch
          onClick={() => setPendingHref('/dashboard-reports')}
          onMouseEnter={() => prefetchRoute('/dashboard-reports')}
          onFocus={() => prefetchRoute('/dashboard-reports')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group cursor-pointer ${
            isLinkActive('/dashboard-reports')
              ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-500/10'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg
            className={`w-5 h-5 transition-colors ${
              isLinkActive('/dashboard-reports') ? 'text-white' : 'text-slate-400 group-hover:text-white'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m4 6V7m4 10v-4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>Dashboard báo cáo</span>
        </Link>
      </div>

      {/* Dynamic Sections */}
      {sections.map((sec, idx) => {
        if (!hasAnyPermission(sec.requiredAnyPermission)) return null;

        const visibleItems = sec.items.filter(item => {
          if (currentUser.roles.includes('system_management')) return true;
          if (item.requiredAnyPermission) return hasAnyPermission(item.requiredAnyPermission);
          if (item.permission) return currentUser.permissions.includes(item.permission);
          return true;
        });

        if (visibleItems.length === 0) return null;

        const headerColorClass = getSectionHeaderColor(sec.title);

        return (
          <div key={idx} className="space-y-1.5">
            <h3 className={`px-3 text-[10px] font-bold uppercase tracking-wider ${headerColorClass}`}>
              {sec.title === "Triển khai & Chăm sóc" ? "THỰC HIỆN" : sec.title.split('/')[0].trim()}
            </h3>
            <div className="space-y-0.5">
              {visibleItems.map((item, itemIdx) => {
                const active = isLinkActive(item.href);
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    prefetch
                    onClick={() => setPendingHref(item.href)}
                    onMouseEnter={() => prefetchRoute(item.href)}
                    onFocus={() => prefetchRoute(item.href)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 transition-colors ${
                        active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
