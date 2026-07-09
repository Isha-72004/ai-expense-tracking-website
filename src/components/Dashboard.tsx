/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, TrendingDown, DollarSign, CreditCard, 
  PlusCircle, Utensils, ShoppingBag, Car, Zap, 
  Film, HelpCircle, ArrowRight, User, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { Expense, PaymentCard, DashboardStats } from '../types';
import api from '../lib/api';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  expenses: Expense[];
  cards: PaymentCard[];
  onRefresh: () => void;
}

export default function Dashboard({ onNavigate, expenses, cards, onRefresh }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    monthlyExpenses: 0,
    monthlyLimit: 1200,
    activeCardsCount: 0,
    dailyAverage: 0,
    topCategory: 'N/A'
  });

  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState('Food');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickCardId, setQuickCardId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    calculateStats();
  }, [expenses, cards]);

  const calculateStats = () => {
    const totalLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Group categories to find top
    const catTotals: Record<string, number> = {};
    expenses.forEach(e => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });

    let topCat = 'N/A';
    let maxSpend = 0;
    Object.entries(catTotals).forEach(([cat, amt]) => {
      if (amt > maxSpend) {
        maxSpend = amt;
        topCat = cat;
      }
    });

    // Calculate rolling daily average for the current month
    const distinctDays = new Set(expenses.map(e => e.date.split('T')[0])).size || 1;
    const dailyAvg = totalSpent / distinctDays;

    setStats({
      totalBalance: totalLimit - totalSpent,
      monthlyExpenses: totalSpent,
      monthlyLimit: totalLimit || 5000,
      activeCardsCount: cards.length,
      dailyAverage: dailyAvg,
      topCategory: topCat
    });
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount || !quickDesc) return;

    setIsAdding(true);
    try {
      await api.createExpense({
        amount: Number(quickAmount),
        category: quickCategory,
        description: quickDesc,
        cardId: quickCardId || undefined,
        isFood: quickCategory === 'Food',
        foodDetails: quickCategory === 'Food' ? { mealType: 'lunch' } : undefined,
      });

      setQuickAmount('');
      setQuickDesc('');
      setQuickCardId('');
      
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      
      onRefresh();
    } catch (err) {
      alert('Failed to record transaction');
    } finally {
      setIsAdding(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food': return <Utensils className="w-4 h-4 text-emerald-400" />;
      case 'Shopping': return <ShoppingBag className="w-4 h-4 text-purple-400" />;
      case 'Transport': return <Car className="w-4 h-4 text-blue-400" />;
      case 'Utilities': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Entertainment': return <Film className="w-4 h-4 text-rose-400" />;
      default: return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCardColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-600/10 border-blue-500/20 text-blue-400';
      case 'purple': return 'bg-purple-600/10 border-purple-500/20 text-purple-400';
      case 'rose': return 'bg-rose-600/10 border-rose-500/20 text-rose-400';
      case 'amber': return 'bg-amber-600/10 border-amber-500/20 text-amber-400';
      case 'emerald': return 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400';
      default: return 'bg-slate-600/10 border-slate-500/20 text-slate-400';
    }
  };

  const recentExpenses = expenses.slice(0, 4);

  return (
    <div id="dashboard_container" className="space-y-6 font-sans">
      
      {/* Top Banner Message */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Workspace Overview <span className="text-xs font-normal font-mono px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-800/50">Active Turn</span>
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time telemetry and capital allocation controls.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            id="btn_quick_view_expenses"
            onClick={() => onNavigate('expenses')}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition text-xs font-semibold text-slate-300 flex items-center gap-1.5"
          >
            Manage Expenses <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button 
            id="btn_quick_add_expense_trigger"
            onClick={() => {
              const el = document.getElementById('quick_add_desc_input');
              el?.focus();
            }}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Quick Action
          </button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Available Credit Balance */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Available Cap Buffer</span>
            <div className="p-1.5 bg-indigo-500/10 rounded-lg"><DollarSign className="w-4 h-4 text-indigo-400" /></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">${stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Total credit buffer minus spent capital.</p>
          </div>
        </div>

        {/* Card 2: Cumulative Expenses */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Spent This Month</span>
            <div className="p-1.5 bg-rose-500/10 rounded-lg"><TrendingDown className="w-4 h-4 text-rose-400" /></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">${stats.monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full" 
                  style={{ width: `${Math.min((stats.monthlyExpenses / stats.monthlyLimit) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap">{Math.round((stats.monthlyExpenses / stats.monthlyLimit) * 100)}% Limit</span>
            </div>
          </div>
        </div>

        {/* Card 3: Rolling Daily Burn */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Rolling Daily Burn</span>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-400" /></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">${stats.dailyAverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Rolling category velocity rate.</p>
          </div>
        </div>

        {/* Card 4: High-Velocity Category */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Top-velocity Sector</span>
            <div className="p-1.5 bg-purple-500/10 rounded-lg"><CreditCard className="w-4 h-4 text-purple-400" /></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">{stats.topCategory}</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Primary source of monthly outflow.</p>
          </div>
        </div>

      </div>

      {/* Main Content Split Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Quick Action form & Cards summary */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Add Expense Panel */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm tracking-tight text-white">Record Transaction</h2>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">Instant ledger update</span>
            </div>

            {successMsg && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 rounded-lg text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Transaction logged. Linked card spent metrics updated.</span>
              </div>
            )}

            <form onSubmit={handleQuickAdd} className="space-y-3.5 text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="quick_add_desc_input">Description</label>
                <input 
                  id="quick_add_desc_input"
                  type="text" 
                  required
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  placeholder="e.g. AWS Cloud Hosting Premium Tier"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="quick_add_amount_input">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">$</span>
                    <input 
                      id="quick_add_amount_input"
                      type="number" 
                      step="0.01"
                      required
                      value={quickAmount}
                      onChange={(e) => setQuickAmount(e.target.value)}
                      placeholder="79.99"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="quick_add_category_select">Category</label>
                  <select 
                    id="quick_add_category_select"
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Food">Food & Dining</option>
                    <option value="Shopping">Shopping & Tech</option>
                    <option value="Transport">Transport</option>
                    <option value="Utilities">Utilities & Bills</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="quick_add_card_select">Funding Card</label>
                <select 
                  id="quick_add_card_select"
                  value={quickCardId}
                  onChange={(e) => setQuickCardId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Unlinked (Cash/Direct Transfer)</option>
                  {cards.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.cardName} ({c.cardNumber.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="btn_quick_add_submit"
                type="submit"
                disabled={isAdding}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 rounded-lg text-white font-semibold tracking-wide transition flex items-center justify-center gap-1.5"
              >
                {isAdding ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" /> Save to Ledger
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Active Cards Snapshot */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm tracking-tight text-white">Active Pipelines</h2>
              <button 
                id="btn_view_all_cards_from_dash"
                onClick={() => onNavigate('cards')}
                className="text-[10px] font-semibold text-indigo-400 hover:underline"
              >
                Configure
              </button>
            </div>

            <div className="space-y-2.5">
              {cards.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-800 rounded-lg text-center text-xs text-slate-500">
                  No active payment pipelines configured.
                </div>
              ) : (
                cards.slice(0, 3).map(c => {
                  const percentUsed = Math.min((c.spent / c.creditLimit) * 100, 100);
                  return (
                    <div key={c.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`px-2 py-1 rounded border font-mono font-semibold text-[10px] capitalize ${getCardColorClass(c.color)}`}>
                          {c.cardType}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{c.cardName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{c.cardNumber}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-slate-200">${c.spent.toFixed(2)}</p>
                        <p className="text-[9px] text-slate-500 font-mono">of ${c.creditLimit.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Ledger Feed */}
        <div className="lg:col-span-7">
          
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm tracking-tight text-white">Real-time Ledger</h2>
                  <p className="text-[10px] text-slate-500">Latest capital flows logged in session.</p>
                </div>
                <button 
                  id="btn_view_ledger_feed"
                  onClick={() => onNavigate('expenses')}
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Full ledger <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {recentExpenses.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500 space-y-1">
                    <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-medium text-slate-400">The Ledger is currently empty</p>
                    <p className="text-[10px]">Use the quick-add form to create your first transaction record.</p>
                  </div>
                ) : (
                  recentExpenses.map((e, index) => (
                    <motion.div 
                      key={e.id}
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3.5 bg-slate-950 hover:bg-slate-900/60 transition border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
                          {getCategoryIcon(e.category)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{e.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500">{new Date(e.date).toLocaleDateString()}</span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/60 border border-slate-800 text-slate-400">{e.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-white text-sm">-${e.amount.toFixed(2)}</p>
                        {e.cardId ? (
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">Linked Pipeline</p>
                        ) : (
                          <p className="text-[9px] text-indigo-400 font-mono mt-0.5">Cash</p>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Quick telemetry logs footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span> Ledger synched with cache</span>
              <span>Buffer allocation optimized</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
