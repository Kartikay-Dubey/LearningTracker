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
      const response = await fetch("http://localhost:5001/api/generate-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabusText }),
      });

      if (!response.ok) throw new Error("Failed to get response from Backend.");

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content in OpenAI response.");

      console.log("OpenAI response content:", content);

      // Parse JSON directly since backend forces json_object format
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseErr) {
        throw new Error("Invalid JSON structure returned by AI.");
      }
      
      const goals: LearningGoal[] = parsed.goals || [];
      if (!goals.length) throw new Error("AI did not extract any valid goals.");

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