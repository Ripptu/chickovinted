/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Listing } from '../types';
import { Clock, Map } from 'lucide-react';

interface AnalyticsProps {
  listings: Listing[];
}

export default function Analytics({ listings }: AnalyticsProps) {
  // Aggregate stats
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalNetProfit = 0;
    let activeCount = 0;
    let soldCount = 0;
    let totalHoldingDays = 0;
    let soldWithDatesCount = 0;

    // Build location distribution counters
    const locDistribution: { [key: string]: { totalProfit: number; count: number } } = {};

    listings.forEach(item => {
      // Location calculations
      const loc = item.storage_location || 'Unbekannt';
      if (!locDistribution[loc]) {
        locDistribution[loc] = { totalProfit: 0, count: 0 };
      }
      locDistribution[loc].count += 1;

      if (item.status === 'Sold') {
        soldCount++;
        const p = item.sold_price || 0;
        const c = item.buying_cost || 0;
        totalRevenue += p;
        totalCost += c;
        const profit = p - c;
        totalNetProfit += profit;
        
        locDistribution[loc].totalProfit += profit;

        // Calc holding days
        if (item.sold_at && item.created_at) {
          const start = new Date(item.created_at).getTime();
          const end = new Date(item.sold_at).getTime();
          const diffDays = Math.max(1, Math.round((end - start) / 86400000));
          totalHoldingDays += diffDays;
          soldWithDatesCount++;
        }
      } else {
        activeCount++;
      }
    });

    // Format locations for visual ranking
    const locationRankings = Object.entries(locDistribution)
      .map(([name, stat]) => ({
        name,
        profit: stat.totalProfit,
        count: stat.count,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 4);

    const averageHoldingDays = soldWithDatesCount > 0 ? (totalHoldingDays / soldWithDatesCount) : null;
    const profitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    const roi = totalCost > 0 ? (totalNetProfit / totalCost) * 100 : 0;

    return {
      totalRevenue,
      totalNetProfit,
      totalCost,
      activeCount,
      soldCount,
      totalCount: listings.length,
      profitMargin,
      roi,
      averageHoldingDays,
      locationRankings
    };
  }, [listings]);

  // Extract all sold listings with financial breakdown to feed the Sales Ledger
  const soldListings = useMemo(() => {
    return listings
      .filter(item => item.status === 'Sold')
      .sort((a, b) => new Date(b.sold_at || 0).getTime() - new Date(a.sold_at || 0).getTime());
  }, [listings]);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-24 space-y-6">
      {/* Title */}
      <div className="px-1">
        <h2 className="text-xl font-bold text-white tracking-tight">ANALYSEN</h2>
        <p className="text-xs text-neutral-500 font-mono mt-0.5">Übersicht.</p>
      </div>

      {/* Primary Financial Splits */}
      <div className="whoop-card rounded-xl p-5 border border-neutral-800">
        <h3 className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-4">Kennzahlen</h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Profit Margin indicator custom */}
          <div className="flex flex-col justify-between">
            <span className="text-[9px] text-neutral-500 font-mono uppercase">Rendite (ROI)</span>
            <div className="my-2">
              <span className="text-2xl font-bold text-emerald-400 font-sans">
                {stats.roi.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-neutral-900 rounded h-1 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded" 
                style={{ width: `${Math.min(100, Math.max(5, stats.roi))}%` }}
              />
            </div>
            <span className="text-[9px] text-neutral-500 mt-1 font-mono">ROI</span>
          </div>

          {/* Average Stock Turnover Speed */}
          <div className="flex flex-col justify-between">
            <span className="text-[9px] text-neutral-500 font-mono uppercase">Lagerumschlag</span>
            <div className="my-2">
              <span className="text-2xl font-bold text-white font-sans flex items-baseline gap-1">
                {stats.averageHoldingDays !== null ? stats.averageHoldingDays.toFixed(1) : '--'}
                <span className="text-xs font-mono font-normal text-neutral-500">Tage</span>
              </span>
            </div>
            <div className="w-full bg-neutral-900 rounded h-1 overflow-hidden">
              <div 
                className="bg-neutral-500 h-full rounded" 
                style={{ width: `${Math.min(100, Math.max(10, 100 - (stats.averageHoldingDays || 10) * 3))}%` }}
              />
            </div>
            <span className="text-[9px] text-neutral-500 mt-1 font-mono">Verkaufszeit</span>
          </div>
        </div>
      </div>

      {/* Storage Locator Performance Ranker */}
      <div className="whoop-card rounded-xl p-4 border border-neutral-800">
        <h3 className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1">
          <Map size={11} /> Profit nach Lagerort
        </h3>

        <div className="space-y-3.5">
          {stats.locationRankings.map((loc, idx) => {
            const maxProfit = Math.max(...stats.locationRankings.map(l => l.profit), 1);
            const ratioPercentage = (loc.profit / maxProfit) * 100;
            return (
              <div key={loc.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-neutral-500 font-bold">0{idx + 1}</span>
                    <span className="font-medium text-white">{loc.name}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-white font-bold">€{loc.profit.toFixed(0)}</span>
                    <span className="text-neutral-500 text-[9px] ml-1.5">({loc.count} Artikel)</span>
                  </div>
                </div>
                <div className="w-full bg-neutral-900 h-1 rounded overflow-hidden">
                  <div 
                    className="bg-white h-full rounded transition-all duration-700" 
                    style={{ width: `${Math.max(4, ratioPercentage)}%` }}
                  />
                </div>
              </div>
            );
          })}

          {stats.locationRankings.length === 0 && (
            <p className="text-xs text-neutral-500 font-mono text-center py-4">Erfassung erforderlich für Statistiken.</p>
          )}
        </div>
      </div>

      {/* Ledger sales overview details */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold font-mono text-neutral-400 tracking-wider uppercase pl-1">VERKAUFSPROTOKOLL</h3>
        
        <div className="space-y-2">
          {soldListings.map(item => {
            const itemProfit = (item.sold_price || 0) - (item.buying_cost || 0);
            
            // Calc dynamic holding velocity
            let durationString = '--';
            if (item.sold_at && item.created_at) {
               const start = new Date(item.created_at).getTime();
               const end = new Date(item.sold_at).getTime();
               const diffDays = Math.max(1, Math.round((end - start) / 86400000));
               durationString = `${diffDays} ${diffDays > 1 ? 'Tage' : 'Tag'}`;
            }

            return (
              <div key={item.id} className="whoop-card rounded-xl p-4 border border-neutral-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-[210px]">{item.title}</h4>
                    
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] font-mono bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-semibold">
                        {item.storage_location}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-500 flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                        <Clock size={9} /> {durationString}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 font-mono block">
                      +€{itemProfit.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-neutral-500 font-mono block mt-0.5">Nettogewinn</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-800 text-[10px] font-mono text-neutral-450">
                  <div>
                    <span className="text-[8px] text-neutral-500 block">EINKAUF</span>
                    <span className="text-neutral-300">€{item.buying_cost?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-neutral-500 block">VERKAUF</span>
                    <span className="text-neutral-300">€{item.sold_price?.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-neutral-500 block">ROI</span>
                    <span className="text-emerald-400 font-semibold">
                      {item.buying_cost ? `${((itemProfit / item.buying_cost) * 105 - 5).toFixed(0)}%` : '100%'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {soldListings.length === 0 && (
            <div className="whoop-card p-8 text-center border-dashed border-neutral-800">
              <p className="text-xs text-neutral-500 font-mono">Keine Verkäufe.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
