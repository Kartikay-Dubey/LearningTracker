/**
 * useSupabaseSync.ts
 * 
 * This hook bridges Supabase Auth ↔ Zustand Store.
 * 
 * On login:  Fetches goals, XP, achievements from DB → overwrites Zustand
 * On logout: Clears Zustand state
 * 
 * Mount this ONCE in App.tsx.
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useStore, getLevelForXP } from '../stores/useStore';
import {
  fetchGoals,
  fetchUserXP,
  fetchUserAchievements
} from '../lib/supabaseService';
import type { Session } from '@supabase/supabase-js';

export function useSupabaseSync() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    // 1. Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        syncFromDB(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          await syncFromDB(session.user.id);
        } else {
          setLoading(false);
          setSynced(false);
          useStore.setState({ isGuestMode: true });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /** Pull all user data from Supabase → hydrate Zustand store */
  async function syncFromDB(userId: string) {
    try {
      console.log('[Sync] Fetching data from Supabase for user:', userId);

      // Fetch in parallel
      const [dbGoals, dbXP, dbAchievements] = await Promise.all([
        fetchGoals(),
        fetchUserXP(),
        fetchUserAchievements(),
      ]);

      const store = useStore.getState();

      // ── Sync Goals ──
      // If db has goals or we have local goals, we handle the merge prompt
      if (dbGoals.length > 0) {
        useStore.setState({ goals: dbGoals });
        console.log(`[Sync] Loaded ${dbGoals.length} goals from DB`);
      }
      
      // If they logged in and had local goals, ask to merge!
      if (store.goals.length > 0) {
        useStore.setState({
          syncPromptData: {
            show: true,
            localGoalsCount: store.goals.length,
            userId: userId
          }
        });
      }

      // ── Sync XP ──
      if (dbXP) {
        useStore.setState({
          userStats: {
            ...store.userStats,
            totalXP: dbXP.total_xp,
            level: getLevelForXP(dbXP.total_xp),
            currentStreak: dbXP.current_streak,
            longestStreak: dbXP.longest_streak,
            totalGoalsCompleted: dbXP.total_goals_completed,
            lastActivityDate: dbXP.last_activity_date,
          }
        });
        console.log(`[Sync] Loaded XP from DB: ${dbXP.total_xp} XP, Level ${getLevelForXP(dbXP.total_xp)}`);
      }

      // ── Sync Achievements ──
      if (dbAchievements.length > 0) {
        const currentAchievements = useStore.getState().achievements;
        const merged = currentAchievements.map(a => {
          const dbEntry = dbAchievements.find(dba => dba.achievement_id === a.id);
          if (dbEntry) {
            return {
              ...a,
              progress: dbEntry.progress,
              unlockedAt: dbEntry.unlocked_at || undefined,
            };
          }
          return a;
        });
        useStore.setState({ achievements: merged });
        console.log(`[Sync] Merged ${dbAchievements.length} achievements from DB`);
      }

      useStore.setState({ isGuestMode: false });
      setSynced(true);
      console.log('[Sync] ✅ Supabase sync complete');
    } catch (err) {
      console.error('[Sync] Error syncing from DB:', err);
    } finally {
      setLoading(false);
    }
  }

  return { session, loading, synced };
}

/** Background push: sends localStorage goals to DB (first-time migration or manual sync) */
export async function pushLocalGoalsToDB(userId: string, goals: any[]) {
  try {
    const rows = goals.map(goal => ({
      id: goal.id,
      user_id: userId,
      title: goal.title,
      description: goal.description || '',
      category: goal.category || 'General',
      difficulty: goal.difficulty || 'Medium',
      xp_reward: goal.difficulty === 'Easy' ? 50 : goal.difficulty === 'Hard' ? 150 : 100,
      progress: goal.progress || 0,
      status: goal.status || 'To Do',
      time_spent: goal.timeSpent || '0h',
      target_date: goal.targetDate || null,
      deadline: goal.deadline || null,
      sub_tasks: goal.subTasks || [],
      notes: goal.notes || '',
      links: goal.links || [],
      created_at: goal.createdAt || new Date().toISOString(),
      completed_at: goal.completedAt || null,
    }));

    // Use upsert to avoid duplicates
    const { error } = await supabase
      .from('goals')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('[Sync] Push local goals error:', error.message);
    } else {
      console.log(`[Sync] Pushed ${rows.length} local goals to DB`);
    }
  } catch (err) {
    console.error('[Sync] Push error:', err);
  }
}
