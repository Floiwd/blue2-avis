import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase';


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ urls: [] });
    }

    const uploadedUrls: string[] = [];

    if (!isSupabaseConfigured()) {
      // Fallback base64 / data URL pour démo avant configuration des clés Supabase
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;
        uploadedUrls.push(dataUrl);
      }
      return NextResponse.json({ urls: uploadedUrls });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      throw new Error('Supabase client unavailable');
    }

    // Assure le bucket avis-photos
    const bucketName = 'avis-photos';

    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const buffer = await file.arrayBuffer();

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(cleanFileName, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Storage upload error:', error);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    console.error('Upload handler error:', message);
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement des photos' },
      { status: 500 }
    );
  }
}
