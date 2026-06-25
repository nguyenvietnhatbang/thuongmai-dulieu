import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const allowedFileTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

const blockedExtensions = new Set([
  'bat',
  'cmd',
  'com',
  'exe',
  'js',
  'jar',
  'msi',
  'ps1',
  'scr',
  'sh',
  'vbs',
]);

function isAllowedUpload(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (blockedExtensions.has(extension)) return false;
  return file.type.startsWith('image/') || allowedFileTypes.has(file.type);
}

// GET: List files for a specific entity
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json({ success: false, error: 'entityType and entityId are required' }, { status: 400 });
    }

    const res = await query(
      `SELECT id, bucket, object_path as "objectPath", original_name as "originalName", content_type as "contentType", size_bytes as "sizeBytes", created_at as "createdAt"
       FROM app.file_assets
       WHERE entity_type = $1 AND entity_id = $2 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [entityType, entityId]
    );

    const files = res.rows.map(row => ({
      ...row,
      publicUrl: getPublicUrl(row.objectPath)
    }));

    return NextResponse.json({ success: true, data: files });
  } catch (error: any) {
    console.error('API Files GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Upload a file for an entity
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const entityType = formData.get('entityType') as string | null;
    const entityId = formData.get('entityId') as string | null;

    if (!file || !entityType || !entityId) {
      return NextResponse.json({ success: false, error: 'File, entityType and entityId are required' }, { status: 400 });
    }

    if (!isAllowedUpload(file)) {
      return NextResponse.json({
        success: false,
        error: 'Hệ thống chỉ hỗ trợ PDF, Word, Excel, CSV và hình ảnh; các tệp thực thi bị từ chối.'
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase/Mock Storage
    const bucket = process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents';
    const uploadResult = await uploadFile(buffer, file.name, file.type);

    if (!uploadResult.success || !uploadResult.objectPath) {
      return NextResponse.json({ success: false, error: uploadResult.error || 'Failed to upload to storage' }, { status: 500 });
    }

    // Insert metadata into database
    const insertRes = await query(
      `INSERT INTO app.file_assets (bucket, object_path, original_name, content_type, size_bytes, entity_type, entity_id, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, bucket, object_path as "objectPath", original_name as "originalName", content_type as "contentType", size_bytes as "sizeBytes", created_at as "createdAt"`,
      [
        bucket,
        uploadResult.objectPath,
        file.name,
        file.type,
        file.size,
        entityType,
        entityId,
        user.id
      ]
    );

    const savedFile = insertRes.rows[0];
    const fileWithUrl = {
      ...savedFile,
      publicUrl: getPublicUrl(savedFile.objectPath)
    };

    return NextResponse.json({
      success: true,
      data: fileWithUrl,
      message: 'Tệp tin đã được tải lên thành công!'
    });
  } catch (error: any) {
    console.error('API Files POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a file asset
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id parameter is required' }, { status: 400 });
    }

    // Get the object path to delete from storage
    const fileRes = await query(
      'SELECT object_path FROM app.file_assets WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (fileRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const objectPath = fileRes.rows[0].object_path;

    // Delete from storage
    await deleteFile(objectPath);

    // Soft delete in database
    await query(
      'UPDATE app.file_assets SET deleted_at = NOW() WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Tệp tin đã được xóa thành công!'
    });
  } catch (error: any) {
    console.error('API Files DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
