import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase (service role)
export function getSupabaseAdmin() {
    return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
    });
}

/**
 * Upload a mosque photo to Supabase Storage and return the public URL.
 */
export async function uploadMosquePhoto(file: File, mosqueId: string): Promise<string> {
    const ext = file.name.split('.').pop();
    const filename = `${mosqueId}-${Date.now()}.${ext}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
        .from('mosque-photos')
        .upload(filename, file, {
            cacheControl: '3600',
            upsert: true, // overwrite if exists
        });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // Get public URL (no error property)
    const { data } = supabase.storage
        .from('mosque-photos')
        .getPublicUrl(filename);

    return data.publicUrl; // this exists, TS happy now
}
