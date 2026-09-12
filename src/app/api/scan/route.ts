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
1. **READ THE PACKAGING FIRST.** If the image shows packaged food with visible nutrition info, net weight, or serving size printed on it, USE THOSE EXACT NUMBERS. Do NOT guess or use generic database values when the label is visible.
2. For packaged foods: identify the net weight of the ENTIRE package (e.g. "36g" printed on front). Then calculate macros for the full package weight using the per-100g or per-serving values visible on the label.
3. For unpackaged/homemade food: estimate portions visually and use standard USDA database values.
4. If you can read the brand name, use brand-specific nutrition data, not generic category averages.
5. When in doubt, OVERESTIMATE calories rather than underestimate. Accuracy matters more than being conservative.

Return ONLY a valid JSON array of objects. Each object must have these fields:
- "food_name" (string - include brand if visible, e.g. "Hershey's Kisses")
- "quantity" (number - the actual weight in grams if visible on packaging, or portion count)
- "unit" (string - "grams" for packaged with visible weight, or "serving"/"cup" etc. for unpackaged)
- "calories" (number - total for the identified quantity, NOT per 100g)
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
