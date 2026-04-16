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

// ─── Quiz Generation Endpoint ───
app.post("/api/generate-quiz", async (req, res) => {
  const { goalTitle, goalDescription } = req.body;
  if (!goalTitle) return res.status(400).json({ error: "Missing goalTitle" });

  try {
    console.log(`Generating quiz for: ${goalTitle}`);

    // 1. Try to get relevant context from ML service
    let context = "";
    try {
      const ML_URL = process.env.ML_API_URL || "http://127.0.0.1:8000";
      const mlResponse = await fetch(`${ML_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: goalTitle, n_results: 5 })
      });
      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        context = mlData.context || "";
        console.log(`Quiz ML context: ${context.length} chars`);
      }
    } catch (mlErr) {
      console.error("ML Service unavailable for quiz, using description only.");
    }

    // 2. Build source material for question generation
    const sourceMaterial = context
      ? `Topic: ${goalTitle}\nDescription: ${goalDescription || ""}\n\nStudy Material:\n${context}`
      : `Topic: ${goalTitle}\nDescription: ${goalDescription || ""}`;

    // 3. Generate quiz via OpenRouter
    const response = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct-v0.1",
      messages: [
        {
          role: "system",
          content: `You are a quiz generator for a learning platform. Generate exactly 5 multiple-choice questions based on the provided study material.

You MUST return ONLY a valid JSON object. No markdown. No explanation. OUTPUT NOTHING EXCEPT RAW JSON.

Format:
{
  "questions": [
    {
      "question": "What is...?",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correct": "B"
    }
  ]
}

Rules:
- Exactly 5 questions
- 4 options each (A, B, C, D)
- Questions must test understanding, not just recall
- "correct" field must be the letter only (A, B, C, or D)
- Questions must be relevant to the topic`
        },
        { role: "user", content: sourceMaterial }
      ],
      temperature: 0.4,
      max_tokens: 1500,
    });

    const content = response?.choices?.[0]?.message?.content || "";
    if (!content) throw new Error("Empty quiz response from AI");

    // 4. Parse the JSON response
    let parsed;
    try {
      // Try direct parse first
      parsed = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from potential markdown wrapping
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse quiz JSON from AI response");
      }
    }

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("AI returned invalid quiz structure");
    }

    console.log(`Quiz generated: ${parsed.questions.length} questions`);
    res.json(parsed);

  } catch (err) {
    console.error("API Error in /api/generate-quiz:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate quiz" });
  }
});

const PORT = process.env.PORT || 5001;
console.log("Starting backend from:", __dirname);
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));