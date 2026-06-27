import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function upload() {
  const filePath = '/Users/hazwans./Downloads/TCG/Foils/Starter 1 Cropped.png';
  const file = fs.readFileSync(filePath);
  
  const { data, error } = await supabase.storage
    .from('tcg-cards')
    .upload('packs/starter_pack_foil.png', file, {
      contentType: 'image/png',
      upsert: true
    });
    
  if (error) {
    console.error("Upload error:", error.message);
  } else {
    console.log("Uploaded successfully:", data);
  }
}

upload().catch(console.error);
