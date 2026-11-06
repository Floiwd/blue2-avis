import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limiter';


export async function POST(req: NextRequest) {
  try {
    // 1. IP Detection & Rate Limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const rate = checkRateLimit(ip, 6, 60 * 60 * 1000);
    if (!rate.success) {
      return NextResponse.json(
        {
          error:
            'Trop de soumissions récentes. Par mesure de sécurité anti-spam, veuillez patienter avant de soumettre un nouvel avis.',
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Anti-spam Honeypot Check
    if (body.website_url_hp || body.telephone_fax_hp) {
      console.warn('Bot detected by honeypot, silent rejection for IP:', ip);
      return NextResponse.json({ success: true, message: 'Merci pour votre avis !' });
    }

    // 3. Validation des champs
    const {
      site_id,
      collaborateur_id,
      intitule_prestation,
      note_conseil,
      note_diversite,
      note_proprete,
      note_engagements,
      note_qualite_prix,
      note_recommandation,
      commentaire,
      photos = [],
      nom,
      prenom,
      email,
      telephone,
      societe,
    } = body;

    if (!site_id || !collaborateur_id) {
      return NextResponse.json(
        { error: 'Veuillez sélectionner une agence et un collaborateur.' },
        { status: 400 }
      );
    }

    const notes = [
      Number(note_conseil),
      Number(note_diversite),
      Number(note_proprete),
      Number(note_engagements),
      Number(note_qualite_prix),
      Number(note_recommandation),
    ];

    for (const n of notes) {
      if (isNaN(n) || n < 1 || n > 5) {
        return NextResponse.json(
          { error: 'Toutes les notations doivent être comprises entre 1 et 5 gouttes d\'eau.' },
          { status: 400 }
        );
      }
    }

    if (!nom || !prenom || !nom.trim() || !prenom.trim()) {
      return NextResponse.json(
        { error: 'Veuillez renseigner votre nom et prénom.' },
        { status: 400 }
      );
    }

    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: 'L\'adresse e-mail renseignée n\'est pas valide.' },
        { status: 400 }
      );
    }

    // 4. Traitement des clés photos Cloudflare R2 (max 8 photos)
    const sanitizedPhotos = Array.isArray(photos)
      ? photos.slice(0, 8).map((p: any) => (typeof p === 'object' ? JSON.stringify(p) : String(p)))
      : [];

    // 5. Données de l'avis
    const newAvis = {
      site_id,
      collaborateur_id,
      intitule_prestation: intitule_prestation?.trim() || null,
      note_conseil: Number(note_conseil),
      note_diversite: Number(note_diversite),
      note_proprete: Number(note_proprete),
      note_engagements: Number(note_engagements),
      note_qualite_prix: Number(note_qualite_prix),
      note_recommandation: Number(note_recommandation),
      commentaire: commentaire?.trim() || null,
      photos: sanitizedPhotos,
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email?.trim() || null,
      telephone: telephone?.trim() || null,
      societe: societe?.trim() || null,
      statut: 'approuve',
      ip_hash: Buffer.from(ip).toString('base64').substring(0, 16),
      user_agent: req.headers.get('user-agent')?.substring(0, 150) || null,
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        avisId: 'demo-' + Date.now(),
        message: 'Avis enregistré avec succès (Mode Démo Vercel).',
      });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const { data, error } = await supabase
      .from('avis')
      .insert([newAvis])
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      avisId: data?.id,
      message: 'Votre avis a été enregistré avec succès. Merci !',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Submission failed';
    console.error('Error submitting avis:', message);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'enregistrement de votre avis.' },
      { status: 500 }
    );
  }
}
