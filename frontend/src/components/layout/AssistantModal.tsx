import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  X,
  Sparkles,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { sendQuery } from '../../services/chat.service';
import SourceDrawer from '../chat/SourceDrawer';
import RagTraceViewer from '../chat/RagTraceViewer';
import { ChatMessage, Citation } from '../../types';

const SUGGESTED_QUESTIONS = [
  'What is the return policy for TechNova products?',
  'How much does overnight shipping cost?',
  "My SmartHome Hub won't connect to Wi-Fi.",
  'What SmartHome Hub models are available?',
];

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssistantModal({ isOpen, onClose }: AssistantModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Searching knowledge base...');
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setIsLoading(true);

    setLoadingStep('Searching knowledge base with dense & sparse vectors...');
    const t1 = setTimeout(() => setLoadingStep('Reranking top sources with MS-MARCO...'), 600);
    const t2 = setTimeout(() => setLoadingStep('Generating grounded response with LLM...'), 1100);

    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await sendQuery(query, historyPayload);

    clearTimeout(t1);
    clearTimeout(t2);

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: response.answer,
      citations: response.citations,
      confidence: response.confidence,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      trace: response.trace,
    };

    setMessages([...updatedMessages, assistantMsg]);
    setIsLoading(false);
  };

  const handleFeedback = (msgId: string, rating: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, feedback: m.feedback === rating ? null : rating } : m
      )
    );
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.role === 'user' || !msg.citations || msg.citations.length === 0) {
      return <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>;
    }

    const parts = msg.content.split(/(\[\d+\])/g);
    return (
      <p className="leading-relaxed whitespace-pre-wrap">
        {parts.map((part, idx) => {
          const match = part.match(/^\[(\d+)\]$/);
          if (match) {
            const citIndex = parseInt(match[1], 10) - 1;
            const cit = msg.citations?.[citIndex];
            return (
              <button
                key={idx}
                onClick={() => cit && setSelectedCitation(cit)}
                className="inline-flex items-center justify-center font-mono font-bold text-xs text-lime-700 bg-lime-100 hover:bg-lime-200 border border-lime-300 rounded px-1.5 py-0.2 mx-0.5 transition-colors cursor-pointer"
                title={`View citation source: ${cit?.source || 'Document'}`}
              >
                [{match[1]}]
              </button>
            );
          }
          return part;
        })}
      </p>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop overlay with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 25 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-3xl h-[85vh] max-h-[720px] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-lime-400 flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-base leading-tight flex items-center gap-2">
                  Neura Assistant
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Live
                  </span>
                </h2>
                <span className="text-[11px] font-mono text-slate-500 block">
                  Interactive Grounded RAG Chat
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
              title="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body Container */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
            {messages.length === 0 && !isLoading ? (
              /* Empty State */
              <div className="max-w-md mx-auto py-8 text-center space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-slate-900">How can Neura help today?</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ask any question about products, shipping, returns, or technical setup.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-left">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                    Quick Prompts
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="p-3 text-left text-xs font-medium text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 hover:border-lime-500 rounded-xl transition-all shadow-2xs"
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Messages */
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-lime-400 flex items-center justify-center font-bold flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm ${
                      msg.role === 'user'
                        ? 'bg-slate-900 text-white font-medium rounded-tr-xs'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    <div className="leading-relaxed">{renderMessageContent(msg)}</div>

                    {/* Sources Box */}
                    {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Verified Sources ({msg.citations.length})
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {msg.citations.map((c, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => setSelectedCitation(c)}
                              className="p-2 bg-slate-50 hover:bg-lime-50 border border-slate-200 hover:border-lime-400 rounded-lg text-left text-xs transition-colors flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-mono font-bold text-lime-700 bg-lime-100 px-1 rounded text-[10px]">
                                  [{cIdx + 1}]
                                </span>
                                <span className="font-semibold text-slate-800 truncate text-xs">{c.source}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 group-hover:text-lime-700">
                                Page {c.page || 1}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* RAG Trace Viewer */}
                    {msg.role === 'assistant' && <RagTraceViewer trace={msg.trace} />}

                    {/* Feedback */}
                    {msg.role === 'assistant' && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="text-emerald-700 font-semibold font-mono">Grounded Answer</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleFeedback(msg.id, 'like')}
                            className={`p-1 rounded hover:bg-slate-100 ${
                              msg.feedback === 'like' ? 'text-lime-600 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'dislike')}
                            className={`p-1 rounded hover:bg-slate-100 ${
                              msg.feedback === 'dislike' ? 'text-rose-600 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-lime-400 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-lime-400 flex items-center justify-center font-bold flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-xs">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
                    <span>{loadingStep}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer / Input Form */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                className="flex-1 bg-slate-50 border border-slate-300 focus:border-slate-900 focus:bg-white rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                placeholder="Ask about products, shipping, returns, or technical setup..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-5 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs sm:text-sm transition-all disabled:opacity-40 shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>
        </motion.div>

        {/* Source Drawer for Citations inside Modal */}
        <SourceDrawer
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
        />
      </div>
    </AnimatePresence>
  );
}
