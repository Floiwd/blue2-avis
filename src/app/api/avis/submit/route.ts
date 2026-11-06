import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/db';
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
      ? photos.slice(0, 8).map((p: unknown) => (typeof p === 'object' ? p : { original: String(p) }))
      : [];

    if (!isDbConfigured()) {
      return NextResponse.json({
        success: true,
        avisId: 'demo-' + Date.now(),
        message: 'Avis enregistré avec succès (Mode Démo Vercel).',
      });
    }

    const sql = getDb();
    if (!sql) throw new Error('Database client unavailable');

    const result = await sql`
      INSERT INTO avis (
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
        photos,
        nom,
        prenom,
        email,
        telephone,
        societe,
        statut
      ) VALUES (
        ${site_id},
        ${collaborateur_id},
        ${intitule_prestation?.trim() || null},
        ${Number(note_conseil)},
        ${Number(note_diversite)},
        ${Number(note_proprete)},
        ${Number(note_engagements)},
        ${Number(note_qualite_prix)},
        ${Number(note_recommandation)},
        ${commentaire?.trim() || null},
        ${JSON.stringify(sanitizedPhotos)}::jsonb,
        ${nom.trim()},
        ${prenom.trim()},
        ${email?.trim() || null},
        ${telephone?.trim() || null},
        ${societe?.trim() || null},
        'approuve'
      )
      RETURNING id
    `;

    const avisId = result[0]?.id;

    return NextResponse.json({
      success: true,
      avisId,
      message: 'Votre avis a été enregistré avec succès. Merci !',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Submission failed';
    console.error('Error submitting avis to Neon:', message);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'enregistrement de votre avis.' },
      { status: 500 }
    );
  }
}
