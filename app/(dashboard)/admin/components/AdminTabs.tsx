'use client';

import { PageTabs } from '@/components/ui/ListControls';
import { AdminTab } from './types';

interface AdminTabsProps {
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
}

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'users', label: 'Người dùng' },
  { id: 'roles', label: 'Vai trò' },
  { id: 'rbac', label: 'Phân quyền' },
];

export function AdminTabs({ activeTab, onChange }: AdminTabsProps) {
  return (
    <PageTabs
      tabs={tabs}
      active={activeTab}
      onChange={onChange}
    />
  );
}
