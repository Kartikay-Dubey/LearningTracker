import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useStore } from "./stores/useStore";
import Navigation from "./components/layout/Navigation";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
// import GoalsPage from "./pages/GoalsPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";

function App() {
  const isDarkMode = useStore((state) => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-premium-primary dark:text-gray-200 transition-colors duration-300">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* <Route path="/goals" element={<GoalsPage />} /> */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
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
      </div>
    </Router>
  );
}

export default App;
