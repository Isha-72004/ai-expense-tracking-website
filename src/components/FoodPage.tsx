/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Utensils, Star, Plus, ShieldCheck, Heart, Coffee, Cookie, Apple, Flame, DollarSign } from 'lucide-react';
import { Expense, PaymentCard } from '../types';
import api from '../lib/api';

interface FoodPageProps {
  expenses: Expense[];
  cards: PaymentCard[];
  onRefresh: () => void;
}

export default function FoodPage({ expenses, cards, onRefresh }: FoodPageProps) {
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [calories, setCalories] = useState('');
  const [healthRating, setHealthRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [restaurant, setRestaurant] = useState('');
  const [cardId, setCardId] = useState('');

  // Extract all food expenses
  const foodExpenses = expenses.filter(e => e.isFood || e.category === 'Food');

  // Metrics
  const totalFoodSpend = foodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCaloriesTracked = foodExpenses.reduce((sum, e) => sum + (e.foodDetails?.calories || 0), 0);
  
  // Average Health Rating
  const validRatings = foodExpenses.filter(e => e.foodDetails?.healthRating);
  const avgHealthRating = validRatings.length > 0 
    ? Number((validRatings.reduce((sum, e) => sum + (e.foodDetails?.healthRating || 0), 0) / validRatings.length).toFixed(1))
    : 0;

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    setLoading(true);
    try {
      await api.createExpense({
        amount: Number(amount),
        category: 'Food',
        description,
        cardId: cardId || undefined,
        isFood: true,
        foodDetails: {
          mealType,
          calories: calories ? Number(calories) : undefined,
          healthRating,
          restaurant: restaurant || undefined,
        },
      });

      // Reset
      setDescription('');
      setAmount('');
      setMealType('lunch');
      setCalories('');
      setHealthRating(3);
      setRestaurant('');
      setCardId('');
      
      setShowAddMeal(false);
      onRefresh();
    } catch (err) {
      alert('Failed to log dining expense');
    } finally {
      setLoading(false);
    }
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'lunch': return <Apple className="w-4 h-4 text-emerald-400" />;
      case 'dinner': return <Utensils className="w-4 h-4 text-indigo-400" />;
      case 'snack': return <Cookie className="w-4 h-4 text-purple-400" />;
      default: return <Utensils className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div id="food_page_container" className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Meal Tracker</h1>
          <p className="text-slate-400 text-sm mt-0.5">Log caloric velocity, food costs, and nutritional grades.</p>
        </div>
        <button
          id="btn_add_meal_toggle"
          onClick={() => setShowAddMeal(!showAddMeal)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Record Dining Out
        </button>
      </div>

      {/* KPI Grid for Food Sector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Cost Stats */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <p className="text-xs text-slate-400 font-medium">Accumulative Dining Costs</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">${totalFoodSpend.toFixed(2)}</span>
            <span className="text-[10px] text-slate-500 font-mono">logged</span>
          </div>
        </div>

        {/* Caloric stats */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <p className="text-xs text-slate-400 font-medium">Total Tracked Calories</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white">{totalCaloriesTracked.toLocaleString()}</span>
            <span className="text-[10px] text-amber-400 font-mono flex items-center gap-0.5"><Flame className="w-3 h-3 fill-amber-500/30" /> kCal</span>
          </div>
        </div>

        {/* Nutritional Score */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <p className="text-xs text-slate-400 font-medium">Average Health Grade</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white">{avgHealthRating || 'N/A'}</span>
            <div className="flex gap-0.5 text-indigo-400 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3.5 h-3.5 ${i < Math.round(avgHealthRating) ? 'fill-indigo-400' : 'text-slate-700'}`} 
                />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Slide-out Add Meal Form */}
      {showAddMeal && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-5 bg-slate-900 border border-slate-800 rounded-xl"
        >
          <form onSubmit={handleAddMeal} className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-300">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="meal_desc">Dish Name / Menu Item</label>
                <input
                  id="meal_desc"
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Avocado Toast with Poached Egg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="meal_amount">Cost (USD)</label>
                <input
                  id="meal_amount"
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="14.50"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="meal_type_select">Meal Period</label>
                  <select
                    id="meal_type_select"
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="meal_calories">Calories (kCal)</label>
                  <input
                    id="meal_calories"
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="e.g. 520"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Healthiness Index (Nutrition)</label>
                <div className="flex items-center gap-1.5 py-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setHealthRating(val as any)}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`w-5 h-5 transition-all ${
                          val <= healthRating ? 'fill-amber-400 text-amber-400 scale-105' : 'text-slate-700 hover:text-slate-500'
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="text-[10px] font-mono text-slate-500 ml-2">
                    {healthRating === 1 && 'Unhealthy / Fast food'}
                    {healthRating === 2 && 'Moderate Carbs'}
                    {healthRating === 3 && 'Balanced Meal'}
                    {healthRating === 4 && 'Nutritional / Clean'}
                    {healthRating === 5 && 'Organic / Elite'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider" htmlFor="meal_restaurant">Restaurant / Store Name</label>
                <input
                  id="meal_restaurant"
                  type="text"
                  value={restaurant}
                  onChange={(e) => setRestaurant(e.target.value)}
                  placeholder="e.g. Sweetgreen"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn_dismiss_meal"
                  type="button"
                  onClick={() => setShowAddMeal(false)}
                  className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 font-semibold"
                >
                  Dismiss
                </button>
                <button
                  id="btn_submit_meal"
                  type="submit"
                  disabled={loading}
                  className="py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg flex items-center justify-center"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'Record Meal'
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Meals Ledger */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm tracking-tight text-white">Nutritional ledger</h2>
            <span className="text-[10px] text-slate-500 font-mono">Isolated Food Category Transactions</span>
          </div>

          <div className="space-y-2.5">
            {foodExpenses.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center text-xs text-slate-500 space-y-2">
                <Utensils className="w-10 h-12 text-slate-700 mx-auto" />
                <p className="font-medium text-slate-400">No dining entries recorded</p>
                <p className="text-[10px]">Add dining expenses using the record meal trigger above to begin macro tracking.</p>
              </div>
            ) : (
              foodExpenses.map((e) => (
                <div key={e.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
                      {getMealIcon(e.foodDetails?.mealType || 'lunch')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-200 truncate">{e.description}</p>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800">{e.foodDetails?.mealType || 'Meal'}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-slate-500 text-[10px] mt-1 font-mono">
                        {e.foodDetails?.restaurant && (
                          <span className="text-slate-400">{e.foodDetails.restaurant}</span>
                        )}
                        {e.foodDetails?.calories && (
                          <span className="flex items-center gap-0.5 text-amber-500/80"><Flame className="w-3 h-3 text-amber-500 fill-amber-500/20" /> {e.foodDetails.calories} kCal</span>
                        )}
                        {e.foodDetails?.healthRating && (
                          <span className="flex items-center gap-0.5 text-indigo-400"><Heart className="w-3 h-3 text-indigo-400 fill-indigo-400/10" /> Grade {e.foodDetails.healthRating}/5</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-white text-sm">-${e.amount.toFixed(2)}</p>
                    <span className="text-[9px] text-slate-500 font-mono">Debit pipeline</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Nutritional Coaching block */}
        <div className="lg:col-span-4">
          <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm tracking-tight text-white">Dynamic macro coach</h3>
            </div>
            
            <p className="text-slate-400 text-xs leading-relaxed">
              Dining behaviors and fast-food transactions represent the highest variance of discretionary spending for students. Keep eating balanced to support both cognitive load and pocketbook thresholds.
            </p>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <p className="font-semibold text-slate-200">Balanced Habits</p>
              
              <ul className="space-y-2 text-[11px] text-slate-400 list-disc list-inside">
                <li>Limit high-calories delivery services.</li>
                <li>Avoid meal tracking discrepancies.</li>
                <li>Cook meals containing organic macros.</li>
              </ul>
            </div>
            
            <div className="pt-2 flex items-center gap-2 text-[10px] text-indigo-400 font-mono">
              <ShieldCheck className="w-4 h-4" /> Recommended threshold active
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
