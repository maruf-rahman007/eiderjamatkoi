import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a mosque photo. 
 * @param file The image file
 * @param mosqueId A unique ID for the mosque/temp entry
 * @param firebaseIdToken THE FIREBASE ID TOKEN of the logged in user
 */
export async function uploadMosquePhoto(
  file: File, 
  mosqueId: string, 
  firebaseIdToken: string // <--- Add this argument
): Promise<string> {
  
  // 1. Sign in to Supabase using the Firebase Token
  // This creates a valid Supabase session linked to the Firebase user
  const { error: signInError } = await supabase.auth.signInWithIdToken({
    provider: 'firebase', // Ensure 'firebase' is enabled in Supabase Dashboard > Auth > Providers
    token: firebaseIdToken,
  });

  if (signInError) {
    console.error("Failed to sync auth with Supabase:", signInError);
    throw new Error('Authentication sync failed. Please try logging in again.');
  }

  // 2. Verify the user is now recognized
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User not recognized by Supabase after login sync.');
  }

  // 3. Proceed with upload
  const ext = file.name.split('.').pop() || 'jpg';
  const safeMosqueId = mosqueId.replace(/[^a-zA-Z0-9_-]/g, ''); 
  const filename = `mosque-${safeMosqueId}-${Date.now()}.${ext}`;

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  const { error: uploadError } = await supabase.storage
    .from('mosque-photos')
    .upload(filename, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data } = supabase.storage.from('mosque-photos').getPublicUrl(filename);
  return data.publicUrl;
}