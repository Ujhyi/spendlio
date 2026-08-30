import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GooglePayload {
  email: string;
  emailVerified: boolean;
  googleId: string;
}

export async function verifyGoogleToken(idToken: string): Promise<GooglePayload> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Neplatný Google token.');
  }

  return {
    email: payload.email,
    emailVerified: payload.email_verified ?? false,
    googleId: payload.sub,
  };
}