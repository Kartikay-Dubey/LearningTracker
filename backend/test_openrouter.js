require("dotenv").config();
const { OpenAI } = require("openai");

console.log("Key:", process.env.OPENROUTER_API_KEY ? "EXISTS" : "MISSING");

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "Learning Tracker",
  }
});

async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: "openrouter/free",
      messages: [{ role: "user", content: "Say hello!" }],
    });
    console.log("SUCCESS:", response.choices[0].message.content);
  } catch (err) {
    console.error("ERROR CAUGHT:", err.message);
  }
}

test();
