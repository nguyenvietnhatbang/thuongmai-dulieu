import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const bucketName = process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents';

const isPlaceholder =
  !supabaseUrl ||
  supabaseUrl.includes('YOUR_PROJECT_REF') ||
  !supabaseAnonKey ||
  supabaseAnonKey.includes('YOUR_SUPABASE_ANON') ||
  !supabaseServiceKey ||
  supabaseServiceKey.includes('YOUR_SUPABASE_SERVICE');

const supabase = isPlaceholder
  ? null
  : createClient(supabaseUrl, supabaseServiceKey);

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ success: boolean; objectPath?: string; error?: string }> {
  if (isPlaceholder) {
    const randomId = Math.random().toString(36).substring(7);
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectPath = `mock/${randomId}_${safeName}`;
    return { success: true, objectPath };
  }

  try {
    const randomId = Math.random().toString(36).substring(7);
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectPath = `uploads/${randomId}_${safeName}`;

    const { data, error } = await supabase!.storage
      .from(bucketName)
      .upload(objectPath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, objectPath: data.path };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteFile(objectPath: string): Promise<{ success: boolean; error?: string }> {
  if (isPlaceholder) {
    return { success: true };
  }

  try {
    const { error } = await supabase!.storage
      .from(bucketName)
      .remove([objectPath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function getPublicUrl(objectPath: string): string {
  if (isPlaceholder || objectPath.startsWith('mock/')) {
    // Return high quality mock document images based on filename
    const lowerPath = objectPath.toLowerCase();
    if (lowerPath.includes('contract') || lowerPath.includes('hopdong')) {
      return 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=85';
    }
    if (lowerPath.includes('invoice') || lowerPath.includes('hoadon') || lowerPath.includes('receivable')) {
      return 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=85';
  }

  const { data } = supabase!.storage.from(bucketName).getPublicUrl(objectPath);
  return data.publicUrl;
}
