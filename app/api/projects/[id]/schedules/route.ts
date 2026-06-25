import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getProjectSchedules, createProjectSchedule } from '@/features/projects/services/project.service';

export const dynamic = 'force-dynamic';

/**
 * GET: Retrieve list of schedules for a project
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const schedules = await getProjectSchedules(id);
    return NextResponse.json({
      success: true,
      data: schedules
    });
  } catch (error: any) {
    console.error('API Project Schedules GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedules', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a schedule inside a project
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

    const { id } = await params;
    const body = await request.json();
    const {
      customerId,
      scheduleType,
      title,
      startsAt,
      endsAt,
      ownerUserId,
      location,
      internalAttendeeIds,
      notes
    } = body;

    if (!title || !customerId || !startsAt || !scheduleType) {
      return NextResponse.json({ success: false, error: 'Missing required fields: title, customerId, startsAt, scheduleType' }, { status: 400 });
    }

    const newSchedule = await createProjectSchedule({
      projectId: id,
      customerId,
      scheduleType,
      title,
      startsAt,
      endsAt,
      ownerUserId,
      location,
      internalAttendeeIds,
      notes,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: newSchedule,
      message: 'Schedule created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Project Schedules POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule', details: error.message },
      { status: 500 }
    );
  }
}
