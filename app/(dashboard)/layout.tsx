import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { UserSwitcher } from '@/components/ui/UserSwitcher';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { SidebarNav } from '@/components/ui/SidebarNav';
import { HeaderTitle } from '@/components/ui/HeaderTitle';

// Force dynamic execution
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {/* Sidebar Navigation - Dark Navy Blue Theme */}
      <aside className="w-64 border-r border-slate-800 bg-[#0b1a30] text-slate-100 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-800/80">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/25">
              <span>AG</span>
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-100 leading-none">Antigravity CRM</h1>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Commerce Edition</span>
            </div>
          </div>

          {/* Client Navigation Sidebar Component */}
          <SidebarNav
            currentUser={{
              roles: currentUser.roles,
              permissions: currentUser.permissions,
            }}
          />
        </div>

        {/* User Info & Switcher Panel in Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 flex flex-col gap-2">
          <div className="flex flex-col gap-0.5 px-2">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-none">Phòng ban</span>
            <span className="text-xs font-bold text-slate-200 truncate">{currentUser.fullName.split('(')[0].trim()}</span>
            <span className="text-[10px] text-slate-400 font-mono">{currentUser.email}</span>
          </div>
          <UserSwitcher currentUser={{
            id: currentUser.id,
            fullName: currentUser.fullName,
            email: currentUser.email,
            roles: currentUser.roles
          }} />
        </div>
      </aside>

      {/* Main App Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header toolbar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 z-10 shrink-0">
          {/* Dynamic page title and breadcrumbs */}
          <HeaderTitle />
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-muted-foreground leading-none">Thời gian</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">17/06/2026</p>
            </div>
            
            <div className="h-8 w-px bg-border hidden sm:block" />

            {/* Notification Bell */}
            <NotificationBell />
          </div>
        </header>

        {/* Content body container (overflow-hidden to support custom page scroll scrollbars) */}
        <main className="flex-1 overflow-hidden p-8 relative animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
