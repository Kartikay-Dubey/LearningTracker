import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  BarChart, 
  CheckCircle, 
  Zap, 
  User, 
  BookOpen, 
  TrendingUp, 
  Target, 
  Github, 
  Linkedin, 
  Mail,
  Clock,
  Award,
  Shield,
  Smartphone,
  Globe,
  Star,
  ArrowRight,
  Play,
  Users,
  Rocket,
  Brain,
  Heart,
  Trophy,
  Lock,
  Unlock,
  Flame
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from "recharts";
import { useStore } from "../stores/useStore";
import { useState } from "react";
import AchievementCard from "../components/features/achievements/AchievementCard";
import AchievementModal from "../components/features/achievements/AchievementModal";
import type { Achievement } from '../stores/useStore';

// Enhanced analytics data
const analyticsData = [
  { name: "Jan", Progress: 20, Goals: 3 },
  { name: "Feb", Progress: 40, Goals: 5 },
  { name: "Mar", Progress: 60, Goals: 7 },
  { name: "Apr", Progress: 80, Goals: 8 },
  { name: "May", Progress: 90, Goals: 10 },
  { name: "Jun", Progress: 100, Goals: 12 },
];

const features = [
  {
    icon: <BarChart className="w-8 h-8 text-blue-600" />,
    title: "Smart Analytics",
    desc: "Visualize your learning journey with beautiful charts and insights.",
    color: "blue"
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-green-600" />,
    title: "Goal Management",
    desc: "Set, track, and achieve your learning objectives with ease.",
    color: "green"
  },
  {
    icon: <Zap className="w-8 h-8 text-purple-600" />,
    title: "Gamification",
    desc: "Earn badges, streaks, and XP to stay motivated and engaged.",
    color: "purple"
  },
  {
    icon: <User className="w-8 h-8 text-pink-600" />,
    title: "Personal Dashboard",
    desc: "All your learning stats, tasks, and notes in one beautiful place.",
    color: "pink"
  },
  {
    icon: <Clock className="w-8 h-8 text-orange-600" />,
    title: "Time Tracking",
    desc: "Monitor how much time you spend on each learning goal.",
    color: "orange"
  },
  {
    icon: <Award className="w-8 h-8 text-yellow-600" />,
    title: "Achievement System",
    desc: "Celebrate milestones and unlock achievements as you progress.",
    color: "yellow"
  }
];

const steps = [
  {
    icon: <BookOpen className="w-7 h-7 text-blue-500" />,
    title: "1. Define Your Goals",
    desc: "Start by adding what you want to learn. From programming languages to musical instruments, anything is possible.",
    step: "01"
  },
  {
    icon: <Target className="w-7 h-7 text-green-500" />,
    title: "2. Track Your Progress",
    desc: "Update your progress, add notes, and check off sub-tasks as you move forward in your learning journey.",
    step: "02"
  },
  {
    icon: <TrendingUp className="w-7 h-7 text-purple-500" />,
    title: "3. Celebrate Growth",
    desc: "Watch your stats, streaks, and achievements grow over time. Every step forward is a victory worth celebrating.",
    step: "03"
  }
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Developer",
    content: "LearnTrack helped me stay organized while learning React. The progress tracking kept me motivated!",
    avatar: "SC"
  },
  {
    name: "Marcus Johnson",
    role: "Student",
    content: "Perfect for managing my study goals. The analytics help me understand my learning patterns.",
    avatar: "MJ"
  },
  {
    name: "Emma Rodriguez",
    role: "Designer",
    content: "Love the clean interface and how easy it is to track my design learning projects.",
    avatar: "ER"
  }
];

const stats = [
  { number: "10K+", label: "Active Learners", icon: <Users className="w-6 h-6" /> },
  { number: "50K+", label: "Goals Completed", icon: <CheckCircle className="w-6 h-6" /> },
  { number: "95%", label: "Success Rate", icon: <TrendingUp className="w-6 h-6" /> },
  { number: "24/7", label: "Available", icon: <Globe className="w-6 h-6" /> }
];

const HomePage: React.FC = () => {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-premium-primary overflow-x-hidden transition-colors duration-300">

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-20 px-4 sm:px-8">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center px-4 py-2 bg-teal-50 dark:bg-premium-secondary rounded-full text-premium-accent border border-premium-accent/20 dark:border-premium-border text-sm font-medium mb-4">
            <Star className="w-4 h-4 mr-2" />
            Trusted by 10,000+ learners worldwide
          </div>
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-7xl font-extrabold text-slate-900 dark:text-slate-100 mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Learning Tracker
        </motion.h1>
        
        <motion.p
          className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Transform your learning journey with our intelligent progress tracking system. 
          Set goals, track progress, and celebrate achievements with beautiful analytics.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link to="/dashboard">
            <motion.button
              className="btn-primary w-full sm:w-auto flex items-center justify-center text-lg py-4 px-8"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Rocket className="w-5 h-5 mr-2" />
              Get Started Free
            </motion.button>
          </Link>
          
          <motion.button
            className="btn-secondary w-full sm:w-auto flex items-center justify-center text-lg py-4 px-8"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-5 h-5 mr-2" />
            Watch Demo
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 + idx * 0.1 }}
            >
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.number}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* About Section */}
      <section className="max-w-4xl mx-auto py-16 px-4 sm:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            About LearnTrack
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            LearnTrack is your all-in-one personal learning companion designed for the modern learner. 
            Whether you're mastering a new programming language, preparing for certification exams, 
            or building healthy habits, our platform provides the tools and motivation you need to succeed.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Smart Learning</h3>
              <p className="text-gray-600 dark:text-gray-300">AI-powered insights help you optimize your learning strategy</p>
            </motion.div>
            
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Privacy First</h3>
              <p className="text-gray-600 dark:text-gray-300">Your data stays private and secure. No ads, no tracking</p>
            </motion.div>
            
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              <Smartphone className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Cross Platform</h3>
              <p className="text-gray-600 dark:text-gray-300">Access your learning data anywhere, on any device</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto py-16 px-4 sm:px-8">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold mb-12 text-center text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          How It Works
        </motion.h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              className="relative bg-white dark:bg-premium-card rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 p-8 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 border border-transparent dark:border-premium-border"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: idx * 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-premium-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
                {step.step}
              </div>
              <div className="mb-6 mt-4">{step.icon}</div>
              <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-4">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-8">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold mb-12 text-center text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          Powerful Features
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              className="bg-white dark:bg-premium-card rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 p-8 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 group border border-transparent dark:border-premium-border"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: idx * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-4">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Achievement System Preview */}
      <section className="max-w-6xl mx-auto py-16 px-4 sm:px-8">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold mb-12 text-center text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          Gamified Learning Experience
        </motion.h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Earn Achievements & Build Streaks
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Achievement System</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Unlock badges for completing milestones</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Daily Streaks</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Build momentum with consecutive learning days</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">XP & Levels</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Gain experience points and level up</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {[
              { icon: "🎯", title: "First Steps", rarity: "Common" },
              { icon: "🔥", title: "Week Warrior", rarity: "Rare" },
              { icon: "👑", title: "Monthly Master", rarity: "Epic" },
              { icon: "🏆", title: "Century Champion", rarity: "Legendary" }
            ].map((achievement, idx) => (
              <motion.div
                key={achievement.title}
                className="bg-white dark:bg-premium-card rounded-xl p-4 text-center shadow-lg shadow-black/5 dark:shadow-black/30 border border-transparent dark:border-premium-border"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  {achievement.title}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {achievement.rarity}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Analytics Preview Section */}
      <section className="max-w-6xl mx-auto py-16 px-4 sm:px-8">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold mb-12 text-center text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          Your Learning Analytics
        </motion.h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            className="bg-white dark:bg-premium-card rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 p-8 border border-transparent dark:border-premium-border"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Progress Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#eee"} />
                <XAxis dataKey="name" stroke={isDarkMode ? "#cbd5e1" : "#333"} />
                <YAxis stroke={isDarkMode ? "#cbd5e1" : "#333"} />
                <Tooltip
                  contentStyle={{
                    background: isDarkMode ? "#1e293b" : "#fff",
                    color: isDarkMode ? "#f8fafc" : "#333",
                    borderRadius: "12px",
                    border: isDarkMode ? "1px solid #334155" : "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Progress"
                  stroke="#14B8A6"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#0D9488", strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: "#14B8A6", strokeWidth: 0 }}
                  animationDuration={1200}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
          
          <motion.div
            className="bg-white dark:bg-premium-card rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 p-8 border border-transparent dark:border-premium-border"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Goals Completed</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#eee"} />
                <XAxis dataKey="name" stroke={isDarkMode ? "#cbd5e1" : "#333"} />
                <YAxis stroke={isDarkMode ? "#cbd5e1" : "#333"} />
                <Tooltip
                  contentStyle={{
                    background: isDarkMode ? "#1e293b" : "#fff",
                    color: isDarkMode ? "#f8fafc" : "#333",
                    borderRadius: "12px",
                    border: isDarkMode ? "1px solid #334155" : "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                />
                <Bar dataKey="Goals" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-6xl mx-auto py-16 px-4 sm:px-8">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold mb-12 text-center text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          What Our Users Say
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.name}
              className="bg-white dark:bg-premium-card rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 p-8 border border-transparent dark:border-premium-border"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: idx * 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-premium-accent rounded-full flex items-center justify-center text-white font-semibold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">"{testimonial.content}"</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto py-16 px-4 sm:px-8 text-center">
        <motion.div
          className="bg-premium-secondary border border-premium-border rounded-3xl p-12 text-white shadow-xl shadow-black/10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Transform Your Learning?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of learners who are already achieving their goals with LearnTrack.</p>
          <Link to="/dashboard">
            <motion.button
              className="btn-primary flex items-center mx-auto text-lg py-4 px-8 mt-4 bg-white text-premium-accent hover:bg-gray-100"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      <footer className="relative w-full mt-16 border-t border-gray-200 dark:border-premium-border">
        
        {/* Footer Content */}
        <div className="relative z-10 flex flex-col items-center justify-center py-12 bg-white dark:bg-premium-primary">
          <div className="flex space-x-6 mb-6">
            <motion.a 
              href="https://github.com/your-github" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-premium-accent transition-colors duration-300"
              whileHover={{ scale: 1.1, y: -2 }}
            >
              <Github className="w-7 h-7" />
            </motion.a>
            <motion.a 
              href="https://linkedin.com/in/your-linkedin" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-premium-accent transition-colors duration-300"
              whileHover={{ scale: 1.1, y: -2 }}
            >
              <Linkedin className="w-7 h-7" />
            </motion.a>
            <motion.a 
              href="mailto:your.email@example.com" 
              className="text-gray-400 hover:text-premium-accent transition-colors duration-300"
              whileHover={{ scale: 1.1, y: -2 }}
            >
              <Mail className="w-7 h-7" />
            </motion.a>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm font-light mt-6">
            &copy; {new Date().getFullYear()} LearnTrack. Built with <Heart className="inline w-4 h-4 text-premium-accent" /> by <a href="mailto:your.email@example.com" className="underline hover:text-premium-highlight">Kartikay Dubey</a>
          </p>
        </div>
      </footer>

      <AchievementModal
        achievement={selectedAchievement}
        isOpen={showAchievementModal}
        onClose={() => {
          setShowAchievementModal(false);
          setSelectedAchievement(null);
        }}
      />
    </div>
  );
};

export default HomePage;
