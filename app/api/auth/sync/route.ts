import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyIdToken, extractBearerToken } from '@/lib/firebase-admin';
import { createHash } from 'crypto';

/**
 * POST /api/auth/sync
 * Syncs a Firebase-authenticated user to our PostgreSQL database.
 */
export async function POST(req: NextRequest) {
    try {
        const token = extractBearerToken(req.headers.get('Authorization'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await verifyIdToken(token);
        const { uid, phone_number, name } = decodedToken;

        if (!phone_number) {
            return NextResponse.json(
                { error: 'Phone number required' },
                { status: 400 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const displayName = body.displayName || name || null;

        // Hash phone number for privacy
        const phoneHash = createHash('sha256').update(phone_number).digest('hex');

        const user = await prisma.user.upsert({
            where: { firebaseUid: uid },
            create: {
                firebaseUid: uid,
                displayName,
                phoneHash,
            },
            update: {
                displayName,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({ user: { id: user.id, displayName: user.displayName } });
    } catch (error) {
        console.error('[auth/sync]', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
}
