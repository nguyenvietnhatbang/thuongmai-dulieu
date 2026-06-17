import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getProjectNotes, createProjectNote } from '@/features/projects/services/project.service';

export const dynamic = 'force-dynamic';

/**
 * GET: Retrieve list of internal notes/messages for a project
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

    const notes = await getProjectNotes(id);
    return NextResponse.json({
      success: true,
      data: notes
    });
  } catch (error: any) {
    console.error('API Project Notes GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notes', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Create/Send an internal note
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
    const { customerId, recipientUserId, content, parentNoteId } = body;

    if (!content || !customerId || !recipientUserId) {
      return NextResponse.json({ success: false, error: 'Missing required fields: content, customerId, recipientUserId' }, { status: 400 });
    }

    const newNote = await createProjectNote({
      projectId: id,
      customerId,
      senderUserId: user.id,
      recipientUserId,
      content,
      parentNoteId
    });

    return NextResponse.json({
      success: true,
      data: newNote,
      message: 'Note created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Project Notes POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create note', details: error.message },
      { status: 500 }
    );
  }
}
