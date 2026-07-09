/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, Edit2, Trash2, Plus, 
  X, Calendar, Filter, Download, ArrowUpDown, ChevronDown, CheckCircle 
} from 'lucide-react';
import { Expense, PaymentCard } from '../types';
import api from '../lib/api';

interface ExpensesPageProps {
  expenses: Expense[];
  cards: PaymentCard[];
  onRefresh: () => void;
}

export default function ExpensesPage({ expenses, cards, onRefresh }: ExpensesPageProps) {
  // Filters & Search State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [cardId, setCardId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // CRUD Edit / Create Modal State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [crudSuccess, setCrudSuccess] = useState<string | null>(null);

  // Form Fields
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Food');
  const [formDate, setFormDate] = useState('');
  const [formCardId, setFormCardId] = useState('');
  const [formIsFood, setFormIsFood] = useState(false);

  // Categories
  const categoriesList = ['Food', 'Transport', 'Utilities', 'Shopping', 'Entertainment', 'Other'];

  const triggerCreateForm = () => {
    setEditingExpense(null);
    setFormDesc('');
    setFormAmount('');
    setFormCategory('Food');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCardId('');
    setFormIsFood(true);
    setShowFormModal(true);
  };

  const triggerEditForm = (exp: Expense) => {
    setEditingExpense(exp);
    setFormDesc(exp.description);
    setFormAmount(exp.amount.toString());
    setFormCategory(exp.category);
    setFormDate(new Date(exp.date).toISOString().split('T')[0]);
    setFormCardId(exp.cardId || '');
    setFormIsFood(!!exp.isFood);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc || !formAmount) return;

    setLoading(true);
    try {
      const payload: Partial<Expense> = {
        description: formDesc,
        amount: Number(formAmount),
        category: formCategory,
        date: new Date(formDate).toISOString(),
        cardId: formCardId || undefined,
        isFood: formIsFood,
        foodDetails: formIsFood ? { mealType: 'lunch' } : undefined,
      };

      if (editingExpense) {
        await api.updateExpense(editingExpense.id, payload);
        setCrudSuccess('Expense record successfully updated in core DB.');
      } else {
        await api.createExpense(payload);
        setCrudSuccess('New expense successfully logged on database ledger.');
      }

      onRefresh();
      setShowFormModal(false);
      setTimeout(() => setCrudSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string, desc: string) => {
    if (!confirm(`Are you sure you want to delete "${desc}" from database?`)) {
      return;
    }

    try {
      await api.deleteExpense(id);
      setCrudSuccess('Record removed from persistent ledger.');
      setTimeout(() => setCrudSuccess(null), 3000);
      onRefresh();
    } catch (err) {
      alert('Failed to delete expense record');
    }
  };

  // Local client-side advanced filtering & sorting
  let filteredExpenses = [...expenses];

  if (search) {
    const q = search.toLowerCase();
    filteredExpenses = filteredExpenses.filter(e => 
      e.description.toLowerCase().includes(q) || 
      e.category.toLowerCase().includes(q)
    );
  }

  if (category) {
    filteredExpenses = filteredExpenses.filter(e => e.category === category);
  }

  if (cardId) {
    filteredExpenses = filteredExpenses.filter(e => e.cardId === cardId);
  }

  if (startDate) {
    filteredExpenses = filteredExpenses.filter(e => e.date.split('T')[0] >= startDate);
  }

  if (endDate) {
    filteredExpenses = filteredExpenses.filter(e => e.date.split('T')[0] <= endDate);
  }

  // Apply Sorting
  filteredExpenses.sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount_desc') return b.amount - a.amount;
    if (sortBy === 'amount_asc') return a.amount - b.amount;
    return 0;
  });

  return (
    <div id="expenses_page_container" className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Central Ledger</h1>
          <p className="text-slate-400 text-sm mt-0.5">CRUD ledger with multi-variable transactional telemetry.</p>
        </div>
        <button
          id="btn_create_expense_trigger"
          onClick={triggerCreateForm}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Create Expense
        </button>
      </div>

      {crudSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {crudSuccess}
        </div>
      )}

      {/* Advanced Telemetry Filters Box */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-xs text-slate-300">
        
        {/* Row 1: Search & sorting */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><Search className="w-4 h-4" /></span>
            <input
              id="ledger_search_input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ledger entries (description or sector)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><ArrowUpDown className="w-4 h-4" /></span>
            <select
              id="ledger_sort_select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs appearance-none"
            >
              <option value="date_desc">Sort: Newest First</option>
              <option value="date_asc">Sort: Oldest First</option>
              <option value="amount_desc">Sort: Amount High-to-Low</option>
              <option value="amount_asc">Sort: Amount Low-to-High</option>
            </select>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><Filter className="w-4 h-4" /></span>
            <select
              id="ledger_category_filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs appearance-none"
            >
              <option value="">Filter: All Sectors</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Pipeline filters & Date filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          <div className="relative">
            <select
              id="ledger_card_filter"
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs appearance-none"
            >
              <option value="">Filter: All Pipelines</option>
              {cards.map(c => (
                <option key={c.id} value={c.id}>{c.cardName} ({c.cardNumber.slice(-4)})</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><Calendar className="w-3.5 h-3.5" /></span>
            <input
              id="ledger_start_date_filter"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><Calendar className="w-3.5 h-3.5" /></span>
            <input
              id="ledger_end_date_filter"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div className="flex gap-2">
            <button
              id="btn_clear_ledger_filters"
              onClick={() => {
                setSearch('');
                setCategory('');
                setCardId('');
                setStartDate('');
                setEndDate('');
              }}
              className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg font-semibold text-slate-400"
            >
              Clear Filters
            </button>
          </div>
        </div>

      </div>

      {/* Ledger Table / List View */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono font-medium tracking-wider uppercase">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4">Pipeline</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Controls</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No transaction records matched the query parameters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => {
                  const linkedCard = cards.find(c => c.id === e.cardId);
                  return (
                    <tr key={e.id} className="border-b border-slate-800/50 hover:bg-slate-950/40 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(e.date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {e.description}
                        {e.isFood && (
                          <span className="ml-2 text-[9px] px-1 bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 rounded">Nutrition</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[10px]">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {linkedCard ? (
                          <span className="flex items-center gap-1.5 font-mono text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            {linkedCard.cardName} ({linkedCard.cardNumber.slice(-4)})
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[10px]">Direct Cash</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-white text-sm">
                        -${e.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn_edit_expense_${e.id}`}
                            onClick={() => triggerEditForm(e)}
                            className="p-1.5 bg-slate-950/40 hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/20 rounded-lg text-slate-400 hover:text-indigo-400 transition"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            id={`btn_delete_expense_${e.id}`}
                            onClick={() => handleDeleteExpense(e.id, e.description)}
                            className="p-1.5 bg-slate-950/40 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 rounded-lg text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Modal Form for CRUD operations */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-xs"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white">
                {editingExpense ? 'Modify Ledger Entry' : 'New Ledger Record'}
              </h2>
              <button
                id="btn_close_crud_modal"
                onClick={() => setShowFormModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-slate-300">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="crud_desc">Transaction Description</label>
                <input
                  id="crud_desc"
                  type="text"
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="AWS Compute Instance Monthly Billing"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="crud_amount">Cost (USD)</label>
                  <input
                    id="crud_amount"
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="24.99"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="crud_category">Discretionary Sector</label>
                  <select
                    id="crud_category"
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      if (e.target.value === 'Food') setFormIsFood(true);
                      else setFormIsFood(false);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="crud_date">Effective Date</label>
                  <input
                    id="crud_date"
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="crud_card">Assigned Pipeline</label>
                  <select
                    id="crud_card"
                    value={formCardId}
                    onChange={(e) => setFormCardId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none"
                  >
                    <option value="">Unlinked Cash Pipeline</option>
                    {cards.map(c => (
                      <option key={c.id} value={c.id}>{c.cardName} ({c.cardNumber.slice(-4)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="crud_is_food_checkbox"
                  type="checkbox"
                  checked={formIsFood}
                  onChange={(e) => setFormIsFood(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 bg-slate-950 w-4 h-4"
                />
                <label className="text-slate-400 font-medium cursor-pointer" htmlFor="crud_is_food_checkbox">Is this meal/dining related? (Triggers nutrition index)</label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button
                  id="btn_cancel_crud"
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 font-semibold text-center"
                >
                  Cancel
                </button>
                <button
                  id="btn_submit_crud"
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg text-center flex items-center justify-center"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'Commit Record'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
