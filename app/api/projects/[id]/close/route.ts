import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { closeProject } from '@/features/projects/services/project.service';

export const dynamic = 'force-dynamic';

/**
 * POST: Execute project closure / acceptance
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

    // Checking if PM or Admin
    const allowed = user.roles.includes('system_management') || 
      user.roles.includes('project_operation') ||
      await hasPermission('projects.assign.team');

    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to close projects' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      code,
      closedDate,
      acceptanceStatus,
      archiveStatus,
      completionSummary,
      acceptanceFileAssetId,
      receivableCompleted,
      notes
    } = body;

    if (!code || !closedDate || !acceptanceStatus || !archiveStatus) {
      return NextResponse.json({ success: false, error: 'Missing required fields: code, closedDate, acceptanceStatus, archiveStatus' }, { status: 400 });
    }

    const result = await closeProject({
      projectId: id,
      code,
      closedDate,
      acceptanceStatus,
      archiveStatus,
      completionSummary,
      acceptanceFileAssetId,
      receivableCompleted,
      notes,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Project closed successfully'
    });
  } catch (error: any) {
    console.error('API Project Close error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to close project' },
      { status: 500 }
    );
  }
}
