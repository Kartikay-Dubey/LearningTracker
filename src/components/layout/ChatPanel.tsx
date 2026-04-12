import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your LearnTrack assistant. I've read your uploaded syllabus content. How can I help you study?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput("");
    
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Structure history for completion
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: userMsg + " (Use a friendly tone and include emojis like 😊📚✨ where appropriate)", 
          history 
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to connect to chat API");
      }

      const data = await res.json();
      const assistantMsg = data?.choices?.[0]?.message?.content || "No response received";
      
      if (!data?.choices?.length) {
        throw new Error("Empty response from AI");
      }

      setMessages(prev => [...prev, { role: "assistant", content: assistantMsg }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: err.message || "Sorry, I am having trouble connecting to the server. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (location.pathname !== "/dashboard") return null;

  return (
    <>
      {/* Premium Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        {/* Tooltip */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 dark:bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
          Ask AI ✨
        </div>
        <motion.button
          className="p-4 bg-gradient-to-br from-teal-500 to-teal-400 dark:from-orange-500 dark:to-amber-400 text-white rounded-full shadow-lg shadow-teal-500/30 dark:shadow-orange-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          onClick={() => setIsOpen(!isOpen)}
          initial={{ scale: 0 }}
          animate={{ scale: isOpen ? 0 : 1 }}
        >
          <motion.div 
            className="relative"
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Bot className="w-7 h-7" />
          </motion.div>
        </motion.button>
      </div>

      {/* Chat Window with Glow & Scale Transition */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 w-[90vw] sm:w-[400px] h-[550px] bg-white dark:bg-premium-card rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-100 dark:border-premium-border overflow-hidden dark:shadow-orange-500/10 origin-bottom-right"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white p-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-800 transition-colors">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 dark:bg-orange-500/20 rounded-lg">
                  <Bot className="w-4 h-4 text-teal-600 dark:text-orange-400" />
                </div>
                <span className="font-semibold tracking-wide">AI Doubt Solver</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-premium-primary/50 relative">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-teal-500 dark:bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[75%] text-sm shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-teal-500 to-teal-400 dark:from-orange-500 dark:to-amber-500 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gradient-to-r dark:from-slate-800/80 dark:to-slate-800/50 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Animation */}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 flex-row items-center"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-tl-none flex items-center justify-center gap-1">
                    <motion.div className="w-1.5 h-1.5 bg-teal-500 dark:bg-orange-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }} />
                    <motion.div className="w-1.5 h-1.5 bg-teal-500 dark:bg-orange-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.2 }} />
                    <motion.div className="w-1.5 h-1.5 bg-teal-500 dark:bg-orange-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.4 }} />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-premium-card border-t border-gray-100 dark:border-slate-800/80 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about your syllabus..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800/60 border border-transparent dark:focus:border-slate-600 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-teal-500/50 dark:focus:ring-orange-500/50 dark:text-white transition-all outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-3 bg-teal-500 hover:bg-teal-600 dark:bg-orange-500 dark:hover:bg-orange-600 active:scale-95 disabled:opacity-50 text-white rounded-full transition-all flex flex-shrink-0 items-center justify-center shadow-md shadow-teal-500/20 dark:shadow-orange-500/20"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatPanel;
