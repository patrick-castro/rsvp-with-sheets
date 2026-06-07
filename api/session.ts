import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySessionToken } from './_lib/token.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = (req.body ?? {}) as { token?: unknown };

  return res
    .status(200)
    .json({ authenticated: typeof token === 'string' && verifySessionToken(token) });
}
