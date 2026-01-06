
<img width="1279" height="719" alt="123" src="https://github.com/user-attachments/assets/0ce1be64-27ca-43fb-9830-36a21e9e54ef" />

<div align="center">

# Wanderlust AI Planner
### 下一代智能旅行策展人 | Next-Gen Agentic Travel Planner

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-3.0%20Flash-orange?logo=google)](https://ai.google.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-Morandi-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

[功能特性](#-核心功能) • [与众不同](#-为什么选择-wanderlust) • [快速开始](#-快速开始-本地运行) • [技术栈](#-技术栈)

</div>

---

## 📖 项目简介

**Wanderlust AI Planner** 不仅仅是一个简单的行程生成器，它是一个基于 **Google Gemini 3** 模型构建的多智能体（Multi-Agent）旅行规划系统。

通过模拟专业的旅行策划工作流（Ingestor -> Researcher -> Planner -> Finalizer），Wanderlust 能够理解模糊的旅行意图，进行全网事实核查，并最终生成一份包含**深度见解**、**比价信息**且**视觉精美**的 HTML 杂志级行程单。

## ✨ 核心功能

*   **🗣️ 自然语言交互**：无需复杂的表单，只需像聊天一样告诉 AI 您的想法（如："想去京都看红叶，喜欢小众咖啡馆"）。
*   **🖼️ 多模态输入**：支持上传图片或视频作为灵感参考，AI 会分析图片风格并融入行程。
*   **🧠 透明思维链 (CoT)**：实时展示 AI 的思考过程。您可以看到 "Researcher Agent" 如何搜索航班，"Critic Agent" 如何评估路线可行性。
*   **🎨 自适应莫兰迪 UI**：生成的行程单会根据目的地氛围自动调整配色（例如：京都-禅意绿，圣托里尼-海盐蓝）。
*   **📄 杂志级交付物**：生成的行程是一个独立的 HTML 网页，排版精美，支持导出为 **PDF** 或下载 **HTML 源码** 离线查看。
*   **🔗 智能比价与导航**：行程卡片内置 Google Maps 导航链接及官方 vs OTA 价格对比。

## 🦄 为什么选择 Wanderlust？

市面上的旅行 App 浩如烟海，Wanderlust 有何不同？

| 特性 | ❌ 传统攻略 / ChatGPT 文字版 | ✅ Wanderlust AI Planner |
| :--- | :--- | :--- |
| **生成逻辑** | 黑盒输出，经常出现"幻觉"（不存在的景点） | **Evidence-Based (基于证据)**：集成 Google Search Grounding，实时核验营业时间与票价。 |
| **视觉体验** | 枯燥的文字列表或 Markdown | **自适应杂志排版**：根据目的地 "Vibe" 动态生成 Tailwind 配色方案与 Hero 图片。 |
| **规划深度** | 简单的"点到点"罗列 | **深度见解**：提供"Booking Intelligence"（预订建议）与 "Deep Dive"（深度玩法）。 |
| **交互性** | 静态文本，无法互动 | **完全可交互**：内置地图跳转、外部链接、反馈评价与社交分享。 |
| **可移植性** | 只能在 App 内查看 | **零依赖交付**：生成单一 HTML 文件，可在任何浏览器打开，永久保存。 |

## 🚀 快速开始 (本地运行)

想要在本地体验 Wanderlust？请按照以下步骤操作：

### 1. 前置要求
*   [Node.js](https://nodejs.org/) (v18 或更高版本)
*   [Google AI Studio API Key](https://aistudio.google.com/app/apikey) (推荐使用免费的 Gemini Flash 模型)

### 2. 获取代码
```bash
git clone https://github.com/yourusername/wanderlust-planner.git
cd wanderlust-planner
```

### 3. 安装依赖
```bash
npm install
# 或者
yarn install
```

### 4. 配置环境变量
在项目根目录创建一个 `.env` 文件，并填入您的 API Key：

```bash
# .env 文件内容
API_KEY=您的_GOOGLE_GEMINI_API_KEY
```

> **注意**：本项目默认使用 `gemini-3-flash-preview` 模型以确保响应速度快且不易触发免费配额限制。

### 5. 启动应用
```bash
npm run dev
```
浏览器打开 `http://localhost:5173` 即可开始规划您的旅程！

## 🛠️ 技术栈

*   **Frontend Framework**: React 19 (Hooks, Streaming)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS (自定义莫兰迪色系配置)
*   **AI SDK**: Google GenAI SDK (`@google/genai`)
*   **Icons**: Lucide React
*   **Streaming**: 实现了基于 Async Generator 的流式 UI 渲染

## 📖 SHOWCASE
![111](https://github.com/user-attachments/assets/6342ea88-aa3c-4e3b-bd46-611e9e50812e)

![222](https://github.com/user-attachments/assets/6fac0a05-39a0-4897-8ef9-de5afd6ac895)

![333](https://github.com/user-attachments/assets/540335a4-3267-44bd-aff8-5b4e28436266)

---
<div align="center">
Built with ❤️ using Gemini 3 & React
</div>
