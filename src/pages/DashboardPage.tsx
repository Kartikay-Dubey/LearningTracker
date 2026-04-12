import React, { useState } from "react";
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
  Flame
} from "lucide-react";
import { useStore } from '../stores/useStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, BarChart, Bar } from "recharts";
import toast from "react-hot-toast";
import CreateGoalModal from "../components/features/goals/CreateGoalModal";
import AchievementCard from "../components/features/achievements/AchievementCard";
import AchievementModal from "../components/features/achievements/AchievementModal";
import type { Achievement } from '../stores/useStore';
import SyllabusToGoalsModal from "../components/features/goals/SyllabusAI/SyllabusToGoalsModal";


const DashboardPage: React.FC = () => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("week");
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  
  const goals = useStore((state) => state.goals);
  const updateGoal = useStore((state) => state.updateGoal);
  const deleteGoal = useStore((state) => state.deleteGoal);
  const toggleSubTask = useStore((state) => state.toggleSubTask);
  const achievements = useStore((state) => state.achievements);
  const userStats = useStore((state) => state.userStats);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  // Enhanced analytics data
  const analyticsData = [
    { name: "Mon", Progress: 20, Goals: 3, Time: 2.5 },
    { name: "Tue", Progress: 35, Goals: 4, Time: 3.2 },
    { name: "Wed", Progress: 45, Goals: 5, Time: 4.1 },
    { name: "Thu", Progress: 60, Goals: 6, Time: 3.8 },
    { name: "Fri", Progress: 75, Goals: 7, Time: 5.2 },
    { name: "Sat", Progress: 85, Goals: 8, Time: 4.5 },
    { name: "Sun", Progress: 95, Goals: 9, Time: 6.0 },
  ];

  const pieData = [
    { name: "Completed", value: goals.filter(g => g.status === "Completed").length, color: "#10b981" },
    { name: "In Progress", value: goals.filter(g => g.status === "In Progress").length, color: "#3b82f6" },
    { name: "To Do", value: goals.filter(g => g.status === "To Do").length, color: "#6b7280" },
  ];

  // Filter and sort goals
  const filteredGoals = goals
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
    });

  const handleStatusChange = (goalId: string, newStatus: 'To Do' | 'In Progress' | 'Completed') => {
    updateGoal(goalId, { status: newStatus });
    toast.success('Goal status updated!');
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

  const stats = [
    { 
      title: "Total Goals", 
      value: goals.length, 
      icon: <Target className="w-6 h-6" />, 
      color: "blue",
      change: "+12%"
    },
    { 
      title: "In Progress", 
      value: goals.filter(g => g.status === 'In Progress').length, 
      icon: <Clock className="w-6 h-6" />, 
      color: "yellow",
      change: "+5%"
    },
    { 
      title: "Completed", 
      value: goals.filter(g => g.status === 'Completed').length, 
      icon: <CheckCircle className="w-6 h-6" />, 
      color: "green",
      change: "+8%"
    },
    { 
      title: "Success Rate", 
      value: goals.length > 0 ? Math.round((goals.filter(g => g.status === 'Completed').length / goals.length) * 100) : 0, 
      icon: <TrendingUp className="w-6 h-6" />, 
      color: "purple",
      change: "+3%"
    }
  ];

  const achievementStats = [
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
  ];

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
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Learning Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300">Track your progress and achieve your goals</p>
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

          {/* Enhanced Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.title}
                className="bg-white dark:bg-premium-card rounded-2xl p-6 shadow-lg shadow-black/5 dark:shadow-black/30 border border-transparent dark:border-premium-border hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
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

          {/* Search and Filters */}
          <div className="bg-white dark:bg-premium-card rounded-2xl p-6 shadow-lg shadow-black/5 dark:shadow-black/30 border border-transparent dark:border-premium-border mb-8">
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
          <div className="bg-white dark:bg-premium-card rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 p-6 border border-transparent dark:border-premium-border">
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
          <div className="bg-white dark:bg-premium-card rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 p-6 border border-transparent dark:border-premium-border">
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
                <button className="text-blue-600 dark:text-blue-400 hover:underline">
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
                  
                  {/* Category formatting rule */}
                  {goal.category && goal.category !== "Syllabus (Auto-Generated)" && viewMode === "grid" && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{goal.category}</span>
                    </div>
                  )}
                  
                  {/* Elegant Gradient Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-slate-700/50 rounded-full h-2 mb-3 overflow-hidden">
                    <motion.div 
                      className={`h-2 rounded-full ${
                        goal.status === "Completed" 
                          ? "bg-green-500" 
                          : "bg-gradient-to-r from-orange-500 to-amber-400"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{goal.progress}%</p>
                    <div className="flex space-x-2 items-center">
                      {/* Difficulty Glow Badge */}
                      {goal.notes && goal.notes.includes("Difficulty:") && viewMode === "timeline" && (
                        <span className="bg-orange-500/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-semibold shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                          {goal.notes.split('|')[0].replace('Difficulty:', '').trim()}
                        </span>
                      )}
                      <select
                        value={goal.status}
                        onChange={(e) => handleStatusChange(goal.id, e.target.value as any)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-medium border border-gray-300 dark:border-slate-600 rounded-full px-3 py-1 focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white cursor-pointer"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
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
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{goal.description}</p>
                      )}
                      
                      {goal.notes && (
                        <div className="mb-4 text-xs bg-orange-50 dark:bg-orange-500/5 p-3 rounded-xl text-orange-900 dark:text-orange-200 border border-orange-100 dark:border-orange-500/10 whitespace-pre-line">
                          {goal.notes}
                        </div>
                      )}

                      {goal.subTasks.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Milestones</h4>
                          <div className="space-y-2">
                            {goal.subTasks.map((task) => (
                              <div key={task.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSubTask(goal.id, task.id);
                                  }}
                                  className={`transition-colors ${task.completed ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-orange-500'}`}
                                >
                                  {task.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                </button>
                                <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {task.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
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
    </div>
  );
};

export default DashboardPage;
