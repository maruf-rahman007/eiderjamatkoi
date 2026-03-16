import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const EID_YEAR = parseInt(process.env.NEXT_PUBLIC_EID_YEAR || '2025');

/**
 * GET /api/mosques/[id]
 * Returns full mosque details with all prayer times and vote counts.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    const mosque = await prisma.mosque.findUnique({
        where: { id: params.id },
        include: {
            prayerTimes: {
                where: { year: EID_YEAR },
                orderBy: { voteCount: 'desc' },
                include: {
                    _count: { select: { votes: true } },
                },
            },
            user: { select: { displayName: true } },
        },
    });

    if (!mosque) {
        return NextResponse.json({ error: 'Mosque not found' }, { status: 404 });
    }

    return NextResponse.json(mosque);
}
