const express = require("express");
const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/generate-goals", async (req, res) => {
  const { syllabusText } = req.body;
  if (!syllabusText) return res.status(400).json({ error: "Missing syllabusText" });

  // === DEBUG LOGS START ===
  console.log("Received request to /api/generate-goals");
  console.log("OPENAI_API_KEY present?", !!process.env.OPENAI_API_KEY);
  console.log("First 100 chars of syllabusText:", syllabusText.slice(0, 100));
  // === DEBUG LOGS END ===

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for a learning tracker app. Given the following academic syllabus, break it into a list of smart, structured learning goals. 

You MUST return ONLY a valid JSON object with a single key "goals" containing an array of objects.
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
      }),
    });

    const data = await response.json();
    // === DEBUG LOG: OpenAI response ===
    console.log("OpenAI API response received");

    // Silently route the syllabus to the ML service context buffer
    fetch("http://127.0.0.1:8000/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_text: syllabusText })
    }).catch(err => console.error("ML Service unavailable. Context skipped."));

    res.json(data);
  } catch (err) {
    // === DEBUG LOG: Error ===
    console.error("Error in /api/generate-goals:", err);
    res.status(500).json({ error: "Failed to get response from OpenAI." });
  }
});

// Chatbot Endpoint (Doubt Solver with Semantic Context)
app.post("/api/chat", async (req, res) => {
  const { query, history } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    console.log(`Received chat query: ${query.substring(0, 50)}...`);
    
    // 1. Semantic Search local Context via ML Service
    let context = "";
    try {
      const mlResponse = await fetch("http://127.0.0.1:8000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, n_results: 3 })
      });
      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        context = mlData.context || "";
        console.log(`ML Context retrieved: ${context.length} chars`);
      }
    } catch (mlErr) {
      console.error("ML Service query failed, proceeding without context.");
    }

    // 2. Query OpenAI RAG architecture
    const systemPrompt = context 
      ? `You are an intelligent learning assistant. Answer the user's questions utilizing the following context from their uploaded syllabus/documents:\n\n---\n${context}\n---\n\nIf the answer is not in the context, you can use your general knowledge, but prioritize the context. Keep answers concise, and professional.`
      : `You are an intelligent learning assistant. Help the user with their educational questions. Keep answers concise, and professional.`;

    const chatHistory = history || [];
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: query }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error in /api/chat:", err);
    res.status(500).json({ error: "Failed to process chat response." });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));