import { createHash, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSessionToken } from './_lib/token';

function hash(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function matches(input: string, expected: string): boolean {
  return timingSafeEqual(hash(input), hash(expected));
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminUsername || !adminPassword) {
    return res.status(500).json({ error: 'Admin credentials are not configured' });
  }

  const { username, password } = (req.body ?? {}) as {
    username?: unknown;
    password?: unknown;
  };

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (!matches(username, adminUsername) || !matches(password, adminPassword)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  return res.status(200).json({ token: createSessionToken() });
}
