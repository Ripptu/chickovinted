/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Listing } from '../types';
import { TrendingUp, Database, Sparkles, ChevronRight, Package, Search } from 'lucide-react';

interface DashboardProps {
  listings: Listing[];
  onNavigate: (tab: 'dashboard' | 'inventory' | 'add' | 'analytics') => void;
  onOpenSqlGuide: () => void;
  isDbConnected: boolean;
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default function Dashboard({ listings, onNavigate, onOpenSqlGuide, isDbConnected }: DashboardProps) {
  const [timeframe, setTimeframe] = useState<'Täglich' | 'Wöchentlich' | 'Monatlich'>('Täglich');

  // Compute Key Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalNetProfit = 0;
    let activeCount = 0;
    let soldCount = 0;

    listings.forEach(item => {
      if (item.status === 'Sold') {
        soldCount++;
        const p = item.sold_price || 0;
        const c = item.buying_cost || 0;
        totalRevenue += p;
        totalCost += c;
        totalNetProfit += (p - c);
      } else {
        activeCount++;
      }
    });

    return {
      totalRevenue,
      totalNetProfit,
      totalCost,
      activeCount,
      soldCount,
      profitMargin: totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0
    };
  }, [listings]);

  const dailyProfitData = useMemo(() => {
    const days: { date: Date; label: string; profit: number }[] = [];
    const weekdayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = i === 0 ? 'Heute' : weekdayLabels[d.getDay()];
      days.push({
        date: d,
        label: dayLabel,
        profit: 0
      });
    }

    listings.forEach(item => {
      if (item.status === 'Sold' && item.sold_at) {
        const itemDate = new Date(item.sold_at);
        const itemProfit = (item.sold_price || 0) - (item.buying_cost || 0);
        
        const match = days.find(day => 
          day.date.getFullYear() === itemDate.getFullYear() &&
          day.date.getMonth() === itemDate.getMonth() &&
          day.date.getDate() === itemDate.getDate()
        );
        
        if (match) {
          match.profit += itemProfit;
        }
      }
    });

    return days.map((day, idx) => ({
      label: day.label,
      value: day.profit,
      isHighlighted: idx === days.length - 1
    }));
  }, [listings]);

  const weeklyProfitData = useMemo(() => {
    const weeks: { year: number; weekNum: number; label: string; profit: number }[] = [];
    
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const weekNum = getWeekNumber(d);
      const year = d.getFullYear();
      const label = i === 0 ? 'Diese W.' : `KW ${weekNum}`;
      weeks.push({
        year,
        weekNum,
        label,
        profit: 0
      });
    }

    listings.forEach(item => {
      if (item.status === 'Sold' && item.sold_at) {
        const itemDate = new Date(item.sold_at);
        const itemProfit = (item.sold_price || 0) - (item.buying_cost || 0);
        const itemWeek = getWeekNumber(itemDate);
        const itemYear = itemDate.getFullYear();

        const match = weeks.find(w => w.year === itemYear && w.weekNum === itemWeek);
        if (match) {
          match.profit += itemProfit;
        }
      }
    });

    return weeks.map((w, idx) => ({
      label: w.label,
      value: w.profit,
      isHighlighted: idx === weeks.length - 1
    }));
  }, [listings]);

  const monthlyProfitData = useMemo(() => {
    const months: { year: number; monthIdx: number; label: string; profit: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const label = i === 0 ? 'Diesen M.' : monthNames[monthIdx];
      months.push({
        year,
        monthIdx,
        label,
        profit: 0
      });
    }

    listings.forEach(item => {
      if (item.status === 'Sold' && item.sold_at) {
        const itemDate = new Date(item.sold_at);
        const itemProfit = (item.sold_price || 0) - (item.buying_cost || 0);
        const itemMonth = itemDate.getMonth();
        const itemYear = itemDate.getFullYear();

        const match = months.find(m => m.year === itemYear && m.monthIdx === itemMonth);
        if (match) {
          match.profit += itemProfit;
        }
      }
    });

    return months.map((m, idx) => ({
      label: m.label,
      value: m.profit,
      isHighlighted: idx === months.length - 1
    }));
  }, [listings]);

  // Generate vertical bars to match a crisp minimalist WHOOP chart
  const barData = useMemo(() => {
    switch (timeframe) {
      case 'Täglich':
        return dailyProfitData;
      case 'Wöchentlich':
        return weeklyProfitData;
      case 'Monatlich':
        return monthlyProfitData;
      default:
        return dailyProfitData;
    }
  }, [timeframe, dailyProfitData, weeklyProfitData, monthlyProfitData]);

  // Sum chart total for the statistics header
  const chartSum = useMemo(() => {
    return barData.reduce((acc, curr) => acc + curr.value, 0);
  }, [barData]);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-24 space-y-6">

      {/* WHOOP Metric Card: Available profits with high contrast layout */}
      <div className="relative rounded-xl whoop-card p-5 border border-neutral-800">
        <div>
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">Reingewinn</span>
          <div className="flex items-baseline gap-1 mt-1">
            <h1 className="text-3xl font-bold text-white tracking-tight font-sans">
              €{metrics.totalNetProfit.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>
          
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-emerald-500">
            <span className="font-bold flex items-center gap-0.5">
              <TrendingUp size={11} />
              +{metrics.profitMargin.toFixed(0)}%
            </span>
            <span className="text-neutral-500">Ø Marge</span>
          </div>
        </div>

        {/* Dynamic KPI summary indicators */}
        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-neutral-800">
          <div>
            <span className="text-[9px] text-neutral-500 font-mono block">AKTIV</span>
            <span className="text-xs font-medium text-white font-sans">{metrics.activeCount} Artikel</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-neutral-500 font-mono block">Ø GEWINN</span>
            <span className="text-xs font-bold text-white font-sans">€{metrics.soldCount > 0 ? (metrics.totalNetProfit / metrics.soldCount).toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '0'}</span>
          </div>
        </div>
      </div>

      {/* Toggle switches matching WHOOP dark capsule selector */}
      <div className="space-y-3">
        {/* Pill Selection Swinger */}
        <div className="flex bg-[#0a0a0d] border border-neutral-800 p-1 rounded-lg">
          {(['Täglich', 'Wöchentlich', 'Monatlich'] as const).map(item => {
            const isActive = timeframe === item;
            return (
              <button
                key={item}
                onClick={() => setTimeframe(item)}
                className={`flex-1 py-1.5 text-[10px] rounded-md font-bold font-sans tracking-wide transition-all ${
                  isActive
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Raw performance representation bar chart */}
      <div className="whoop-card rounded-xl p-5 border border-neutral-850 space-y-4">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-xl font-bold text-white font-sans">
              €{chartSum.toLocaleString('de-DE')}
            </span>
            <span className="text-[9px] font-mono text-neutral-400 block mt-0.5 uppercase">Gewinn ({timeframe})</span>
          </div>
          <span className="text-[9px] text-neutral-400 font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded">
            AKTIV
          </span>
        </div>

        {/* Minimalist Column Bars */}
        <div className="h-32 flex items-end justify-between px-2 pt-4 relative">
          {/* Subtle grid lines */}
          <div className="absolute inset-x-0 bottom-4 top-2 flex flex-col justify-between pointer-events-none opacity-5">
            <div className="border-b border-white w-full" />
            <div className="border-b border-white w-full" />
          </div>

          {barData.map((bar, idx) => {
            const maxVal = Math.max(...barData.map(b => b.value));
            const fillPercent = (bar.value / maxVal) * 100;

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                {/* Visual Bar Column */}
                <div className="w-4 bg-neutral-900 rounded h-20 relative overflow-hidden flex items-end">
                  <div
                    style={{ height: `${fillPercent}%` }}
                    className={`w-full rounded transition-all duration-550 ${
                      bar.isHighlighted
                        ? 'bg-white'
                        : 'bg-neutral-800 hover:bg-neutral-700'
                    }`}
                  />
                </div>
                {/* Day Label */}
                <span className={`text-[9px] font-mono font-bold ${bar.isHighlighted ? 'text-white' : 'text-neutral-600'}`}>
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latest Transactions Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-wider">TRANSAKTIONEN</h3>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-[10px] text-neutral-400 hover:text-white font-semibold flex items-center gap-0.5"
          >
            Alle <ChevronRight size={12} />
          </button>
        </div>

        <div className="space-y-2">
          {listings.slice(0, 3).map(item => {
            const isSold = item.status === 'Sold';
            const profit = isSold ? (item.sold_price || 0) - (item.buying_cost || 0) : null;

            return (
              <div
                key={item.id}
                onClick={() => onNavigate('inventory')}
                className="whoop-card-interactive p-4 flex items-center justify-between cursor-pointer border border-neutral-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded flex items-center justify-center transition-all ${
                    isSold
                      ? 'bg-neutral-900 text-emerald-400 border border-neutral-800'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                  }`}>
                    <Package size={14} />
                  </div>
                  
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate max-w-[170px]">{item.title}</h4>
                    <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px] text-neutral-500">
                      <span className="text-neutral-400 font-semibold">{item.storage_location}</span>
                      <span>•</span>
                      <span>{new Date(item.created_at).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-xs font-bold font-sans ${isSold ? 'text-emerald-400' : 'text-white'}`}>
                    {isSold ? `+€${profit?.toFixed(2)}` : `€${item.listing_price.toFixed(2)}`}
                  </p>
                  <p className="text-[9px] font-mono text-neutral-500 mt-0.5 uppercase tracking-wider">
                    {isSold ? 'Verkauft' : 'Aktiv'}
                  </p>
                </div>
              </div>
            );
          })}

          {listings.length === 0 && (
            <div className="whoop-card p-8 text-center border-dashed border-neutral-800 space-y-1">
              <p className="text-xs text-neutral-500 font-mono">Noch kein Bestand eingetragen.</p>
              <button 
                onClick={() => onNavigate('add')}
                className="text-xs text-white underline font-bold"
              >
                Jetzt Artikel hinzufügen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
