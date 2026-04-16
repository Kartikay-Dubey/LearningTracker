const express = require("express");
const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require("dotenv").config();
const { OpenAI } = require("openai");

const app = express();
app.use(cors({
  origin: "*"
}));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
    "X-Title": "Learning Tracker",
  }
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/api/generate-goals", async (req, res) => {
  const { syllabusText } = req.body;
  if (!syllabusText) return res.status(400).json({ error: "Missing syllabusText" });

  console.log("Received request to /api/generate-goals");
  console.log("OPENROUTER_API_KEY present?", !!process.env.OPENROUTER_API_KEY);
  console.log("First 100 chars of syllabusText:", syllabusText.slice(0, 100));

  try {
    const response = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct-v0.1",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a learning tracker app. Given the following academic syllabus, break it into a list of smart, structured learning goals. 

You MUST return ONLY a valid JSON object with a single key "goals" containing an array of objects. Do not output markdown blocks like \`\`\`json. OUTPUT NOTHING EXCEPT RAW JSON.
Each object MUST have the following structure:
{
  "title": "Module or Topic Name",
  "description": "Short description of what to learn",
  "difficulty": "Easy", // or Medium, Hard
  "estimated_time": "Time in hours or days",
  "prerequisites": ["List", "of", "strings"],
  "resources": ["Links", "or", "book names"]
}`
        },
        { role: "user", content: syllabusText },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    // OpenAI modern structure returns directly accessible fields
    const content = response?.choices?.[0]?.message?.content || "No response received";
    if (!response?.choices?.length) {
      throw new Error("Empty response from AI");
    }
    console.log("OpenAI API response received successfully.");

    // Silently route the syllabus to the ML service context buffer
    const ML_URL = process.env.ML_API_URL || "http://127.0.0.1:8000";
    fetch(`${ML_URL}/store`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_text: syllabusText })
    }).catch(err => console.error("ML Service unavailable. Context skipped."));

    // We emulate the older JSON payload structure for the frontend backward compatibility
    res.json({
      choices: [{ message: { content } }]
    });

  } catch (err) {
    console.error("API Error in /api/generate-goals:", err.response?.data || err.message);
    res.status(500).json({ error: (err.response?.data ? JSON.stringify(err.response.data) : err.message) || "Failed to get response from OpenAI." });
  }
});

// --- Response Sanitizer (removes markdown artifacts from AI output) ---
function sanitizeResponse(text) {
  if (!text) return text;
  let cleaned = text;
  // Remove ## headings — convert to bold heading
  cleaned = cleaned.replace(/^#{1,6}\s*(.+)$/gm, '**$1**');
  // Remove excessive asterisks (3+ in a row) but keep single ** pairs for bold
  cleaned = cleaned.replace(/\*{3,}/g, '**');
  // Remove standalone ** that aren't wrapping text (e.g. "** " at start of line)
  cleaned = cleaned.replace(/\*\*\s*\*\*/g, '');
  // Clean empty bold markers
  cleaned = cleaned.replace(/\*\*\s+/g, '**');
  cleaned = cleaned.replace(/\s+\*\*/g, '**');
  // Remove stray single asterisks that aren't part of bold pairs
  cleaned = cleaned.replace(/(?<!\*)\*(?!\*)/g, '•');
  // Normalize bullet points: - or * at start of line → •
  cleaned = cleaned.replace(/^\s*[-]\s+/gm, '• ');
  // Remove multiple blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

// Chatbot Endpoint (Doubt Solver with Semantic Context)
app.post("/api/chat", async (req, res) => {
  const { query, history } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    console.log(`Received chat query: ${query.substring(0, 50)}...`);
    
    // 1. Semantic Search local Context via ML Service
    let context = "";
    try {
      const ML_URL = process.env.ML_API_URL || "http://127.0.0.1:8000";
      const mlResponse = await fetch(`${ML_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, n_results: 3 })
      });
      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        context = mlData.context || "";
        console.log(`ML Context retrieved: ${context.length} chars`);
      } else {
        console.error("ML response not ok:", mlResponse.status);
      }
    } catch (mlErr) {
      console.error("ML Service query failed, proceeding without context.");
    }

    // 2. Query OpenAI RAG architecture
    const systemPrompt = context 
      ? `You are a friendly and concise learning assistant for students. Answer the user's question using the following context from their uploaded syllabus/documents:

---
${context}
---

RULES (follow strictly):
- Keep answers to 6-8 lines maximum unless the user explicitly asks for a detailed explanation.
- Use bullet points (•) for lists. Use arrows (→) to explain terms.
- DO NOT use markdown headings (no # or ##). If you need a heading, just write it in plain bold.
- DO NOT scatter ** symbols randomly. Only use bold for ONE main heading at the top if needed.
- Structure your answer like clean student notes — short, scannable, to the point.
- If the answer is not in the context, use your general knowledge but keep it brief.
- Be warm and use 1-2 emojis naturally (📚, ✨, etc.) but don't overdo it.`
      : `You are a friendly and concise learning assistant for students.

RULES (follow strictly):
- Keep answers to 6-8 lines maximum unless the user explicitly asks for a detailed explanation.
- Use bullet points (•) for lists. Use arrows (→) to explain terms.
- DO NOT use markdown headings (no # or ##). If you need a heading, just write it in plain bold.
- DO NOT scatter ** symbols randomly. Only use bold for ONE main heading at the top if needed.
- Structure your answer like clean student notes — short, scannable, to the point.
- Be warm and use 1-2 emojis naturally (📚, ✨, etc.) but don't overdo it.`;

    const chatHistory = history || [];
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: query }
    ];

    const response = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct-v0.1",
      messages: messages,
      temperature: 0.5,
    });

    let content = response?.choices?.[0]?.message?.content || "No response received";
    if (!response?.choices?.length) {
      throw new Error("Empty response from AI");
    }
    // Sanitize markdown artifacts before sending to frontend
    content = sanitizeResponse(content);
    console.log("Chat OpenAI response successful:", content.substring(0, 50));

    res.json({
      choices: [{ message: { content } }]
    });

  } catch (err) {
    console.error("API Error in /api/chat:", err.response?.data || err.message);
    res.status(500).json({ error: (err.response?.data ? JSON.stringify(err.response.data) : err.message) || "Failed to process chat response." });
  }
});

const PORT = process.env.PORT || 5001;
console.log("Starting backend from:", __dirname);
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));