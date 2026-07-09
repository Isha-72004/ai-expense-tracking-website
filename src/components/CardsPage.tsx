/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Plus, Trash2, ArrowUpRight, Shield, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { PaymentCard } from '../types';
import api from '../lib/api';

interface CardsPageProps {
  cards: PaymentCard[];
  onRefresh: () => void;
}

export default function CardsPage({ cards, onRefresh }: CardsPageProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'amex' | 'discover'>('visa');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [color, setColor] = useState<'blue' | 'purple' | 'emerald' | 'rose' | 'amber'>('blue');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !creditLimit) return;

    setLoading(true);
    try {
      await api.createCard({
        cardName,
        cardNumber,
        cardType,
        cardHolder: cardHolder || 'VALUED CUSTOMER',
        expiryDate: expiryDate || '12/29',
        creditLimit: Number(creditLimit),
        color,
      });

      // Reset form
      setCardName('');
      setCardNumber('');
      setCardType('visa');
      setCardHolder('');
      setExpiryDate('');
      setCreditLimit('');
      setColor('blue');
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setShowAddForm(false);
      onRefresh();
    } catch (err) {
      alert('Failed to register payment pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete payment card "${name}"?\nThis will disconnect this credit pipeline, but historic transaction records will remain.`)) {
      return;
    }

    try {
      await api.deleteCard(id);
      onRefresh();
    } catch (err) {
      alert('Failed to remove payment pipeline');
    }
  };

  const getGradientClass = (col: string) => {
    switch (col) {
      case 'blue': return 'from-slate-900 via-blue-950 to-slate-900 border-blue-500/20';
      case 'purple': return 'from-slate-900 via-purple-950 to-slate-900 border-purple-500/20';
      case 'rose': return 'from-slate-900 via-rose-950 to-slate-900 border-rose-500/20';
      case 'amber': return 'from-slate-900 via-amber-950 to-slate-900 border-amber-500/20';
      case 'emerald': return 'from-slate-900 via-emerald-950 to-slate-900 border-emerald-500/20';
      default: return 'from-slate-950 to-slate-900 border-slate-800';
    }
  };

  const getGlowColorClass = (col: string) => {
    switch (col) {
      case 'blue': return 'shadow-blue-500/10';
      case 'purple': return 'shadow-purple-500/10';
      case 'rose': return 'shadow-rose-500/10';
      case 'amber': return 'shadow-amber-500/10';
      case 'emerald': return 'shadow-emerald-500/10';
      default: return 'shadow-transparent';
    }
  };

  return (
    <div id="cards_page_container" className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Payment Pipelines</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage credit thresholds and dedicated capital channels.</p>
        </div>
        <button
          id="btn_add_card_form_toggle"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Connect Credit Line
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> New payment pipeline created and registered securely.
        </div>
      )}

      {/* Slide Out Add Form Panel */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h2 className="font-bold text-sm tracking-tight text-white">Configure New Pipeline</h2>
              
              <form onSubmit={handleAddCard} className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-300">
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="card_name_input">Card Name / Issuer</label>
                    <input
                      id="card_name_input"
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. Chase Sapphire Preferred"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="card_number_input">Card Number (Last 4 are vital)</label>
                    <input
                      id="card_number_input"
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="e.g. **** **** **** 4582"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="card_type_select">Network</label>
                      <select
                        id="card_type_select"
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="visa">Visa</option>
                        <option value="mastercard">Mastercard</option>
                        <option value="amex">AMEX</option>
                        <option value="discover">Discover</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="expiry_date_input">Expiry Date</label>
                      <input
                        id="expiry_date_input"
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="09/29"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="credit_limit_input">Credit Limit ($)</label>
                      <input
                        id="credit_limit_input"
                        type="number"
                        required
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(e.target.value)}
                        placeholder="5000"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="card_holder_input">Cardholder Name</label>
                      <input
                        id="card_holder_input"
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Alex Mercer"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Aesthetic Hue (Skin)</label>
                    <div className="flex items-center gap-2">
                      {(['blue', 'purple', 'emerald', 'rose', 'amber'] as const).map(col => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setColor(col)}
                          className={`w-6 h-6 rounded-full border-2 transition ${
                            col === 'blue' ? 'bg-blue-600' :
                            col === 'purple' ? 'bg-purple-600' :
                            col === 'emerald' ? 'bg-emerald-600' :
                            col === 'rose' ? 'bg-rose-600' : 'bg-amber-600'
                          } ${color === col ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      id="btn_cancel_add_card"
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 font-semibold"
                    >
                      Dismiss
                    </button>
                    <button
                      id="btn_submit_add_card"
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5"
                    >
                      {loading ? (
                        <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        'Save Pipeline'
                      )}
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.length === 0 ? (
          <div className="col-span-full p-12 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
            <CreditCard className="w-12 h-12 text-slate-700 mx-auto" />
            <div className="space-y-1">
              <p className="text-slate-300 font-semibold text-sm">No payment pipelines linked</p>
              <p className="text-slate-500 text-xs">Create your first credit pipeline to map expenses to credit usage thresholds.</p>
            </div>
            <button
              id="btn_empty_add_card_trigger"
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold rounded-lg text-indigo-400"
            >
              Add Card Pipeline
            </button>
          </div>
        ) : (
          cards.map(c => {
            const usagePercent = Math.min((c.spent / c.creditLimit) * 100, 100);
            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 bg-gradient-to-br ${getGradientClass(c.color)} ${getGlowColorClass(c.color)} border rounded-2xl shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden group`}
              >
                {/* Visual Glassmorphism Mesh */}
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none rounded-2xl"></div>
                <div className="absolute -right-16 -bottom-16 w-44 h-44 bg-white/[0.02] rounded-full blur-xl pointer-events-none"></div>

                {/* Card Header */}
                <div className="flex justify-between items-start z-10">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Credit Pipeline</p>
                    <h3 className="font-bold text-sm tracking-tight text-white group-hover:text-indigo-200 transition">{c.cardName}</h3>
                  </div>
                  <button
                    id={`btn_delete_card_${c.id}`}
                    onClick={() => handleDeleteCard(c.id, c.cardName)}
                    className="p-1.5 bg-slate-950/40 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Metallic Chip Sim */}
                <div className="flex items-center justify-between z-10">
                  <div className="w-9 h-7 bg-gradient-to-br from-amber-400/40 to-amber-200/10 border border-amber-400/20 rounded-md flex flex-col justify-between p-1">
                    <div className="w-full h-[1px] bg-amber-400/10"></div>
                    <div className="w-full h-[1px] bg-amber-400/10"></div>
                  </div>
                  <Shield className="w-5 h-5 text-slate-500" />
                </div>

                {/* Card Number */}
                <div className="z-10">
                  <p className="text-base font-mono tracking-wider text-slate-100 font-medium">
                    {c.cardNumber}
                  </p>
                </div>

                {/* Card Footer Info */}
                <div className="flex justify-between items-end z-10">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-mono text-slate-500 uppercase">Cardholder</p>
                    <p className="text-xs font-semibold text-slate-200 uppercase tracking-wide truncate max-w-[150px]">{c.cardHolder}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[9px] font-mono text-slate-500 uppercase">Expires</p>
                    <p className="text-xs font-mono font-semibold text-slate-200">{c.expiryDate}</p>
                  </div>
                  <div className="px-2.5 py-0.5 bg-slate-950/60 border border-slate-800 rounded font-mono text-[9px] uppercase font-bold text-slate-300">
                    {c.cardType}
                  </div>
                </div>

                {/* Credit Limit Meter */}
                <div className="pt-4 border-t border-slate-800/40 space-y-1.5 z-10">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Utilization Burn</span>
                    <span className="font-mono text-slate-200 font-semibold">${c.spent.toFixed(2)} <span className="text-slate-500">/ ${c.creditLimit.toLocaleString()}</span></span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          usagePercent > 80 ? 'bg-rose-500' :
                          usagePercent > 50 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      ></div>
                    </div>
                    {usagePercent > 80 && (
                      <div className="flex items-center gap-1 text-[9px] text-rose-400 mt-1 font-semibold">
                        <AlertTriangle className="w-3 h-3" /> High utilization (Threshold critical!)
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })
        )}
      </div>

    </div>
  );
}
