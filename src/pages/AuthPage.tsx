import React from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabaseClient";
import { motion } from "framer-motion";
import { easeInOut } from "framer-motion";
import { Rocket, User, Github, Linkedin, Mail } from "lucide-react";

import { useStore } from "../stores/useStore";

const AuthPage: React.FC = () => {
  const isDarkMode = useStore((state) => state.isDarkMode);
  
  return (
  <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-premium-primary relative overflow-hidden transition-colors duration-300">
    {/* Minimal Background accents */}
    <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent opacity-50 dark:opacity-20 pointer-events-none" />

    {/* Glassmorphism Card */}
    <div className="relative z-10 bg-white/80 dark:bg-premium-card/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-md w-full border border-gray-200 dark:border-premium-border/50 flex flex-col items-center shadow-black/30">
      <motion.div
        className="mb-6 flex items-center justify-center"
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <Rocket className="w-12 h-12 text-premium-accent drop-shadow-lg" />
      </motion.div>
      <h2 className="text-3xl font-extrabold mb-2 text-center text-slate-900 dark:text-slate-100">
        Welcome to LearnTrack
      </h2>
      <p className="mb-6 text-center text-gray-600 dark:text-gray-300">
        Track your learning. Achieve your goals. Level up your skills!
      </p>
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: "#14B8A6",
                brandAccent: "#0D9488"
              }
            }
          }
        }}
        providers={["google", "github", "linkedin"]}
        theme={isDarkMode ? "dark" : "default"}
        onlyThirdPartyProviders={false}
        socialLayout="horizontal"
        magicLink={true}
      />
    </div>
  </div>
  );
};

export default AuthPage;