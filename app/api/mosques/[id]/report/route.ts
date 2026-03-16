import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyIdToken, extractBearerToken } from '@/lib/firebase-admin';

/**
 * POST /api/mosques/[id]/report
 * Body: { prayerTimeId?, reason, suggestedTime? }
 */
export async function POST(req: NextRequest, context: any) {
  const id = context.params.id;

  // Extract token from Authorization header
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify Firebase token
  let decoded;
  try {
    decoded = await verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Find user in DB
  const dbUser = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
  });
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Parse request body
  const { prayerTimeId, reason, suggestedTime } = await req.json();

  if (!reason) {
    return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
  }

  // Create report
  const report = await prisma.report.create({
    data: {
      mosqueId: id,
      prayerTimeId: prayerTimeId || null,
      reporterId: dbUser.id,
      reason,
      suggestedTime: suggestedTime || null,
    },
  });

  return NextResponse.json({ report }, { status: 201 });
}
