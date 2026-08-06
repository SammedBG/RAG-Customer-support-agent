import React from 'react';
import { NavLink } from 'react-router-dom';
import { Eye, Code, Globe, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center text-slate-950 font-bold">
                <Eye className="w-4 h-4" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">Neura</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Production-oriented RAG customer support agent with hybrid retrieval, grounding verification, and source citation traceability.
            </p>
          </div>

          {/* Project Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Project
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <NavLink to="/architecture" className="hover:text-lime-400 transition-colors">
                  Architecture
                </NavLink>
              </li>
              <li>
                <NavLink to="/knowledge-base" className="hover:text-lime-400 transition-colors">
                  Knowledge Base
                </NavLink>
              </li>
              <li>
                <NavLink to="/evaluation" className="hover:text-lime-400 transition-colors">
                  Evaluation
                </NavLink>
              </li>
              <li>
                <NavLink to="/agent" className="hover:text-lime-400 transition-colors">
                  Live Demo
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Technology
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="hover:text-slate-300">LangGraph</li>
              <li className="hover:text-slate-300">LlamaIndex</li>
              <li className="hover:text-slate-300">Qdrant</li>
              <li className="hover:text-slate-300">FastAPI</li>
              <li className="hover:text-slate-300">RAGAS & DeepEval</li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Connect
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://github.com/SammedBG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-lime-400 transition-colors"
                >
                  <Code className="w-4 h-4 text-lime-400" />
                  GitHub Profile
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-lime-400 transition-colors"
                >
                  <Globe className="w-4 h-4 text-lime-400" />
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/SammedBG/RAG-Customer-support-agent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-lime-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-lime-400" />
                  Portfolio Repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Built by <span className="font-semibold text-slate-300">Sammed Ghattad</span>
          </div>
          <div>Built with LangGraph, Qdrant & FastAPI</div>
        </div>
      </div>
    </footer>
  );
}
