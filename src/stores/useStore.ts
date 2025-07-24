import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient'; // Adjust the import based on your project structure

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  status: 'To Do' | 'In Progress' | 'Completed';
  timeSpent: string;
  targetDate: string;
  createdAt: string;
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

interface AppState {
  goals: Goal[];
  achievements: Achievement[];
  userStats: UserStats;
  isDarkMode: boolean;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleSubTask: (goalId: string, taskId: string) => void;
  toggleDarkMode: () => void;
  checkAchievements: () => void;
  unlockAchievement: (achievementId: string) => void;
  addXP: (amount: number) => void;
  updateStreak: () => void;
  logout: () => Promise<void>; // Add logout function
}

const initialAchievements: Achievement[] = [
  {
    id: 'first-goal',
    title: 'First Steps',
    description: 'Complete your first learning goal',
    icon: '🎯',
    category: 'milestone',
    progress: 0, // Reset to 0
    maxProgress: 1,
    rarity: 'common',
    xpReward: 50
    // Remove unlockedAt
  },
  {
    id: 'streak-3',
    title: 'Getting Started',
    description: 'Maintain a 3-day learning streak',
    icon: '🔥',
    category: 'streak',
    progress: 0, // Reset to 0
    maxProgress: 3,
    rarity: 'common',
    xpReward: 100
    // Remove unlockedAt
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '⚡',
    category: 'streak',
    progress: 0, // Current streak is 5, need 2 more days
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

      addGoal: (goalData) => {
        const newGoal: Goal = {
          ...goalData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          goals: [...state.goals, newGoal]
        }));
        get().checkAchievements();
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map(goal => 
            goal.id === id ? { ...goal, ...updates } : goal
          )
        }));
        
        // Check if goal was completed
        if (updates.status === 'Completed') {
          get().addXP(100);
          get().updateStreak();
          get().checkAchievements();
        }
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter(goal => goal.id !== id)
        }));
      },

      toggleSubTask: (goalId, taskId) => {
        set((state) => ({
          goals: state.goals.map(goal =>
            goal.id === goalId
              ? {
                  ...goal,
                  subTasks: goal.subTasks.map(task =>
                    task.id === taskId
                      ? { ...task, completed: !task.completed }
                      : task
                  )
                }
              : goal
          )
        }));
      },

      toggleDarkMode: () => {
        set((state) => {
          const newMode = !state.isDarkMode;
          localStorage.setItem('theme', newMode ? 'dark' : 'light');
          return { isDarkMode: newMode };
        });
      },

      checkAchievements: () => {
        const state = get();
        const { goals, userStats } = state;
        
        const completedGoals = goals.filter(g => g.status === 'Completed');
        const currentDate = new Date();
        const lastActivity = new Date(userStats.lastActivityDate);
        const daysSinceLastActivity = Math.floor((currentDate.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

        // Update achievement progress
        const updatedAchievements = state.achievements.map(achievement => {
          let progress = 0;
          
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
            case 'perfect-week':
              // This would need more complex logic to track daily completions
              progress = 0;
              break;
          }
          
          return { ...achievement, progress };
        });

        set({ achievements: updatedAchievements });

        // Check for newly unlocked achievements
        updatedAchievements.forEach(achievement => {
          if (achievement.progress >= achievement.maxProgress && !achievement.unlockedAt) {
            get().unlockAchievement(achievement.id);
          }
        });
      },

      unlockAchievement: (achievementId) => {
        set((state) => ({
          achievements: state.achievements.map(achievement =>
            achievement.id === achievementId
              ? { ...achievement, unlockedAt: new Date().toISOString() }
              : achievement
          ),
          userStats: {
            ...state.userStats,
            achievementsUnlocked: state.userStats.achievementsUnlocked + 1
          }
        }));
        
        const achievement = get().achievements.find(a => a.id === achievementId);
        if (achievement) {
          get().addXP(achievement.xpReward);
        }
      },

      addXP: (amount) => {
        set((state) => {
          const newTotalXP = state.userStats.totalXP + amount;
          const newLevel = Math.floor(newTotalXP / 1000) + 1;
          
          return {
            userStats: {
              ...state.userStats,
              totalXP: newTotalXP,
              level: newLevel
            }
          };
        });
      },

      updateStreak: () => {
        set((state) => {
          const currentDate = new Date();
          const lastActivity = new Date(state.userStats.lastActivityDate);
          const daysSinceLastActivity = Math.floor((currentDate.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
          
          let newStreak = state.userStats.currentStreak;
          
          if (daysSinceLastActivity === 1) {
            // Consecutive day
            newStreak += 1;
          } else if (daysSinceLastActivity === 0) {
            // Same day, keep current streak
            newStreak = state.userStats.currentStreak;
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

      logout: async () => {
        await supabase.auth.signOut();
        // Optionally clear user-related state here
        window.location.href = "/auth"; // Redirect to login page after logout
      },
    }),
    {
      name: 'learning-tracker-storage',
    }
  )
);
