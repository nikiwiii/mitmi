import 'dotenv/config';
import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { findUserById, User } from './db.js';

// secret for signing session tokens, random per process when not configured
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.log('[mit.mi] brak SESSION_SECRET, sesje wygasna po restarcie serwera');
}

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14;

// password hashing with scrypt and a per-user salt
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

function sign(data: string): string {
  return crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
}

export function createToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string): string | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.uid !== 'string' || typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}

export interface AuthedRequest extends Request {
  user?: User;
}

// middleware that loads the account from the bearer token
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const userId = token ? readToken(token) : null;
  const user = userId ? await findUserById(userId) : null;
  if (!user) {
    return res.status(401).json({ error: 'wymagane logowanie' });
  }
  req.user = user;
  next();
}
