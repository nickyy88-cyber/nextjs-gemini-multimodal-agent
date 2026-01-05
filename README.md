# 🧠 DocuMind AI - Multimodal RAG Agent

![Next.js 16](https://img.shields.io/badge/Next.js_16-Black?style=flat&logo=next.js&logoColor=white)
![Gemini 2.5](https://img.shields.io/badge/AI-Gemini_2.5_Flash-blue?style=flat&logo=google&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

> **A production-ready AI Agent capable of analyzing Documents (PDF), Images, and Video in real-time.**

[**🔴 Live Demo**](https://您的-vercel-链接.vercel.app) · [**Report Bug**](https://github.com/nickyy88-cyber/nextjs-gemini-multimodal-agent/issues)

---

## ⚡️ About The Project

**DocuMind AI** is a technical showcase demonstrating the power of **Multimodal AI** integrated into a modern web application. Unlike traditional chatbots, DocuMind can "see" and "read" uploaded files to provide context-aware answers.

It is built to demonstrate **Enterprise-Grade AI Integration** capabilities, including:
*   **Zero-Latency Streaming:** Utilizing Vercel AI SDK for typewriter-style responses.
*   **Multimodal Reasoning:** Powered by **Google Gemini 2.5 Flash**, it understands charts in PDFs and frames in videos.
*   **Mobile-First UX:** A native-app-like experience on mobile devices with optimized touch interactions.

---

## 🛠 Tech Stack (The Bleeding Edge)

This project is built on the latest 2026 web standards:

*   **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
*   **AI Engine:** [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) (via Google Generative AI SDK)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
*   **State Management:** Vercel AI SDK (`useChat`)
*   **Deployment:** Vercel Edge Network

---

## 🚀 Key Features

- **📄 Document Analysis:** Upload PDFs (Contracts, Reports) and chat with them instantly.
- **🖼️ Visual Intelligence:** Upload charts or screenshots; the AI interprets data points accurately.
- **🎥 Video Understanding:** (Experimental) Analyze video content for summaries and insights.
- **💬 Real-time Streaming:** No loading spinners. Responses stream instantly.
- **📱 Responsive Design:** Fully optimized for mobile viewports (no zooming issues, native feel).

---

## 📦 Getting Started

Want to run this locally? Follow these steps:

1.  **Clone the repo**
    ```bash
    git clone https://github.com/nickyy88-cyber/nextjs-gemini-multimodal-agent.git
    ```
2.  **Install dependencies**
    ```bash
    npm install
    ```
3.  **Set up Environment Variables**
    Create a `.env.local` file in the root directory and add your Google API Key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```
4.  **Run the development server**
    ```bash
    npm run dev
    ```

---

## 👨‍💻 Author

**[您的名字]**
*   **Role:** Next.js 16 & AI Architecture Specialist
*   **Focus:** Building high-performance AI SaaS & MVPs.
*   **Available for hire:** Yes

[**Hire me on Upwork**](您的Upwork个人主页链接) | [**View Portfolio**](您的PageAlchemist链接)

---

*Note: This project is a showcase. Do not use the API keys in production without proper backend rate limiting.*
