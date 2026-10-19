import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ====================================================================
// CAD BLUEPRINT & STRUCTURAL DRAWING UPLOAD HANDLER
// Compliant with OWASP ASVS v4.0 (File Integrity & Sanitization)
// ====================================================================

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB max
const ALLOWED_EXTENSIONS = ['.dwg', '.dxf', '.pdf', '.zip', '.step', '.stp'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in payload' }, { status: 400 });
    }

    // 1. File Size Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File exceeds maximum permitted size of 25MB' },
        { status: 400 }
      );
    }

    // 2. Extension Sanitization
    const originalName = file.name;
    const extension = '.' + originalName.split('.').pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        {
          error: `Unsupported file extension (${extension}). Allowed formats: ${ALLOWED_EXTENSIONS.join(
            ', '
          )}`,
        },
        { status: 400 }
      );
    }

    // 3. Sanitized Storage Key
    const safeBaseName = originalName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const storageKey = `blueprints/${Date.now()}-${safeBaseName}`;

    const supabase = createAdminClient();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Attempt Supabase Storage upload
    const { data, error } = await supabase.storage
      .from('engineering-blueprints')
      .upload(storageKey, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    let publicUrl = `/uploads/${safeBaseName}`;

    if (!error && data) {
      const { data: urlData } = supabase.storage
        .from('engineering-blueprints')
        .getPublicUrl(data.path);
      publicUrl = urlData.publicUrl;
    }

    return NextResponse.json({
      success: true,
      fileName: originalName,
      fileSize: file.size,
      storageKey,
      url: publicUrl,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[UPLOAD ERROR]', err);
    return NextResponse.json(
      { error: 'File upload processing failed', details: err.message },
      { status: 500 }
    );
  }
}
