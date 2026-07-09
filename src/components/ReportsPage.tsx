/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { 
  Calendar, Award, AlertTriangle, 
  ShieldCheck, ArrowDownRight, Compass, Sparkles, TrendingUp 
} from 'lucide-react';
import { Expense, PaymentCard } from '../types';

interface ReportsPageProps {
  expenses: Expense[];
  cards: PaymentCard[];
}

export default function ReportsPage({ expenses, cards }: ReportsPageProps) {
  
  // 1. Calculate sector distributions (Donut Chart)
  const categoryChartData = useMemo(() => {
    const dataMap: Record<string, { name: string; value: number; color: string }> = {
      Food: { name: 'Food & Dining', value: 0, color: '#10b981' }, // Emerald
      Shopping: { name: 'Shopping & Tech', value: 0, color: '#8b5cf6' }, // Purple
      Transport: { name: 'Transport', value: 0, color: '#3b82f6' }, // Blue
      Utilities: { name: 'Utilities & Bills', value: 0, color: '#f59e0b' }, // Amber
      Entertainment: { name: 'Entertainment', value: 0, color: '#f43f5e' }, // Rose
      Other: { name: 'Other', value: 0, color: '#64748b' } // Slate
    };

    expenses.forEach(e => {
      const cat = e.category || 'Other';
      if (dataMap[cat]) {
        dataMap[cat].value += e.amount;
      } else {
        dataMap['Other'].value += e.amount;
      }
    });

    return Object.values(dataMap).filter(item => item.value > 0);
  }, [expenses]);

  // 2. Trend velocity line (Area Chart of past 7 days)
  const trendChartData = useMemo(() => {
    const dates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return dates.map(dt => {
      // Find expenses for this day
      const dayTotal = expenses
        .filter(e => e.date.split('T')[0] === dt)
        .reduce((sum, e) => sum + e.amount, 0);

      const dObj = new Date(dt);
      return {
        date: `${dObj.getMonth() + 1}/${dObj.getDate()}`,
        'Daily Burn': Number(dayTotal.toFixed(2)),
        'Safety Limit': 150 // fixed dummy guide
      };
    });
  }, [expenses]);

  // 3. GitHub contributions-style calendar heat map (last 30 days)
  const calendarHeatMapData = useMemo(() => {
    const totalDays = 28; // standard grid
    const start = new Date();
    start.setDate(start.getDate() - totalDays + 1);

    const cells = [];
    for (let i = 0; i < totalDays; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const iso = current.toISOString().split('T')[0];
      
      const dayExpenses = expenses.filter(e => e.date.split('T')[0] === iso);
      const totalAmount = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

      cells.push({
        date: iso,
        dayNum: current.getDate(),
        monthLabel: current.toLocaleString('default', { month: 'short' }),
        amount: totalAmount,
        count: dayExpenses.length
      });
    }
    return cells;
  }, [expenses]);

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const getHeatMapColor = (amt: number) => {
    if (amt === 0) return 'bg-slate-950 border-slate-800 text-slate-600';
    if (amt < 25) return 'bg-indigo-950/40 border-indigo-900/40 text-indigo-400';
    if (amt < 100) return 'bg-indigo-900/60 border-indigo-700/40 text-indigo-200';
    return 'bg-indigo-600/80 border-indigo-400/50 text-white font-bold';
  };

  return (
    <div id="reports_container" className="space-y-6 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Visual Telemetry</h1>
        <p className="text-slate-400 text-sm mt-0.5">Aggregated capital flow representations and burn schedules.</p>
      </div>

      {/* Main Row Charts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Cost Allocation Doughnut (7 columns) */}
        <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-bold text-sm text-white tracking-tight">Sector Concentrations</h2>
            <p className="text-[10px] text-slate-500">Cumulative discretionary distribution.</p>
          </div>

          <div className="h-64 relative flex items-center justify-center">
            {categoryChartData.length === 0 ? (
              <span className="text-xs text-slate-500">No category transactions found.</span>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Total Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Outflow</span>
                  <span className="text-xl font-bold text-white">${totalSpent.toFixed(0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Categories Legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] pt-3 border-t border-slate-800/60 font-mono">
            {categoryChartData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="truncate">{item.name}:</span>
                <span className="font-bold text-slate-200 ml-auto">${item.value.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Burn Schedule Velocity (7 columns) */}
        <div className="lg:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-bold text-sm text-white tracking-tight">Outflow Velocity (Past 7 Days)</h2>
            <p className="text-[10px] text-slate-500">Daily burn rates measured against risk tolerances.</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#64748b', fontSize: '10px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                <Area type="monotone" dataKey="Daily Burn" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBurn)" />
                <Area type="monotone" dataKey="Safety Limit" stroke="#f43f5e" strokeWidth={1} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Burn threshold reset daily</span>
            <span className="flex items-center gap-1 text-emerald-400"><ShieldCheck className="w-3.5 h-3.5" /> Optimal buffer</span>
          </div>
        </div>

      </div>

      {/* GitHub Style Calendar Grid View (Modern Visualization) */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <div>
            <h2 className="font-bold text-sm text-white tracking-tight font-sans">Active Ledger heatmap</h2>
            <p className="text-[10px] text-slate-500">28-day chronological cash flow density visualization.</p>
          </div>
        </div>

        {/* Heat Map Calendar Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
          {calendarHeatMapData.map((cell) => (
            <div
              key={cell.date}
              className={`p-3 border rounded-xl flex flex-col justify-between gap-1 aspect-square transition hover:scale-105 select-none ${getHeatMapColor(cell.amount)}`}
            >
              <div className="flex justify-between items-start text-[10px] font-mono">
                <span>{cell.dayNum}</span>
                <span className="opacity-60">{cell.monthLabel}</span>
              </div>
              <div className="text-right">
                {cell.amount > 0 ? (
                  <p className="text-[10px] font-bold tracking-tight">${cell.amount.toFixed(0)}</p>
                ) : (
                  <p className="text-[10px] opacity-40 font-mono">-</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
          <span>Outflow Intensity:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-950 border border-slate-800"></span>
            <span>$0</span>
            <span className="w-2.5 h-2.5 rounded bg-indigo-950/40 border border-indigo-900/40"></span>
            <span>&lt; $25</span>
            <span className="w-2.5 h-2.5 rounded bg-indigo-900/60 border border-indigo-700/40"></span>
            <span>&lt; $100</span>
            <span className="w-2.5 h-2.5 rounded bg-indigo-600/80 border border-indigo-400/50"></span>
            <span>$100+</span>
          </div>
        </div>

      </div>

    </div>
  );
}
