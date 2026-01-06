<img width="1279" height="719" alt="123" src="https://github.com/user-attachments/assets/a2c6e972-087f-49ea-9037-365b815cc491" />

<div align="center">

# Wanderlust AI Planner
### 智能旅行策展人 | Agentic Travel Planner

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-3%20Pro-4285F4?logo=google)](https://ai.google.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-Morandi-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

[核心亮点](#-核心亮点) • [设计巧思](#-设计巧思-design-philosophy) • [技术架构](#-技术架构-architecture) • [快速开始](#-快速开始-getting-started)

</div>

---

## 📖 项目简介

**Wanderlust AI Planner** 是一款旅行规划应用，旨在解决传统 AI 生成长行程时常见的“虎头蛇尾”和“幻觉”问题。

本项目基于 **Google Gemini 3 Pro** 模型构建，采用**结构化模版强制**技术，能够生成包含**每日地图导航**、**深度文化见解**以及**自适应视觉风格**的杂志级 HTML 行程单。它不仅仅是罗列地点，更是为您策划一场有灵魂的旅程。

---

## ✨ 核心亮点

### 1. 🛡️ 解决 "Lost in the Middle" 现象
针对大模型生成长文本时容易出现的“注意力衰减”问题，我们设计了 **Anti-Laziness Protocol (反偷懒协议)**：
*   **全量细节保留**：强制模型对第 7 天的描述必须与第 1 天一样详尽。
*   **组件强制渲染**：通过代码约束，确保每一天的行程卡片都包含 **Google Maps 路线导航按钮**，杜绝组件丢失。
*   **结构化输出**：不再依赖自由文本，而是要求 AI 填充严格的 HTML 结构槽位。

### 2. 📑 智能摘要与杂志级排版
*   **Journey Overview**：AI 会在行程开头自动生成“旅程概览”和 4 个核心亮点（Highlights），让您一眼通过图标和摘要掌握旅程精髓。
*   **自适应 UI**：行程单并非千篇一律。AI 会分析目的地氛围（Vibe），自动为 HTML 生成一套 **Tailwind 配色方案**（例如：京都-石墨绿，圣托里尼-海蓝，巴黎-玫瑰金）。

### 3. 🔗 真实可落地
集成 Google Search Grounding，AI 规划的每一个景点、餐厅均经过实时事实核验。生成的 HTML 包含真实的 Google Maps 链接，拒绝不存在的“幽灵景点”。

---

## 🎨 设计巧思

Wanderlust 的 UI 设计不仅仅是为了好看，而是为了营造“松弛感”和“沉浸感”。

*   **拟态与微交互**：
    *   **磨砂玻璃**：大量使用 `backdrop-blur` 营造层次感。
    *   **流体动画**：输入框的呼吸效果、加载时的 Agent 流程可视化，让等待 AI 思考的过程本身成为一种享受。

*   **Agent 工作流可视化**：
    我们并不隐藏 AI 的思考过程。在侧边栏，你可以清晰地看到 Agent 从 `Ingesting` (解析需求) -> `Researching` (搜证) -> `Planning` (规划) -> `Finalizing` (生成 UI) 的全过程状态流转。

---

## 🛠 技术架构

*   **Frontend**: React 19 + TypeScript + Vite
*   **AI Model**: Google Gemini 3 Pro Preview (`@google/genai` SDK)
*   **Styling**: Tailwind CSS (Custom Config)
*   **Streaming**: 使用 Async Generator 实现打字机式的流式 HTML 渲染
*   **Export**: 支持一键导出 `.html` 源码或打印为 PDF

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
在项目根目录创建 `.env` 文件（请确保您有访问 Gemini 3 Pro 的权限）：

```bash
# .env
API_KEY=您的_GOOGLE_GEMINI_API_KEY
```

### 4. 启动开发服务器
```bash
npm run dev
```

打开浏览器访问 `http://localhost:5173`，开始体验下一代 AI 旅行规划。

---

## 📸 SHOWCASE
![111](https://github.com/user-attachments/assets/6342ea88-aa3c-4e3b-bd46-611e9e50812e)

![222](https://github.com/user-attachments/assets/6fac0a05-39a0-4897-8ef9-de5afd6ac895)

![333](https://github.com/user-attachments/assets/540335a4-3267-44bd-aff8-5b4e28436266)

---

<div align="center">
Built with ❤️ by Gin HU
</div>
