/**
 * Haversine formula — returns distance in metres between two lat/lng points.
 */
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Earth radius in metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format distance for display.
 * < 1000m → "850m"
 * >= 1000m → "1.2km"
 */
export function formatDistance(metres: number): string {
    if (metres < 1000) return `${Math.round(metres)}m`;
    return `${(metres / 1000).toFixed(1)}km`;
}

/**
 * Check if a time string "HH:MM" is in the past for today.
 */
export function isPrayerTimePast(timeStr: string): boolean {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const prayerTime = new Date();
    prayerTime.setHours(hours, minutes, 0, 0);
    return now > prayerTime;
}

/**
 * Format prayer time "07:00" → "৭:০০ AM" in Bangla or "7:00 AM" in English.
 */
export function formatPrayerTime(timeStr: string, locale = 'bn'): string {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m);

    return date.toLocaleTimeString(locale === 'bn' ? 'bn-BD' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}
