import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Architecture from './pages/Architecture';
import KnowledgeBase from './pages/KnowledgeBase';
import Evaluation from './pages/Evaluation';
import LiveAgent from './pages/LiveAgent';
import AssistantModal from './components/layout/AssistantModal';

import CustomAgentModal from './components/layout/CustomAgentModal';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-lime-300 selection:text-slate-900">
        <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} />
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={<Home onOpenCustomRequest={() => setIsCustomModalOpen(true)} />}
            />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/evaluation" element={<Evaluation />} />
            <Route path="/agent" element={<LiveAgent />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />

        {/* Global Pop-up Assistant Modal */}
        <AssistantModal
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
        />

        {/* Custom AI Agent Request Modal */}
        <CustomAgentModal
          isOpen={isCustomModalOpen}
          onClose={() => setIsCustomModalOpen(false)}
        />
      </div>
    </BrowserRouter>
  );
}
