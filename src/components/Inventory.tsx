/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Listing } from '../types';
import { Search, MapPin, Trash2, Check, Tag, Info, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface InventoryProps {
  listings: Listing[];
  onMarkAsSold: (id: string, buyingCost: number, soldPrice: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function Inventory({ listings, onMarkAsSold, onDelete }: InventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Listed' | 'Sold'>('All');
  
  // Track which listing is currently undergoing "Mark as Sold" conversion
  const [sellFormId, setSellFormId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [buyingCostInput, setBuyingCostInput] = useState('');
  const [soldPriceInput, setSoldPriceInput] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter listings based on criteria
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.storage_location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [listings, searchTerm, statusFilter]);

  // Handle Mark as Sold selection
  const handleOpenSellForm = (item: Listing) => {
    setSellFormId(item.id);
    setBuyingCostInput('');
    // Propose listing price as default sold price to save time!
    setSoldPriceInput(item.listing_price.toString());
    setSubmitError('');
  };

  const handleCancelSellForm = () => {
    setSellFormId(null);
    setSubmitError('');
  };

  const handleSubmitSell = async (id: string) => {
    const cost = parseFloat(buyingCostInput);
    const price = parseFloat(soldPriceInput);

    if (isNaN(cost) || cost < 0) {
      setSubmitError('Bitte einen gültigen Einkaufspreis eingeben.');
      return;
    }
    if (isNaN(price) || price < 0) {
      setSubmitError('Bitte einen gültigen Verkaufspreis eingeben.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');
      await onMarkAsSold(id, cost, price);
      setSellFormId(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Statusaktualisierung fehlgeschlagen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview Profit on the fly as they type
  const liveNetProfit = useMemo(() => {
    const cost = parseFloat(buyingCostInput);
    const price = parseFloat(soldPriceInput);
    if (isNaN(cost) || isNaN(price)) return null;
    return price - cost;
  }, [buyingCostInput, soldPriceInput]);

  // Calculate total worth of active listings
  const activeListingsTotalValue = useMemo(() => {
    return listings
      .filter(item => item.status === 'Listed')
      .reduce((sum, item) => sum + (item.listing_price || 0), 0);
  }, [listings]);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-24 space-y-4">
      {/* Header & Stats Info */}
      <div className="px-1">
        <h2 className="text-xl font-bold text-white tracking-tight">BESTAND</h2>
        <p className="text-xs text-neutral-500 font-mono mt-0.5">Aktive Listungen.</p>
      </div>

      {/* Total Active Listing Value Stat */}
      <div className="rounded-xl whoop-card p-4 border border-neutral-800 bg-[#0c0c0f]">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[8px] text-neutral-500 font-mono block uppercase tracking-wider">WARENWERT</span>
            <span className="text-lg font-bold text-white font-sans mt-0.5 block">
              €{activeListingsTotalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[8px] text-neutral-500 font-mono block uppercase tracking-wider font-bold">ARTIKEL</span>
            <span className="text-xs font-semibold text-neutral-300 font-sans mt-0.5 block">
              {listings.filter(l => l.status === 'Listed').length} aktiv
            </span>
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500 pointer-events-none">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Suche Titel oder Lagerort..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-all font-mono"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex bg-[#0a0a0d] border border-neutral-800 p-1 rounded-lg">
          {(['All', 'Listed', 'Sold'] as const).map(tab => {
            const isActive = statusFilter === tab;
            const count = listings.filter(l => tab === 'All' || l.status === tab).length;

            const labelMap = {
              All: 'Alle',
              Listed: 'Gelistet',
              Sold: 'Verkauft'
            };

            return (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setSellFormId(null);
                }}
                className={`flex-1 py-1 text-[11px] text-center font-bold rounded-md font-sans transition-all duration-200 ${
                  isActive
                    ? 'bg-neutral-800 text-white border border-neutral-750 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {labelMap[tab]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Listings Thread */}
      <div className="space-y-3">
        {filteredListings.map(item => {
          const isSelected = sellFormId === item.id;
          const isSold = item.status === 'Sold';
          const netProfit = isSold ? (item.sold_price || 0) - (item.buying_cost || 0) : null;

          return (
            <div
              key={item.id}
              className={`rounded-lg border transition-all duration-200 relative overflow-hidden ${
                isSelected
                  ? 'bg-neutral-900 border-neutral-700'
                  : 'whoop-card-interactive border-neutral-800'
              }`}
            >
              {/* Premium custom deletion confirmation overlay to bypass sandbox iframe layout blocks */}
              {deleteConfirmId === item.id && (
                <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-3 text-center z-50">
                  <AlertTriangle size={20} className="text-red-400 mb-1" />
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Artikel löschen?</h4>
                  <p className="text-[9px] text-neutral-450 font-mono mt-0.5 mb-3 max-w-[85%] truncate">{item.title}</p>
                  <div className="flex gap-2 w-full max-w-[200px]">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 py-1 px-2.5 rounded bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 font-mono text-[9px] uppercase font-bold text-center transition"
                    >
                      Nein
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await onDelete(item.id);
                        } catch (err) {
                          console.error('Delete item failed:', err);
                        } finally {
                          setDeleteConfirmId(null);
                        }
                      }}
                      className="flex-1 py-1 px-2.5 rounded bg-red-950 lg:hover:bg-red-900 border border-red-900/30 text-red-200 font-mono text-[9px] uppercase font-extrabold text-center transition"
                    >
                      Ja, weg
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4">
                {/* Product Title and Actions */}
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-xs font-bold text-white tracking-wide truncate">{item.title}</h3>
                    
                    {/* Location Locator Tag - MANDATORY requirement */}
                    <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                      <MapPin size={10} className="text-neutral-500" />
                      <span className="font-semibold">{item.storage_location}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-1 rounded text-neutral-600 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Listing Details & Status Footer */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[8px] font-mono text-neutral-500 block uppercase">PREIS</span>
                      <span className="text-[11px] font-bold text-white">€{item.listing_price.toFixed(2)}</span>
                    </div>

                    {isSold ? (
                      <div>
                        <span className="text-[8px] font-mono text-neutral-500 block uppercase">GEWINN</span>
                        <span className="text-[11px] font-bold text-emerald-400">
                          +€{netProfit?.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[8px] font-mono text-neutral-500 block uppercase font-bold">STATUS</span>
                        <span className="inline-block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest bg-neutral-800 border border-neutral-755 px-1.5 py-0.2 rounded-sm">
                          Aktiv
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Operational Mark As Sold Trigger */}
                  {!isSold && !isSelected && (
                    <button
                      onClick={() => handleOpenSellForm(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 transition-all font-mono text-[9px] text-white font-bold uppercase tracking-wider h-7"
                    >
                      <Check size={10} />
                      Verkauft
                    </button>
                  )}
                </div>

                {/* MARK AS SOLD LIVE INLINE FORM PANEL */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-neutral-800 space-y-4">
                    <span className="text-[10px] font-mono uppercase text-white tracking-wide flex items-center gap-1 font-bold">
                      <Tag size={10} /> Eintrag
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] text-neutral-500 font-mono mb-1 uppercase">Einkauf (€)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={buyingCostInput}
                          onChange={(e) => setBuyingCostInput(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-850 rounded p-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-neutral-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-neutral-500 font-mono mb-1 uppercase">Verkauf (€)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={soldPriceInput}
                          onChange={(e) => setSoldPriceInput(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-850 rounded p-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-neutral-700 font-mono"
                        />
                      </div>
                    </div>

                    {/* Live profit calculations on-the-fly */}
                    {liveNetProfit !== null && (
                      <div className="p-2 bg-neutral-950 border border-neutral-850 rounded text-[10px] font-mono flex items-center justify-between">
                        <span className="text-neutral-500 font-bold">GEWINN:</span>
                        <span className={`font-black ${liveNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {liveNetProfit >= 0 ? '+' : ''}€{liveNetProfit.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {submitError && (
                      <div className="p-2 bg-neutral-950 border border-red-900/40 rounded text-[9px] text-red-400 font-mono flex items-center gap-1">
                        <AlertTriangle size={10} />
                        <span>{submitError}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelSellForm}
                        disabled={isSubmitting}
                        className="flex-1 py-1.5 rounded bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-white font-mono text-[10px] uppercase transition"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={() => handleSubmitSell(item.id)}
                        disabled={isSubmitting}
                        className="flex-1 py-1.5 rounded bg-white hover:bg-neutral-200 text-black font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                      >
                        {isSubmitting ? 'Wird gespeichert...' : 'Verkauf Bestätigen'}
                        <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredListings.length === 0 && (
          <div className="whoop-card p-10 text-center border-dashed border-neutral-800 space-y-2">
            <Info className="mx-auto text-neutral-600" size={24} />
            <h3 className="text-xs font-bold text-white">Keine Artikel gefunden</h3>
            <p className="text-[10px] text-neutral-500 font-mono">Verwende andere Suchbegriffe oder passe die Statusfilter an.</p>
          </div>
        )}
      </div>
    </div>
  );
}
