import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

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
      
      const res = await fetch("http://localhost:5001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg, history })
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

  return (
    <>
      {/* Premium Floating Action Button */}
      <motion.button
        className="fixed bottom-6 right-6 p-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-full shadow-lg hover:shadow-orange-500/30 transition-all z-50 flex items-center justify-center dark:shadow-orange-500/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
      >
        <MessageCircle className="w-7 h-7" />
      </motion.button>

      {/* Chat Window with Glow & Scale Transition */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 w-[90vw] sm:w-[400px] h-[550px] bg-white dark:bg-premium-card rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-100 dark:border-premium-border overflow-hidden dark:shadow-orange-500/10"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 border-b border-orange-500/20">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-orange-400" />
                <span className="font-semibold tracking-wide">AI Doubt Solver</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-300" />
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[75%] text-sm shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-tr-none' 
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
                    <motion.div className="w-1.5 h-1.5 bg-orange-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }} />
                    <motion.div className="w-1.5 h-1.5 bg-orange-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.2 }} />
                    <motion.div className="w-1.5 h-1.5 bg-orange-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.4 }} />
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
                  className="flex-1 bg-slate-100 dark:bg-slate-800/60 border border-transparent dark:focus:border-slate-600 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-orange-500/50 dark:text-white transition-all outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-3 bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 text-white rounded-full transition-all flex flex-shrink-0 items-center justify-center shadow-md dark:shadow-orange-500/20"
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
