/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, CreditCard, Utensils, Layers, 
  Terminal, BarChart3, LogOut, User, Sparkles, Brain, Lock 
} from 'lucide-react';
import { User as UserType, Expense, PaymentCard } from './types';
import api from './lib/api';

// Components
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import CardsPage from './components/CardsPage';
import FoodPage from './components/FoodPage';
import ExpensesPage from './components/ExpensesPage';
import ReportsPage from './components/ReportsPage';
import AIAnalysis from './components/AIAnalysis';
import EngineeringPanel from './components/EngineeringPanel';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [loading, setLoading] = useState(false);

  // Subscribe to Authentication state changes (DIP)
  useEffect(() => {
    const unsubscribe = api.addAuthListener((user) => {
      setCurrentUser(user);
      if (user) {
        refreshAllData();
      } else {
        setExpenses([]);
        setCards([]);
      }
    });
    return unsubscribe;
  }, []);

  const refreshAllData = async () => {
    if (!api.isAuthenticated()) return;
    setLoading(true);
    try {
      const [cardsData, expensesData] = await Promise.all([
        api.getCards(),
        api.getExpenses(),
      ]);
      setCards(cardsData);
      setExpenses(expensesData);
    } catch (err) {
      console.error('Failed to coordinate secure data fetch', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return <AuthPage />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} expenses={expenses} cards={cards} onRefresh={refreshAllData} />;
      case 'cards':
        return <CardsPage cards={cards} onRefresh={refreshAllData} />;
      case 'food':
        return <FoodPage expenses={expenses} cards={cards} onRefresh={refreshAllData} />;
      case 'expenses':
        return <ExpensesPage expenses={expenses} cards={cards} onRefresh={refreshAllData} />;
      case 'ai':
        return <AIAnalysis />;
      case 'reports':
        return <ReportsPage expenses={expenses} cards={cards} />;
      case 'engineering':
        return <EngineeringPanel />;
      default:
        return <Dashboard onNavigate={setActiveTab} expenses={expenses} cards={cards} onRefresh={refreshAllData} />;
    }
  };

  return (
    <div id="fullstack_app_shell" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative antialiased">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
      
      {/* Universal Desktop Navigation Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md shadow-indigo-500/10">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white">ApexTracker</span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider block text-indigo-400">SOLID Workspace</span>
          </div>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <button 
            id="nav_link_dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-slate-900 text-white border border-slate-800 font-semibold' : 'hover:bg-slate-900/40 hover:text-slate-200'}`}
          >
            Overview
          </button>
          <button 
            id="nav_link_cards"
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'cards' ? 'bg-slate-900 text-white border border-slate-800 font-semibold' : 'hover:bg-slate-900/40 hover:text-slate-200'}`}
          >
            Pipelines
          </button>
          <button 
            id="nav_link_food"
            onClick={() => setActiveTab('food')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'food' ? 'bg-slate-900 text-white border border-slate-800 font-semibold' : 'hover:bg-slate-900/40 hover:text-slate-200'}`}
          >
            Nutritional
          </button>
          <button 
            id="nav_link_expenses"
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'expenses' ? 'bg-slate-900 text-white border border-slate-800 font-semibold' : 'hover:bg-slate-900/40 hover:text-slate-200'}`}
          >
            Ledger
          </button>
          <button 
            id="nav_link_reports"
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'reports' ? 'bg-slate-900 text-white border border-slate-800 font-semibold' : 'hover:bg-slate-900/40 hover:text-slate-200'}`}
          >
            Telemetry
          </button>
          <button 
            id="nav_link_ai"
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-lg transition-all text-indigo-400 border border-transparent hover:border-indigo-500/20 ${activeTab === 'ai' ? 'bg-indigo-950/20 text-indigo-300 border border-indigo-500/30 font-semibold shadow-inner' : 'hover:bg-indigo-950/10'}`}
          >
            <Sparkles className="w-3 h-3 inline mr-1" /> Gemini Audit
          </button>
          <button 
            id="nav_link_engineering"
            onClick={() => setActiveTab('engineering')}
            className={`px-3 py-1.5 rounded-lg transition-all text-purple-400 border border-transparent hover:border-purple-500/20 ${activeTab === 'engineering' ? 'bg-purple-950/20 text-purple-300 border border-purple-500/30 font-semibold shadow-inner' : 'hover:bg-purple-950/10'}`}
          >
            <Terminal className="w-3.5 h-3.5 inline mr-1" /> Core Engine
          </button>
        </nav>

        {/* User Badge */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-semibold text-slate-200 text-xs">{currentUser.name}</span>
            <span className="text-[9px] font-mono px-1 rounded bg-slate-900 border border-slate-800 text-slate-500 capitalize">{currentUser.role} Account</span>
          </div>
          <button
            id="btn_navbar_logout"
            onClick={handleLogout}
            className="p-2 bg-slate-900/80 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition"
            title="Sign out of pipeline session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Sticky Tab bar */}
      <div className="md:hidden border-b border-slate-900 bg-slate-950 flex items-center justify-around px-2 py-1.5 text-[10px] text-slate-500 font-semibold">
        <button id="btn_m_dash" onClick={() => setActiveTab('dashboard')} className={`p-1.5 rounded ${activeTab === 'dashboard' ? 'text-white bg-slate-900' : ''}`}>Overview</button>
        <button id="btn_m_cards" onClick={() => setActiveTab('cards')} className={`p-1.5 rounded ${activeTab === 'cards' ? 'text-white bg-slate-900' : ''}`}>Cards</button>
        <button id="btn_m_food" onClick={() => setActiveTab('food')} className={`p-1.5 rounded ${activeTab === 'food' ? 'text-white bg-slate-900' : ''}`}>Food</button>
        <button id="btn_m_expenses" onClick={() => setActiveTab('expenses')} className={`p-1.5 rounded ${activeTab === 'expenses' ? 'text-white bg-slate-900' : ''}`}>Ledger</button>
        <button id="btn_m_reports" onClick={() => setActiveTab('reports')} className={`p-1.5 rounded ${activeTab === 'reports' ? 'text-white bg-slate-900' : ''}`}>Reports</button>
        <button id="btn_m_ai" onClick={() => setActiveTab('ai')} className={`p-1.5 rounded text-indigo-400 ${activeTab === 'ai' ? 'bg-indigo-950/30' : ''}`}>Gemini</button>
        <button id="btn_m_eng" onClick={() => setActiveTab('engineering')} className={`p-1.5 rounded text-purple-400 ${activeTab === 'engineering' ? 'bg-purple-950/30' : ''}`}>Engine</button>
      </div>

      {/* Main Shell viewport wrapper */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Educational status marker */}
      <footer className="py-4 border-t border-slate-900 text-center text-[10px] text-slate-600 font-mono">
        <p>© 2026 ApexTracker Systems. Created as a full-stack engineering portfolio showcase.</p>
      </footer>
    </div>
  );
}
