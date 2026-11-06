import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { getR2Client, isR2Configured } from '@/lib/r2';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'blue2-avis-photos';

export async function GET(req: NextRequest) {
  try {
    // Vérification de sécurité CRON_SECRET (envoyé automatiquement par Vercel Cron)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const manualKey = req.nextUrl.searchParams.get('key');
      if (manualKey !== cronSecret && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }
    }

    const report: Record<string, any> = {
      timestamp: new Date().toISOString(),
      supabase_keepalive: false,
      backup_github: false,
      total_avis: 0,
      total_r2_keys: 0,
    };

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Cron exécuté (Supabase non configuré)',
        report,
      });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    // (a) Requête Keep-Alive pour réveiller et maintenir actif le projet Supabase
    const { count: sitesCount, error: pingError } = await supabase
      .from('sites')
      .select('id', { count: 'exact', head: true });

    if (pingError) {
      report.keepalive_error = pingError.message;
    } else {
      report.supabase_keepalive = true;
      report.sites_count = sitesCount;
    }

    // (b) Export de sauvegarde de toutes les tables (avis, collaborateurs, sites)
    const { data: allSites } = await supabase.from('sites').select('*');
    const { data: allCollabs } = await supabase.from('collaborateurs').select('*');
    const { data: allAvis } = await supabase.from('avis').select('*');

    report.total_avis = allAvis?.length || 0;

    // Extraction et inventaire de toutes les clés R2 depuis la base
    const r2KeysFromDb = new Set<string>();
    (allAvis || []).forEach((avis: any) => {
      if (Array.isArray(avis.photos)) {
        avis.photos.forEach((item: any) => {
          if (typeof item === 'string') {
            try {
              const parsed = JSON.parse(item);
              if (parsed.original) r2KeysFromDb.add(parsed.original);
              if (parsed.thumbnail) r2KeysFromDb.add(parsed.thumbnail);
              if (!parsed.original && !parsed.thumbnail) r2KeysFromDb.add(item);
            } catch {
              r2KeysFromDb.add(item);
            }
          } else if (typeof item === 'object' && item !== null) {
            if (item.original) r2KeysFromDb.add(item.original);
            if (item.thumbnail) r2KeysFromDb.add(item.thumbnail);
          }
        });
      }
    });

    // Optionnel : Listing direct du bucket R2 si configuré
    let r2BucketObjects: { key: string; size?: number; lastModified?: Date }[] = [];
    if (isR2Configured()) {
      try {
        const r2Client = getR2Client();
        if (r2Client) {
          const listCmd = new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            MaxKeys: 1000,
          });
          const listRes = await r2Client.send(listCmd);
          if (listRes.Contents) {
            r2BucketObjects = listRes.Contents.map((obj) => ({
              key: obj.Key || '',
              size: obj.Size,
              lastModified: obj.LastModified,
            }));
          }
        }
      } catch (err: any) {
        console.warn('R2 listing warning in cron:', err.message);
      }
    }

    const r2KeysList = Array.from(r2KeysFromDb);
    report.total_r2_keys_db = r2KeysList.length;
    report.total_r2_keys_bucket = r2BucketObjects.length;

    const backupPayload = {
      backup_date: new Date().toISOString(),
      metadata: {
        app: 'Formulaire avis Blue 2.0',
        version: '2.0',
        sites_count: allSites?.length || 0,
        collaborateurs_count: allCollabs?.length || 0,
        avis_count: allAvis?.length || 0,
        r2_photos_count: r2KeysList.length,
        r2_bucket_objects_count: r2BucketObjects.length,
      },
      sites: allSites || [],
      collaborateurs: allCollabs || [],
      avis: allAvis || [],
      r2_keys_from_db: r2KeysList,
      r2_bucket_inventory: r2BucketObjects,
    };

    // Push vers GitHub si configuré
    const ghToken = process.env.GITHUB_BACKUP_TOKEN || process.env.GH_TOKEN;
    const ghRepo = process.env.GITHUB_BACKUP_REPO; // format "username/repo"

    if (ghToken && ghRepo) {
      const dateStr = new Date().toISOString().split('T')[0];
      const filePath = `backups/backup-blue2-${dateStr}.json`;
      const message = `chore(backup): sauvegarde automatique Blue 2.0 avis & R2 du ${dateStr}`;
      const contentBase64 = Buffer.from(
        JSON.stringify(backupPayload, null, 2)
      ).toString('base64');

      let sha: string | undefined = undefined;
      const getFileRes = await fetch(
        `https://api.github.com/repos/${ghRepo}/contents/${filePath}`,
        {
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Blue2-Backup-Cron',
          },
        }
      );

      if (getFileRes.ok) {
        const fileInfo = await getFileRes.json();
        sha = fileInfo.sha;
      }

      const putRes = await fetch(
        `https://api.github.com/repos/${ghRepo}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Blue2-Backup-Cron',
          },
          body: JSON.stringify({
            message,
            content: contentBase64,
            ...(sha ? { sha } : {}),
          }),
        }
      );

      if (putRes.ok) {
        report.backup_github = true;
        report.backup_file = filePath;
      } else {
        const errText = await putRes.text();
        report.backup_github_error = errText;
      }
    } else {
      report.backup_github_note =
        'GITHUB_BACKUP_TOKEN ou GITHUB_BACKUP_REPO non renseigné. La sauvegarde JSON avec clés R2 est disponible via la réponse HTTP et dans /admin.';
    }

    return NextResponse.json({
      success: true,
      report,
      backup_summary: backupPayload.metadata,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cron failed';
    console.error('Error during cron execution:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
