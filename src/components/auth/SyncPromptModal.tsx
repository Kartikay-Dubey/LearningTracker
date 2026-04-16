import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Server, AlertTriangle } from 'lucide-react';
import { useStore } from '../../stores/useStore';
import { fetchGoals } from '../../lib/supabaseService';

export const SyncPromptModal: React.FC = () => {
  const syncPromptData = useStore(state => state.syncPromptData);
  const isGuestMode = useStore(state => state.isGuestMode);
  const [isSyncing, setIsSyncing] = useState(false);

  const closePrompt = () => {
    useStore.setState({
      syncPromptData: { ...syncPromptData, show: false }
    });
  };

  const handleMerge = async () => {
    setIsSyncing(true);
    try {
      if (syncPromptData.userId) {
        const goals = useStore.getState().goals;
        // The background sync hook handles pushing XP and Achievements inside updater functions.
        // We push goals manually:
        const { pushLocalGoalsToDB } = await import('../../hooks/useSupabaseSync');
        await pushLocalGoalsToDB(syncPromptData.userId, goals);
        
        // Fetch to confirm update
        const mergedGoals = await fetchGoals();
        if (mergedGoals.length > 0) {
           useStore.setState({ goals: mergedGoals });
        }
      }
    } catch (e) {
      console.error('[SyncPrompt] Failed to merge:', e);
    } finally {
      setIsSyncing(false);
      closePrompt();
    }
  };

  const handleDiscard = async () => {
    setIsSyncing(true);
    try {
      // Overwrite local with remote
      const dbGoals = await fetchGoals();
      useStore.setState({ goals: dbGoals });
    } catch (e) {
      console.error('[SyncPrompt] Failed to fetch server goals:', e);
    } finally {
      setIsSyncing(false);
      closePrompt();
    }
  };

  // Only show if not a guest and prompt is active
  if (isGuestMode || !syncPromptData.show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          className="bg-white dark:bg-premium-card w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-premium-border"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Cloud className="w-8 h-8 text-blue-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Sync Progress?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            We noticed you have <strong>{syncPromptData.localGoalsCount} local goals</strong> from Guest Mode. Would you like to merge them with your cloud account?
          </p>

          <div className="space-y-3">
            <button
              onClick={handleMerge}
              disabled={isSyncing}
              className="w-full relative py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Cloud className="w-5 h-5" />
                  Merge & Sync to Cloud
                </>
              )}
            </button>

            <button
              onClick={handleDiscard}
              disabled={isSyncing}
              className="w-full py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Server className="w-5 h-5" />
              Discard Local & Use Cloud Only
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
