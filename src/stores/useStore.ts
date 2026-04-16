import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import {
  insertGoal as dbInsertGoal,
  updateGoalInDB,
  deleteGoalFromDB,
  updateUserXP,
  updateAchievementInDB,
  insertQuizAttempt,
} from '../lib/supabaseService';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  progress: number;
  status: 'To Do' | 'In Progress' | 'Completed';
  timeSpent: string;
  targetDate: string;
  deadline: string;       // ISO date string — overdue if past this
  createdAt: string;
  completedAt?: string;   // ISO timestamp when marked Completed
  subTasks: SubTask[];
  notes: string;
  links: string[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'milestone' | 'special' | 'speed' | 'consistency';
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

export interface UserStats {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalGoalsCompleted: number;
  totalTimeSpent: number;
  achievementsUnlocked: number;
  lastActivityDate: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'success' | 'info';
  read: boolean;
  createdAt: string;
}

interface AppState {
  goals: Goal[];
  achievements: Achievement[];
  userStats: UserStats;
  isDarkMode: boolean;
  _xpRecalculated: boolean; // internal flag to run recalc only once

  // Hybrid Mode state
  isGuestMode: boolean;
  syncPromptData: {
    show: boolean;
    localGoalsCount: number;
    userId: string | null;
  };

  // Notifications
  notifications: Notification[];
  assessNotifications: () => void;
  markNotificationRead: (id: string) => void;

  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'completedAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  completeGoalViaQuiz: (id: string, quizScore: number, quizTotal: number) => { passed: boolean; score: number };
  toggleSubTask: (goalId: string, taskId: string) => void;
  checkDeadlines: () => void;

  // XP & Achievements
  addXP: (amount: number) => void;
  updateStreak: () => void;
  checkAchievements: () => void;
  unlockAchievement: (achievementId: string) => void;
  recalculateXP: () => void;

  // UI
  toggleDarkMode: () => void;
  logout: () => Promise<void>;
}

// ──────────────────────────────────────────────
// XP reward by difficulty
// ──────────────────────────────────────────────

export function getXPForDifficulty(difficulty: string): number {
  switch (difficulty) {
    case 'Easy': return 50;
    case 'Hard': return 150;
    case 'Medium':
    default: return 100;
  }
}

// XP thresholds for each level
const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000, 5000, 8000, 12000, 20000];

export function getLevelForXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXPForNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const level = getLevelForXP(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 5000;
  const progress = Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
  return { current: xp - currentThreshold, needed: nextThreshold - currentThreshold, progress: Math.min(progress, 100) };
}

// ──────────────────────────────────────────────
// Achievement definitions
// ──────────────────────────────────────────────

const initialAchievements: Achievement[] = [
  {
    id: 'first-goal',
    title: 'First Steps',
    description: 'Complete your first learning goal',
    icon: '🎯',
    category: 'milestone',
    progress: 0,
    maxProgress: 1,
    rarity: 'common',
    xpReward: 50
  },
  {
    id: 'streak-3',
    title: 'Getting Started',
    description: 'Maintain a 3-day learning streak',
    icon: '🔥',
    category: 'streak',
    progress: 0,
    maxProgress: 3,
    rarity: 'common',
    xpReward: 100
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '⚡',
    category: 'streak',
    progress: 0,
    maxProgress: 7,
    rarity: 'rare',
    xpReward: 250
  },
  {
    id: 'streak-30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day learning streak',
    icon: '👑',
    category: 'streak',
    progress: 0,
    maxProgress: 30,
    rarity: 'epic',
    xpReward: 1000
  },
  {
    id: 'streak-100',
    title: 'Century Champion',
    description: 'Maintain a 100-day learning streak',
    icon: '🏆',
    category: 'streak',
    progress: 0,
    maxProgress: 100,
    rarity: 'legendary',
    xpReward: 5000
  },
  // Goal Completion Achievements
  {
    id: 'complete-5',
    title: 'Goal Getter',
    description: 'Complete 5 learning goals',
    icon: '🎉',
    category: 'milestone',
    progress: 0,
    maxProgress: 5,
    rarity: 'common',
    xpReward: 200
  },
  {
    id: 'complete-25',
    title: 'Goal Guru',
    description: 'Complete 25 learning goals',
    icon: '💎',
    category: 'milestone',
    progress: 0,
    maxProgress: 25,
    rarity: 'rare',
    xpReward: 500
  },
  {
    id: 'complete-100',
    title: 'Goal Grandmaster',
    description: 'Complete 100 learning goals',
    icon: '🌟',
    category: 'milestone',
    progress: 0,
    maxProgress: 100,
    rarity: 'epic',
    xpReward: 2000
  },
  // Speed Achievements
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete a goal within 24 hours of creating it',
    icon: '🚀',
    category: 'speed',
    progress: 0,
    maxProgress: 1,
    rarity: 'rare',
    xpReward: 300
  },
  // Consistency Achievements
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Complete at least one goal every day for a week',
    icon: '✨',
    category: 'consistency',
    progress: 0,
    maxProgress: 7,
    rarity: 'epic',
    xpReward: 750
  },
  // Special Achievements
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Complete a goal before 8 AM',
    icon: '🌅',
    category: 'special',
    progress: 0,
    maxProgress: 1,
    rarity: 'rare',
    xpReward: 150
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Complete a goal after 10 PM',
    icon: '🦉',
    category: 'special',
    progress: 0,
    maxProgress: 1,
    rarity: 'rare',
    xpReward: 150
  }
];

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      goals: [],
      achievements: initialAchievements,
      userStats: {
        totalXP: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalGoalsCompleted: 0,
        totalTimeSpent: 0,
        achievementsUnlocked: 0,
        lastActivityDate: new Date().toISOString()
      },
      isDarkMode: false,
      _xpRecalculated: false,
      isGuestMode: true,
      syncPromptData: {
        show: false,
        localGoalsCount: 0,
        userId: null
      },
      notifications: [],

      // ────────── GOAL CRUD ──────────

      addGoal: (goalData) => {
        const newGoal: Goal = {
          ...goalData,
          difficulty: goalData.difficulty || 'Medium',
          deadline: goalData.deadline || goalData.targetDate || '',
          id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          goals: [...state.goals, newGoal]
        }));
        // Fire-and-forget DB write
        dbInsertGoal(newGoal).catch(e => console.error('[DB] addGoal sync failed:', e));
        get().checkAchievements();
      },

      updateGoal: (id, updates) => {
        const prevGoal = get().goals.find(g => g.id === id);
        if (!prevGoal) return;

        // ── STATE LOCK: once Completed, NO reverting ──
        if (prevGoal.status === 'Completed' && updates.status && updates.status !== 'Completed') {
          console.warn(`[LearnTrack] Blocked: Cannot revert completed goal "${prevGoal.title}"`);
          return; // Silently reject
        }

        // ── Block direct completion via dropdown (must go through quiz) ──
        if (updates.status === 'Completed' && prevGoal.status !== 'Completed') {
          // Only completeGoalViaQuiz should set Completed — it calls updateGoal internally
          // If this is called from quiz flow, _quizCompleting flag will be set
          const isQuizFlow = (updates as any)._fromQuiz === true;
          if (!isQuizFlow) {
            console.warn(`[LearnTrack] Blocked: Use quiz to complete goal "${prevGoal.title}"`);
            return;
          }
        }

        // Strip internal flags before saving
        const cleanUpdates = { ...updates };
        delete (cleanUpdates as any)._fromQuiz;

        set((state) => ({
          goals: state.goals.map(goal =>
            goal.id === id ? { ...goal, ...cleanUpdates } : goal
          )
        }));

        // Fire-and-forget DB write
        updateGoalInDB(id, cleanUpdates).catch(e => console.error('[DB] updateGoal sync failed:', e));

        // Award XP only on genuine first-time completion
        if (updates.status === 'Completed' && prevGoal.status !== 'Completed') {
          const xpAmount = getXPForDifficulty(prevGoal.difficulty || 'Medium');
          get().addXP(xpAmount);
          set((state) => ({
            userStats: {
              ...state.userStats,
              totalGoalsCompleted: state.userStats.totalGoalsCompleted + 1
            }
          }));
          get().updateStreak();
          get().checkAchievements();
          // Sync XP to DB
          const stats = get().userStats;
          updateUserXP({
            total_xp: stats.totalXP,
            level: stats.level,
            current_streak: stats.currentStreak,
            longest_streak: stats.longestStreak,
            total_goals_completed: stats.totalGoalsCompleted,
            last_activity_date: stats.lastActivityDate,
          }).catch(e => console.error('[DB] updateUserXP sync failed:', e));
        }
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter(goal => goal.id !== id)
        }));
        // Fire-and-forget DB delete
        deleteGoalFromDB(id).catch(e => console.error('[DB] deleteGoal sync failed:', e));
      },

      // ────────── QUIZ-BASED COMPLETION ──────────

      completeGoalViaQuiz: (id, quizScore, quizTotal) => {
        const passThreshold = quizTotal; // 100% must be correct
        const passed = quizScore >= passThreshold;

        if (passed) {
          get().updateGoal(id, {
            status: 'Completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            _fromQuiz: true
          } as any);
        }

        // Store quiz attempt in DB (pass or fail)
        const goal = get().goals.find(g => g.id === id);
        insertQuizAttempt(id, quizScore, quizTotal, passed, []).catch(
          e => console.error('[DB] insertQuizAttempt failed:', e)
        );

        return { passed, score: quizScore };
      },

      // ────────── SUBTASK TOGGLE + DYNAMIC PROGRESS ──────────

      toggleSubTask: (goalId, taskId) => {
        let updatedGoal: Goal | undefined;
        set((state) => {
          const updatedGoals = state.goals.map(goal => {
            if (goal.id !== goalId) return goal;
            if (goal.status === 'Completed') return goal;

            const updatedSubTasks = goal.subTasks.map(task =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
            );

            const totalTasks = updatedSubTasks.length;
            const completedTasks = updatedSubTasks.filter(t => t.completed).length;
            const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            let newStatus = goal.status;
            if (newProgress > 0 && goal.status === 'To Do') {
              newStatus = 'In Progress';
            }

            const updated = { ...goal, subTasks: updatedSubTasks, progress: newProgress, status: newStatus };
            updatedGoal = updated;
            return updated;
          });

          return { goals: updatedGoals };
        });
        // Sync subtask + progress change to DB
        if (updatedGoal) {
          updateGoalInDB(goalId, {
            subTasks: updatedGoal.subTasks,
            progress: updatedGoal.progress,
            status: updatedGoal.status,
          }).catch(e => console.error('[DB] toggleSubTask sync failed:', e));
        }
      },

      // ────────── DEADLINE CHECKING ──────────

      checkDeadlines: () => {
        const state = get();
        const now = new Date();
        let xpPenalty = 0;
        const newNotifications: Notification[] = [];
        let modified = false;

        const updatedGoals = state.goals.map(goal => {
          // Only check goals that are strictly active
          if (goal.status === 'Completed' || goal.status === 'Overdue' || !goal.deadline) return goal;

          const deadlineDate = new Date(goal.deadline);
          if (isNaN(deadlineDate.getTime())) return goal;

          // If deadline has passed, execute strict punishment
          if (now.getTime() > deadlineDate.getTime()) {
            xpPenalty += 10;
            newNotifications.push({
              id: `overdue-penalty-${goal.id}-${now.getTime()}`,
              title: 'Goal Overdue! ❌',
              message: `Missed deadline for "${goal.title}". -10 XP penalty applied.`,
              type: 'error',
              read: false,
              createdAt: now.toISOString()
            });
            modified = true;
            return { ...goal, status: 'Overdue' as any };
          }
          return goal;
        });

        if (modified) {
          if (xpPenalty > 0) {
            get().addXP(-xpPenalty);
          }
          set((s) => ({
            goals: updatedGoals,
            notifications: [...newNotifications, ...s.notifications].slice(0, 50)
          }));
        }
      },

      // ────────── XP SYSTEM ──────────

      addXP: (amount) => {
        set((state) => {
          const newTotalXP = Math.max(0, state.userStats.totalXP + amount);
          const newLevel = getLevelForXP(newTotalXP);

          return {
            userStats: {
              ...state.userStats,
              totalXP: newTotalXP,
              level: newLevel
            }
          };
        });
      },

      recalculateXP: () => {
        // Derive correct XP from actual completed goals + unlocked achievements
        // This fixes any corrupted localStorage values
        const state = get();
        if (state._xpRecalculated) return; // Only run once

        const completedGoals = state.goals.filter(g => g.status === 'Completed');
        let goalXP = 0;
        completedGoals.forEach(goal => {
          goalXP += getXPForDifficulty(goal.difficulty || 'Medium');
        });

        let achievementXP = 0;
        state.achievements.forEach(a => {
          if (a.unlockedAt) {
            achievementXP += a.xpReward;
          }
        });

        const correctXP = goalXP + achievementXP;
        const correctLevel = getLevelForXP(correctXP);
        const correctCompleted = completedGoals.length;
        const correctUnlocked = state.achievements.filter(a => a.unlockedAt).length;

        console.log(`[LearnTrack] XP Recalculation: goals=${goalXP} + achievements=${achievementXP} = ${correctXP} (was ${state.userStats.totalXP})`);

        set({
          _xpRecalculated: true,
          userStats: {
            ...state.userStats,
            totalXP: correctXP,
            level: correctLevel,
            totalGoalsCompleted: correctCompleted,
            achievementsUnlocked: correctUnlocked
          }
        });
      },

      // ────────── STREAK ──────────

      updateStreak: () => {
        set((state) => {
          const currentDate = new Date();
          const lastActivity = new Date(state.userStats.lastActivityDate);

          // Normalize to date-only comparison (ignore time)
          const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
          const lastDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
          const dayDiff = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

          let newStreak = state.userStats.currentStreak;

          if (dayDiff === 1) {
            // Consecutive day
            newStreak += 1;
          } else if (dayDiff === 0) {
            // Same day, keep current streak
          } else {
            // Streak broken
            newStreak = 1;
          }

          return {
            userStats: {
              ...state.userStats,
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, state.userStats.longestStreak),
              lastActivityDate: currentDate.toISOString()
            }
          };
        });
      },

      // ────────── ACHIEVEMENTS ──────────

      checkAchievements: () => {
        const state = get();
        const { goals, userStats } = state;
        const newNotificationsFromAchieve: Notification[] = [];

        const completedGoals = goals.filter(g => g.status === 'Completed');
        const now = new Date();

        const updatedAchievements = state.achievements.map(achievement => {
          let progress = achievement.progress;

          switch (achievement.id) {
            case 'first-goal':
              progress = completedGoals.length >= 1 ? 1 : 0;
              break;
            case 'complete-5':
              progress = Math.min(completedGoals.length, 5);
              break;
            case 'complete-25':
              progress = Math.min(completedGoals.length, 25);
              break;
            case 'complete-100':
              progress = Math.min(completedGoals.length, 100);
              break;
            case 'streak-3':
              progress = Math.min(userStats.currentStreak, 3);
              break;
            case 'streak-7':
              progress = Math.min(userStats.currentStreak, 7);
              break;
            case 'streak-30':
              progress = Math.min(userStats.currentStreak, 30);
              break;
            case 'streak-100':
              progress = Math.min(userStats.currentStreak, 100);
              break;
            case 'speed-demon':
              const hasSpeed = completedGoals.some(g => {
                if (!g.completedAt || !g.createdAt) return false;
                const diffHours = (new Date(g.completedAt).getTime() - new Date(g.createdAt).getTime()) / (1000 * 60 * 60);
                return diffHours <= 24;
              });
              if (hasSpeed) progress = 1;
              break;
            case 'early-bird':
              const hasEarly = completedGoals.some(g => {
                if (!g.completedAt) return false;
                return new Date(g.completedAt).getHours() < 9;
              });
              if (hasEarly) progress = 1;
              break;
            case 'night-owl':
              const hasNight = completedGoals.some(g => {
                if (!g.completedAt) return false;
                const h = new Date(g.completedAt).getHours();
                return h >= 22 || h < 4;
              });
              if (hasNight) progress = 1;
              break;
            case 'perfect-week':
              if (userStats.currentStreak >= 7) progress = 7;
              break;
          }

          return { ...achievement, progress };
        });

        // Save progress first
        set({ achievements: updatedAchievements });

        // Unlock achieved ones
        updatedAchievements.forEach(achievement => {
          if (achievement.progress >= achievement.maxProgress && !achievement.unlockedAt) {
            get().unlockAchievement(achievement.id);
          }
        });
      },

      unlockAchievement: (achievementId) => {
        // Guard: don't unlock if already unlocked
        const existing = get().achievements.find(a => a.id === achievementId);
        if (!existing || existing.unlockedAt) return;

        set((state) => ({
          achievements: state.achievements.map(achievement =>
            achievement.id === achievementId
              ? { ...achievement, unlockedAt: new Date().toISOString() }
              : achievement
          ),
          userStats: {
            ...state.userStats,
            achievementsUnlocked: state.userStats.achievementsUnlocked + 1
          },
          notifications: [
            {
              id: `achieve-${achievementId}-${Date.now()}`,
              title: 'Achievement Unlocked! 🏆',
              message: `You unlocked: ${existing.title}`,
              type: 'success',
              read: false,
              createdAt: new Date().toISOString()
            },
            ...state.notifications
          ].slice(0, 50)
        }));

        // Trigger Confetti
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }).catch(() => {});

        const achievement = get().achievements.find(a => a.id === achievementId);
        if (achievement) {
          get().addXP(achievement.xpReward);
        }
      },

      // ────────── UI ──────────

      toggleDarkMode: () => {
        set((state) => {
          const newMode = !state.isDarkMode;
          localStorage.setItem('theme', newMode ? 'dark' : 'light');
          return { isDarkMode: newMode };
        });
      },

      // ────────── NOTIFICATIONS ──────────

      assessNotifications: () => {
        const { goals, userStats, notifications } = get();
        const now = new Date();
        const newNotifications: Notification[] = [];
        
        // Check deadlines
        goals.forEach(goal => {
          if (goal.status === 'Completed' || !goal.deadline) return;
          const deadline = new Date(goal.deadline);
          const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          if (diffHours < 0 && diffHours > -24) { // Only notify if recently overdue to avoid spam
            newNotifications.push({
              id: `overdue-${goal.id}`,
              title: 'Goal Overdue',
              message: `Your goal "${goal.title}" is overdue!`,
              type: 'error',
              read: false,
              createdAt: now.toISOString()
            });
          } else if (diffHours > 0 && diffHours <= 48) {
            newNotifications.push({
              id: `deadline-${goal.id}`,
              title: 'Deadline Approaching',
              message: `"${goal.title}" is due in less than 48 hours.`,
              type: 'warning',
              read: false,
              createdAt: now.toISOString()
            });
          }
        });

        // Check streak warning
        const lastActivity = new Date(userStats.lastActivityDate);
        const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
        if (hoursSinceActivity > 24 && hoursSinceActivity < 48 && userStats.currentStreak > 0) {
          newNotifications.push({
            id: `streak-warning-${lastActivity.toISOString()}`,
            title: 'Streak at Risk!',
            message: 'Complete a goal today to keep your streak alive!',
            type: 'warning',
            read: false,
            createdAt: now.toISOString()
          });
        }

        // Deduplicate and merge
        if (newNotifications.length > 0) {
          set((state) => {
            const currentIds = new Set(state.notifications.map(n => n.id));
            const uniqueNew = newNotifications.filter(n => !currentIds.has(n.id));
            if (uniqueNew.length > 0) {
              return { notifications: [...uniqueNew, ...state.notifications].slice(0, 50) };
            }
            return state;
          });
        }
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },

      logout: async () => {
        await supabase.auth.signOut();
        window.location.href = "/auth";
      },
    }),
    {
      name: 'learning-tracker-storage',
    }
  )
);
