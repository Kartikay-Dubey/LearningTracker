import React from "react";
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

  return (
    <Router>
      <div className={`App ${isDarkMode ? 'dark' : ''}`}>
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
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
                background: isDarkMode ? '#374151' : '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </div>
    </Router>
  );
}

export default App;
