import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: {
    id: number;
    uid: string;
    email: string;
    name: string | null;
    role: string | null;
    xp: number;
    siaFriendStyle?: boolean;
    siaHumorous?: boolean;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const email = decodedToken.email || '';
    const uid = decodedToken.uid;
    const name = decodedToken.name || '';

    // Synchronize or fetch user profile in PostgreSQL using upsert
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name,
        role: 'student', // Default on onboarding
        xp: 0, // Default initial XP
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email, // Keep email in sync
        },
      })
      .returning();

    req.dbUser = result[0];
    next();
  } catch (error: any) {
    console.error('Error verifying Firebase ID token or sync database:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token - ' + error.message });
  }
};
