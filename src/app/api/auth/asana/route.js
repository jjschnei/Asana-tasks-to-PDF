import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { code } = await request.json();

    const CLIENT_ID = process.env.NEXT_PUBLIC_ASANA_CLIENT_ID;
    const CLIENT_SECRET = process.env.ASANA_CLIENT_SECRET;
    const REDIRECT_URI = 'https://asana-tasks-to-pdf.vercel.app/auth/callback';

    console.log('Using redirect URI:', REDIRECT_URI);

    const response = await fetch('https://app.asana.com/-/oauth_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Asana token exchange error:', errorData);
      return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 400 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 500 });
  }
}
