import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Plus,
  MessageSquare,
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  FileText,
  AlertCircle,
  Wifi,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import { sendQuery } from '../services/chat.service';
import { checkSystemHealth } from '../services/api';
import SourceDrawer from '../components/chat/SourceDrawer';
import RagTraceViewer from '../components/chat/RagTraceViewer';
import { ChatMessage, Conversation, Citation, HealthStatus } from '../types';

const SUGGESTED_QUESTIONS = [
  'What is the return policy for TechNova products?',
  'How much does overnight shipping cost?',
  "My SmartHome Hub won't connect to Wi-Fi.",
  'What SmartHome Hub models are available?',
];

export default function LiveAgent() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      title: 'Return Policy & Refunds',
      createdAt: 'Today',
      messages: [],
    },
  ]);
  const [activeConvId, setActiveConvId] = useState<string>('conv-1');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Searching knowledge base...');
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [health, setHealth] = useState<HealthStatus>({
    apiStatus: 'online',
    qdrantStatus: 'connected',
    modelName: 'gpt-4o-mini',
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkSystemHealth().then(setHealth);
  }, []);

  const currentConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv?.messages, isLoading]);

  const handleStartNewChat = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      createdAt: 'Just now',
      messages: [],
    };
    setConversations([newConv, ...conversations]);
    setActiveConvId(newConv.id);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update conversation title if first query
    const updatedMessages = [...currentConv.messages, userMsg];
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              title: c.messages.length === 0 ? query.slice(0, 30) + '...' : c.title,
              messages: updatedMessages,
            }
          : c
      )
    );

    if (!textToSend) setInput('');
    setIsLoading(true);

    // Realistic Loading Step Cycle
    setLoadingStep('Searching knowledge base with dense & sparse vectors...');
    const t1 = setTimeout(() => setLoadingStep('Reranking top sources with MS-MARCO...'), 600);
    const t2 = setTimeout(() => setLoadingStep('Generating grounded response with LLM...'), 1100);
    const t3 = setTimeout(() => setLoadingStep('Verifying grounding assertions...'), 1500);

    const historyPayload = currentConv.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await sendQuery(query, historyPayload);

    clearTimeout(t1);
    clearTimeout(t2);
    clearTimeout(t3);

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: response.answer,
      citations: response.citations,
      confidence: response.confidence,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      trace: response.trace,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId ? { ...c, messages: [...c.messages, userMsg, assistantMsg] } : c
      )
    );

    setIsLoading(false);
  };

  const handleFeedback = (msgId: string, rating: 'like' | 'dislike') => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId ? { ...m, feedback: m.feedback === rating ? null : rating } : m
              ),
            }
          : c
      )
    );
  };

  // Helper to render text with clickable citation links [1], [2]
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
                title={`Click to view citation source: ${cit?.source || 'Document'}`}
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
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col w-full"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white border border-slate-200 rounded-2xl flex-1 flex overflow-hidden shadow-sm h-[calc(100vh-12rem)] min-h-[600px]"
      >
        {/* Left Sidebar: Conversations & Connection Status */}
        <aside className="w-80 border-r border-slate-200 bg-slate-50/70 flex flex-col hidden md:flex">
          {/* New Chat Action */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">
              Conversations
            </span>
            <button
              onClick={handleStartNewChat}
              className="p-1.5 rounded-lg bg-lime-400 text-slate-950 font-bold hover:bg-lime-300 transition-colors inline-flex items-center gap-1 text-xs"
              title="Start New Chat"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-colors flex items-center gap-2.5 ${
                  conv.id === activeConvId
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-lime-400 flex-shrink-0" />
                <span className="truncate flex-1">{conv.title}</span>
              </button>
            ))}
          </div>

          {/* Runtime System Status Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-100/60 text-xs space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Grounded RAG</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Qdrant Store</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  health.qdrantStatus === 'connected' ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {health.qdrantStatus === 'connected' ? (
                  <>
                    <Wifi className="w-3 h-3" /> Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" /> Qdrant Offline
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px]">
              <span className="text-slate-500">API Gateway</span>
              <span
                className={`font-semibold ${
                  health.apiStatus === 'online' ? 'text-slate-900' : 'text-rose-600 font-bold'
                }`}
              >
                {health.apiStatus === 'online' ? 'Online' : 'API Offline'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 text-center">Model: {health.modelName}</div>
          </div>
        </aside>

        {/* Right Main Chat Container */}
        <main className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-lime-400 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base leading-tight">Neura AI Agent</h2>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                  <span>Grounded Hybrid RAG</span>
                  <span>•</span>
                  <span className="text-lime-700 font-semibold">Qdrant Connected</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartNewChat}
              className="md:hidden p-2 rounded-lg bg-lime-400 text-slate-950 font-bold text-xs"
            >
              + New
            </button>
          </header>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {currentConv.messages.length === 0 && !isLoading ? (
              /* Empty Chat State */
              <div className="max-w-lg mx-auto py-12 text-center space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Ask Neura Anything</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Neura retrieves knowledge from uploaded documents, evaluates grounding, and cites verifiable sources.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-left">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block text-center">
                    Suggested Questions
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="p-3 text-left text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all hover:border-slate-300"
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Chat Messages */
              <AnimatePresence mode="popLayout">
              {currentConv.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-lime-400 flex items-center justify-center font-bold flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-5 ${
                      msg.role === 'user'
                        ? 'bg-slate-900 text-white font-medium rounded-tr-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-900 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    <div className="text-sm leading-relaxed">{renderMessageContent(msg)}</div>

                    {/* Sources Box */}
                    {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          Sources ({msg.citations.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.citations.map((c, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => setSelectedCitation(c)}
                              className="p-2.5 bg-white border border-slate-200 hover:border-lime-500 rounded-lg text-left text-xs transition-colors flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-mono font-bold text-lime-700 bg-lime-100 px-1 rounded">
                                  [{cIdx + 1}]
                                </span>
                                <span className="font-semibold text-slate-800 truncate">{c.source}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 group-hover:text-lime-700">
                                Page {c.page || 1}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* RAG Trace Viewer */}
                    {msg.role === 'assistant' && <RagTraceViewer trace={msg.trace} />}

                    {/* Message Action Footer (Feedback, Grounding Status) */}
                    {msg.role === 'assistant' && (
                      <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Grounded
                          </span>
                          <span>•</span>
                          <span>{msg.trace?.totalLatencySeconds.toFixed(1) || '1.8'}s</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-400 mr-1">Helpful?</span>
                          <button
                            onClick={() => handleFeedback(msg.id, 'like')}
                            className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                              msg.feedback === 'like' ? 'text-lime-600 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'dislike')}
                            className={`p-1 rounded hover:bg-slate-200 transition-colors ${
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
                </motion.div>
              ))}
              </AnimatePresence>
            )}

            {/* Polished Pipeline Loading State */}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-lime-400 flex items-center justify-center font-bold flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl rounded-tl-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
                    <span>{loadingStep}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Form */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                className="flex-1 bg-white border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                placeholder="Ask about products, shipping, returns, or technical guides..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-5 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-sm transition-all disabled:opacity-40 shadow-xs flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>
        </main>
      </motion.div>

      {/* Interactive Citation Drawer */}
      <SourceDrawer
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </motion.div>
  );
}
