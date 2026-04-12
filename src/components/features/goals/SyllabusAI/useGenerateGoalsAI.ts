import { useState } from "react";

export interface LearningGoal {
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  estimated_time: string;
  prerequisites?: string[];
  resources?: string[];
}

export function useGenerateGoalsAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateGoals = async (syllabusText: string): Promise<LearningGoal[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const response = await fetch(`${API_URL}/api/generate-goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabusText }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get response from Backend.");
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || "No response received";

      if (!data?.choices?.length) {
        throw new Error("Empty response from AI");
      }

      console.log("OpenAI response content:", content);

      // Parse JSON directly since backend forces json_object format
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseErr) {
        parsed = { goals: [{ title: "Fallback Goal", description: content, difficulty: "Medium", estimated_time: "Unknown", prerequisites: [], resources: [] }] };
      }
      
      let goals: LearningGoal[] = [];
      if (Array.isArray(parsed)) {
        goals = parsed;
      } else if (parsed.goals && Array.isArray(parsed.goals)) {
        goals = parsed.goals;
      } else {
        goals = Object.values(parsed).find(Array.isArray) as LearningGoal[] || [];
      }

      if (!goals.length) throw new Error("AI did not extract any valid goals.");

      setLoading(false);
      return goals;
    } catch (err: any) {
      console.error("API ERROR:", err.response?.data || err.message || err);
      setError(err.message || "Failed to generate goals.");
      setLoading(false);
      return null;
    }
  };

  return { generateGoals, loading, error };
}