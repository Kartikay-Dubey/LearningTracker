import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import SyllabusUpload from "./SyllabusUpload";
import { useExtractTextFromPDF } from "./useExtractTextFromPDF";
import { useGenerateGoalsAI, LearningGoal } from "./useGenerateGoalsAI";

interface SyllabusToGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SyllabusToGoalsModal: React.FC<SyllabusToGoalsModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [goals, setGoals] = useState<LearningGoal[] | null>(null);

  const { extractText, extracting, error: extractError } = useExtractTextFromPDF();
  const { generateGoals, loading: aiLoading, error: aiError } = useGenerateGoalsAI();

  // Handle file selection and text extraction
  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);
    setPdfText(null);
    setGoals(null);
    const text = await extractText(file);
    setPdfText(text);
    console.log("Extracted PDF text:", text);
  };

  // Handle AI generation
  const handleGenerateGoals = async () => {
    if (!pdfText) return;
    setGoals(null);
    const result = await generateGoals(pdfText);
    setGoals(result);
  };

  // Reset state on close
  const handleClose = () => {
    setSelectedFile(null);
    setFileName(null);
    setPdfText(null);
    setGoals(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-premium-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-premium-border shadow-black/5 dark:shadow-black/30"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Syllabus to Goals Generator
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-premium-secondary rounded-lg transition-colors text-gray-500 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <SyllabusUpload
                onFileSelected={handleFileSelected}
                uploading={extracting}
                fileName={fileName}
              />
              {extractError && (
                <div className="text-red-600 text-sm">{extractError}</div>
              )}
              {pdfText && !goals && (
                <button
                  className="btn-primary w-full px-4 py-3"
                  onClick={handleGenerateGoals}
                  disabled={aiLoading}
                >
                  {aiLoading ? "Generating Goals..." : "Generate Learning Goals"}
                </button>
              )}
              {aiError && (
                <div className="text-red-600 text-sm">{aiError}</div>
              )}
              {goals && (
                <div className="grid gap-4">
                  {goals.map((goal, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 bg-gray-50 dark:bg-premium-secondary"
                    >
                      <h3 className="font-semibold text-lg mb-1">{goal.goal}</h3>
                      <p className="mb-2 text-gray-700 dark:text-gray-200">{goal.description}</p>
                      <div className="flex flex-wrap gap-2 text-sm mb-1">
                        <span className="px-2 py-1 bg-teal-50 text-premium-accent dark:bg-premium-accent/20 rounded font-medium border border-premium-accent/20">
                          Difficulty: {goal.difficulty}
                        </span>
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-premium-secondary dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                          Time: {goal.timeEstimate}
                        </span>
                        {goal.prerequisites && goal.prerequisites.length > 0 && (
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 rounded">
                            Prerequisites: {goal.prerequisites.join(", ")}
                          </span>
                        )}
                      </div>
                      {goal.resources && goal.resources.length > 0 && (
                        <div className="mt-2">
                          <span className="font-medium">Resources:</span>
                          <ul className="list-disc ml-6">
                            {goal.resources.map((res, i) => (
                              <li key={i}>
                                <a
                                  href={res}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-premium-accent underline break-all hover:text-teal-700"
                                >
                                  {res}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SyllabusToGoalsModal;