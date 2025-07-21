import React from "react";
import { motion } from "framer-motion";
import { Trophy, Lock, Unlock } from "lucide-react";
import type { Achievement } from "../../../stores/useStore";

interface AchievementCardProps {
  achievement: Achievement;
  onClick?: () => void;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, onClick }) => {
  const isUnlocked = !!achievement.unlockedAt;
  const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
      case 'rare': return 'border-blue-300 bg-blue-50 dark:bg-blue-900/20';
      case 'epic': return 'border-purple-300 bg-purple-50 dark:bg-purple-900/20';
      case 'legendary': return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return '';
      case 'rare': return 'shadow-blue-200 dark:shadow-blue-900/50';
      case 'epic': return 'shadow-purple-200 dark:shadow-purple-900/50';
      case 'legendary': return 'shadow-yellow-200 dark:shadow-yellow-900/50';
      default: return '';
    }
  };

  return (
    <motion.div
      className={`relative p-4 min-w-[180px] rounded-xl border-2 transition-all duration-300 cursor-pointer ${
        isUnlocked 
          ? `${getRarityColor(achievement.rarity)} hover:shadow-lg ${getRarityGlow(achievement.rarity)}` 
          : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 opacity-60'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Achievement Icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-3xl">{achievement.icon}</div>
        <div className="flex items-center space-x-1">
          {isUnlocked ? (
            <Unlock className="w-4 h-4 text-green-600" />
          ) : (
            <Lock className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {achievement.rarity.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Achievement Info */}
      <div className="mb-3">
        <h3 className={`font-semibold text-sm mb-1 ${
          isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {achievement.title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
          {achievement.description}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 mb-2 overflow-hidden">
        <motion.div
          className={`h-2 rounded-full transition-all duration-500 ${
            isUnlocked 
              ? 'bg-gradient-to-r from-green-400 to-green-600' 
              : 'bg-gradient-to-r from-blue-400 to-blue-600'
          }`}
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
          transition={{ duration: 1 }}
        />
      </div>

      {/* Progress Text */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          {achievement.progress}/{achievement.maxProgress}
        </span>
        <span className="text-blue-600 dark:text-blue-400 font-medium">
          +{achievement.xpReward} XP
        </span>
      </div>

      {/* Unlock Date */}
      {isUnlocked && achievement.unlockedAt && (
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  );
};

export default AchievementCard;
