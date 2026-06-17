import { getCurrentUser } from '@/lib/auth';
import { ReportsClient } from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  return <ReportsClient currentUser={currentUser} />;
}
