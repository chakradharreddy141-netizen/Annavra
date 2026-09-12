import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `You are a precise food nutrition analyzer. Analyze this food image carefully.

CRITICAL RULES (follow in order):
1. **READ THE PACKAGING FIRST.** Look for the net weight (e.g., "36g") on the front of the packaging.
2. **USE INTERNAL KNOWLEDGE FOR BRANDED ITEMS.** If it's a branded item (e.g., "Hershey's Kisses") and you only see the front, use your exact internal knowledge of its per-100g nutritional values. Do NOT guess generic portion sizes.
3. **DO THE MATH STRICTLY.** If you find the net weight (e.g. 36g) and know the per-100g calories (e.g. 534 kcal), you MUST calculate the exact calories for the entire package. Formula: (per_100g_value / 100) * net_weight. E.g., (534 / 100) * 36 = 192.24 kcal. Do this calculation for ALL macros (Protein, Carbs, Fat, Fiber) and return the exact calculated result for the specific weight.
4. For unpackaged/homemade food: estimate portions visually and use standard USDA database values.
5. Return the calculated values for the entire identified quantity, NOT per 100g.

Return ONLY a valid JSON array of objects. Each object must have these fields:
- "food_name" (string - include brand if visible, e.g. "Hershey's Kisses")
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
                mimeType: file.type,
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
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
