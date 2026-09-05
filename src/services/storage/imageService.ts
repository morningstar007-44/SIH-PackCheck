import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export async function uploadInspectionImage(
  userId: string,
  inspectionId: string,
  imageBlob: Blob
): Promise<string> {
  if (!isSupabaseConfigured()) {
    // Return Object URL for demo mode
    return URL.createObjectURL(imageBlob);
  }

  const filePath = `${userId}/${inspectionId}/original.jpg`;
  const { error } = await supabase.storage
    .from('inspection-images')
    .upload(filePath, imageBlob, { contentType: 'image/jpeg', upsert: true });

  if (error) {
    console.error('Supabase Storage Upload Error:', error);
    // Fallback to Blob URL if upload fails so user can continue seamlessly
    return URL.createObjectURL(imageBlob);
  }

  const { data } = supabase.storage.from('inspection-images').getPublicUrl(filePath);
  return data.publicUrl;
}
