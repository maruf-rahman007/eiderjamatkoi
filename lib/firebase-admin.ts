import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Replace \n with actual newlines for the private key
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export default admin;

/**
 * Verify a Firebase ID token from the Authorization header.
 * Returns the decoded token or throws.
 */
export async function verifyIdToken(token: string) {
    return admin.auth().verifyIdToken(token);
}

/**
 * Extract Bearer token from Authorization header string.
 */
export function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
}
