import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyIdToken, extractBearerToken } from '@/lib/firebase-admin';
import { getRemainingSubmissions } from '@/lib/spam';

/**
 * GET /api/user/me
 * Returns current user profile and remaining daily submissions.
 */
export async function GET(req: NextRequest) {
    const token = extractBearerToken(req.headers.get('Authorization'));
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
        decoded = await verifyIdToken(token);
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
        select: {
            id: true,
            displayName: true,
            createdAt: true,
            _count: { select: { mosques: true, votes: true } },
        },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const remainingSubmissions = await getRemainingSubmissions(user.id);

    return NextResponse.json({ user, remainingSubmissions });
}
