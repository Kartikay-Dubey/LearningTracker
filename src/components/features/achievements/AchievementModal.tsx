import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Star, Zap } from "lucide-react";
import type { Achievement } from "../../../stores/useStore";
import Confetti from 'react-confetti';

interface AchievementModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

const AchievementModal: React.FC<AchievementModalProps> = ({ 
  achievement, 
  isOpen, 
  onClose 
}) => {
  if (!achievement) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-slate-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-indigo-500';
      case 'legendary': return 'bg-premium-highlight';
      default: return 'bg-slate-500';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti for newly unlocked achievements */}
          {achievement.unlockedAt && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={200}
            />
          )}
          
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="bg-white dark:bg-premium-card border border-transparent dark:border-premium-border rounded-2xl p-8 max-w-md w-full mx-4 relative shadow-2xl shadow-black/30"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Achievement Content */}
              <div className="text-center">
                {/* Icon */}
                <motion.div
                  className={`w-20 h-20 mx-auto mb-6 rounded-full text-white ${getRarityColor(achievement.rarity)} flex items-center justify-center text-3xl shadow-lg`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  {achievement.icon}
                </motion.div>

                {/* Title */}
                <motion.h2
                  className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {achievement.title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  className="text-gray-600 dark:text-gray-300 mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {achievement.description}
                </motion.p>

                {/* Rarity Badge */}
                <motion.div
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Trophy className="w-4 h-4 mr-1" />
                  {achievement.rarity.toUpperCase()}
                </motion.div>

                {/* XP Reward */}
                <motion.div
                  className="bg-premium-accent text-white px-6 py-3 rounded-xl font-semibold shadow-md"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center justify-center">
                    <Zap className="w-5 h-5 mr-2" />
                    +{achievement.xpReward} XP Earned!
                  </div>
                </motion.div>

                {/* Unlock Date */}
                {achievement.unlockedAt && (
                  <motion.p
                    className="text-sm text-gray-500 dark:text-gray-400 mt-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </motion.p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AchievementModal;
