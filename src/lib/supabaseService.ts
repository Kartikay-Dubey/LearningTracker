/**
 * supabaseService.ts
 * 
 * Low-level Supabase CRUD functions.
 * These are called BY the Zustand store to mirror local state changes to the DB.
 * 
 * Architecture:
 *   Zustand (instant UI) ←→ supabaseService (persistence) ←→ Supabase DB
 */

import { supabase } from './supabaseClient';
import type { Goal, SubTask, Achievement } from '../stores/useStore';

// ─────────────────────────────────────────────
// Helper: Get current authenticated user ID
// ─────────────────────────────────────────────

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

// ─────────────────────────────────────────────
// GOALS — CRUD
// ─────────────────────────────────────────────

/** Fetch all goals for the logged-in user */
export async function fetchGoals(): Promise<Goal[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] fetchGoals error:', error.message);
    return [];
  }

  // Map DB columns (snake_case) → frontend interface (camelCase)
  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'General',
    difficulty: row.difficulty || 'Medium',
    progress: row.progress || 0,
    status: row.status || 'To Do',
    timeSpent: row.time_spent || '0h',
    targetDate: row.target_date || '',
    deadline: row.deadline || '',
    createdAt: row.created_at,
    completedAt: row.completed_at || undefined,
    subTasks: (row.sub_tasks || []) as SubTask[],
    notes: row.notes || '',
    links: row.links || [],
  }));
}

/** Insert a new goal into Supabase */
export async function insertGoal(goal: Goal): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase.from('goals').insert({
    id: goal.id,
    user_id: userId,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    difficulty: goal.difficulty || 'Medium',
    xp_reward: goal.difficulty === 'Easy' ? 50 : goal.difficulty === 'Hard' ? 150 : 100,
    progress: goal.progress,
    status: goal.status,
    time_spent: goal.timeSpent,
    target_date: goal.targetDate || null,
    deadline: goal.deadline || null,
    sub_tasks: goal.subTasks,
    notes: goal.notes,
    links: goal.links,
    created_at: goal.createdAt,
  });

  if (error) {
    console.error('[Supabase] insertGoal error:', error.message);
    return false;
  }
  return true;
}

/** Update an existing goal */
export async function updateGoalInDB(id: string, updates: Partial<Goal>): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  // Map camelCase updates to snake_case DB columns
  const dbUpdates: Record<string, any> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
  if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.timeSpent !== undefined) dbUpdates.time_spent = updates.timeSpent;
  if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
  if (updates.subTasks !== undefined) dbUpdates.sub_tasks = updates.subTasks;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.links !== undefined) dbUpdates.links = updates.links;
  if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

  if (Object.keys(dbUpdates).length === 0) return true;

  const { error } = await supabase
    .from('goals')
    .update(dbUpdates)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('[Supabase] updateGoal error:', error.message);
    return false;
  }
  return true;
}

/** Delete a goal */
export async function deleteGoalFromDB(id: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('[Supabase] deleteGoal error:', error.message);
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────
// USER XP — Read/Write
// ─────────────────────────────────────────────

export interface UserXPRow {
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  total_goals_completed: number;
  last_activity_date: string;
}

/** Fetch user XP stats */
export async function fetchUserXP(): Promise<UserXPRow | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_xp')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[Supabase] fetchUserXP error:', error.message);
    return null;
  }
  return data;
}

/** Update user XP stats */
export async function updateUserXP(updates: Partial<UserXPRow>): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from('user_xp')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) {
    console.error('[Supabase] updateUserXP error:', error.message);
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────
// ACHIEVEMENTS — Read/Write
// ─────────────────────────────────────────────

export interface UserAchievementRow {
  achievement_id: string;
  progress: number;
  unlocked_at: string | null;
}

/** Fetch user achievement progress */
export async function fetchUserAchievements(): Promise<UserAchievementRow[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id, progress, unlocked_at')
    .eq('user_id', userId);

  if (error) {
    console.error('[Supabase] fetchUserAchievements error:', error.message);
    return [];
  }
  return data || [];
}

/** Update a single achievement's progress */
export async function updateAchievementInDB(achievementId: string, progress: number, unlockedAt?: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const updates: Record<string, any> = { progress };
  if (unlockedAt) updates.unlocked_at = unlockedAt;

  const { error } = await supabase
    .from('user_achievements')
    .update(updates)
    .eq('user_id', userId)
    .eq('achievement_id', achievementId);

  if (error) {
    console.error('[Supabase] updateAchievement error:', error.message);
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────
// QUIZ ATTEMPTS — Write
// ─────────────────────────────────────────────

export async function insertQuizAttempt(
  goalId: string,
  score: number,
  total: number,
  passed: boolean,
  questions: any[]
): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase.from('quiz_attempts').insert({
    user_id: userId,
    goal_id: goalId,
    score,
    total,
    passed,
    questions,
  });

  if (error) {
    console.error('[Supabase] insertQuizAttempt error:', error.message);
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────
// RPC: Atomic Goal Completion
// ─────────────────────────────────────────────

export async function completeGoalRPC(goalId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase.rpc('complete_goal', {
    p_goal_id: goalId,
    p_user_id: userId,
  });

  if (error) {
    console.error('[Supabase] completeGoalRPC error:', error.message);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true, data };
}
