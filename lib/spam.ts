import { prisma } from './prisma';

const DAILY_LIMIT = 5;

/**
 * Check if a user has exceeded their daily submission limit.
 * Returns true if they can still submit.
 */
export async function checkDailyLimit(userId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await prisma.dailySubmissionLog.findUnique({
        where: {
            userId_date: {
                userId,
                date: today,
            },
        },
    });

    if (!log) return true; // No submissions today
    return log.count < DAILY_LIMIT;
}

/**
 * Increment the daily submission count for a user.
 * Uses upsert to create or increment atomically.
 */
export async function incrementDailyCount(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailySubmissionLog.upsert({
        where: {
            userId_date: {
                userId,
                date: today,
            },
        },
        create: {
            userId,
            date: today,
            count: 1,
        },
        update: {
            count: { increment: 1 },
        },
    });
}

/**
 * Get remaining submissions for today.
 */
export async function getRemainingSubmissions(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await prisma.dailySubmissionLog.findUnique({
        where: {
            userId_date: {
                userId,
                date: today,
            },
        },
    });

    if (!log) return DAILY_LIMIT;
    return Math.max(0, DAILY_LIMIT - log.count);
}
