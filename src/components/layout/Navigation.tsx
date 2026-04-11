import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  BarChart3, 
  Plus, 
  User, 
  Moon, 
  Sun, 
  Menu, 
  X,
  Bell,
  Search,
  LogOut
} from "lucide-react";
import { useStore } from "../../stores/useStore";
import { supabase } from "../../lib/supabaseClient";

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isDarkMode = useStore((state) => state.isDarkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const logout = useStore((state) => state.logout);

  // Track login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    // { path: "/goals", label: "Goals", icon: Plus },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <motion.nav 
      className="bg-white/70 text-[#111827] dark:bg-slate-900/70 dark:text-[#E5E7EB] backdrop-blur-md border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              className="w-8 h-8 bg-premium-accent rounded-lg flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <BarChart3 className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              LearnTrack
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    location.pathname === item.path
                      ? "text-premium-accent bg-teal-50 dark:text-orange-400 dark:bg-slate-800"
                      : "text-gray-600 hover:text-premium-accent hover:bg-gray-50 dark:text-gray-400 dark:hover:text-orange-500 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <motion.button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-premium-secondary rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-5 h-5" />
            </motion.button>

            {/* Notifications */}
            <motion.button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-premium-secondary rounded-lg transition-colors relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-premium-secondary rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            {/* Logout Button */}
            {isLoggedIn && (
              <motion.button
                className="p-2 text-red-500 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-premium-secondary rounded-lg transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 dark:border-slate-700 py-4 bg-white dark:bg-slate-900"
          >
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                      location.pathname === item.path
                        ? "text-premium-accent bg-teal-50 dark:text-orange-400 dark:bg-slate-800"
                        : "text-gray-600 hover:text-premium-accent hover:bg-gray-50 dark:text-gray-400 dark:hover:text-orange-500 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navigation;
