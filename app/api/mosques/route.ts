import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyIdToken, extractBearerToken } from '@/lib/firebase-admin';
import { haversineDistance } from '@/lib/geo';
import { checkDailyLimit, incrementDailyCount } from '@/lib/spam';
import { MosqueWithTimes } from '@/types';

const EID_YEAR = parseInt(process.env.NEXT_PUBLIC_EID_YEAR || '2025');
const MAX_RADIUS = 10000; // 10km hard limit
const PROXIMITY_LIMIT = 1000; // 1km — user must be within this to submit

/**
 * GET /api/mosques?lat=&lng=&radius=
 * Returns mosques within radius, sorted by distance, with prayer times.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = Math.min(
        parseFloat(searchParams.get('radius') || '5000'),
        MAX_RADIUS
    );

    if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
            { error: 'lat and lng are required' },
            { status: 400 }
        );
    }

    // Rough bounding box filter first (fast), then precise Haversine in JS
    const latDelta = radius / 111320;
    const lngDelta = radius / (111320 * Math.cos((lat * Math.PI) / 180));

    const mosques = await prisma.mosque.findMany({
        where: {
            lat: { gte: lat - latDelta, lte: lat + latDelta },
            lng: { gte: lng - lngDelta, lte: lng + lngDelta },
        },
        include: {
            prayerTimes: {
                where: { year: EID_YEAR },
                orderBy: { voteCount: 'desc' },
            },
            user: {
                select: { displayName: true },
            },
        },
    });

    // Precise distance filter + transform
    const results: MosqueWithTimes[] = mosques
        .map((mosque) => {
            const distance = haversineDistance(lat, lng, mosque.lat, mosque.lng);
            const selectedTime =
                mosque.prayerTimes.find((pt) => pt.isSelected) ||
                mosque.prayerTimes[0] ||
                null;
            const totalVotes = mosque.prayerTimes.reduce(
                (sum, pt) => sum + pt.voteCount,
                0
            );

            return {
                id: mosque.id,
                name: mosque.name,
                nameBn: mosque.nameBn,
                lat: mosque.lat,
                lng: mosque.lng,
                photoUrl: mosque.photoUrl,
                submittedBy: mosque.submittedBy,
                submitterName: mosque.user?.displayName || null,
                distance,
                prayerTimes: mosque.prayerTimes.map((pt) => ({
                    id: pt.id,
                    jamaatTime: pt.jamaatTime,
                    year: pt.year,
                    voteCount: pt.voteCount,
                    isSelected: pt.isSelected,
                    submittedBy: pt.submittedBy,
                })),
                selectedTime: selectedTime
                    ? {
                        id: selectedTime.id,
                        jamaatTime: selectedTime.jamaatTime,
                        year: selectedTime.year,
                        voteCount: selectedTime.voteCount,
                        isSelected: selectedTime.isSelected,
                        submittedBy: selectedTime.submittedBy,
                    }
                    : null,
                totalVotes,
            };
        })
        .filter((m) => m.distance <= radius)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return NextResponse.json(results);
}

/**
 * POST /api/mosques
 * Submit a new mosque. Requires auth, proximity check, and daily limit.
 */
export async function POST(req: NextRequest) {
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
        return NextResponse.json(
            { error: 'User not found — please sync first' },
            { status: 404 }
        );
    }

    // Daily limit check
    const canSubmit = await checkDailyLimit(dbUser.id);
    if (!canSubmit) {
        return NextResponse.json(
            { error: 'Daily submission limit reached (5/day)' },
            { status: 429 }
        );
    }

    const body = await req.json();
    const { name, nameBn, lat, lng, photoUrl, jamaatTimes, userLat, userLng } =
        body;

    if (!name || !lat || !lng || !jamaatTimes?.length) {
        return NextResponse.json(
            { error: 'name, lat, lng, and jamaatTimes are required' },
            { status: 400 }
        );
    }

    if (jamaatTimes.length > 4) {
        return NextResponse.json(
            { error: 'Maximum 4 prayer times allowed' },
            { status: 400 }
        );
    }

    // Server-side GPS proximity check
    if (userLat && userLng) {
        const distFromMosque = haversineDistance(userLat, userLng, lat, lng);
        if (distFromMosque > PROXIMITY_LIMIT) {
            return NextResponse.json(
                { error: `You must be within 1km of the mosque. You are ${Math.round(distFromMosque)}m away.` },
                { status: 400 }
            );
        }
    }

    // Create mosque + prayer times in transaction
    const mosque = await prisma.$transaction(async (tx) => {
        const newMosque = await tx.mosque.create({
            data: {
                name,
                nameBn,
                lat,
                lng,
                photoUrl,
                submittedBy: dbUser.id,
            },
        });

        // Create all prayer time records; first one gets isSelected=true by default
        await tx.eidPrayerTime.createMany({
            data: jamaatTimes.map((time: string, idx: number) => ({
                mosqueId: newMosque.id,
                jamaatTime: time,
                year: EID_YEAR,
                isSelected: idx === 0,
                submittedBy: dbUser.id,
            })),
        });

        return newMosque;
    });

    await incrementDailyCount(dbUser.id);

    return NextResponse.json({ mosque }, { status: 201 });
}
