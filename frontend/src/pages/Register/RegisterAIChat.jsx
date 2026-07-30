import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, CheckCircle2 } from "lucide-react";

/**
 * RegisterAIChat
 * 
 * An interactive, slide-in AI Assistant Chat drawer designed to work with Aavedan-Setu.
 * Includes a typing indicator, default prompt suggestions, and messaging threads.
 * 
 * FUTURE AI INTEGRATION NOTICE:
 * Look for the `handleSendMessageToAI` function. You can replace the mock setTimeout API call
 * with an Axios call to your actual Node.js/Python backend LLM route.
 */
export default function RegisterAIChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Namaste! I am your AI Citizen Assistant. How can I help you raise complaints or search schemes today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const suggestions = [
    "How do I submit a garbage dump complaint?",
    "Show me schemes for farmers",
    "What is the eligibility for Ayushman Bharat?",
    "Track status of complaint #129",
  ];

  // Auto-scroll to the bottom of the chat list
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /**
   * FUTURE AI INTEGRATION BRIDGE
   * Edit this function when you want to connect your real AI API!
   * 
   * Example integration:
   * ```js
   * import axios from 'axios';
   * ...
   * const response = await axios.post('/api/ai/query', { message: userText });
   * const aiReply = response.data.reply;
   * ```
   */
  const handleSendMessageToAI = async (userText) => {
    setIsTyping(true);

    try {
      // ─── PLUG IN YOUR BACKEND AI API HERE ───
      // For now, we simulate a mock reply with standard assistance templates.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      let replyText = "I received your query. In the next phase of this project, I will process this question using an AI model to guide you.";

      // Custom mock responses based on standard suggestions
      if (userText.toLowerCase().includes("complaint")) {
        replyText = "To raise a complaint, you'll need to sign up. Once signed up, go to your Dashboard and click 'Submit Complaint'. You can upload images, tag a category (e.g., Waste, Roads), and geo-tag the location.";
      } else if (userText.toLowerCase().includes("scheme")) {
        replyText = "Aavedan-Setu offers scheme searches categorized by Farmers, Education, Women Welfare, and Senior Citizens. You can apply directly through the 'Government Schemes' page.";
      } else if (userText.toLowerCase().includes("ayushman")) {
        replyText = "Ayushman Bharat scheme provides cover up to Rs 5 Lakhs per family per year for secondary/tertiary hospitalizations. Low-income families listed in SECC database are eligible.";
      } else if (userText.toLowerCase().includes("status")) {
        replyText = "You can track any complaint instantly by typing its ID in the 'Track Status' page or inside your dashboard under 'My Complaints'.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error("AI Assistant API Error: ", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "Oops, I encountered a temporary connection issue. Please try again shortly.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (textToSend) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Add user message to thread
    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Trigger API call (or mock query)
    handleSendMessageToAI(trimmed);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 pointer-events-auto"
          />

          {/* Chat Side Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-[450px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-50 text-white"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[16px] flex items-center gap-1.5">
                    AI Citizen Bot
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Online" />
                  </h3>
                  <p className="text-[11px] text-slate-400">Powered by Aavedan-Setu AI Core</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60 custom-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[18px] px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-violet-600 text-white rounded-br-none"
                        : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/50"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="block text-[9px] text-slate-400 text-right mt-1 font-mono">
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700/50 rounded-[18px] rounded-bl-none px-4 py-3 flex items-center gap-1 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Footer Suggestions & Input */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-3">
              {/* Suggestion Prompts */}
              {messages.length === 1 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={12} className="text-violet-400" />
                    Suggested queries
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(sug)}
                        className="text-left w-full text-[12px] bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-all truncate"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputText);
                }}
                className="flex items-center gap-2 mt-1"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder:text-slate-500 outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </form>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <CheckCircle2 size={11} className="text-emerald-500/80" />
                AI API placeholder is set up and ready to connect.
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
