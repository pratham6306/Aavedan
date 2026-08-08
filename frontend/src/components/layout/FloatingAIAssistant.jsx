// frontend/src/components/layout/FloatingAIAssistant.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles, SendHorizontal, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import aiService from '../../services/aiService';

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

  const chatEndRef = useRef(null);

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
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "I'm sorry, I'm having trouble connecting to the service. Please try again.",
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
      const handoffData = {
        title: `AI Grievance: ${data.subject ? data.subject.replace("[Grievance Registration] ", "").split(" - ")[0] : ""}`,
        description: data.body_text,
        category: data.body_text && data.body_text.includes("• Category: ") ? data.body_text.split("• Category: ")[1].split("\n")[0].trim() : "",
        department: data.body_text && data.body_text.includes("• Department: ") ? data.body_text.split("• Department: ")[1].split("\n")[0].trim() : "",
        state: data.body_text && data.body_text.includes("• State: ") ? data.body_text.split("• State: ")[1].split("\n")[0].trim() : "",
        district: data.body_text && data.body_text.includes("• District: ") ? data.body_text.split("• District: ")[1].split("\n")[0].trim() : "",
        address: data.body_text && data.body_text.includes("• Specific Address: ") ? data.body_text.split("• Specific Address: ")[1].split("\n")[0].trim() : "",
        landmark: data.body_text && data.body_text.includes("• Nearby Landmark: ") ? data.body_text.split("• Nearby Landmark: ")[1].split("\n")[0].trim() : ""
      };
      
      setIsOpen(false);
      navigate('/complaints/create', { state: handoffData });
      toast.info("Pre-filled complaint details from AI! You can now upload images.");
    } catch (err) {
      console.error("Failed to load prefill details:", err);
      setIsOpen(false);
      navigate('/complaints/create');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleOpenPreview = async () => {
    setLoadingPreview(true);
    setSmtpError(null);
    try {
      const response = await aiService.getEmailPreview(sessionId);
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
      const response = await aiService.sendGrievanceEmail(sessionId);
      
      toast.success(response.message || "Grievance email sent successfully!");
      setIsPreviewOpen(false);

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
            className="w-[380px] sm:w-[420px] h-[550px] bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col mb-4 text-white"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gov-600 to-amber-600 flex items-center justify-center shadow-lg">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    Aavedan Saathi
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
                  </h3>
                  <p className="text-[10px] text-slate-400">Official e-Governance Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60 custom-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col max-w-[85%] gap-1">
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'bg-gov-600 text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/50'
                      }`}
                    >
                      <p>{msg.text}</p>
                      
                      {/* Render Scheme Recommendations as Cards */}
                      {msg.sender === 'bot' && msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-3 space-y-2.5 text-left">
                          {msg.recommendations.map((rec, rIdx) => (
                            <div key={rIdx} className="bg-slate-900 border border-slate-700/60 p-3 rounded-xl shadow-sm text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-[12px] text-gov-400">{rec.scheme_name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  rec.is_eligible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {rec.is_eligible ? 'Eligible' : 'Not Eligible'}
                                </span>
                              </div>
                              <p className="text-slate-300 leading-relaxed mt-1 mb-2 text-[11px]">{rec.matching_reason}</p>
                              
                              {rec.is_eligible ? (
                                <>
                                  {rec.required_documents && rec.required_documents.length > 0 && (
                                    <div className="mb-2">
                                      <span className="font-bold text-slate-400 block text-[10px] mb-0.5">📎 Required Documents:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {rec.required_documents.map((doc, dIdx) => (
                                          <span key={dIdx} className="bg-slate-850 text-[9px] text-slate-300 px-1.5 py-0.5 rounded border border-slate-750">
                                            {doc}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] max-h-40 overflow-y-auto custom-scrollbar">
                                    <span className="font-bold text-amber-500 block mb-1">📝 How to Fill / Apply:</span>
                                    <p className="text-slate-400 whitespace-pre-line leading-normal">{rec.filling_instructions}</p>
                                  </div>
                                </>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOpen(false);
                                  navigate(`/schemes/${rec.scheme_id}`);
                                }}
                                className="mt-2.5 w-full bg-gov-600 hover:bg-gov-500 text-white font-bold py-1.5 px-3 rounded-lg text-center transition flex justify-center items-center gap-1 text-[11px]"
                              >
                                Go to Scheme Page
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <span className="block text-[8px] text-slate-400 text-right mt-1 font-mono">
                        {msg.time}
                      </span>
                    </div>

                    {/* Render preview button trigger */}
                    {msg.sender === 'bot' && msg.next_action === 'CONFIRM_AND_FILE' && (
                      <div className="flex flex-col gap-2 mt-2">
                        <button
                          onClick={handleOpenPreview}
                          disabled={loadingPreview}
                          className="btn w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gov-600 to-amber-600 hover:scale-[1.01] text-white text-xs py-2 rounded-xl font-bold shadow-md transition disabled:opacity-50"
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
                          className="btn w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-white text-xs py-2 rounded-xl font-bold border border-slate-700 shadow-md transition disabled:opacity-50"
                        >
                          <Sparkles size={14} className="text-amber-400" />
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
                  <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-gov-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gov-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gov-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions & Input */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex flex-col gap-3">
              {messages.length === 1 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-400" />
                    Suggested queries
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(sug)}
                        className="text-left text-[11px] bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg transition truncate max-w-full"
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
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-gov-500 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-8 h-8 rounded-xl bg-gov-600 hover:bg-gov-500 text-white flex items-center justify-center transition disabled:opacity-50"
                >
                  <SendHorizontal size={14} />
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
                    disabled={isSendingEmail}
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-gov-600 to-amber-600 hover:from-gov-500 hover:to-amber-500 text-white flex items-center justify-center shadow-lg shadow-gov-600/30 border border-white/10 hover:shadow-xl transition-all"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
}
