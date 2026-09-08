/**
 * Let's Estimate - AI BOQ Takeoff Engine
 * 
 * PRIMARY AI ENGINE: Google Gemini 2.5 Flash Vision (@google/genai)
 * 
 * Analyzes architectural floor plans, sections, and elevations (.jpg, .png, .pdf)
 * to extract standard Nigerian building quantities:
 * - Walls m2
 * - RC Slab m3
 * - Blockwork m2
 * - Doors No
 * - Windows No
 * - Roofing m2
 */

import { GoogleGenAI } from '@google/genai';

export interface TakeoffItem {
  item: string;        // Walls, RC Slab, Blockwork, Doors, Windows, Roofing, etc.
  description: string; // Specific detail (e.g. 225mm vibrated hollow sandcrete blocks)
  unit: string;        // m2, m3, No, m, etc.
  qty: number;         // Calculated quantity
  rate?: number;       // Default recommended Nigerian market rate in ₦
}

export interface TakeoffResult {
  engineUsed: 'gemini-2.5-flash' | 'intelligent-nigerian-benchmark';
  provider: 'Google Gemini 2.5 Flash' | 'Nigerian Standard Benchmark';
  items: TakeoffItem[];
  drawingSummary?: string;
  detectedScale?: string;
}

const TAKEOFF_SYSTEM_PROMPT = `
You are a senior professional Nigerian Registered Quantity Surveyor (NIQS) and Estimator with deep expertise in Nigerian architectural blueprints, building codes, and construction cost measurement (BESMM4).

Your task is to analyze the provided architectural floor plan, structural drawing, elevation, or section and perform an accurate Bill of Quantities (BOQ) takeoff.

CRITICAL ITEMS TO DETECT AND MEASURE:
1. "Walls m2" - Gross and net wall area for internal/external plastering and rendering.
2. "RC Slab m3" - Reinforced concrete slab volume (estimate area * typical 150mm thickness, include beams).
3. "Blockwork m2" - 225mm or 150mm vibrated hollow sandcrete blockwork wall area.
4. "Doors No" - Count of all doors (flush doors, security steel doors, aluminum swing doors).
5. "Windows No" - Count of all windows (glazed sliding, projected, casement).
6. "Roofing m2" - Estimated projected roof plan area for longspan aluminum or stone-coated tiles.
7. Substructure / Foundation concrete or Excavation if evident on the drawing.

NIGERIAN CONSTRUCTION STANDARDS TO ASSUME IF NOT MARKED:
- Standard floor-to-ceiling height: 3.0 meters
- External and spine walls: 225mm sandcrete blocks
- Internal partition walls: 150mm sandcrete blocks
- Suspended floor slab: 150mm thick reinforced concrete Grade 25

OUTPUT REQUIREMENT:
You MUST respond with valid JSON ONLY (no markdown code blocks, no backticks, no conversational preamble).
The JSON must be an array of objects matching this exact structure:
[
  {
    "item": "Blockwork",
    "description": "225mm thick vibrated hollow sandcrete blockwork bedded in cement mortar (1:4)",
    "unit": "m2",
    "qty": 420.5
  },
  {
    "item": "RC Slab",
    "description": "150mm thick suspended reinforced concrete Grade 25 floor slab and drop beams",
    "unit": "m3",
    "qty": 65.0
  },
  {
    "item": "Walls",
    "description": "15mm cement-sand plastering and rendering to internal and external wall faces",
    "unit": "m2",
    "qty": 840.0
  },
  {
    "item": "Doors",
    "description": "Single leaf solid timber flush doors (900x2100mm) and entrance security doors",
    "unit": "No",
    "qty": 18
  },
  {
    "item": "Windows",
    "description": "Aluminium sliding glazed windows (1200x1200mm) with insect screens and burglar proofing",
    "unit": "No",
    "qty": 22
  },
  {
    "item": "Roofing",
    "description": "0.55mm aluminium longspan standing seam roofing sheets on timber roof trusses",
    "unit": "m2",
    "qty": 285.0
  }
]
`;

/**
 * Executes AI Takeoff on an uploaded drawing buffer using Google Gemini 2.5 Flash Vision.
 */
export async function performAiTakeoff(
  fileBuffer: Buffer,
  mimeType: string
): Promise<TakeoffResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const base64Data = fileBuffer.toString('base64');
  const normalizedMimeType = mimeType === 'application/pdf' ? 'application/pdf' : (mimeType.includes('png') ? 'image/png' : 'image/jpeg');

  // 1. Run Google Gemini 2.5 Flash Vision
  if (geminiApiKey) {
    try {
      console.log('Running AI Takeoff with Google Gemini 2.5 Flash Vision...');
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      const promptText = `${TAKEOFF_SYSTEM_PROMPT}\n\nCarefully read this architectural drawing. Extract the BOQ items (Walls m2, RC Slab m3, Blockwork m2, Doors No, Windows No, Roofing m2) and return the JSON array.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: normalizedMimeType,
                  data: base64Data,
                },
              },
              {
                text: promptText,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text || '';
      const parsedItems = extractJsonArray(text);
      if (parsedItems.length > 0) {
        return {
          engineUsed: 'gemini-2.5-flash',
          provider: 'Google Gemini 2.5 Flash',
          items: attachDefaultNigerianRates(parsedItems),
          drawingSummary: 'Quantities extracted by Google Gemini 2.5 Flash Vision with Nigerian construction standard dimensional calibration.'
        };
      }
    } catch (geminiErr: any) {
      console.error('Gemini Vision API error:', geminiErr.message);
    }
  }

  // 2. Fallback to Intelligent Nigerian Benchmark Takeoff if key is unavailable
  console.log('Using Intelligent Nigerian Benchmark Takeoff model...');
  return {
    engineUsed: 'intelligent-nigerian-benchmark',
    provider: 'Nigerian Standard Benchmark',
    items: getBenchmarkTakeoff(),
    drawingSummary: 'Demonstration takeoff generated based on standard Nigerian residential/commercial architectural template.'
  };
}

/**
 * Extracts and sanitizes JSON array from AI model response
 */
function extractJsonArray(rawText: string): TakeoffItem[] {
  try {
    const clean = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // Find first '[' and last ']'
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      const jsonSub = clean.substring(start, end + 1);
      const parsed = JSON.parse(jsonSub);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => ({
          item: String(item.item || `Item ${idx + 1}`),
          description: String(item.description || ''),
          unit: String(item.unit || 'm2'),
          qty: Math.max(0, Number(item.qty || 0)),
        }));
      }
    }
  } catch (e) {
    console.error('Failed to parse AI JSON:', e);
  }
  return [];
}

/**
 * Supplies default Nigerian market unit rates in Naira (₦) for detected items
 */
function attachDefaultNigerianRates(items: TakeoffItem[]): TakeoffItem[] {
  const rateMap: Record<string, number> = {
    'rc slab': 175000,
    'slab': 175000,
    'concrete': 170000,
    'blockwork': 14500,
    'blocks': 14500,
    'walls': 4200,
    'plastering': 4200,
    'doors': 75000,
    'windows': 65000,
    'roofing': 28000,
    'excavation': 6500,
  };

  return items.map((it) => {
    let assignedRate = 0;
    const lowerItem = it.item.toLowerCase();
    for (const [key, rate] of Object.entries(rateMap)) {
      if (lowerItem.includes(key)) {
        assignedRate = rate;
        break;
      }
    }
    if (!assignedRate) assignedRate = 12000; // fallback standard rate
    return {
      ...it,
      rate: it.rate || assignedRate,
    };
  });
}

/**
 * Standard benchmark takeoff for testing when offline
 */
function getBenchmarkTakeoff(): TakeoffItem[] {
  return [
    {
      item: 'RC Slab',
      description: '150mm thick reinforced concrete Grade 25 suspended floor slab and beams',
      unit: 'm3',
      qty: 48.5,
      rate: 175000,
    },
    {
      item: 'Blockwork',
      description: '225mm vibrated hollow sandcrete blockwork in cement mortar (1:4) for external walls',
      unit: 'm2',
      qty: 540.0,
      rate: 14500,
    },
    {
      item: 'Walls',
      description: '15mm cement-sand plastering and internal rendering with emulsion finish',
      unit: 'm2',
      qty: 1080.0,
      rate: 4200,
    },
    {
      item: 'Doors',
      description: 'Solid core panel timber doors (900x2100mm) with ironmongery & mortice locks',
      unit: 'No',
      qty: 14,
      rate: 75000,
    },
    {
      item: 'Windows',
      description: 'Anodized aluminium sliding glazed windows (1200x1200mm) with security burglar bars',
      unit: 'No',
      qty: 16,
      rate: 65000,
    },
    {
      item: 'Roofing',
      description: '0.55mm aluminium longspan roofing sheets fixed on hardwood timber trusses',
      unit: 'm2',
      qty: 320.0,
      rate: 28000,
    },
  ];
}
