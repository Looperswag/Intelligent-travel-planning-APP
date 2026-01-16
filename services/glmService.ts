import { TripDetails, MediaItem, UploadedFile, SocialLink, TripSkeleton, DayPlan, VisualIdentity, FollowUpIntent, UIAction, EnhancedFollowUpAnalysis, RenderPhase } from "../types";
import { AmapService } from "./amapService";
import { ImageService } from "./imageService";
import { IntentAgent } from "./agent/intentAgent";
import { generateDaysParallel } from "./agent/dayAgent";

/**
 * Robust JSON parser for AI responses
 * Handles markdown code blocks, extra text after JSON, and various edge cases
 */
function parseAIJsonResponse(text: string): any {
  let cleaned = text.trim();

  // Remove markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // Extract JSON by finding first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    throw new Error('No valid JSON object found in response');
  }

  // Extract just the JSON part
  const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);

  // Parse and return
  return JSON.parse(jsonStr);
}

// GLM Configuration via Anthropic-compatible API
// Note: Vite injects these via define in vite.config.ts
// IMPORTANT: Set these in your .env.local file
declare const __ANTHROPIC_BASE_URL__: string | undefined;
declare const __ANTHROPIC_AUTH_TOKEN__: string | undefined;
declare const __ANTHROPIC_MODEL__: string | undefined;

const GLM_CONFIG = {
  baseUrl: typeof __ANTHROPIC_BASE_URL__ !== 'undefined' ? __ANTHROPIC_BASE_URL__ : 'https://open.bigmodel.cn/api/anthropic',
  apiKey: typeof __ANTHROPIC_AUTH_TOKEN__ !== 'undefined' ? __ANTHROPIC_AUTH_TOKEN__ : '',
  model: typeof __ANTHROPIC_MODEL__ !== 'undefined' ? __ANTHROPIC_MODEL__ : 'GLM-4.7',
  // Thinking mode tokens budget (higher = more reasoning)
  thinkingTokens: 20000
};

interface GLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GLMRequest {
  model: string;
  messages: GLMMessage[];
  max_tokens?: number;
  temperature?: number;
  thinking?: {
    type: 'enabled';
    budget_tokens: number;
  };
  stream?: boolean;
}

interface GLMResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class GLMClient {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(baseUrl: string, apiKey: string, model: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateContent(params: {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    enableThinking?: boolean;
  }): Promise<{ text: string }> {
    const { prompt, maxTokens = 4096, temperature = 0.7, enableThinking = true } = params;

    const requestBody: GLMRequest = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature
    };

    // Enable thinking mode by default
    if (enableThinking) {
      (requestBody as any).thinking = {
        type: 'enabled',
        budget_tokens: GLM_CONFIG.thinkingTokens
      };
    }

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GLM API Error (${response.status}): ${errorText}`);
    }

    const data: GLMResponse = await response.json();

    // Extract text from content blocks
    let text = '';
    for (const block of data.content) {
      if (block.type === 'text') {
        text += block.text;
      }
    }

    return { text };
  }
}

export const getGlmClient = () => {
  if (!GLM_CONFIG.apiKey) {
    throw new Error("GLM API Key 未配置。\n\n请按以下步骤配置：\n1. 复制 .env.example 为 .env.local\n2. 设置 ANTHROPIC_AUTH_TOKEN 为你的 GLM API 密钥\n3. 获取 API 密钥: https://open.bigmodel.cn/\n\n⚠️ 安全提示：此应用使用前端架构，API 密钥会在浏览器中使用。请确保使用有配额限制的密钥。");
  }
  return new GLMClient(GLM_CONFIG.baseUrl, GLM_CONFIG.apiKey, GLM_CONFIG.model);
};

// --- Font Library ---
const FONT_LIBRARY = `
1. CLASSIC (经典宋体): 'Noto Serif SC' (Heading) + 'Noto Sans SC' (Body)
   URL: https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Noto+Serif+SC:wght@400;700&display=swap
2. MODERN (现代黑体): 'Noto Sans SC' (Heading) + 'Noto Sans SC' (Body)
   URL: https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap
3. ELEGANT (优雅古风): 'ZCOOL XiaoWei' (Heading) + 'Noto Serif SC' (Body)
   URL: https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400&family=ZCOOL+XiaoWei&display=swap
4. ARTISTIC (书法艺术): 'Ma Shan Zheng' (Heading) + 'Noto Sans SC' (Body)
   URL: https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@300;400&display=swap
5. MINIMAL (极简人文): 'ZCOOL QingKe HuangYou' (Heading) + 'Noto Sans SC' (Body)
   URL: https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400&family=ZCOOL+QingKe+HuangYou&display=swap
`;

/**
 * Helper: Render JSON Day Data to HTML String
 */
function renderDayToHtml(dayData: DayPlan, palette: string, stockImages: string[]): string {
  // Construct AMap Link (fallback to generic search if coordinates missing)
  const mainActivity = dayData.activities[0];
  const mapLink = mainActivity && mainActivity.location.lat && mainActivity.location.lng
    ? `https://www.amap.com/search?query=${encodeURIComponent(mainActivity.location.name)}`
    : `https://www.amap.com/search?query=${encodeURIComponent(dayData.city + ' ' + dayData.title)}`;

  return `
    <section id="day-${dayData.day}" class="mb-32 break-inside-avoid relative group transition-all duration-500">
       <!-- 1. Header -->
       <div class="flex items-end gap-6 mb-10 relative px-2">
          <div class="text-9xl font-black text-${palette}-100 absolute -top-12 -left-6 z-0 opacity-40 select-none font-heading">${dayData.day.toString().padStart(2, '0')}</div>
          <div class="relative z-10 pl-6 border-l-4 border-${palette}-400">
             <h2 class="text-4xl md:text-5xl font-bold text-${palette}-900 leading-none font-heading tracking-tight">${dayData.title}</h2>
             <p class="text-${palette}-600 font-serif text-xl mt-3 italic flex items-center gap-2">
                <span class="w-8 h-px bg-${palette}-400"></span>
                ${dayData.theme}
             </p>
          </div>
       </div>

       <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
           <!-- 2. LEFT: Visuals -->
           <div class="lg:col-span-5 flex flex-col gap-6 sticky top-8 self-start">
               <div class="grid grid-cols-2 gap-2 w-full rounded-2xl overflow-hidden shadow-xl bg-${palette}-100 aspect-[4/5] group-hover:shadow-2xl transition-shadow duration-500">
                   ${stockImages.slice(0, 3).map((img, idx) => {
                     // 防御性类型检查：支持字符串或对象格式
                     const imgUrl = (typeof img === 'string') ? img : ((img as any)?.url || '');
                     return `
                     <div class="relative bg-${palette}-50 ${idx === 0 ? 'col-span-2 row-span-2' : ''} overflow-hidden group/img">
                       <img
                         src="${imgUrl}"
                         alt="Day Visual"
                         class="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                         loading="lazy"
                         decoding="async"
                         onerror="this.style.opacity='0';this.nextElementSibling?.remove();"
                       />
                       <div class="absolute inset-0 bg-${palette}-100/50 animate-pulse pointer-events-none" style="animation-duration: 1.5s;"></div>
                     </div>
                     `;
                   }).join('')}
               </div>

               <!-- Map Card (Gaode) -->
               <a href="${mapLink}" target="_blank" class="flex items-center p-5 bg-white/80 backdrop-blur rounded-xl border border-${palette}-100 shadow-sm hover:shadow-md hover:border-${palette}-300 transition-all group/map no-underline cursor-pointer">
                  <div class="bg-${palette}-50 p-3 rounded-full text-${palette}-600 mr-4 group-hover/map:bg-${palette}-100 transition-colors">
                     <!-- Gaode Icon Style -->
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                  </div>
                  <div class="flex-1">
                      <span class="block font-bold text-${palette}-900 text-sm">高德地图导航</span>
                      <span class="text-xs text-${palette}-500 truncate max-w-[200px]">${mainActivity ? mainActivity.location.name : dayData.city} 及周边</span>
                  </div>
                  <div class="text-${palette}-400 group-hover/map:translate-x-1 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </div>
               </a>
           </div>

           <!-- 3. RIGHT: Content -->
           <div class="lg:col-span-7 pt-4 flex flex-col">
               <div class="relative space-y-12 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-${palette}-200 before:via-${palette}-100 before:to-transparent flex-1">
                  ${dayData.activities.map(act => `
                    <div class="relative pl-12 md:pl-0 md:group-even:flex-row-reverse group/item">
                       <div class="md:flex items-center justify-between w-full">
                          <div class="absolute left-6 md:left-0 md:relative w-3 h-3 rounded-full border-2 border-white bg-${palette}-400 z-10 -translate-x-1.5 md:mx-auto shadow-sm"></div>

                          <div class="md:w-[45%] mb-2 md:mb-0 md:text-right md:pr-8">
                             <span class="inline-block px-3 py-1 rounded-full bg-${palette}-50 text-${palette}-600 text-xs font-bold mb-2">${act.time}</span>
                             <h3 class="text-xl font-bold text-${palette}-900">${act.title}</h3>
                          </div>

                          <div class="md:w-[45%] md:pl-8">
                             <p class="text-${palette}-700 text-sm leading-relaxed mb-3">${act.description}</p>
                             <div class="flex flex-wrap gap-2">
                                <a href="https://www.amap.com/search?query=${encodeURIComponent(act.location.name)}" target="_blank" class="inline-flex items-center gap-1 text-[10px] text-${palette}-500 bg-white border border-${palette}-100 px-2 py-1 rounded hover:bg-${palette}-50 transition-colors">
                                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                   ${act.location.name}
                                </a>
                             </div>
                             ${act.tips ? `<div class="mt-3 text-xs text-${palette}-500 italic bg-${palette}-50/50 p-2 rounded border-l-2 border-${palette}-300">${act.tips}</div>` : ''}
                          </div>
                       </div>
                    </div>
                  `).join('')}
               </div>

               <!-- MODIFY BUTTON AREA -->
               <div class="mt-8 border-t border-${palette}-100 pt-6 flex justify-end print:hidden">
                  <button onclick="window.parent.postMessage({type: 'MODIFY_DAY', day: ${dayData.day}}, window.location.origin)" class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 border border-${palette}-200 text-${palette}-600 hover:bg-${palette}-50 hover:border-${palette}-300 shadow-sm transition-all text-sm font-medium backdrop-blur-sm group/btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover/btn:scale-110 transition-transform"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    <span>我想修改 Day ${dayData.day}</span>
                  </button>
               </div>
           </div>
       </div>
    </section>
  `;
}

/**
 * 1. Intent Validation
 */
export const validateTripIntent = async (prompt: string): Promise<{ isValid: boolean; message?: string }> => {
  if (!prompt || prompt.length < 2) return { isValid: false, message: "请输入您的旅行计划。" };
  try {
    const ai = getGlmClient();
    const response = await ai.generateContent({
      prompt: `你是一位超会玩的旅行规划助手！请帮我判断用户的旅行需求是否清晰明确。

用户需求："${prompt}"

请用中文回复，JSON 格式：
{
  "hasDestination": true/false,
  "message": "用活泼网感的语气给用户的反馈"
}

注意：
- 如果需求太模糊（比如"想去玩"），hasDestination 设为 false，message 用轻松的语气提醒补充信息
- 如果需求够具体，hasDestination 设为 true，message 用热情的语气期待规划`,
      enableThinking: false // Simple validation, no need for thinking
    });
    const result = parseAIJsonResponse(response.text);
    return { isValid: !!result.hasDestination, message: result.message };
  } catch (e) { return { isValid: true }; }
};

/**
 * 1.5. Follow-up Intent Analysis
 * 分析用户后续输入的意图，判断是局部修改还是全局重新生成
 */
export const analyzeFollowUpIntent = async (
  originalPrompt: string,
  followUpInput: string,
  tripSkeleton: TripSkeleton | null
): Promise<{
  intent: string;
  ui_action: string;
  targetDay?: number;
  confidence: number;
  reasoning: string;
  suggestedAction: string;
  extractedParams?: {
    newDestination?: string;
    newDuration?: number;
    modifiedActivities?: string[];
  };
}> => {
  const ai = getGlmClient();

  const tripInfo = tripSkeleton ? `
- 目的地: ${tripSkeleton.destination}
- 天数: ${tripSkeleton.duration}天
- 行程概览: ${tripSkeleton.summary}
- 每日主题:
${tripSkeleton.days.map(d => `Day ${d.day}: ${d.title} (${d.theme})`).join('\n')}
` : '暂无行程信息';

  const prompt = `Role (角色):
你是一个智能旅行规划应用的意图识别与指令分发专家。你的工作是分析用户针对已有旅行规划提出的修改意见，判断用户的意图类型，并提取必要的修改参数。

Context (上下文):
用户已经获得了一份生成的旅行计划。现在用户正在对这份计划提出反馈或修改要求。
你需要根据用户的输入，决定系统应该执行"全局重构"还是"局部微调"。

【当前行程信息】
${tripInfo}

【用户原始需求】
${originalPrompt}

【用户的后续输入/反馈】
${followUpInput}

Task (任务):
分析用户的自然语言输入，返回一个标准的 JSON 格式指令。

Classification Rules (分类逻辑 - 核心):

1. REGENERATE_GLOBAL (全局重构):
触发条件: 用户修改了根本性的旅行参数，或者表达了对当前整体方案的完全否定。
包括: 修改目的地（如：从东京改为大阪）、修改旅行总天数、修改核心预算等级、大幅度更改旅行主题（如：从亲子游改为特种兵拉练）、或者用户说"我不喜欢这个，重写"。
前端交互 (ui_action): 必须返回 "stream_loading"，提示前端展示全屏 Loading 动画并进入流式输出模式。

2. UPDATE_LOCAL (局部微调):
触发条件: 用户仅希望修改某一天、某个时间段或某个具体的景点/餐厅，而不影响整体行程结构。
包括: 更换某天的某个景点、调整某一天的行程顺序、在某天增加/删除一个地点、修改某一餐的推荐。
前端交互 (ui_action): 返回 "silent_update"，提示前端保持当前界面，仅对数据进行局部刷新（Toast提示或局部Loading）。

3. QA_QUERY (咨询问答):
触发条件: 用户询问关于当前行程的信息，但不需要修改行程。
包括: "这个景点的门票多少钱？"、"那天天气怎么样？"。
前端交互 (ui_action): 返回 "chat_reply"。

请返回 JSON 格式：
{
  "intent": "REGENERATE_GLOBAL" | "UPDATE_LOCAL" | "QA_QUERY",
  "ui_action": "stream_loading" | "silent_update" | "chat_reply",
  "targetDay": 数字或null（仅 UPDATE_LOCAL 时有效）,
  "confidence": 0-1的数字,
  "reasoning": "分析原因（中文）",
  "suggestedAction": "建议的操作描述（中文）",
  "extractedParams": {
    "newDestination": "新的目的地（如有）",
    "newDuration": 新的天数（如有）,
    "modifiedActivities": ["修改的活动描述数组"]
  }
}`;

  try {
    const response = await ai.generateContent({
      prompt,
      maxTokens: 1000,
      temperature: 0.3,
      enableThinking: true
    });
    return parseAIJsonResponse(response.text);
  } catch (error) {
    console.error('Intent analysis failed:', error);
    // 默认返回全局重新生成
    return {
      intent: 'REGENERATE_GLOBAL',
      ui_action: 'stream_loading',
      confidence: 0.5,
      reasoning: '意图分析失败，默认进行全局重新生成',
      suggestedAction: '重新规划整个行程'
    };
  }
};

/**
 * 1.6. QA Reply Generation
 * 为用户咨询提供基于行程上下文的智能回复
 */
export const generateQAReply = async (
  originalPrompt: string,
  query: string,
  tripSkeleton: TripSkeleton | null
): Promise<{
  reply: string;
  suggestions?: string[];
}> => {
  const ai = getGlmClient();

  const tripInfo = tripSkeleton ? `
- 目的地: ${tripSkeleton.destination}
- 天数: ${tripSkeleton.duration}天
- 行程概览: ${tripSkeleton.summary}
- 每日安排:
${tripSkeleton.days.map(d => `Day ${d.day}: ${d.title} - ${d.theme} (${d.city})`).join('\n')}
` : '暂无行程信息';

  const prompt = `Role (角色):
你是一个专业的旅行顾问助手，基于用户已生成的旅行计划回答问题。

Context (上下文):
【当前行程信息】
${tripInfo}

【用户原始需求】
${originalPrompt}

【用户咨询】
${query}

Task (任务):
回答用户的问题，提供有帮助的信息。

回答策略:
1. 如果问题涉及行程中的景点/活动 → 基于行程信息回答
2. 如果问题涉及天气/预算等 → 提供一般性建议和查询渠道
3. 如果问题模糊或超出范围 → 提供有针对性的引导，例如：
   - "关于门票价格，您是想了解某个具体景点的信息吗？"
   - "您是想调整某一天的行程安排吗？"
4. 语气友好、专业、简洁

返回 JSON 格式：
{
  "reply": "回复内容（中文，简洁友好）",
  "suggestions": ["建议选项1", "建议选项2"]
}`;

  try {
    const response = await ai.generateContent({
      prompt,
      maxTokens: 800,
      temperature: 0.5,
      enableThinking: false
    });
    return parseAIJsonResponse(response.text);
  } catch (error) {
    console.error('QA reply failed:', error);
    return {
      reply: '抱歉，我暂时无法回答这个问题。您可以尝试调整行程，或提供更多细节。',
      suggestions: ['调整某一天的行程', '更换某个景点']
    };
  }
};

/**
 * 1.7. Enhanced Follow-up Intent Analysis
 * 增强的意图分析，支持更多意图类型和参数提取
 */
export const analyzeEnhancedIntent = async (
  originalPrompt: string,
  followUpInput: string,
  tripSkeleton: TripSkeleton | null
): Promise<EnhancedFollowUpAnalysis> => {
  const ai = getGlmClient();

  const tripInfo = tripSkeleton ? `
- 目的地: ${tripSkeleton.destination}
- 天数: ${tripSkeleton.duration}天
- 行程概览: ${tripSkeleton.summary}
- 每日主题:
${tripSkeleton.days.map(d => `Day ${d.day}: ${d.title} (${d.theme})`).join('\n')}
` : '暂无行程信息';

  const prompt = `Role (角色):
你是一个智能旅行规划应用的意图识别与指令分发专家。你的工作是分析用户针对已有旅行规划提出的修改意见，判断用户的意图类型，并提取必要的修改参数。

Context (上下文):
用户已经获得了一份生成的旅行计划。现在用户正在对这份计划提出反馈或修改要求。
你需要根据用户的输入，决定系统应该执行哪种操作。

【当前行程信息】
${tripInfo}

【用户原始需求】
${originalPrompt}

【用户的后续输入/反馈】
${followUpInput}

Task (任务):
分析用户的自然语言输入，返回一个标准的 JSON 格式指令。

Classification Rules (分类逻辑):

1. REGENERATE_GLOBAL (全局重构):
触发条件: 用户修改了根本性的旅行参数，或者表达了对当前整体方案的完全否定。
包括: 修改目的地、修改旅行总天数、修改核心预算等级、大幅度更改旅行主题、或者用户说"我不喜欢这个，重写"。
前端交互 (ui_action): 必须返回 "stream_loading"。

2. UPDATE_LOCAL (局部微调):
触发条件: 用户仅希望修改某一天、某个时间段或某个具体的景点/餐厅，不影响整体行程结构。
包括: 更换某天的某个景点、调整某一天的行程顺序、在某天增加/删除一个地点、修改某一餐的推荐。
- 如果能识别具体天数，设置 suggestedDay 和 dayConfidence
- 如果dayConfidence > 0.7，ui_action设为"silent_update"
- 如果dayConfidence < 0.7，ui_action设为"day_confirmation"

3. QA_QUERY (咨询问答):
触发条件: 用户询问关于当前行程的信息，但不需要修改行程。
包括: "这个景点的门票多少钱？"、"那天天气怎么样？"。
前端交互: 返回 "chat_reply"。

4. CHAT (闲聊):
触发条件: 礼貌性回应、感谢、无关对话。
包括: "谢谢"、"好的"、"你好"等。
前端交互: 返回 "chat_reply"，chatType 设为 "casual"。

5. SEARCH (搜索查询):
触发条件: 询问餐厅、景点、交通等具体POI信息，或搜索相关推荐。
包括: "除了xxx还有哪个餐厅好吃？"、"这个景点周围有没有别的景点"。
- 提取searchQuery（搜索关键词）
- 设置searchCategory（restaurant/attraction/transport/accommodation）
前端交互: 返回 "search_confirmation"。

返回 JSON 格式：
{
  "intent": "REGENERATE_GLOBAL" | "UPDATE_LOCAL" | "QA_QUERY" | "CHAT" | "SEARCH",
  "ui_action": "stream_loading" | "silent_update" | "chat_reply" | "day_confirmation" | "search_confirmation",
  "targetDay": 数字或null（仅 UPDATE_LOCAL 时有效）,
  "suggestedDay": 数字或null（AI识别的推荐天数）,
  "dayConfidence": 0-1的数字（天数识别的置信度）,
  "confidence": 0-1,
  "reasoning": "分析原因（中文）",
  "suggestedAction": "建议的操作描述（中文）",
  "requiresConfirmation": true/false,
  "confirmationPrompt": "需要用户确认时的提示语（如：检测到您想修改第X天）",
  "confirmationOptions": ["选项1", "选项2"],
  "chatType": "casual" | "clarification" | "feedback",
  "searchQuery": "搜索关键词",
  "searchCategory": "restaurant" | "attraction" | "transport" | "accommodation",
  "extractedParams": {
    "newDestination": "新的目的地（如有）",
    "newDuration": 新的天数（如有）,
    "modifiedActivities": ["修改的活动描述数组"]
  }
}

重要提示：
- dayConfidence > 0.7 时，AI对天数识别有较高信心，可以静默更新或显示确认弹窗
- dayConfidence < 0.7 时，必须显示天数选择器让用户手动选择
- SEARCH意图下，searchQuery应该是简短的关键词，不是完整句子
- CHAT意图下，chatType通常设为"casual"，表示轻松闲聊`;

  try {
    const response = await ai.generateContent({
      prompt,
      maxTokens: 1500,
      temperature: 0.3,
      enableThinking: true
    });
    const result = parseAIJsonResponse(response.text);

    // Map the result to EnhancedFollowUpAnalysis
    return {
      intent: result.intent || FollowUpIntent.REGENERATE_GLOBAL,
      ui_action: result.ui_action || UIAction.STREAM_LOADING,
      targetDay: result.targetDay || result.suggestedDay || null,
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || '',
      suggestedAction: result.suggestedAction || '',
      extractedParams: result.extractedParams,
      // New fields
      chatType: result.chatType,
      searchQuery: result.searchQuery,
      searchCategory: result.searchCategory,
      suggestedDay: result.suggestedDay,
      dayConfidence: result.dayConfidence,
      requiresConfirmation: result.requiresConfirmation || false,
      confirmationPrompt: result.confirmationPrompt,
      confirmationOptions: result.confirmationOptions
    };
  } catch (error) {
    console.error('Enhanced intent analysis failed:', error);
    // Return default fallback
    return {
      intent: FollowUpIntent.QA_QUERY,
      ui_action: UIAction.CHAT_REPLY,
      confidence: 0.5,
      reasoning: '意图分析失败',
      suggestedAction: '请重新描述',
      requiresConfirmation: false
    };
  }
};

/**
 * 2a. Visual Identity
 */
async function generateVisualIdentity(prompt: string, ai: GLMClient): Promise<VisualIdentity> {
  const response = await ai.generateContent({
    prompt: `你是一位超有审美的旅行视觉设计师！🎨✨

请分析用户的旅行需求，为ta定制专属视觉风格：

用户需求："${prompt}"

请用中文回复，JSON 格式：
{
  "destination": "目的地名称",
  "duration": 天数（整数）,
  "vibe": "用两个字描述旅行氛围（比如：松弛感、烟火气、文艺范、治愈系、出片率）",
  "palette": "选择一个色系：stone/zinc/slate/blue/indigo/rose/orange/emerald/teal",
  "heroStyle": "选择封面风格：centered（居中大气）/magazine（杂志风）/minimal（极简风）",
  "fontConfig": {
    "headingFont": "从下方选择标题字体",
    "bodyFont": "从下方选择正文字体",
    "googleFontUrl": "对应字体的 URL"
  }
}

可用字体库：
${FONT_LIBRARY}

注意：vibe 要用年轻人喜欢的网络流行语，比如"松弛感""烟火气""治愈系"这种风格～`,
    enableThinking: true
  });
  return parseAIJsonResponse(response.text);
}

/**
 * 2b. Structure Skeleton
 */
async function generateItineraryStructure(prompt: string, links: string, visual: VisualIdentity, ai: GLMClient): Promise<TripSkeleton> {
  const response = await ai.generateContent({
    prompt: `你是一位超会玩的旅行规划师！✈️🌍

请为用户设计一份超赞的旅行行程框架：

用户需求：${prompt}
目的地：${visual.destination}
天数：${visual.duration}天
参考链接：${links || "无"}

请用中文回复，JSON 格式：
{
  "summary": "用一句超有网感的话总结这次旅程的精髓（比如：一场逃离都市的治愈之旅，在海边发呆三天三夜～）",
  "highlights": [
    {
      "icon": "emoji 图标",
      "title": "亮点标题",
      "desc": "亮点描述"
    }
  ],
  "days": [
    {
      "day": 1,
      "title": "第1天主题",
      "theme": "当日氛围关键词",
      "city": "所在城市",
      "visualKeyword": "用于图片搜索的英文关键词"
    }
  ]
}

注意：
- summary 要有网感，像小红书那种风格
- highlights 要找出4个最吸引人的点
- 每天的安排要松弛有度，不要太赶`,
    enableThinking: true
  });
  const data = parseAIJsonResponse(response.text);
  return { ...visual, ...data };
}

/**
 * 3. Day Generation (JSON -> AMap -> HTML)
 * @deprecated This function is no longer used, replaced by DayAgent
 */
/*
async function _generateDayDataAndHtml(
  daySkeleton: any,
  skeleton: TripSkeleton,
  ai: GLMClient,
  stockImages: string[]
): Promise<{ data: DayPlan, html: string }> {

  const prompt = `
你是一位超会玩的旅行规划师！✈️

请为第 ${daySkeleton.day} 天设计详细的行程安排：

目的地：${skeleton.destination}
主题：${daySkeleton.theme}
城市：${daySkeleton.city}

请用中文回复，JSON 格式：
{
  "day": ${daySkeleton.day},
  "title": "${daySkeleton.title}",
  "theme": "${daySkeleton.theme}",
  "city": "${daySkeleton.city}",
  "visualKeyword": "${daySkeleton.visualKeyword}",
  "activities": [
    {
      "time": "09:00",
      "title": "活动名称",
      "description": "用活泼的语气描述这个活动（2-3句话，要有趣、有料、有网感）",
      "location": { "name": "具体地点名称（要真实存在，能在高德地图搜到）" },
      "tips": "实用小贴士（避坑指南、拍照技巧、最佳时间等）"
    }
  ]
}

注意：
- 每天安排3-5个活动，不要太多
- 活动之间要有合理的时间间隔
- description 要有网感，像小红书博主的推荐文案
- tips 要实用，是真正能帮到游客的信息
- 地点必须是真实的 POI，能导航过去

只返回 JSON，不要有其他内容～
  `;

  const response = await ai.generateContent({
    prompt,
    enableThinking: true
  });

  const dayData = parseAIJsonResponse(response.text);

  // --- REAL DATA INJECTION: Amap Service ---
  for (const activity of dayData.activities) {
    if (activity.location?.name) {
      const amapResult = await AmapService.searchPlace(activity.location.name, dayData.city || skeleton.destination);
      if (amapResult) {
        activity.location.lat = amapResult.lat;
        activity.location.lng = amapResult.lng;
        activity.location.address = amapResult.address;
      }
    }
  }

  const html = renderDayToHtml(dayData, skeleton.palette, stockImages);

  return { data: dayData, html };
}
*/

/**
 * REGENERATE DAY
 */
export async function regenerateDayPlan(
  skeleton: TripSkeleton,
  dayIndex: number,
  modificationPrompt: string
): Promise<string> {
  const ai = getGlmClient();
  const daySkeleton = skeleton.days.find(d => d.day === dayIndex);
  if (!daySkeleton) throw new Error("Day not found");

  const stockImages = await ImageService.fetchImages({ keyword: `${daySkeleton.visualKeyword} ${modificationPrompt}`, count: 3, orientation: 'portrait' });

  const prompt = `
你是一位超会玩的旅行规划师！✈️

用户想修改第 ${dayIndex} 天的行程，请根据ta的反馈重新安排～

原始主题：${daySkeleton.theme}
用户反馈："${modificationPrompt}"

请根据用户反馈调整活动安排，返回相同的 JSON 结构。

注意：
- 保持活泼网感的文案风格
- 地点必须是真实的 POI，能导航过去
- description 要像小红书博主的推荐文案

只返回 JSON，不要有其他内容～
  `;

  const response = await ai.generateContent({
    prompt,
    enableThinking: true
  });

  const dayData = parseAIJsonResponse(response.text);

  // Re-run Amap search for new activities
  for (const activity of dayData.activities) {
    if (activity.location?.name) {
      const amapResult = await AmapService.searchPlace(activity.location.name, dayData.city || skeleton.destination);
      if (amapResult) {
        activity.location.lat = amapResult.lat;
        activity.location.lng = amapResult.lng;
        activity.location.address = amapResult.address;
      }
    }
  }

  return renderDayToHtml(dayData, skeleton.palette, stockImages);
}

/**
 * 4. Multimodal Media Analysis
 * Analyze uploaded images/videos to extract travel preferences and inspiration
 * Returns a summary string to be included in trip planning context
 */
async function analyzeUserMedia(
  files: UploadedFile[],
  ai: GLMClient
): Promise<{ summary: string; insights: string[] }> {
  if (files.length === 0) {
    return { summary: '', insights: [] };
  }

  const insights: string[] = [];

  // Process each file (batch processing could be optimized)
  for (const file of files) {
    try {
      // Generate base64 if not already present (lazy loading)
      let base64Data = file.base64;
      if (!base64Data) {
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file.file);
        });
      }

      // Prepare analysis prompt with image context
      const analysisPrompt = `
你是一位超懂旅行的视觉分析师！📸✨

用户上传了一个${file.type === 'video' ? '视频' : '图片'}作为旅行灵感参考：

文件名：${file.file.name}
类型：${file.mimeType}

请根据文件名和类型，分析这可能代表什么样的旅行体验：

1. 可能的目的地（如果能推断出来的话）
2. 旅行活动或体验类型
3. 氛围感（浪漫、冒险、松弛、文艺、治愈等）
4. 用户的旅行偏好

用中文回复，2-3句话，要有网感～
      `;

      const response = await ai.generateContent({
        prompt: analysisPrompt,
        maxTokens: 500,
        enableThinking: false
      });

      insights.push(response.text.trim());

    } catch (error) {
      console.warn(`Failed to analyze file ${file.id}:`, error);
      insights.push(`文件 ${file.file.name} 分析失败`);
    }
  }

  // Combine all insights into a summary
  const summary = insights.length > 0
    ? `用户上传了 ${files.length} 个媒体文件作为参考：\n${insights.join('\n')}`
    : '';

  return { summary, insights };
}

/**
 * MAIN ORCHESTRATOR (HTML Stream) - Enhanced with Progressive Rendering
 *
 * New Flow:
 * 1. IntentAgent: Scene analysis (0.5s)
 * 2. Yield skeleton data for immediate UI
 * 3. Generate header and overview (5s)
 * 4. Parallel day generation (15-25s total, but streamed)
 * 5. Complete with footer
 */
export async function* generateTravelPlanStream(
  details: TripDetails,
  mediaItems: MediaItem[]
): AsyncGenerator<string, void, unknown> {

  const ai = getGlmClient();
  const links = mediaItems.filter((m): m is SocialLink => 'url' in m);
  const linkText = links.map(l => `- ${l.url}`).join('\n');
  const uploadedFiles = mediaItems.filter((m): m is UploadedFile => 'file' in m);

  try {
    // Phase 1: Intent Analysis (NEW - 0.5s)
    yield `>>> ${JSON.stringify({ phase: RenderPhase.SKELETON, progress: 5 })}\n`;
    yield ">>> 📡 IntentAgent: 正在分析你的旅行需求...\n";

    const intentAgent = new IntentAgent(ai);
    let mediaContext = '';

    // Analyze media files in parallel with scene analysis
    const [sceneAnalysis, mediaAnalysis] = await Promise.all([
      intentAgent.analyzeScene(details.prompt, mediaContext),
      uploadedFiles.length > 0 ? analyzeUserMedia(uploadedFiles, ai) : Promise.resolve({ summary: '', insights: [] })
    ]);

    if (mediaAnalysis.insights.length > 0) {
      mediaContext = mediaAnalysis.summary;
      yield `>>> 📸 视觉智能体：已提取 ${mediaAnalysis.insights.length} 条旅行灵感\n`;
    }

    yield `>>> 🎯 场景识别：${sceneAnalysis.sceneType} (置信度: ${Math.round(sceneAnalysis.confidence * 100)}%)\n`;
    yield `>>> 📝 快速摘要：${sceneAnalysis.quickSummary}\n`;

    // Enhanced prompt with media context and scene hints
    const enhancedPrompt = mediaContext
      ? `${details.prompt}\n\n用户上传的媒体参考：\n${mediaContext}\n\n场景类型：${sceneAnalysis.sceneType}`
      : details.prompt;

    // Generate visual identity
    yield `>>> ${JSON.stringify({ phase: RenderPhase.HEADER, progress: 10 })}\n`;
    yield ">>> 🎨 艺术总监：正在为你的旅程定制专属视觉风格...\n";

    const visual = await generateVisualIdentity(enhancedPrompt, ai);
    yield `>>> 🎨 视觉风格：${visual.vibe}（${visual.palette} 色系）\n`;

    const heroImages = await ImageService.fetchImages({ keyword: visual.destination + " landscape", count: 1, orientation: 'landscape' });
    visual.heroImage = heroImages[0];

    // Phase 2: Generate HTML Header (5s)
    const palette = visual.palette;
    const { headingFont, bodyFont, googleFontUrl } = visual.fontConfig;
    const headerHtml = `
      <!DOCTYPE html>
      <html lang="zh-CN" class="scroll-smooth">
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="${googleFontUrl}" rel="stylesheet">
        <style>
            :root { --font-heading: '${headingFont}', serif; --font-body: '${bodyFont}', sans-serif; }
            body { font-family: var(--font-body); }
            h1, h2, h3, .font-heading { font-family: var(--font-heading); }
        </style>
      </head>
      <body class="bg-${palette}-50 text-${palette}-900 antialiased selection:bg-${palette}-200 selection:text-${palette}-900">
        <header class="relative w-full aspect-video flex flex-col overflow-hidden bg-${palette}-900 print-aspect-auto">
            <div class="absolute inset-0 bg-${palette}-800">
              <img
                src="${visual.heroImage}"
                class="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-700"
                alt="${visual.destination}"
                loading="eager"
                decoding="async"
                fetchpriority="high"
                onerror="this.style.opacity='0';this.parentElement.style.background='linear-gradient(135deg, ${palette}-900 0%, ${palette}-700 100%)';"
                onload="this.classList.add('opacity-90')"
              />
              <div class="absolute inset-0 bg-${palette}-900/50 animate-pulse" style="animation-duration: 2s;"></div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-${palette}-950/90 via-${palette}-900/40 to-transparent z-10"></div>
            <div class="relative z-20 w-full h-full max-w-7xl mx-auto flex flex-col items-center justify-center text-center pb-20 px-6">
                <h1 class="text-5xl md:text-8xl tracking-tight mb-6 font-heading text-white mix-blend-overlay drop-shadow-lg max-w-5xl">
                    ${visual.destination}
                </h1>
                <div class="mx-auto bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full flex items-center gap-4 shadow-xl">
                    <span class="font-bold tracking-widest uppercase text-sm opacity-90">${visual.duration} 天</span>
                    <span class="w-px h-4 bg-white/40"></span>
                    <span class="font-serif italic text-lg opacity-90">${visual.vibe}</span>
                </div>
            </div>
        </header>
    `;

    yield "<<<HTML_START>>>" + headerHtml;

    // Phase 3: Generate Overview (10s)
    yield `>>> ${JSON.stringify({ phase: RenderPhase.OVERVIEW, progress: 20 })}\n`;
    yield ">>> 🗺️ 行程规划师：正在构建你的专属行程框架...\n";
    const skeleton = await generateItineraryStructure(enhancedPrompt, linkText, visual, ai);
    const fullSkeleton: TripSkeleton = { ...visual, ...skeleton };

    // Yield Skeleton JSON for App.tsx state
    yield `<<<SKELETON>>>${JSON.stringify(fullSkeleton)}`;

    // Generate Overview HTML
    const highlightsHtml = (skeleton.highlights || []).map(h => `
        <div class="bg-${palette}-50/60 backdrop-blur-sm p-6 rounded-2xl text-center border border-${palette}-100">
            <div class="text-${palette}-500 mb-4 flex justify-center font-bold text-3xl opacity-80">${h.icon || '✦'}</div>
            <span class="block font-bold text-lg text-${palette}-900 mb-2 font-heading tracking-wide">${h.title}</span>
            <span class="text-sm text-${palette}-600 leading-relaxed">${h.desc}</span>
        </div>
    `).join('');

    const overviewHtml = `
        <div class="relative z-30 -mt-24 px-4 md:px-8 mb-24">
            <div class="max-w-6xl mx-auto bg-white/95 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50">
                <div class="max-w-3xl mx-auto text-center mb-16">
                    <h2 class="text-3xl md:text-5xl font-bold text-${palette}-900 mb-6 font-heading leading-tight">旅程概览</h2>
                    <p class="text-xl text-${palette}-600 leading-relaxed font-light font-serif">"${skeleton.summary}"</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${highlightsHtml}
                </div>
            </div>
        </div>
        <main class="max-w-6xl mx-auto px-6 pb-20">
    `;
    yield overviewHtml;

    // Phase 4: Parallel Day Generation (NEW - 15-25s total, but streamed)
    yield `>>> ${JSON.stringify({ phase: RenderPhase.DAY_1, progress: 30 })}\n`;
    yield `>>> 🚀 DayAgent: 启动并行生成，正在规划所有天数...\n`;

    // Generate all days in parallel (concurrency: 3)
    const dayResults = await generateDaysParallel(skeleton.days, fullSkeleton, 3);

    // Stream day results in order
    for (let i = 0; i < dayResults.length; i++) {
      const result = dayResults[i];
      const progress = 30 + Math.round((i + 1) / dayResults.length * 60);

      yield `>>> ${JSON.stringify({ phase: i === 0 ? RenderPhase.DAY_1 : RenderPhase.REMAINING, progress, day: result.dayNumber })}\n`;
      yield `>>> 🗓️ Day ${result.dayNumber}: ${result.skeleton.title} 已生成 (${result.generatedAt}ms)\n`;
      yield result.html;
    }

    // Phase 5: Complete
    yield `>>> ${JSON.stringify({ phase: RenderPhase.COMPLETE, progress: 100 })}\n`;

    const footerHtml = `
        </main>
        <footer class="bg-${palette}-900 text-${palette}-100 py-24 mt-12 text-center relative overflow-hidden">
            <p class="font-heading italic text-5xl mb-8 text-white/90">Wanderlust AI</p>
            <p class="text-sm opacity-60">由 GLM 4.7 深度思考模式驱动 × 高德地图实时数据支持 × 并行Agent架构</p>
        </footer>
      </body>
      </html>
    `;

    yield footerHtml;
    yield ">>> ✨ 行程规划完成！";

  } catch (error) {
    console.error("Orchestration Error:", error);
    yield `>>> ❌ 哎呀出错了：${(error as any).message}`;
    throw error;
  }
}
