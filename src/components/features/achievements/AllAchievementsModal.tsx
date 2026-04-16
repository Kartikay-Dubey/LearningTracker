import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Flame, Star, Target, Zap, Clock, Medal } from 'lucide-react';
import { useStore, Achievement } from '../../../stores/useStore';

interface AllAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AllAchievementsModal: React.FC<AllAchievementsModalProps> = ({ isOpen, onClose }) => {
  const achievements = useStore(state => state.achievements);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const RarityColor = {
    common: 'text-gray-500 bg-gray-100 border-gray-200 dark:text-gray-300 dark:bg-slate-800 dark:border-slate-700',
    rare: 'text-blue-500 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800',
    epic: 'text-purple-500 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-800',
    legendary: 'text-amber-500 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-gray-50 dark:bg-premium-primary rounded-3xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white dark:bg-premium-card p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Achievements</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {achievements.filter(a => a.unlockedAt).length} of {achievements.length} unlocked
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {achievements.map((achievement) => {
                  const isUnlocked = !!achievement.unlockedAt;
                  const progressPct = Math.min((achievement.progress / achievement.maxProgress) * 100, 100);

                  return (
                    <motion.div
                      key={achievement.id}
                      variants={itemVariants}
                      className={`relative rounded-2xl p-5 border-2 transition-all ${
                        isUnlocked 
                          ? `bg-white dark:bg-premium-card ${RarityColor[achievement.rarity]}` 
                          : 'bg-gray-100/50 dark:bg-slate-800/20 border-gray-200 dark:border-slate-800 grayscale-[0.6] opacity-70'
                      }`}
                    >
                      {/* Icon */}
                      <div className="text-4xl mb-4">{achievement.icon}</div>
                      
                      <div className="space-y-1 mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">{achievement.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                          {achievement.description}
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-auto">
                        <div className="flex justify-between items-end mb-1.5">
                          <span className="text-xs font-semibold tracking-wide uppercase text-gray-500">
                            {isUnlocked ? 'Unlocked' : `${achievement.progress} / ${achievement.maxProgress}`}
                          </span>
                          <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
                            +{achievement.xpReward} XP
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <motion.div 
                            className={`h-full rounded-full ${isUnlocked ? 'bg-orange-500' : 'bg-gray-400 dark:bg-slate-500'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AllAchievementsModal;
