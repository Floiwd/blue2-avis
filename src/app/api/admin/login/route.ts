import { NextRequest, NextResponse } from 'next/server';
import { generateAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth-admin';


export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const expectedPassword = process.env.ADMIN_PASSWORD || 'blue2admin2026';

    if (!password || password !== expectedPassword) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      );
    }

    const token = generateAdminToken();

    const response = NextResponse.json({
      success: true,
      message: 'Authentification réussie',
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 jours
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Erreur d\'authentification' }, { status: 500 });
  }
}
