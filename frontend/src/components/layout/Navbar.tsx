import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Eye, ExternalLink, Bot, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 border-b ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-slate-200 shadow-sm py-3'
          : 'bg-white border-slate-100 py-4'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-10 flex items-center justify-between">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-lime-400 font-bold transition-transform group-hover:scale-105 shadow-xs">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight block leading-none">
              Neura
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
              RAG Engine
            </span>
          </div>
        </NavLink>

        {/* Desktop Nav Links - Perfectly Centered */}
        <nav className="hidden md:flex items-center justify-center gap-8 flex-1 mx-8">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/architecture"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            Architecture
          </NavLink>
          <NavLink
            to="/knowledge-base"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            Knowledge Base
          </NavLink>
          <NavLink
            to="/evaluation"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            Evaluation
          </NavLink>
          <NavLink
            to="/agent"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            Live Agent
          </NavLink>
          <a
            href="https://github.com/SammedBG/RAG-Customer-support-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
          >
            GitHub
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </nav>

        {/* Primary Action CTA */}
        <div className="hidden md:flex items-center flex-shrink-0">
          <NavLink
            to="/agent"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-lime-400 text-slate-950 text-sm font-bold hover:bg-lime-300 transition-all shadow-sm hover:shadow-lime-500/20 whitespace-nowrap"
          >
            <Bot className="w-4 h-4" />
            Try Assistant
          </NavLink>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          <NavLink
            to="/"
            end
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </NavLink>
          <NavLink
            to="/architecture"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Architecture
          </NavLink>
          <NavLink
            to="/knowledge-base"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Knowledge Base
          </NavLink>
          <NavLink
            to="/evaluation"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Evaluation
          </NavLink>
          <NavLink
            to="/agent"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Live Agent
          </NavLink>
          <a
            href="https://github.com/SammedBG/RAG-Customer-support-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
          >
            GitHub
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>
          <div className="pt-2">
            <NavLink
              to="/agent"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-lime-400 text-slate-950 text-sm font-bold hover:bg-lime-300"
            >
              <Bot className="w-4 h-4" />
              Try Assistant
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
