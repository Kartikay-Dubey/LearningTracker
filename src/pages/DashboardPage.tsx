import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle, 
  Clock, 
  TrendingUp, 
  Calendar,
  Target,
  Award,
  Zap,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  MoreVertical,
  Eye,
  Star,
  Timer,
  BookOpen,
  Users,
  Trophy,
  BarChart3,
  PieChart,
  Activity,
  X,
  FileText,
  Link,
  Flame,
  Brain,
  AlertTriangle,
  Lock,
  CloudOff
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useStore } from '../stores/useStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, BarChart, Bar } from "recharts";
import toast from "react-hot-toast";
import CreateGoalModal from "../components/features/goals/CreateGoalModal";
import AchievementCard from "../components/features/achievements/AchievementCard";
import AchievementModal from "../components/features/achievements/AchievementModal";
import QuizModal from "../components/features/goals/QuizModal";
import type { Achievement } from '../stores/useStore';
import SyllabusToGoalsModal from "../components/features/goals/SyllabusAI/SyllabusToGoalsModal";
import AllAchievementsModal from "../components/features/achievements/AllAchievementsModal";


const DashboardPage: React.FC = () => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAllAchievementsModalOpen, setIsAllAchievementsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("week");
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [quizGoal, setQuizGoal] = useState<{ id: string; title: string; description: string } | null>(null);
  
  const goals = useStore((state) => state.goals);
  const updateGoal = useStore((state) => state.updateGoal);
  const deleteGoal = useStore((state) => state.deleteGoal);
  const toggleSubTask = useStore((state) => state.toggleSubTask);
  const achievements = useStore((state) => state.achievements);
  const userStats = useStore((state) => state.userStats);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const isGuestMode = useStore((state) => state.isGuestMode);
  const recalculateXP = useStore((state) => state.recalculateXP);
  const checkDeadlines = useStore((state) => state.checkDeadlines);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  // Force re-renders for live progress ticking
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 5000); // 5 sec live update
    return () => clearInterval(interval);
  }, []);

  // Recalculate XP on mount to fix any corrupted localStorage data
  useEffect(() => {
    recalculateXP();
    checkDeadlines();
  }, [tick]);

  // Dynamic line chart deduction
  const analyticsData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get past 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayGoalsCreated = goals.filter(g => {
        const t = new Date(g.createdAt).getTime();
        return t >= d.getTime() && t < nextD.getTime();
      }).length;

      const dayGoalsCompleted = goals.filter(g => {
        if (g.status !== 'Completed' || !g.completedAt) return false;
        const t = new Date(g.completedAt).getTime();
        return t >= d.getTime() && t < nextD.getTime();
      }).length;

      // Keep cumulative tracker to prevent empty historical drops
      data.push({
        name: d.toLocaleDateString("en-US", { weekday: "short" }),
        Progress: dayGoalsCreated > 0 ? Math.round((dayGoalsCompleted / dayGoalsCreated) * 100) : 0,
        Goals: dayGoalsCreated,
        Completed: dayGoalsCompleted
      });
    }
    return data;
  }, [goals]);

  const pieData = useMemo(() => [
    { name: "Completed", value: goals.filter(g => g.status === "Completed").length, color: "#10b981" },
    { name: "In Progress", value: goals.filter(g => g.status === "In Progress").length, color: "#3b82f6" },
    { name: "To Do", value: goals.filter(g => g.status === "To Do").length, color: "#6b7280" },
  ], [goals]);

  // Filter and sort goals
  const filteredGoals = useMemo(() => goals
    .filter(goal => 
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterStatus === "all" || goal.status === filterStatus)
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "progress":
          comparison = a.progress - b.progress;
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    }), [goals, searchTerm, filterStatus, sortBy, sortOrder]);

  const handleStatusChange = (goalId: string, newStatus: 'To Do' | 'In Progress' | 'Completed' | 'Overdue') => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    if (goal.status === 'Overdue' || goal.status === 'Completed') {
      toast.error('This goal is permanently locked.');
      return;
    }
    if (goal.status === 'In Progress' && newStatus === 'To Do') {
      toast.error('Cannot regress an active goal.');
      return;
    }
    if (newStatus === 'Completed') {
      if (goal.status !== 'Completed') {
        toast.error('Complete the quiz to finish this goal!');
        return;
      }
    }

    updateGoal(goalId, { status: newStatus as any });
    toast.success('Goal status updated!');
  };

  // Helper: check if a goal is overdue
  const isOverdue = (goal: typeof goals[0]): boolean => {
    if (goal.status === 'Completed' || !goal.deadline) return false;
    return new Date(goal.deadline) < new Date();
  };

  const calculateTimeProgress = (goal: typeof goals[0]): number => {
    if (goal.status === 'Completed') return 100;
    if (!goal.deadline) return 0; // If no deadline, we have no time-based metric

    const start = new Date(goal.createdAt).getTime();
    const end = new Date(goal.deadline).getTime();
    const now = new Date().getTime();

    if (now >= end) return 100; // Passed deadline => 100% elapsed
    if (now <= start) return 0;

    const totalDuration = end - start;
    const elapsed = now - start;
    const progress = (elapsed / totalDuration) * 100;
    
    // Auto-progress bump: if 1 minute has elapsed, guarantee at least 2% progress
    if (elapsed >= 60000 && progress > 0 && progress < 2) {
      return 2;
    }
    
    return Math.floor(Math.max(0, Math.min(100, progress)));
  };

  const getTimeRemainingText = (goal: typeof goals[0]) => {
    if (goal.status === 'Completed') return { text: "Completed", color: "text-green-500" };
    if (!goal.deadline) return { text: "No deadline", color: "text-gray-500 font-medium" };

    const end = new Date(goal.deadline).getTime();
    const now = new Date().getTime();
    const diffHours = (end - now) / (1000 * 60 * 60);

    if (diffHours < 0) return { text: "Overdue", color: "text-red-500 font-bold font-medium" };
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 0) {
      if (Math.floor(diffHours) === 0) return { text: "Due in less than an hour", color: "text-red-500 font-medium" };
      return { text: `Due in ${Math.floor(diffHours)} hours`, color: "text-red-500 font-medium" };
    }
    
    if (diffDays <= 3) return { text: `${diffDays} days left`, color: "text-amber-500 font-medium" };
    
    return { text: `${diffDays} days left`, color: "text-teal-600 dark:text-teal-400 font-medium" };
  };

  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteGoal(goalId);
      toast.success('Goal deleted successfully!');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      case 'In Progress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-premium-secondary dark:text-gray-300';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  // Real stat calculations (no hardcoded percentages)
  const stats = useMemo(() => {
    const completedCount = goals.filter(g => g.status === 'Completed').length;
    const inProgressCount = goals.filter(g => g.status === 'In Progress').length;
    const successRate = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;
    const overdueCount = goals.filter(g => isOverdue(g)).length;

    return [
      { 
        title: "Total Goals", 
        value: goals.length, 
        icon: <Target className="w-6 h-6" />, 
        color: "blue",
        change: goals.length > 0 ? `${goals.length} total` : "—"
      },
      { 
        title: "In Progress", 
        value: inProgressCount, 
        icon: <Clock className="w-6 h-6" />, 
        color: "yellow",
        change: overdueCount > 0 ? `${overdueCount} overdue` : "On track"
      },
      { 
        title: "Completed", 
        value: completedCount, 
        icon: <CheckCircle className="w-6 h-6" />, 
        color: "green",
        change: `${completedCount} done`
      },
      { 
        title: "Success Rate", 
        value: successRate, 
        icon: <TrendingUp className="w-6 h-6" />, 
        color: "purple",
        change: `${successRate}%`
      }
    ];
  }, [goals]);

  const achievementStats = useMemo(() => [
    { 
      title: "Current Streak", 
      value: userStats.currentStreak, 
      icon: <Flame className="w-6 h-6" />, 
      color: "red",
      change: "🔥"
    },
    { 
      title: "Total XP", 
      value: userStats.totalXP, 
      icon: <Star className="w-6 h-6" />, 
      color: "yellow",
      change: "⭐"
    },
    { 
      title: "Level", 
      value: userStats.level, 
      icon: <Target className="w-6 h-6" />, 
      color: "purple",
      change: "🎯"
    },
    { 
      title: "Achievements", 
      value: userStats.achievementsUnlocked, 
      icon: <Award className="w-6 h-6" />, 
      color: "green",
      change: "🏆"
    }
  ], [userStats]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-premium-primary p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Learning Dashboard</h1>
                {isGuestMode && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <CloudOff className="w-4 h-4" /> Guest Mode
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                Track your progress and achieve your goals
                {isGuestMode && (
                  <RouterLink to="/auth" className="text-teal-600 dark:text-orange-400 font-medium hover:underline flex items-center gap-1 text-sm bg-teal-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-md ml-2 border border-teal-200 dark:border-orange-500/30">
                    Login to Sync Progress
                  </RouterLink>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                onClick={() => setViewMode(viewMode === "grid" ? "timeline" : "grid")}
                className="p-2 rounded-lg bg-white dark:bg-premium-card shadow-sm hover:shadow-md transition-all duration-200 border border-transparent dark:border-premium-border"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle View"
              >
                {viewMode === "grid" ? <Activity className="w-5 h-5 text-premium-accent" /> : <BarChart3 className="w-5 h-5 text-premium-accent" />}
              </motion.button>
              <motion.button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="New Goal"
              >
                <Plus className="w-5 h-5" />
                <span>New Goal</span>
              </motion.button>
              <motion.button
                onClick={() => setIsSyllabusModalOpen(true)}
                className="btn-secondary flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="AI Syllabus to Goals"
                title="Generate learning goals from a syllabus PDF"
              >
                <FileText className="w-5 h-5" />
                <span>AI Syllabus to Goals</span>
              </motion.button>
            </div>
          </div>


          {/* Search and Filters */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-black/5 dark:shadow-black/30 border border-white/20 dark:border-white/10 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search goals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-premium-border rounded-xl focus:ring-2 focus:ring-premium-accent focus:border-transparent bg-white dark:bg-premium-secondary text-gray-900 dark:text-white transition-all duration-300"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 dark:border-premium-border rounded-xl focus:ring-2 focus:ring-premium-accent bg-white dark:bg-premium-secondary text-gray-900 dark:text-white transition-all duration-300"
              >
                <option value="all">All Status</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 dark:border-premium-border rounded-xl focus:ring-2 focus:ring-premium-accent bg-white dark:bg-premium-secondary text-gray-900 dark:text-white transition-all duration-300"
              >
                <option value="createdAt">Date Created</option>
                <option value="title">Title</option>
                <option value="progress">Progress</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-3 border border-gray-200 dark:border-premium-border rounded-xl hover:bg-gray-50 dark:hover:bg-premium-secondary transition-colors"
              >
                {sortOrder === "asc" ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Analytics Section */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 p-6 border border-white/20 dark:border-white/10">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-premium-accent" />
              Progress Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e5e7eb"} />
                <XAxis dataKey="name" stroke={isDarkMode ? "#cbd5e1" : "#6b7280"} />
                <YAxis stroke={isDarkMode ? "#cbd5e1" : "#6b7280"} />
                <Tooltip
                  contentStyle={{
                    background: isDarkMode ? "#1e293b" : "#fff",
                    color: isDarkMode ? "#f8fafc" : "#333",
                    border: isDarkMode ? "1px solid #334155" : "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line type="monotone" dataKey="Progress" stroke="#14B8A6" strokeWidth={3} dot={{ r: 4, fill: "#0D9488" }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Goals" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: "#d97706" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-premium-card rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 p-6 border border-transparent dark:border-premium-border">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <PieChart className="w-6 h-6 mr-2 text-premium-accent" />
              Goals Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-6 mt-4">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Achievement Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 p-6 border border-white/20 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-premium-highlight" />
                Achievements & Streaks
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-gradient-to-r from-premium-danger to-red-400 text-white px-3 py-1 rounded-full shadow-sm">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">{userStats.currentStreak} Day Streak</span>
                </div>
                <div className="flex items-center space-x-2 bg-gradient-to-r from-premium-highlight to-yellow-400 text-white px-3 py-1 rounded-full shadow-sm">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-medium">Level {userStats.level}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {achievementStats.map((stat, idx) => (
                <motion.div 
                  key={stat.title}
                  className="bg-gray-50 dark:bg-premium-secondary rounded-xl p-4 text-center border border-transparent dark:border-slate-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                >
                  <div className="text-2xl mb-1">{stat.change}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{stat.title}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {achievements.slice(0, 6).map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClick={() => {
                    setSelectedAchievement(achievement);
                    setShowAchievementModal(true);
                  }}
                />
              ))}
            </div>
            
            {achievements.length > 6 && (
              <div className="text-center mt-4">
                <button 
                  onClick={() => setIsAllAchievementsModalOpen(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium transition-all hover:text-blue-700 dark:hover:text-blue-300"
                >
                  View All Achievements ({achievements.length})
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Goals Grid/Timeline */}
        <motion.div 
          className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "relative max-w-4xl mx-auto py-8"
          }
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {viewMode === "timeline" && filteredGoals.length > 0 && (
            <div className="absolute left-[2.25rem] md:left-[50%] top-16 bottom-16 w-0.5 bg-gradient-to-b from-orange-500 via-amber-400 to-orange-500 opacity-20 transform -translate-x-1/2 rounded-full hidden sm:block" />
          )}
          
          <AnimatePresence>
            {filteredGoals.map((goal, index) => (
              <motion.div 
                key={goal.id} 
                className={
                  viewMode === "timeline" 
                    ? `relative flex flex-col md:flex-row items-center justify-center md:justify-between w-full mb-12 sm:px-4 group ${index % 2 === 0 ? "md:flex-row-reverse" : ""}`
                    : "bg-white dark:bg-premium-card rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 border border-gray-100 dark:border-slate-700 p-6 cursor-pointer hover:shadow-xl transition-all duration-300"
                }
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.02, 
                  rotateY: viewMode === "grid" ? 5 : 0,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}
                style={{ 
                  transformStyle: "preserve-3d",
                  perspective: "1000px"
                }}
                layout
              >
                {/* Timeline node */}
                {viewMode === "timeline" && (
                  <>
                    {/* Timestamp label */}
                    <div className={`hidden md:block w-5/12 text-sm text-gray-500 dark:text-gray-400 font-medium ${index % 2 === 0 ? "text-left pl-8" : "text-right pr-8"}`}>
                      {new Date(goal.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    {/* Circle Node */}
                    <div className="hidden sm:flex absolute left-[2.25rem] md:left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full border-4 border-white dark:border-premium-primary shadow-lg items-center justify-center z-10 bg-white dark:bg-premium-primary group-hover:scale-110 transition-transform duration-300">
                      {goal.status === 'Completed' ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                       goal.status === 'In Progress' ? <Clock className="w-5 h-5 text-orange-500" /> :
                       <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />}
                    </div>
                  </>
                )}

                {/* Content Box */}
                <div className={
                  viewMode === "timeline"
                    ? "w-full pl-16 sm:pl-20 md:pl-0 md:w-5/12 bg-white/5 backdrop-blur border border-white/10 dark:border-slate-700/50 rounded-xl p-6 shadow-xl hover:shadow-orange-500/10 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-premium-card dark:to-premium-secondary"
                    : "flex flex-col h-full"
                }>
                  <div className={`flex justify-between items-start mb-4`}>
                    <div>
                      <h3 className={`font-semibold text-gray-900 dark:text-white text-lg mb-2`}>
                        {goal.title}
                      </h3>
                      {viewMode === "timeline" && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{goal.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGoal(goal.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Category + Difficulty badges */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {goal.category && goal.category !== "Syllabus (Auto-Generated)" && viewMode === "grid" && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{goal.category}</span>
                    )}
                    {(goal as any).difficulty && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        (goal as any).difficulty === 'Hard' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                        (goal as any).difficulty === 'Easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      }`}>
                        {(goal as any).difficulty}
                      </span>
                    )}
                    {goal.status === 'Overdue' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>
                  
                  {/* Elegant Gradient Time Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-slate-700/50 rounded-full h-2 mb-3 overflow-hidden">
                    <motion.div 
                      className={`h-2 rounded-full ${
                        goal.status === "Completed" 
                          ? "bg-green-500" 
                          : calculateTimeProgress(goal) > 90 
                            ? "bg-red-500" 
                            : calculateTimeProgress(goal) > 75
                              ? "bg-amber-500"
                              : "bg-gradient-to-r from-teal-400 to-teal-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${calculateTimeProgress(goal)}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-3">
                    <p className={`text-sm ${getTimeRemainingText(goal).color}`}>
                      {getTimeRemainingText(goal).text}
                    </p>
                    <div className="flex space-x-2 items-center">
                      {/* Take Quiz button for In Progress goals */}
                      {goal.status === 'In Progress' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuizGoal({ id: goal.id, title: goal.title, description: goal.description });
                          }}
                          className="text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm flex items-center gap-1"
                        >
                          <Brain className="w-3 h-3" /> Quiz
                        </button>
                      )}
                      {/* Status dropdown — locked for completed/overdue goals, no Completed option */}
                      {goal.status === 'Completed' ? (
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Completed
                        </span>
                      ) : goal.status === 'Overdue' ? (
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Overdue
                        </span>
                      ) : (
                        <select
                          value={goal.status}
                          onChange={(e) => handleStatusChange(goal.id, e.target.value as any)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-medium border border-gray-300 dark:border-slate-600 rounded-full px-3 py-1 focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white cursor-pointer"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {selectedGoal === goal.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50"
                    >
                      {viewMode === "grid" && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-line">{goal.description}</p>
                      )}
                      
                      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-4">
                        <span className="font-medium">Added: {new Date(goal.createdAt).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredGoals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-gray-400 mb-6">
              <BookOpen className="w-20 h-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">No goals found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              {searchTerm || filterStatus !== "all" 
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Create your first learning goal to get started on your journey!"
              }
            </p>
            {!searchTerm && filterStatus === "all" && (
              <motion.button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary py-4 px-8 mt-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Create Your First Goal
              </motion.button>
            )}
          </motion.div>
        )}
        {/* 4. Stats Summary */}
        <motion.div 
          className="mt-12 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <BarChart3 className="w-6 h-6 mr-2 text-premium-highlight" />
            Lifetime Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.title}
                className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-black/5 dark:shadow-black/30 border border-white/20 dark:border-white/10 hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900`}>
                    <div className={`text-${stat.color}-600 dark:text-${stat.color}-300`}>
                      {stat.icon}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {stat.change}
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.title === "Success Rate" ? `${stat.value}%` : stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{stat.title}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <AchievementModal
        achievement={selectedAchievement}
        isOpen={showAchievementModal}
        onClose={() => {
          setShowAchievementModal(false);
          setSelectedAchievement(null);
        }}
      />
      <SyllabusToGoalsModal
        isOpen={isSyllabusModalOpen}
        onClose={() => setIsSyllabusModalOpen(false)}
      />
      {quizGoal && (
        <QuizModal
          isOpen={!!quizGoal}
          onClose={() => setQuizGoal(null)}
          goalId={quizGoal.id}
          goalTitle={quizGoal.title}
          goalDescription={quizGoal.description}
        />
      )}
      <AllAchievementsModal 
        isOpen={isAllAchievementsModalOpen} 
        onClose={() => setIsAllAchievementsModalOpen(false)} 
      />
    </div>
  );
};

export default DashboardPage;
