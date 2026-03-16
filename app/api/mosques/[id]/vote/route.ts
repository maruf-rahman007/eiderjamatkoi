import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyIdToken, extractBearerToken } from '@/lib/firebase-admin';

const EID_YEAR = parseInt(process.env.NEXT_PUBLIC_EID_YEAR || '2025');

/**
 * POST /api/mosques/[id]/vote
 * Body: { prayerTimeId: string }
 * Casts a vote for a specific prayer time and recalculates isSelected.
 */
export async function POST(req: NextRequest, context: any) {
  const mosqueId = context.params.id;

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

  const dbUser = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { prayerTimeId } = await req.json();

  if (!prayerTimeId) {
    return NextResponse.json(
      { error: 'prayerTimeId is required' },
      { status: 400 }
    );
  }

  // Verify prayer time belongs to this mosque
  const prayerTime = await prisma.eidPrayerTime.findFirst({
    where: { id: prayerTimeId, mosqueId },
  });

  if (!prayerTime) {
    return NextResponse.json(
      { error: 'Prayer time not found' },
      { status: 404 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Create vote (unique constraint prevents double voting)
      await tx.vote.create({
        data: {
          prayerTimeId,
          userId: dbUser.id,
        },
      });

      // Increment vote count
      await tx.eidPrayerTime.update({
        where: { id: prayerTimeId },
        data: { voteCount: { increment: 1 } },
      });

      // Recalculate selected time
      const allTimes = await tx.eidPrayerTime.findMany({
        where: { mosqueId, year: EID_YEAR },
        orderBy: { voteCount: 'desc' },
      });

      if (allTimes.length > 0) {
        const winnerId = allTimes[0].id;

        await tx.eidPrayerTime.updateMany({
          where: { mosqueId, year: EID_YEAR },
          data: { isSelected: false },
        });

        await tx.eidPrayerTime.update({
          where: { id: winnerId },
          data: { isSelected: true },
        });
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {

    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'You have already voted for this time' },
        { status: 409 }
      );
    }

    throw error;
  }
}
