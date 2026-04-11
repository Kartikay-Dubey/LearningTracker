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
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for a learning tracker app. Given the following academic syllabus, break it into a list of smart, structured learning goals. Each goal must include:
- Goal Title
- Description
- Difficulty level (Easy, Medium, Hard)
- Time Estimate (days or hours)
- Optional Resources
- Prerequisites (if any)

Syllabus Text:`,
          },
          { role: "user", content: syllabusText },
        ],
        temperature: 0.3,
        max_tokens: 1200,
      }),
    });

    const data = await response.json();
    // === DEBUG LOG: OpenAI response ===
    console.log("OpenAI API response:", data);

    res.json(data);
  } catch (err) {
    // === DEBUG LOG: Error ===
    console.error("Error in /api/generate-goals:", err);
    res.status(500).json({ error: "Failed to get response from OpenAI." });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));