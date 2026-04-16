import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Loader2, Brain, Trophy, RotateCcw } from 'lucide-react';
import { useStore } from '../../../stores/useStore';
import toast from 'react-hot-toast';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: string; // "A", "B", "C", or "D"
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  goalTitle: string;
  goalDescription: string;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, goalId, goalTitle, goalDescription }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeGoalViaQuiz = useStore((state) => state.completeGoalViaQuiz);

  // Fetch quiz when modal opens
  useEffect(() => {
    if (isOpen && questions.length === 0) {
      fetchQuiz();
    }
    // Reset state when closed
    if (!isOpen) {
      setQuestions([]);
      setCurrentQ(0);
      setSelectedAnswer(null);
      setAnswers([]);
      setShowResult(false);
      setScore(0);
      setPassed(false);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const RAW_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const API_URL = RAW_URL.replace(/\/+$/, "");
      const res = await fetch(`${API_URL}/api/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalTitle, goalDescription })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate quiz");
      }

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions received");
      }

      setQuestions(data.questions.slice(0, 5)); // Cap at 5
    } catch (err: any) {
      console.error("Quiz fetch error:", err);
      setError(err.message || "Failed to load quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (letter: string) => {
    if (isSubmitting) return;
    setSelectedAnswer(letter);
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // Calculate score
      let correctCount = 0;
      questions.forEach((q, i) => {
        if (newAnswers[i] === q.correct) {
          correctCount++;
        }
      });

      setScore(correctCount);
      setIsSubmitting(true);

      // Attempt completion via store
      const result = completeGoalViaQuiz(goalId, correctCount, questions.length);
      setPassed(result.passed);
      setShowResult(true);
      setIsSubmitting(false);

      if (result.passed) {
        toast.success(`🎉 Quiz passed! Goal completed! +XP earned`);
      } else {
        toast('📚 Keep studying! You need 100% to pass.', { icon: '💪' });
      }
    }
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setScore(0);
    setPassed(false);
    setIsSubmitting(false);
    // Optionally fetch a new quiz or retry same. For now we retry same
  };

  const getLetterFromIndex = (index: number): string => {
    return ['A', 'B', 'C', 'D'][index] || 'A';
  };

  const question = questions[currentQ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-premium-card rounded-2xl shadow-2xl border border-transparent dark:border-premium-border max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-xl">
                    <Brain className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Knowledge Quiz</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[250px]">{goalTitle}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-premium-secondary rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Loader2 className="w-10 h-10 text-orange-500" />
                  </motion.div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Generating quiz from your study material...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <XCircle className="w-12 h-12 text-red-400" />
                  <p className="text-red-500 text-sm text-center">{error}</p>
                  <button
                    onClick={fetchQuiz}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                  </button>
                </div>
              )}

              {/* Quiz Question */}
              {!loading && !error && !showResult && question && (
                <div>
                  {/* Progress */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Question {currentQ + 1} of {questions.length}
                    </span>
                    <div className="flex gap-1.5">
                      {questions.map((_, i) => (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${
                            i < currentQ ? 'bg-orange-500' :
                            i === currentQ ? 'bg-orange-400 ring-2 ring-orange-200 dark:ring-orange-800' :
                            'bg-gray-200 dark:bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Question Text */}
                  <motion.p
                    key={currentQ}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-lg font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed"
                  >
                    {question.question}
                  </motion.p>

                  {/* Options */}
                  <div className="space-y-3">
                    {question.options.map((option, idx) => {
                      const letter = getLetterFromIndex(idx);
                      const isSelected = selectedAnswer === letter;
                      return (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleSelectAnswer(letter)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 shadow-md shadow-orange-500/10'
                              : 'border-gray-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-700 bg-white dark:bg-premium-secondary'
                          }`}
                        >
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-200'
                          }`}>
                            {option}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <div className="mt-8 flex justify-end">
                    <motion.button
                      onClick={handleNext}
                      disabled={!selectedAnswer}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-orange-500/20"
                      whileHover={selectedAnswer ? { scale: 1.02 } : {}}
                      whileTap={selectedAnswer ? { scale: 0.98 } : {}}
                    >
                      {currentQ < questions.length - 1 ? 'Next Question →' : 'Submit Quiz'}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Result Screen */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8 space-y-6"
                >
                  {passed ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.2 }}
                      >
                        <Trophy className="w-20 h-20 text-yellow-500" />
                      </motion.div>
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          🎉 Quiz Passed!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          You scored <span className="font-bold text-green-600 dark:text-green-400">{score}/{questions.length}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Goal has been marked as completed. XP awarded!
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.2 }}
                      >
                        <XCircle className="w-20 h-20 text-red-400" />
                      </motion.div>
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          Keep Studying! 📚
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          You scored <span className="font-bold text-red-500">{score}/{questions.length}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          You need 100% correct answers to pass.
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex gap-4">
                    {!passed && (
                      <button
                        onClick={handleRetry}
                        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
                      >
                        Retry Quiz
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-gray-100 dark:bg-premium-secondary hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuizModal;
