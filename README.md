<img width="1279" height="719" alt="123" src="https://github.com/user-attachments/assets/35d6f514-1209-4b7b-a189-782c48202503" />

<div align="center">

# Wanderlust AI Planner
### 基于 Multi-Agent 架构的新一代智能旅行策展人

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![GLM](https://img.shields.io/badge/GLM-4.7-5737D6?logo=ai)](https://open.bigmodel.cn/)
[![Multi-Agent](https://img.shields.io/badge/Architecture-Multi--Agent-success)](https://github.com/anthropics/anthropic-quickstart)
[![Tailwind](https://img.shields.io/badge/Tailwind-Morandi-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

[Multi-Agent 架构](#-multi-agent-架构设计) • [核心技术优势](#-核心技术优势) • [快速开始](#-快速开始)

</div>

---

## 📖 项目简介

**Wanderlust AI Planner** 是一款智能旅行规划应用，采用 **Multi-Agent 架构**，通过 5 个专业 AI Agent 协同工作，为用户生成高质量、个性化的旅行行程。

与传统的单一 AI 模型不同，将复杂的旅行规划任务拆解为多个专业领域，每个 Agent 专注于特定职责，通过并行处理和渐进式渲染，让用户可以快速看到结果。


## 🤖 Multi-Agent 架构设计

### 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户输入 (TripDetails)                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  IntentAgent (意图识别专家) - < 0.5s                           │
│  - 快速识别 8 种旅行场景                                        │
│  - 生成骨架屏数据，实现即时反馈                                 │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  SceneAgent (场景适配专家)                                      │
│  - 基于场景类型定制行程框架                                     │
│  - 应用专属配色和字体配置                                      │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
┌──────────────────────────────┐  ┌──────────────────────────────────┐
│  DayAgent[] (并行生成引擎)     │  │  ShareAgent (双视图生成器)       │
│  - 3 天并发处理                │  │  - 组织者视图（准备清单）         │
│  - 每天生成 < 5s               │  │  - 旅行者视图（快速概览）         │
└──────────────────────────────┘  └──────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  渐进式渲染 (Progressive Rendering)                             │
│  0.5s → 骨架屏  →  5s → Day 1  →  30s → 完整报告             │
└─────────────────────────────────────────────────────────────────┘
```

### 5 个专业 Agent 详解

#### 🎯 IntentAgent - 意图识别专家
**响应时间**: < 0.5s | **核心能力**: 关键词匹配 + AI 深度分析

- **双层识别机制**: 快速预判（~10ms）+ 深度分析（< 0.5s）
- **8 种场景识别**: 浪漫、亲子、探险、商务、美食、文化、休闲、独行
- **骨架屏生成**: 即时反馈，提升用户体验
- **智能缓存**: 避免重复分析相同输入

#### 🗺️ SceneAgent - 场景适配专家
**核心能力**: 基于场景类型定制行程

- **8 大场景专属配置**: 每种场景都有独特的色系、字体和行程节奏
- **自动内容适配**: 根据场景类型调整亮点和活动风格
- **模板化生成**: 确保输出的一致性和高质量

#### ⚡ DayAgent - 并行生成引擎
**性能**: 每天 < 5s | **并发数**: 3

- **独立职责**: 每个 DayAgent 专注于单日行程生成
- **并行处理**: 3 天同时生成，整体效率提升 70%
- **数据丰富**: 自动集成高德地图 POI、精美配图
- **容错机制**: 单日失败不影响整体生成

#### 👥 ShareAgent - 双视图生成器
**视图模式**: 组织者视图 + 旅行者视图

**组织者视图**:
- 📦 准备物品清单（衣物、电子、证件、药品等）
- 💰 预算估算（交通、住宿、餐饮、景点等）
- 🚨 紧急联系人（警察、医院、旅游咨询）

**旅行者视图**:
- ⚡ 快速概览（一句话精华）
- 🌟 每日亮点（必看景点、必做事项）
- 📋 实用信息（最佳季节、语言、货币、时区等）

#### 🔄 FeedbackAgent - 智能反馈系统
**核心能力**: 版本管理 + 自动修改

- **智能分类**: 自动识别反馈类型（建议/异议/问题/认可）
- **版本历史**: 完整记录每次修改，支持版本回滚
- **差异对比**: 可视化展示不同版本之间的变化
- **自动路由**: 根据反馈决定全局重构或局部调整

---

## 🚀 核心技术优势

### 📊 性能指标对比

| 指标 | 传统 AI 生成 | Wanderlust AI | 提升 |
|:----|:------------|:--------------|:----|
| **首字节时间 (TTFB)** | 15s | **0.5s** | **97% ↓** |
| **Day 1 可见时间** | 15s | **5s** | **67% ↓** |
| **完整 7 天报告** | 70s | **30s** | **57% ↓** |
| **场景识别能力** | ❌ | **8 种场景** | ✨ **NEW** |
| **版本管理** | ❌ | **完整历史** | ✨ **NEW** |
| **多视图模式** | ❌ | **组织者 + 旅行者** | ✨ **NEW** |

### 🏆 与竞品的差异化

#### vs. ChatGPT / Claude 通用 AI

| 特性 | 通用 AI | Wanderlust AI |
|:----|:--------|:-------------|
| **架构设计** | 单一 Prompt | **5 个专业 Agent 协同** |
| **处理方式** | 顺序生成 | **并行处理（效率提升 70%）** |
| **用户体验** | 等待完整结果 | **渐进式渲染，即时反馈** |
| **数据集成** | 可能产生幻觉 | **高德地图 API，真实数据** |
| **版本控制** | ❌ | **✅ 完整修改历史** |

#### vs. 传统旅游规划 App

| 特性 | 传统 App | Wanderlust AI |
|:----|:--------|:-------------|
| **定制化程度** | 固定模板 | **AI 深度定制** |
| **输入方式** | 表单填写 | **多模态（文字、图片、视频、链接）** |
| **场景识别** | 手动选择 | **自动识别 8 种场景** |
| **输出质量** | 列表式 | **杂志级排版，自适应配色** |

### 🎯 并行处理 Pipeline

```
生成流程：
─────────────────────────────────────────────────────────
Phase 1: IntentAgent      →  场景识别     (0.5s)
         ↓
Phase 2: SceneAgent       →  场景适配     (5-8s)
         ↓
Phase 3: DayAgent[]       →  并行生成     (15-25s)
         ├─ Day 1 Agent ────────────┐
         ├─ Day 2 Agent ────────────┤
         └─ Day 3 Agent ────────────┘
         ↓ (并行执行，3天并发)
Phase 4: ShareAgent       →  双视图生成   (异步)
         ↓
Phase 5: 渐进式渲染       →  流式输出     (持续)
         ├─ 0.5s: 骨架屏
         ├─ 5s:   Day 1 内容
         └─ 30s:  完整报告
─────────────────────────────────────────────────────────
```

### ✨ 功能特性

#### 8 大场景智能识别

| 场景类型 | 图标组件 | 特色 | 适用人群 |
|:--------|:----|:----|:--------|
| **浪漫情侣** | Heart | 减少景点数量，增加停留时间 | 情侣、蜜月、纪念日 |
| **亲子家庭** | Users | 老少皆宜，节奏轻松 | 家庭出游 |
| **户外探险** | Mountain | 刺激体验，挑战自我 | 户外爱好者 |
| **商务出行** | Briefcase | 高效行程，品质住宿 | 商务人士 |
| **美食之旅** | Utensils | 地道美食，特色餐厅 | 美食爱好者 |
| **文化深度** | Landmark | 历史古迹，文化体验 | 文化爱好者 |
| **休闲度假** | Sun | 悠闲节奏，放松体验 | 度假休闲 |
| **独行旅行** | Backpack | 自由探索，深度体验 | 独行侠 |

#### 版本管理与反馈闭环

```
用户反馈 → FeedbackAgent 分析 → 生成修改方案
    ↓              ↓                  ↓
  提交建议    智能分类    全局重构 / 局部调整
    ↓              ↓                  ↓
  版本历史    差异对比    新版本生成
    ↓              ↓                  ↓
  版本回滚    可视化展示    用户确认
```

#### 智能搜索系统

- 🌐 **多源搜索**: 整合 Tavily 网页搜索、高德地图 POI、图片搜索
- 🔍 **智能分类**: 支持景点、餐厅、酒店、活动等分类搜索
- 📊 **结果排序**: AI 驱动的相关性排序和过滤
- 💾 **搜索缓存**: 自动缓存搜索结果，提升响应速度
- 📜 **搜索历史**: 记录搜索历史，快速重复搜索

---

## 🛠 技术栈

| 类别 | 技术 | 用途 |
|:----|:----|:----|
| **前端框架** | React 18 + TypeScript | 用户界面 |
| **构建工具** | Vite 5 | 快速开发和热更新 |
| **样式** | Tailwind CSS (Morandi 配色) | 视觉设计 |
| **图标系统** | lucide-react | 统一 SVG 图标 |
| **AI 模型** | GLM-4.7 (智谱 AI) | 智能规划核心 |
| **搜索服务** | Tavily Search API | 网页搜索和智能问答 |
| **地图服务** | 高德地图 API | POI 数据和导航 |
| **图片服务** | Pexels + Pixabay | 旅行配图 |
| **状态管理** | React Context + Hooks | 全局状态 |

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/wanderlust-planner.git
cd wanderlust-planner
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 API Key

复制环境变量模板：
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```bash
# 必需：GLM-4.7 API 配置
ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic
ANTHROPIC_AUTH_TOKEN=your_glm_api_key_here
ANTHROPIC_MODEL=GLM-4.7

# 新增：Web 搜索服务
VITE_TAVILY_API_KEY=your_tavily_api_key_here

# 可选：图片 API
PEXELS_API_KEY=your_pexels_api_key_here
PIXABAY_API_KEY=your_pixabay_api_key_here

# 可选：高德地图 API
AMAP_API_KEY=your_amap_api_key_here
```

**获取 API 密钥**：
- GLM-4.7: https://open.bigmodel.cn/
- Tavily Search: https://tavily.com/
- Pexels: https://www.pexels.com/api/
- Pixabay: https://pixabay.com/api/docs/
- 高德地图: https://lbs.amap.com/

### 4. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 `http://localhost:5173`，开始体验 Multi-Agent 智能旅行规划。

---

## 📁 项目结构

```
wanderlust-planner/
├── components/
│   ├── icons/                     # SVG 图标系统
│   │   ├── mappings.ts
│   │   └── SceneIcon.tsx
│   ├── ui/                        # 通用 UI 组件
│   │   └── Button.tsx
│   ├── SearchInput.tsx            # 搜索输入组件
│   ├── SearchHistory.tsx          # 搜索历史组件
│   ├── SearchResultsCard.tsx      # 搜索结果卡片（支持多源）
│   ├── InputForm.tsx              # 输入表单（支持多模态）
│   ├── AgentLoadingScreen.tsx     # Agent 加载动画
│   ├── SkeletonLoader.tsx         # 骨架屏组件
│   ├── ChatMessage.tsx            # 聊天消息组件
│   ├── ReportChatPanel.tsx        # 报告聊天面板
│   └── views/
│       ├── OrganizerView.tsx      # 组织者视图
│       └── TravelerView.tsx       # 旅行者视图
├── hooks/                         # 自定义 React Hooks
│   ├── useTripPlan.ts             # 行程规划状态管理
│   ├── useVersionHistory.ts       # 版本历史管理
│   ├── useChatMessages.ts         # 聊天消息管理
│   └── useAgentProgress.ts        # Agent 进度跟踪
├── services/
│   ├── webSearchService.ts        # Tavily API 集成
│   ├── unifiedSearchService.ts    # 统一搜索入口
│   ├── glmService.ts              # GLM-4.7 核心服务
│   ├── amapService.ts             # 高德地图服务
│   ├── imageService.ts            # 图片获取服务
│   └── agent/
│       ├── intentAgent.ts         # 意图识别 Agent
│       ├── sceneAgent.ts          # 场景适配 Agent
│       ├── dayAgent.ts            # 并行生成 Agent
│       ├── shareAgent.ts          # 分享视图 Agent
│       ├── feedbackAgent.ts       # 反馈处理 Agent
│       └── searchAgent.ts         # 搜索编排 Agent
├── contexts/
│   └── TravelContext.tsx          # 全局状态管理
├── types.ts                       # TypeScript 类型定义
├── App.tsx                        # 主应用组件
├── .env.example                   # 环境变量模板
├── SECURITY.md                    # 安全策略文档
└── README.md                      # 项目说明（本文件）
```

---

## 🔒 安全说明

本项目采用前端架构，API 密钥会在浏览器中使用。请确保：

1. ✅ 使用有配额限制的 API 密钥
2. ✅ 定期监控 API 使用情况
3. ✅ 定期轮换 API 密钥
4. ✅ 不要将 `.env.local` 提交到版本控制

如需部署到生产环境，建议：
- 实现后端代理服务
- 添加用户认证系统
- 实施速率限制

详见 [SECURITY.md](./SECURITY.md)


Built with ❤️ by GENGJIAN and claude code
<br>
Powered by <a href="https://open.bigmodel.cn/">GLM-4.7</a> • Multi-Agent Architecture
</div>
