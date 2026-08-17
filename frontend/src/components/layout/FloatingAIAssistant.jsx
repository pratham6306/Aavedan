// frontend/src/components/layout/FloatingAIAssistant.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles, SendHorizontal, Mail, Mic, MicOff, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import aiService from '../../services/aiService';
import { useSpeechToText } from '../../hooks/useSpeechToText';

export default function FloatingAIAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'init',
      sender: 'bot',
      text: "👋 Namaste! I am Aavedan Saathi, your e-Governance Assistant. How can I help you today? You can describe a public complaint (e.g., 'There is a pothole near the post office') or ask about schemes.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sessionId, setSessionId] = useState('');
  
  // Modal states for grievance dispatch preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [smtpError, setSmtpError] = useState(null);
  const [preloadedEntities, setPreloadedEntities] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const chatEndRef = useRef(null);

  // Voice Command & Navigation Handler
  const handleVoiceCommand = useCallback((text) => {
    if (!text) return;
    const lower = text.toLowerCase();
    if (lower.includes('show schemes') || lower.includes('schemes') || lower.includes('yojana')) {
      navigate('/schemes');
      toast.info('Navigating to Schemes...');
    } else if (lower.includes('file complaint') || lower.includes('create complaint') || lower.includes('shikayat')) {
      navigate('/complaints/create');
      toast.info('Navigating to Create Complaint...');
    } else if (lower.includes('my complaints') || lower.includes('track complaint')) {
      navigate('/my-complaints');
      toast.info('Navigating to My Complaints...');
    } else if (lower.includes('dashboard')) {
      navigate('/dashboard');
      toast.info('Navigating to Dashboard...');
    } else if (lower.includes('profile')) {
      navigate('/profile');
      toast.info('Navigating to Profile...');
    }
  }, [navigate]);

  const getSpeechLanguage = () => {
    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/i);
    const code = match ? match[1] : (localStorage.getItem('preferred_lang') || 'en');
    if (code === 'hi') return 'hi-IN';
    if (code === 'or') return 'or-IN';
    if (code === 'bn') return 'bn-IN';
    if (code === 'te') return 'te-IN';
    if (code === 'ta') return 'ta-IN';
    if (code === 'mr') return 'mr-IN';
    if (code === 'gu') return 'gu-IN';
    if (code === 'pa') return 'pa-IN';
    if (code === 'kn') return 'kn-IN';
    if (code === 'ml') return 'ml-IN';
    if (code === 'ur') return 'ur-IN';
    return 'en-IN';
  };

  const { isListening, startListening, stopListening, isSupported } = useSpeechToText({
    lang: getSpeechLanguage(),
    onResult: (text) => {
      setInputText(text);
      handleVoiceCommand(text);
    }
  });

  const toggleMic = () => {
    if (!isSupported) {
      toast.warning('Web Speech API is not supported in your browser.');
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
      toast.info('Listening... Speak now!');
    }
  };

  const resetChatSession = useCallback((showToast = true) => {
    const newId = crypto.randomUUID();
    sessionStorage.setItem('ai_assistant_session_id', newId);
    setSessionId(newId);
    setPreloadedEntities(null);
    setMessages([
      {
        id: 'init',
        sender: 'bot',
        text: "👋 Namaste! I am Aavedan Saathi, your e-Governance Assistant. How can I help you today? You can describe a public complaint (e.g., 'There is a pothole near the post office') or ask about schemes.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    if (showToast) {
      toast.info("Started a fresh AI conversation session.");
    }
  }, []);

  // Initialize unique session ID
  useEffect(() => {
    let id = sessionStorage.getItem('ai_assistant_session_id');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('ai_assistant_session_id', id);
    }
    setSessionId(id);
  }, []);

  // Auto scroll to bottom of chat thread
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const suggestions = [
    "I want to report a broken street light",
    "How to raise a garbage collection issue",
    "Where is the nearest PWD office?",
    "Show me welfare schemes"
  ];

  const handleSendMessage = useCallback(async (textToSend, entitiesOverride = null) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Add user message to state
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const payloadEntities = entitiesOverride || preloadedEntities;
      const response = await aiService.sendChatMessage(trimmed, sessionId, payloadEntities);
      
      if (payloadEntities) {
        setPreloadedEntities(null);
      }
      
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.message || response.reply,
        next_action: response.next_action,
        recommendations: response.recommendations,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Failed to get AI response:', err);
      const isUnauthorized = err?.response?.status === 401;
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: isUnauthorized
          ? "🔒 You are currently not logged in (or your session expired). Please log in to your account to use Aavedan Saathi AI Assistant and auto-fill form details!"
          : "I'm sorry, I'm having trouble connecting to the service. Please check your connection and try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, preloadedEntities]);

  // Event listener to open assistant with custom complaint details
  useEffect(() => {
    const handleOpenWithData = (event) => {
      const data = event.detail;
      if (!data) return;

      // Clear existing messages to start a clean contextual thread
      setMessages([]);
      setIsOpen(true);
      setPreloadedEntities(data);

      const prompt = `Please help me file an official grievance email for this complaint:
Category: ${data.category || ''}
Description: ${data.description || ''}
Address: ${data.address || ''}
State: ${data.state || ''}
District: ${data.district || ''}
Landmark: ${data.landmark || ''}`;

      handleSendMessage(prompt, data);
    };

    window.addEventListener('open_ai_assistant_with_data', handleOpenWithData);
    return () => {
      window.removeEventListener('open_ai_assistant_with_data', handleOpenWithData);
    };
  }, [sessionId, handleSendMessage]);

  const handleGoToManualForm = async () => {
    setLoadingPreview(true);
    try {
      const data = await aiService.getEmailPreview(sessionId);

      const getVal = (marker) => {
        if (!data.body_text || !data.body_text.includes(marker)) return "";
        return data.body_text.split(marker)[1].split("\n")[0].trim();
      };

      const handoffData = {
        title: `AI Grievance: ${data.subject ? data.subject.replace("[Grievance Registration] ", "").split(" - ")[0] : ""}`,
        description: data.draft_description || data.generated_description || data.original_description || getVal("• Description: "),
        category: data.category || getVal("• Category: "),
        department: data.department || getVal("• Department: "),
        state: data.state || preloadedEntities?.state || getVal("• State: ") || "",
        district: data.district || preloadedEntities?.district || getVal("• District: ") || "",
        address: data.address || preloadedEntities?.address || getVal("• Specific Address: ") || "",
        landmark: data.landmark || preloadedEntities?.landmark || getVal("• Nearby Landmark: ") || ""
      };
      
      setIsOpen(false);
      navigate('/complaints/create', { state: handoffData });
      toast.info("Pre-filled complaint details from AI! You can now upload images.");
      resetChatSession(false);
    } catch (err) {
      console.error("Failed to load prefill details:", err);
      setIsOpen(false);
      navigate('/complaints/create');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleOpenPreview = async (isAnon) => {
    const anonVal = typeof isAnon === 'boolean' ? isAnon : isAnonymous;
    setLoadingPreview(true);
    setSmtpError(null);
    try {
      const response = await aiService.getEmailPreview(sessionId, anonVal);
      setPreviewData(response);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Failed to generate email preview:", err);
      const errMsg = err?.response?.data?.message || "Failed to generate preview. Please verify location details are resolved.";
      toast.error(errMsg);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDispatchEmail = async () => {
    setIsSendingEmail(true);
    setSmtpError(null);
    try {
      const response = await aiService.sendGrievanceEmail(sessionId, isAnonymous);
      
      toast.success(response.message || "Grievance email sent successfully!");
      setIsPreviewOpen(false);
      resetChatSession(false);

      const botSuccessMsg = {
        id: Date.now().toString(),
        sender: 'bot',
        text: `📧 ${response.message || "Your complaint details have been dispatched to the designated officer successfully. A copy has been CC'd to your registered email inbox."}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botSuccessMsg]);

      // Regenerate session ID for next conversation since backend clears it
      const nextId = crypto.randomUUID();
      sessionStorage.setItem('ai_assistant_session_id', nextId);
      setSessionId(nextId);

    } catch (err) {
      console.error("Failed to send grievance email:", err);
      const responseData = err?.response?.data;
      
      // Check if SMTP is specifically refused so we can display it clearly in the Modal
      if (responseData?.error_type === "SMTP_CONNECTION_REFUSED") {
        setSmtpError(responseData.message);
      } else {
        const errMsg = responseData?.message || "Failed to send the email. Please try again.";
        toast.error(errMsg);
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="w-[380px] sm:w-[420px] h-[550px] bg-gradient-to-b from-[#FDF2F8] via-[#FCE7F3] to-[#EEF2FF] border border-[#F472B6]/40 shadow-[0_20px_60px_rgba(236,72,153,0.18)] rounded-3xl overflow-hidden flex flex-col mb-4 text-[#4C0519]"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#FBCFE8] flex justify-between items-center bg-[#FDF2F8]/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F43F5E] via-[#EC4899] to-[#D946EF] flex items-center justify-center shadow-md shadow-pink-500/25">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#4C0519] flex items-center gap-1.5">
                    Aavedan Saathi
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Online" />
                  </h3>
                  <p className="text-[11px] font-semibold text-[#9F1239]">Official e-Governance Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => resetChatSession(true)}
                  className="px-2.5 py-1 rounded-xl bg-[#FCE7F3] hover:bg-[#FBCFE8] text-[#9F1239] text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                  title="Start a fresh AI conversation session"
                >
                  <RotateCcw size={13} />
                  <span>New Chat</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#FCE7F3] text-[#4C0519] transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#FCE7F3]/40 to-[#EEF2FF]/60 custom-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col max-w-[85%] gap-1">
                    <div
                      className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-[#EC4899] to-[#D946EF] text-white rounded-tr-none shadow-md shadow-pink-500/20'
                          : 'bg-white/95 text-[#4C0519] rounded-tl-none border border-[#FBCFE8] shadow-[0_2px_12px_rgba(236,72,153,0.06)]'
                      }`}
                    >
                      <p>{msg.text}</p>
                      
                      {/* Render Scheme Recommendations as Cards */}
                      {msg.sender === 'bot' && msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-3 space-y-2.5 text-left">
                          {msg.recommendations.map((rec, rIdx) => (
                            <div key={rIdx} className="bg-[#FCE7F3]/60 border border-[#F472B6]/40 p-3 rounded-xl shadow-xs text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-[12px] text-[#BE185D]">{rec.scheme_name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  rec.is_eligible ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-800 border border-rose-500/30'
                                }`}>
                                  {rec.is_eligible ? 'Eligible' : 'Not Eligible'}
                                </span>
                              </div>
                              <p className="text-[#831843] leading-relaxed mt-1 mb-2 text-[11px]">{rec.matching_reason}</p>
                              
                              {rec.is_eligible ? (
                                <>
                                  {rec.required_documents && rec.required_documents.length > 0 && (
                                    <div className="mb-2">
                                      <span className="font-bold text-[#9F1239] block text-[10px] mb-0.5">📎 Required Documents:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {rec.required_documents.map((doc, dIdx) => (
                                          <span key={dIdx} className="bg-white text-[9px] text-[#831843] px-1.5 py-0.5 rounded border border-[#F472B6]/40">
                                            {doc}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="bg-white/80 p-2 rounded-lg border border-[#F472B6]/30 text-[10px] max-h-40 overflow-y-auto custom-scrollbar">
                                    <span className="font-bold text-[#EC4899] block mb-1">📝 How to Fill / Apply:</span>
                                    <p className="text-[#831843] whitespace-pre-line leading-normal">{rec.filling_instructions}</p>
                                  </div>
                                </>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOpen(false);
                                  navigate(`/schemes/${rec.scheme_id}`);
                                }}
                                className="mt-2.5 w-full bg-gradient-to-r from-[#EC4899] to-[#D946EF] hover:from-[#DB2777] hover:to-[#C084FC] text-white font-bold py-1.5 px-3 rounded-lg text-center transition flex justify-center items-center gap-1 text-[11px]"
                              >
                                Go to Scheme Page
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <span className={`block text-[9px] text-right mt-1 font-medium ${msg.sender === 'user' ? 'text-white/80' : 'text-[#BE185D]'}`}>
                        {msg.time}
                      </span>
                    </div>

                    {/* Render preview button trigger */}
                    {msg.sender === 'bot' && msg.next_action === 'CONFIRM_AND_FILE' && (
                      <div className="flex flex-col gap-2 mt-2">
                        <button
                          onClick={handleOpenPreview}
                          disabled={loadingPreview}
                          className="btn w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#EC4899] to-[#D946EF] hover:scale-[1.01] text-white text-xs py-2 rounded-xl font-bold shadow-md transition disabled:opacity-50"
                        >
                          {loadingPreview ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Generating Dispatch Preview...
                            </>
                          ) : (
                            <>
                              <Mail size={14} />
                              Option 1: Preview & Dispatch Email
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleGoToManualForm}
                          disabled={loadingPreview}
                          className="btn w-full flex items-center justify-center gap-2 bg-white hover:bg-[#FCE7F3] text-[#4C0519] text-xs py-2 rounded-xl font-bold border border-[#F472B6] shadow-md transition disabled:opacity-50"
                        >
                          <Sparkles size={14} className="text-[#EC4899]" />
                          Option 2: Handoff to Form & Upload Images
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/95 border border-[#FBCFE8] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions & Input */}
            <div className="p-3.5 border-t border-[#FBCFE8] bg-[#FCE7F3]/30 flex flex-col gap-3">
              {messages.length === 1 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] text-[#EC4899] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#EC4899]" />
                    SUGGESTED QUERIES
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(sug)}
                        className="text-left text-xs bg-white/90 hover:bg-white border border-[#F472B6]/50 hover:border-[#EC4899] text-[#831843] font-semibold px-3.5 py-1.5 rounded-full shadow-2xs transition-all truncate max-w-full"
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
                  handleSendMessage(inputText);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isListening ? "Listening... Speak now!" : "Ask a question..."}
                    className={`w-full bg-white border ${
                      isListening ? 'border-[#EC4899] shadow-md shadow-pink-500/20' : 'border-[#F472B6]/50 focus:border-[#EC4899]'
                    } rounded-full px-4 py-2.5 pr-10 text-xs text-[#4C0519] placeholder:text-[#DB2777]/70 outline-none shadow-2xs transition`}
                  />
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`absolute right-2 p-1.5 rounded-full transition ${
                      isListening ? 'bg-red-500 text-white animate-pulse' : 'text-[#BE185D] hover:text-[#EC4899] hover:bg-[#FCE7F3]'
                    }`}
                    title={isListening ? 'Stop Listening' : 'Voice Dictation / Speech-to-Text'}
                  >
                    {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-[#EC4899] to-[#D946EF] hover:from-[#DB2777] hover:to-[#C084FC] text-white flex items-center justify-center shadow-md shadow-pink-500/30 shrink-0 transition-transform hover:scale-105 disabled:opacity-50"
                >
                  <SendHorizontal size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dispatch Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && previewData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-slate-850"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-gov-700 font-bold text-sm">
                  <Mail size={18} className="text-gov-600 animate-pulse" />
                  <span>Official Grievance Email Dispatch Preview</span>
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
                {previewData.is_valid_for_dispatch === false && (
                  <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl text-rose-950 mb-4">
                    <p className="font-bold flex items-center gap-1.5 text-xs sm:text-sm mb-1.5">
                      ⚠️ Incomplete Location Details
                    </p>
                    <p className="text-xs leading-relaxed">
                      This grievance cannot be dispatched directly because the **State** or **District** is not resolved. 
                      You can close this modal and tell Aavedan Saathi your location details, or click the **"Cancel"** button and pick Option 2 to fill them manually on the form.
                    </p>
                  </div>
                )}

                {previewData.duplicate_found && previewData.duplicates && previewData.duplicates.length > 0 && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-950 mb-4">
                    <p className="font-bold flex items-center gap-1.5 text-xs sm:text-sm mb-1.5">
                      ⚠️ Alert: Similar Grievances Found Nearby
                    </p>
                    <p className="text-xs leading-relaxed mb-3">
                      Other citizens have already filed similar reports in this area. You can view and support/upvote their complaints instead of sending a duplicate email:
                    </p>
                    <div className="flex flex-col gap-2">
                      {previewData.duplicates.map((dup) => (
                        <div key={dup.id} className="bg-white border border-amber-200 rounded-lg p-2.5 flex items-center justify-between shadow-3xs">
                          <div className="text-xs">
                            <span className="font-bold text-amber-800 text-[10px]">{dup.reference_number || `#GOV-${dup.id}`}</span>
                            <div className="font-semibold text-slate-800 truncate max-w-[280px]">{dup.title}</div>
                          </div>
                          <a
                            href={`/complaints/${dup.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] py-1 px-2.5 rounded font-bold shadow-xs transition decoration-none"
                          >
                            View & Support
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {smtpError && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-900">
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                      ⚠️ Note: Automated SMTP Configuration Needed
                    </p>
                    <p className="text-xs leading-relaxed">{smtpError}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* From */}
                  <div className="grid grid-cols-4 items-center">
                    <span className="font-semibold text-slate-500 col-span-1">From (CC):</span>
                    <span className="col-span-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-mono text-xs text-slate-700">
                      {previewData.sender_email}
                    </span>
                  </div>

                  {/* To */}
                  <div className="grid grid-cols-4 items-center">
                    <span className="font-semibold text-slate-500 col-span-1">To (Officer):</span>
                    <span className="col-span-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-mono text-xs text-slate-700 flex flex-col">
                      <span className="font-bold text-slate-900">{previewData.office_name}</span>
                      <span className="text-slate-500">{previewData.receiver_email}</span>
                    </span>
                  </div>

                  {/* Subject */}
                  <div className="grid grid-cols-4 items-center">
                    <span className="font-semibold text-slate-500 col-span-1">Subject:</span>
                    <span className="col-span-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-semibold text-xs text-slate-800">
                      {previewData.subject}
                    </span>
                  </div>

                  {/* Attachments */}
                  {previewData.attachments && previewData.attachments.length > 0 && (
                    <div className="grid grid-cols-4 items-start">
                      <span className="font-semibold text-slate-500 col-span-1 mt-1">Attachments:</span>
                      <div className="col-span-3 flex flex-wrap gap-1.5">
                        {previewData.attachments.map((name, index) => (
                          <span key={index} className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg text-xs font-mono">
                            📎 {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anonymous Toggle Checkbox */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 p-3 sm:p-4 rounded-xl mt-2">
                    <input
                      type="checkbox"
                      id="anon-dispatch-toggle"
                      checked={isAnonymous}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsAnonymous(checked);
                        handleOpenPreview(checked);
                      }}
                      className="w-4 h-4 text-gov-600 border-slate-350 rounded focus:ring-gov-500 cursor-pointer"
                    />
                    <label htmlFor="anon-dispatch-toggle" className="text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer select-none">
                      🔒 File Anonymously (Hide my name and email from authorities)
                    </label>
                  </div>

                  {/* Content Preview */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-slate-500">Email Plain-text Body:</span>
                    <textarea
                      readOnly
                      value={previewData.body_text}
                      className="w-full h-60 p-3 bg-slate-50 border border-slate-150 rounded-xl font-mono text-[11px] leading-relaxed resize-none outline-none text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(previewData.body_text);
                      toast.success("Grievance email content copied to clipboard!");
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs py-2 px-4 rounded-xl font-semibold transition"
                  >
                    📋 Copy Email Body
                  </button>
                  
                  {previewData.portal_url && (
                    <a
                      href={previewData.portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs py-2 px-4 rounded-xl font-semibold border border-sky-200 flex items-center gap-1 transition decoration-none"
                    >
                      🌐 Official Portal Link
                    </a>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="bg-white border border-slate-350 hover:bg-slate-100 text-slate-600 text-xs py-2 px-4 rounded-xl font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDispatchEmail}
                    disabled={isSendingEmail || previewData.is_valid_for_dispatch === false}
                    className="bg-gradient-to-r from-gov-600 to-amber-600 text-white text-xs py-2 px-5 rounded-xl font-bold flex items-center gap-1.5 hover:scale-[1.01] transition disabled:opacity-50"
                  >
                    {isSendingEmail ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Send Official Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F43F5E] via-[#EC4899] to-[#D946EF] hover:from-[#E11D48] hover:to-[#C084FC] text-white flex items-center justify-center shadow-lg shadow-pink-500/35 border border-white/20 hover:shadow-xl transition-all cursor-pointer"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
}
