/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, AlertTriangle, Lightbulb, CheckCircle2, Info, ArrowRight, Activity, HelpCircle } from 'lucide-react';
import { AIInsight } from '../types';
import api from '../lib/api';

export default function AIAnalysis() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    'Scanning active database partitions...',
    'Aggregating category expenditure velocities...',
    'Analyzing food-related macros & dining frequencies...',
    'Generating predictive capital burn models with Gemini...',
    'Formatting safety recommendations...'
  ];

  const triggerAnalysis = async () => {
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    // Stagger loading messages to show real-time analysis pipeline
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const result = await api.getAiInsights();
      setInsights(result);
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with AI module');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'tip': return <Lightbulb className="w-5 h-5 text-amber-400" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      default: return <Info className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getInsightBorderClass = (type: string) => {
    switch (type) {
      case 'warning': return 'border-rose-950 bg-rose-950/10 hover:bg-rose-950/15';
      case 'tip': return 'border-amber-950 bg-amber-950/10 hover:bg-amber-950/15';
      case 'success': return 'border-emerald-950 bg-emerald-950/10 hover:bg-emerald-950/15';
      default: return 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/50';
    }
  };

  return (
    <div id="ai_analysis_module" className="space-y-6 font-sans text-xs">
      
      {/* Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" /> Gemini Financial Audit
            </h1>
            <p className="text-slate-400 text-sm">Query Google AI to scan spending categories, extract risks, and build clean savings tracks.</p>
          </div>
          <button
            id="btn_run_ai_audit"
            onClick={triggerAnalysis}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition disabled:opacity-50 text-xs"
          >
            <Brain className="w-4 h-4" /> Run Gemini Audit
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="min-h-[300px] flex flex-col justify-center items-center">
        <AnimatePresence mode="wait">
          
          {/* 1. Loading State */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4 max-w-sm py-12"
            >
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <Brain className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Synthesizing Analytics</p>
                <motion.p 
                  key={loadingStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-slate-500 text-xs font-mono h-4"
                >
                  {loadingMessages[loadingStep]}
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* 2. Error State */}
          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-md space-y-3"
            >
              <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
              <p className="font-semibold text-white">AI Grounding Failed</p>
              <p className="text-slate-400 leading-relaxed text-xs">
                Could not generate AI insights. Check if your Gemini API Key is configured in the secrets menu or retry later. Falling back to static mock models is supported.
              </p>
              <button
                id="btn_retry_ai"
                onClick={triggerAnalysis}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-semibold"
              >
                Retry Analysis
              </button>
            </motion.div>
          )}

          {/* 3. Empty State */}
          {!loading && !error && insights.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-8 border border-dashed border-slate-800 rounded-2xl max-w-md space-y-4"
            >
              <Brain className="w-12 h-12 text-slate-700 mx-auto" />
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-300 text-sm">No Active Audit Reports</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Trigger an AI audit report to have Gemini process your active database partitions and output custom financial suggestions.
                </p>
              </div>
              <button
                id="btn_empty_run_ai"
                onClick={triggerAnalysis}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-indigo-400 flex items-center gap-1.5 mx-auto"
              >
                <Sparkles className="w-3.5 h-3.5" /> Initialize Model
              </button>
            </motion.div>
          )}

          {/* 4. Display Insights */}
          {!loading && !error && insights.length > 0 && (
            <motion.div
              key="insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-5 border rounded-2xl flex flex-col justify-between space-y-4 transition-all ${getInsightBorderClass(insight.type)}`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-950/40 rounded-lg shrink-0 border border-slate-800/40">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm tracking-tight text-white capitalize">{insight.title}</h3>
                        <span className="text-[9px] font-mono text-slate-500">Confidence: {Math.round(insight.confidence * 100)}%</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-400 leading-relaxed text-xs">
                      {insight.description}
                    </p>

                    {/* Recommendations List */}
                    <div className="space-y-1.5 pt-1">
                      <p className="font-bold text-[10px] text-slate-300 uppercase tracking-wider flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-indigo-400" /> Actionable Mitigations:</p>
                      <ul className="space-y-1.5 text-[11px] text-slate-400 pl-1">
                        {insight.recommendations.map((rec, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-1.5">
                            <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </motion.div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
