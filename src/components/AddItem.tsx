/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, MapPin, PlusCircle, CheckCircle } from 'lucide-react';

interface AddItemProps {
  onAddListing: (title: string, listingPrice: number, storageLocation: string) => Promise<any>;
  onNavigate: (tab: 'dashboard' | 'inventory' | 'add' | 'analytics') => void;
}

export default function AddItem({ onAddListing, onNavigate }: AddItemProps) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newlyAddedItem, setNewlyAddedItem] = useState<any>(null);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Bitte gib eine Vinted-Artikelbezeichnung ein.');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Bitte gib einen gültigen Listenpreis an.');
      return;
    }

    if (!location.trim()) {
      setError('Bitte gib einen physischen Lagerort an.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await onAddListing(title, numericPrice, location);
      setNewlyAddedItem(res);
      setSuccess(true);
      setTitle('');
      setPrice('');
      setLocation('');
    } catch (err: any) {
      setError(err?.message || 'Registrierung fehlgeschlagen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success && newlyAddedItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 text-center pb-24">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400">
            <CheckCircle size={32} />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white tracking-tight">ERFASST</h2>
          <p className="text-xs text-emerald-400 font-mono">Erfolgreich gespeichert.</p>
        </div>

        <div className="w-full whoop-card p-5 border border-neutral-800 text-left space-y-3">
          <div>
            <span className="text-[8px] font-mono text-neutral-500 uppercase block">ARTIKELBEZEICHNUNG</span>
            <span className="text-xs font-bold text-white">{newlyAddedItem.title}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
            <div>
              <span className="text-[8px] font-mono text-neutral-500 uppercase block">LISTENPREIS</span>
              <span className="text-xs font-bold text-white">€{newlyAddedItem.listing_price.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[8px] font-mono text-neutral-500 uppercase block">LAGERORT</span>
              <span className="text-xs font-bold text-neutral-400 font-mono">{newlyAddedItem.storage_location}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={() => setSuccess(false)}
            className="w-full py-3 rounded-lg bg-white text-black font-sans text-xs font-bold hover:bg-neutral-200 transition flex items-center justify-center gap-1.5"
          >
            <PlusCircle size={13} /> Weiteren Artikel erfassen
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="w-full py-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-bold text-neutral-300 transition"
          >
            Zum Warenbestand
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-24 space-y-6">
      {/* Title */}
      <div className="px-1">
        <h2 className="text-xl font-bold text-white tracking-tight">ARTIKEL ERSTELLEN</h2>
        <p className="text-xs text-neutral-500 font-mono mt-0.5">Neuer Bestand.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title input */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono font-bold text-neutral-450 uppercase tracking-wider pl-1 font-semibold">Artikelbezeichnung</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500 pointer-events-none">
              <Sparkles size={12} />
            </span>
            <input
              type="text"
              placeholder="z.B. Carhartt Jacke"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2.5 pl-9 pr-4 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-all font-mono"
            />
          </div>
        </div>

        {/* Listing Price */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono font-bold text-neutral-450 uppercase tracking-wider pl-1 font-semibold">Preis (€)</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-500 pointer-events-none font-mono text-xs select-none">
              €
            </span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2.5 pl-9 pr-4 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-all font-mono"
            />
          </div>
        </div>

        {/* Storage Location Locator */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono font-bold text-neutral-450 uppercase tracking-wider pl-1 font-semibold">Lagerort</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-500 pointer-events-none">
              <MapPin size={12} />
            </span>
            <input
              type="text"
              placeholder="z.B. Box 3"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2.5 pl-9 pr-4 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-all font-mono"
            />
          </div>
        </div>



        {/* Errors section */}
        {error && (
          <div className="p-2 bg-neutral-950 border border-red-900/40 rounded text-xs text-red-400 font-mono">
            {error}
          </div>
        )}

        {/* CTA Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 mt-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? 'Speichert...' : 'Speichern'}
        </button>
      </form>
    </div>
  );
}
