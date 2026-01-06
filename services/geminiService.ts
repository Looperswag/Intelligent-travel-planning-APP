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
      model: 'gemini-3-pro-preview',
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
    1.  **Reasoning Log**: Output a concise "Stream of Consciousness" log.
    2.  **HTML Output**: Output a detailed, professional, magazine-style HTML itinerary.
    
    **USER INPUT**: "${details.prompt}"
    **USER LINKS**: ${linkText}

    ---------------------------------------------------------
    ### PHASE 1: REASONING LOG (Text Output)
    Start with internal agent logs. Keep it concise.

    **CRITICAL: ADAPTIVE COLOR PALETTE**: 
    Analyze the destination's "Vibe" and decide on a Tailwind Color Palette.
    *   *Kyoto/Nature*: Stone, Zinc, Emerald (Zen). \`bg-stone-50 text-stone-900\`
    *   *Santorini/Ocean*: Blue, Sky, White. \`bg-blue-50 text-blue-900\`
    *   *Paris/Urban*: Slate, Amber, Rose. \`bg-slate-50 text-slate-900\`
    
    State your chosen palette explicitly in the log.

    ---------------------------------------------------------
    ### PHASE 2: HTML OUTPUT (After Log)
    Use separator \`<<<HTML_START>>>\`.

    **Layout & Design Rules**:
    1.  **Hero Banner**: Wide-screen (16:9 ratio, max-height 50vh, object-cover).
    2.  **Typography**: refined, compact font scale (text-sm/text-base).
    3.  **Color Scheme**: Strictly apply the chosen "Vibe" palette.

    **SECTION 1: HERO & EXECUTIVE SUMMARY (MUST COME FIRST)**
    
    Immediately after the Hero Banner, you MUST generate a "Journey Overview" section.
    This summarizes the generated itinerary for the user.
    
    Template for Summary:
    \`\`\`html
    <div class="max-w-4xl mx-auto -mt-20 relative z-10 px-6">
        <div class="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 mb-20">
            <h2 class="text-3xl font-serif text-{palette_color}-900 mb-6 border-b border-{palette_color}-100 pb-4">Journey at a Glance</h2>
            
            <!-- Executive Summary Text -->
            <p class="text-lg text-{palette_color}-700 leading-relaxed mb-8 font-light">
                [Write a compelling, 3-sentence summary of the entire trip here. Mention the vibe, key destinations, and the pacing.]
            </p>

            <!-- Highlights Grid (4 Key Aspects) -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-{palette_color}-50 p-4 rounded-2xl text-center">
                    <div class="text-{palette_color}-500 mb-2 flex justify-center">
                       <!-- Insert specific SVG icon 1 (e.g. Utensils for food) -->
                       <svg ...>...</svg>
                    </div>
                    <span class="block font-bold text-sm text-{palette_color}-800">[Highlight 1]</span>
                    <span class="text-xs text-{palette_color}-600">[Short detail]</span>
                </div>
                <div class="bg-{palette_color}-50 p-4 rounded-2xl text-center">
                    <div class="text-{palette_color}-500 mb-2 flex justify-center">
                       <!-- Insert specific SVG icon 2 (e.g. Camera for sights) -->
                       <svg ...>...</svg>
                    </div>
                    <span class="block font-bold text-sm text-{palette_color}-800">[Highlight 2]</span>
                    <span class="text-xs text-{palette_color}-600">[Short detail]</span>
                </div>
                 <div class="bg-{palette_color}-50 p-4 rounded-2xl text-center">
                    <div class="text-{palette_color}-500 mb-2 flex justify-center">
                       <!-- Insert specific SVG icon 3 (e.g. Bed for relaxation) -->
                       <svg ...>...</svg>
                    </div>
                    <span class="block font-bold text-sm text-{palette_color}-800">[Highlight 3]</span>
                    <span class="text-xs text-{palette_color}-600">[Short detail]</span>
                </div>
                 <div class="bg-{palette_color}-50 p-4 rounded-2xl text-center">
                    <div class="text-{palette_color}-500 mb-2 flex justify-center">
                       <!-- Insert specific SVG icon 4 (e.g. Heart for experience) -->
                       <svg ...>...</svg>
                    </div>
                    <span class="block font-bold text-sm text-{palette_color}-800">[Highlight 4]</span>
                    <span class="text-xs text-{palette_color}-600">[Short detail]</span>
                </div>
            </div>
        </div>
    </div>
    \`\`\`

    **SECTION 2: DAILY ITINERARY (ANTI-LAZINESS PROTOCOL)**
    AI models often summarize the last few days of a trip or forget to add UI buttons.
    **THIS IS STRICTLY FORBIDDEN.**
    
    **YOU MUST ADHERE TO THIS EXACT TEMPLATE FOR EVERY SINGLE DAY (Day 1 to Day N):**
    
    \`\`\`html
    <!-- START OF DAY TEMPLATE -->
    <section class="mb-16">
       <!-- 1. Day Header -->
       <h2 class="text-3xl font-light mb-2 text-{palette_color}-900">Day X: [Title]</h2>
       <p class="text-{palette_color}-500 mb-6 italic border-b border-{palette_color}-200 pb-4">[Brief thematic overview]</p>

       <!-- 2. ROUTE MASTER BUTTON (MANDATORY FOR EVERY DAY) -->
       <!-- DO NOT SKIP THIS BUTTON ON DAY 4, 5, 6, 7... -->
       <!-- Logic: Extract ALL stops for Day X. Construct Google Maps URL. -->
       <a href="https://www.google.com/maps/dir/?api=1&origin=...&waypoints=...&destination=..." target="_blank" class="group inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-sm hover:shadow-float hover:bg-white/80 transition-all duration-300 mb-8 no-underline w-fit">
          <div class="p-1.5 bg-{palette_color}-100 rounded-full text-{palette_color}-700 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16.2 7.8l-2 6.3-6.4 2.1 2-6.3z"/></svg>
          </div>
          <div class="flex flex-col">
             <span class="text-xs font-bold tracking-widest text-{palette_color}-900 uppercase opacity-90">Navigate Day X Route</span>
             <span class="text-[10px] text-{palette_color}-600 leading-none">View route on Google Maps</span>
          </div>
       </a>

       <!-- 3. DETAILED ACTIVITIES (3-5 items PER DAY) -->
       <!-- MUST maintain high density. NO SUMMARIES. -->
       <div class="space-y-8 border-l-2 border-{palette_color}-200 pl-8 ml-4">
          
          <!-- Activity Item Template -->
          <div class="relative group">
             <div class="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-white border-4 border-{palette_color}-300 group-hover:border-{palette_color}-500 transition-colors"></div>
             
             <h3 class="text-xl font-medium text-{palette_color}-800 flex items-center gap-3">
                <span class="font-mono text-base opacity-60">09:00</span> 
                <span>Activity Name</span>
             </h3>
             
             <!-- 4-Dimension Details -->
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-white/50 p-4 rounded-xl">
                <div class="text-sm">
                   <strong class="block text-xs uppercase tracking-wider opacity-50 mb-1">Why Here?</strong>
                   <p>[Curatorial reasoning]</p>
                </div>
                <div class="text-sm">
                   <strong class="block text-xs uppercase tracking-wider opacity-50 mb-1">Logistics</strong>
                   <p>[Transit info / Uber estimate]</p>
                </div>
                <div class="text-sm col-span-full border-t border-{palette_color}-100 pt-2 flex justify-between items-center">
                   <span>🎫 Ticket: [Price/Link]</span>
                   <span class="text-xs bg-{palette_color}-100 px-2 py-1 rounded">Suggested duration: 2h</span>
                </div>
             </div>
             
             <!-- Optional Image -->
             <div class="mt-4 rounded-lg overflow-hidden h-48 w-full shadow-sm">
                 <img src="..." onerror="handleImageError(this)" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700">
             </div>
          </div>
          <!-- Repeat Activity Item 3-5 times -->

       </div>
    </section>
    <!-- END OF DAY TEMPLATE -->
    \`\`\`

    **VERIFICATION CHECKLIST**:
    1.  Did you render the **Journey Overview** summary section? (Yes/No - Must be Yes)
    2.  Did you render the **Map Button** for Day 7? (Yes/No - Must be Yes)
    3.  Is Day 7 as long as Day 1? (Yes/No - Must be Yes)
    4.  Did you avoid sections like "The Rest of the Trip"? (Yes/No - Must be Yes)

    **Image Robustness**:
    *   **Icons**: Use inline SVGs only.
    *   **Photos**: \`<img src="..." alt="..." onerror="handleImageError(this)" />\`
    
    **Script Injection**:
    Append the following script at the end of \`<body>\`:
    \`\`\`javascript
    <script>
      function handleImageError(img) {
        if (img.dataset.retried) return;
        img.dataset.retried = true;
        const keyword = encodeURIComponent(img.alt || 'travel');
        console.log('Healing image:', keyword);
        img.style.opacity = '0.7';
        // Use pollinations.ai for reliable dynamic fallback
        const fallbackUrl = 'https://image.pollinations.ai/prompt/' + keyword + '?width=800&height=600&nologo=true&seed=' + Math.random();
        
        const tempImg = new Image();
        tempImg.onload = function() { img.src = fallbackUrl; img.style.opacity = '1'; };
        tempImg.onerror = function() { img.src = 'https://placehold.co/800x600/e2e8f0/475569?text=' + keyword; img.style.opacity = '1'; };
        tempImg.src = fallbackUrl;
      }
    </script>
    \`\`\`
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
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview', 
      contents: {
        parts: parts
      },
      config: {
        tools: [{ googleSearch: {} }],
        // Maximize token output to allow for full-length itineraries without truncation
        maxOutputTokens: 8192, 
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
    
  } catch (error) {
    throw error;
  }
}