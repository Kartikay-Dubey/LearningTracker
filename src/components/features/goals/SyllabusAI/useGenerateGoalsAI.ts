import { useState } from "react";

export interface LearningGoal {
  goal: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeEstimate: string;
  prerequisites?: string[];
  resources?: string[];
}

const SYSTEM_PROMPT = `
You are an AI assistant for a learning tracker app. Given the following academic syllabus, break it into a list of smart, structured learning goals. Each goal must include:
- Goal Title
- Description
- Difficulty level (Easy, Medium, Hard)
- Time Estimate (days or hours)
- Optional Resources
- Prerequisites (if any)

Syllabus Text:
`;

export function useGenerateGoalsAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateGoals = async (syllabusText: string): Promise<LearningGoal[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5001/api/generate-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabusText }),
      });

      if (!response.ok) throw new Error("Failed to get response from OpenAI.");

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content in OpenAI response.");

      console.log("OpenAI response content:", content);

      // Try to find and parse JSON in the response
      const jsonStart = content.indexOf("[");
      const jsonEnd = content.lastIndexOf("]");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found in response.");
      const jsonString = content.slice(jsonStart, jsonEnd + 1);

      const goals: LearningGoal[] = JSON.parse(jsonString);
      setLoading(false);
      return goals;
    } catch (err: any) {
      setError(err.message || "Failed to generate goals.");
      setLoading(false);
      return null;
    }
  };

  return { generateGoals, loading, error };
}