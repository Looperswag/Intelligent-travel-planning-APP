import { GoogleGenAI, Type } from "@google/genai";
import { TripDetails, MediaItem, UploadedFile, SocialLink } from "../types";

// Helper to initialize AI only when needed, preventing app crash on load if key is missing
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key 未配置。请在 .env 文件中设置 API_KEY。");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Validates if the user input contains enough information to generate a plan.
 */
export const validateTripIntent = async (prompt: string): Promise<{ isValid: boolean; message?: string }> => {
  if (!prompt || prompt.length < 2) {
      return { isValid: false, message: "请输入您的旅行计划。" };
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Role: Ingestor Agent.
        Task: Analyze travel request validity.
        Input: "${prompt}"
        
        Check for:
        1. Destination (City/Country)
        2. Vague intent that implies travel.
        
        Return JSON:
        {
          "hasDestination": boolean,
          "message": "string (Polite Chinese prompt if missing info)"
        }
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasDestination: { type: Type.BOOLEAN },
            message: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    if (!result.hasDestination) {
      return { isValid: false, message: result.message || "请提供明确的旅行目的地。" };
    }
    return { isValid: true };

  } catch (e: any) {
    console.error("Validation failed", e);
    // If it's an API Key error, rethrow it so the UI shows it
    if (e.message.includes("API Key")) {
      throw e;
    }
    return { isValid: true }; 
  }
};

/**
 * Generator function that streams the travel plan.
 * It yields text chunks as they are generated.
 */
export async function* generateTravelPlanStream(
  details: TripDetails,
  mediaItems: MediaItem[]
): AsyncGenerator<string, void, unknown> {
  
  const ai = getAiClient();
  const links = mediaItems.filter((m): m is SocialLink => 'url' in m);
  const files = mediaItems.filter((m): m is UploadedFile => 'file' in m);
  const linkText = links.map(l => `- ${l.url}`).join('\n');
  
  const prompt = `
    You are the **Orchestrator** of a multi-agent travel planning system (Gemini 3).
    
    **TASK**:
    1.  **Reasoning Log**: First, output a "Stream of Consciousness" log where you analyze, search, criticize, and plan.
    2.  **HTML Output**: Then, output the final HTML file.
    
    **USER INPUT**: "${details.prompt}"
    **USER LINKS**: ${linkText}

    ---------------------------------------------------------
    ### PHASE 1: REASONING LOG (Text Output)
    Start your response by printing a log of your internal agents working. 
    Format example:
    *   [Ingestor]: Parsing intent... User wants a trip to Tokyo.
    *   [Researcher]: Searching for flights... Found JAL/ANA options.
    *   [Critic]: Checking availability... "Sushi Dai" requires 3am queue, looking for alternatives.
    *   [Visuals]: Determining color palette...
    
    **CRITICAL: ADAPTIVE COLOR PALETTE**: 
    Analyze the destination's "Vibe" and decide on a Tailwind Color Palette.
    *   *Kyoto/Nature*: Stone, Zinc, Emerald (Zen). \`bg-stone-50 text-stone-900\`
    *   *Santorini/Ocean*: Blue, Sky, White. \`bg-blue-50 text-blue-900\`
    *   *Paris/Urban*: Slate, Amber, Rose. \`bg-slate-50 text-slate-900\`
    *   *Bangkok/Tropical*: Orange, Amber, Lime. \`bg-orange-50 text-orange-900\`
    
    State your chosen palette explicitly in the log.

    ---------------------------------------------------------
    ### PHASE 2: HTML OUTPUT (After Log)
    Use the separator \`<<<HTML_START>>>\` to indicate the start of the HTML file.

    **Structure**:
    1.  **Magazine Cover**: Full-screen hero image.
    2.  **Smart Logistics Panel**: Flight/Train + Hotel.
    3.  **The "Deep Dive" Itinerary**:
        *   **BOOKING INTELLIGENCE CARD**: For every major spot, include price comparison and links (Official vs OTA).
        *   **Action Buttons**: MUST use \`target="_blank"\`.
        *   **Navigation**: Bottom-right card with \`target="_blank"\` link to Google Maps.
    
    **Design & Colors**:
    *   **Apply the chosen color palette** to the HTML \`<body>\` and UI components. 
    *   Use \`bg-{color}-50\` for backgrounds, \`text-{color}-900\` for headings, \`bg-{color}-100\` for cards.
    *   Do NOT use the default gray/white if a specific vibe fits better.
    
    **Content Depth**:
    *   Immersive, long-form descriptions (200+ words/spot).
    *   "Insight" vs "Fact" separation.
  `;

  const parts: any[] = [{ text: prompt }];

  for (const file of files) {
    const base64Data = file.base64.split(',')[1]; 
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: base64Data
      }
    });
  }

  try {
    // Note: Switched to gemini-3-flash-preview for better rate limits on free tier
    // gemini-3-pro-preview often hits 429 errors quickly
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: parts
      },
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
    
  } catch (error) {
    // Pass the actual error up so the UI can display it (e.g., 404 Model Not Found)
    throw error;
  }
}