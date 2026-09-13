import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SCAN_RATE_LIMIT = process.env.SCAN_RATE_LIMIT ? parseInt(process.env.SCAN_RATE_LIMIT) : 20;
const SCAN_RATE_WINDOW_HOURS = 1;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // 2. Rate Limiting
    const oneHourAgo = new Date(Date.now() - SCAN_RATE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { count, error: limitErr } = await supabase
      .from('scan_rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('scan_time', oneHourAgo);

    if (limitErr && limitErr.code !== '42P01') {
      console.error("Rate limit check error:", limitErr);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (count !== null && count >= SCAN_RATE_LIMIT) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // 3. File Size Validation (8MB limit)
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 8MB)' }, { status: 413 });
    }

    // 4. Image Validation and Resizing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let processedBuffer;
    let mimeType;
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
      if (!metadata.format || !allowedFormats.includes(metadata.format as any)) {
        return NextResponse.json({ error: 'Unsupported image format' }, { status: 415 });
      }

      mimeType = `image/${metadata.format}`;
      
      processedBuffer = await image
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    } catch (e) {
      console.error("Image validation failed:", e);
      return NextResponse.json({ error: 'Invalid or malformed image' }, { status: 415 });
    }
    
    // Record rate limit AFTER validation passes to avoid punishing invalid uploads
    await supabase.from('scan_rate_limits').insert({ user_id: user.id });

    const base64Data = processedBuffer.toString('base64');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `You are a precise food nutrition analyzer. Analyze this food image carefully.

CRITICAL RULES (follow in order):
1. **READ THE PACKAGING FIRST.** Look for the net weight (e.g., "36g") on the front of the packaging.
2. **USE INTERNAL KNOWLEDGE FOR BRANDED ITEMS.** If it's a branded item and you only see the front, use your exact internal knowledge of its per-100g nutritional values. Do NOT guess generic portion sizes.
3. **DO THE MATH STRICTLY.** If you find the net weight (e.g. 36g) and know the per-100g calories (e.g. 534 kcal), you MUST calculate the exact calories for the entire package.
4. For unpackaged/homemade food: estimate portions visually and use standard USDA database values.
5. Return the calculated values for the entire identified quantity, NOT per 100g.

Return ONLY a valid JSON array of objects. Each object must have these fields:
- "food_name" (string - include brand if visible)
- "quantity" (number - the actual weight in grams if visible on packaging, or portion count)
- "unit" (string - "grams" for packaged with visible weight, or "serving"/"cup" etc. for unpackaged)
- "calories" (number - calculated total for the exact identified quantity)
- "protein_g" (number)
- "carbs_g" (number)
- "fat_g" (number)
- "fiber_g" (number)

If there are multiple food items, list each as a separate object.`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const responseText = result.response.text();
    let jsonResult;
    try {
      jsonResult = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini output:", responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ items: jsonResult });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
