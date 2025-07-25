import React from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabaseClient";
import { motion } from "framer-motion";
import { Rocket, User, Github, Linkedin, Mail } from "lucide-react";

const blobs = [
  {
    style: "absolute w-[40vw] h-[40vw] bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-30 blur-3xl rounded-full top-[-10%] left-[-10%]",
    animate: { x: [0, 40, 0], y: [0, 40, 0] },
    transition: { repeat: Infinity, duration: 18, ease: ["easeInOut"] } // <-- FIXED
  },
  {
    style: "absolute w-[30vw] h-[30vw] bg-gradient-to-br from-pink-400 via-yellow-400 to-blue-400 opacity-20 blur-3xl rounded-full bottom-[-10%] right-[-10%]",
    animate: { x: [0, -30, 0], y: [0, -30, 0] },
    transition: { repeat: Infinity, duration: 22, ease: ["easeInOut"] } // <-- FIXED
  }
];

const AuthPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
    {/* Animated Blobs */}
    <div className="fixed inset-0 z-0 pointer-events-none">
      {blobs.map((blob, idx) => (
        <motion.div
          key={idx}
          className={blob.style}
          animate={blob.animate}
          transition={blob.transition}
        />
      ))}
    </div>
    {/* Glassmorphism Card */}
    <div className="relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-md w-full border border-gray-200 dark:border-gray-700 flex flex-col items-center">
      <motion.div
        className="mb-6 flex items-center justify-center"
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <Rocket className="w-12 h-12 text-purple-600 drop-shadow-lg" />
      </motion.div>
      <h2 className="text-3xl font-extrabold mb-2 text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
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
                brand: "#8b5cf6",
                brandAccent: "#6366f1"
              }
            }
          }
        }}
        providers={["google", "github", "linkedin"]}
        theme="light"
        onlyThirdPartyProviders={false}
        socialLayout="horizontal"
        magicLink={true}
      />
      <div className="flex justify-center gap-4 mt-6">
        <span className="text-gray-400">or sign in with</span>
        <Github className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        <Linkedin className="w-6 h-6 text-blue-700 dark:text-blue-400" />
        <Mail className="w-6 h-6 text-red-500 dark:text-red-400" />
      </div>
    </div>
  </div>
);

export default AuthPage;