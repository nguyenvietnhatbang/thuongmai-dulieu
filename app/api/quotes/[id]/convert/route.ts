import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { convertToContract } from '@/features/quotes/services/quote.service';

export const dynamic = 'force-dynamic';

/**
 * POST: Convert approved quote to a contract
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Must have contract creation rights
    const allowed = user.roles.includes('system_management') || await hasPermission('contracts.create.all');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: You cannot create contracts' }, { status: 403 });
    }

    const { id } = await params;

    const result = await convertToContract(id, user.id);
    return NextResponse.json({
      success: true,
      data: result,
      message: `Báo giá đã được chuyển đổi thành hợp đồng ${result.contractNumber} thành công.`
    });
  } catch (error: any) {
    console.error('API Quote Convert error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to convert quote to contract' },
      { status: 500 }
    );
  }
}
