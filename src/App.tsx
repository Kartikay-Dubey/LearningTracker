import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useStore } from "./stores/useStore";
import { supabase } from "./lib/supabaseClient";
import Navigation from "./components/layout/Navigation";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import ChatPanel from "./components/layout/ChatPanel";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { SyncPromptModal } from "./components/auth/SyncPromptModal";
import { useSupabaseSync } from "./hooks/useSupabaseSync";

function App() {
  const isDarkMode = useStore((state) => state.isDarkMode);
  
  // Sync Zustand ← Supabase on auth state change
  const { session, loading: syncLoading } = useSupabaseSync();

  const assessNotifications = useStore((state) => state.assessNotifications);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Evaluate deadlines and warnings
    assessNotifications();
    const interval = setInterval(() => {
      assessNotifications();
    }, 60 * 60 * 1000); // Check every hour
    
    return () => clearInterval(interval);
  }, [isDarkMode, assessNotifications]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-premium-primary dark:text-gray-200 transition-colors duration-300">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDarkMode ? '#1E293B' : '#363636',
              color: '#fff',
            },
          }}
        />
        <ChatPanel />
        <SyncPromptModal />
      </div>
    </Router>
  );
}

export default App;
