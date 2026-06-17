import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { updatePaymentMilestone } from '@/features/contracts/services/contract.service';

export const dynamic = 'force-dynamic';

/**
 * PATCH: Update payment milestone collection amount or status
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Must have receivables update privileges to edit payment milestones
    const allowed = user.roles.includes('system_management') || await hasPermission('receivables.update_status.all');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to collect payments' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amountPaid, status } = body;

    const updated = await updatePaymentMilestone(id, {
      amountPaid: amountPaid !== undefined ? Number(amountPaid) : undefined,
      status,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Payment milestone updated successfully'
    });
  } catch (error: any) {
    console.error('API Milestone PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update milestone' },
      { status: 500 }
    );
  }
}
