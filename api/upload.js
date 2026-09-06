import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const form = formidable({ multiples: true });
    
    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ error: 'Parse error' });
        
        const file = files.media || files.file;
        const bucket = fields.bucket || 'media';
        
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const fileData = fs.readFileSync(file.filepath);
        const fileName = `${Date.now()}_${file.originalFilename}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, fileData, { contentType: file.mimetype });

        if (error) return res.status(500).json({ error: error.message });

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        res.status(200).json({ url: urlData.publicUrl });
    });
}
