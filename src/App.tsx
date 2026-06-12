/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  getListings,
  addListing,
  markAsSold,
  deleteListing,
  isSupabaseConfigured,
  SQL_SCHEMA,
} from './supabaseClient';
import { Listing } from './types';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import AddItem from './components/AddItem';
import Analytics from './components/Analytics';
import {
  LayoutDashboard,
  PackageCheck,
  PlusSquare,
  BarChart3,
  Copy,
  Check,
  RefreshCw,
  Database,
  X,
  Smartphone,
  Info,
} from 'lucide-react';

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'add' | 'analytics'>('dashboard');
  const [isSqlGuideOpen, setIsSqlGuideOpen] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial listings from backend
  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getListings();
      setListings(data);
    } catch (err) {
      console.error('Error loading inventory dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddListing = async (title: string, listingPrice: number, storageLocation: string) => {
    const newItem = await addListing(title, listingPrice, storageLocation);
    await loadData();
    return newItem;
  };

  const handleMarkAsSold = async (id: string, buyingCost: number, soldPrice: number) => {
    await markAsSold(id, buyingCost, soldPrice);
    await loadData();
  };

  const handleDeleteListing = async (id: string) => {
    await deleteListing(id);
    await loadData();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // Render current panel based on navigation state
  const renderPanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            listings={listings}
            onNavigate={setActiveTab}
            onOpenSqlGuide={() => setIsSqlGuideOpen(true)}
            isDbConnected={isSupabaseConfigured}
          />
        );
      case 'inventory':
        return (
          <Inventory
            listings={listings}
            onMarkAsSold={handleMarkAsSold}
            onDelete={handleDeleteListing}
          />
        );
      case 'add':
        return (
          <AddItem
            onAddListing={handleAddListing}
            onNavigate={setActiveTab}
          />
        );
      case 'analytics':
        return <Analytics listings={listings} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-neutral-100 flex items-center justify-center p-0 md:p-6 select-none">
      
      {/* Flagship Device Mockup container */}
      <div className="w-full max-w-[420px] h-screen md:h-[860px] bg-[#0c0c0f] border border-neutral-800 md:rounded-[36px] shadow-[0_12px_40px_rgba(0,0,0,0.85)] relative flex flex-col overflow-hidden">
        
        {/* Device camera cutout or top bar notch */}
        <div className="hidden md:flex justify-center absolute top-2 inset-x-0 z-50 pointer-events-none">
          <div className="w-28 h-5 bg-[#0a0a0d] rounded-b-xl border-x border-b border-neutral-850 flex items-center justify-center">
            <div className="w-10 h-0.5 bg-neutral-800 rounded-full"></div>
          </div>
        </div>

        {/* Core Screen Viewport Area */}
        <div className="flex-1 overflow-hidden flex flex-col px-5 pt-8 pb-28 relative z-30">
          {renderPanel()}
        </div>

        {/* Sticky Floating Capsule Bottom Navigation Menu (Matches WHOOP layout perfectly) */}
        <div className="absolute bottom-4 inset-x-0 mx-auto max-w-[92%] bg-neutral-950 border border-neutral-800 p-1 rounded-xl flex justify-between items-center z-40 shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
          {/* Dashboard Icon */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 transition-all ${
              activeTab === 'dashboard' ? 'text-white' : 'text-neutral-550 hover:text-neutral-300'
            }`}
          >
            <LayoutDashboard size={15} />
            <span className="text-[9px] font-mono tracking-wide font-medium">Übersicht</span>
          </button>

          {/* Inventory Icon */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 transition-all ${
              activeTab === 'inventory' ? 'text-white' : 'text-neutral-550 hover:text-neutral-300'
            }`}
          >
            <PackageCheck size={15} />
            <span className="text-[9px] font-mono tracking-wide font-medium">Bestand</span>
          </button>

          {/* Load Item Icon */}
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 transition-all ${
              activeTab === 'add' ? 'text-white' : 'text-neutral-550 hover:text-neutral-300'
            }`}
          >
            <PlusSquare size={15} />
            <span className="text-[9px] font-mono tracking-wide font-medium">Eintragen</span>
          </button>

          {/* Financials Icon */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 transition-all ${
              activeTab === 'analytics' ? 'text-white' : 'text-neutral-550 hover:text-neutral-300'
            }`}
          >
            <BarChart3 size={15} />
            <span className="text-[9px] font-mono tracking-wide font-medium">Analysen</span>
          </button>
        </div>
      </div>
      {/* COMPACT FLOATING INSTRUCTION SHEET ON THE LEFT (Desktop viewports only) */}
      <div className="hidden lg:flex flex-col w-[350px] ml-8 space-y-4">
        <div className="whoop-card rounded-xl p-5 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Smartphone size={16} />
            <h3 className="text-xs font-bold font-sans uppercase tracking-wider">Zentrale</h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed font-mono">
            Optimierte Reseller-Umgebung.
          </p>
        </div>
      </div>

      {/* MODAL - SUPABASE SQL SCHEMA COMPANION EDITOR GUIDE */}
      {isSqlGuideOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#0c0c0f] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-850 bg-neutral-950">
              <div className="flex items-center gap-2">
                <Database className="text-white" size={14} />
                <h3 className="text-xs font-bold font-mono tracking-wide">STATUS</h3>
              </div>
              <button
                onClick={() => setIsSqlGuideOpen(false)}
                className="p-1 h-6 w-6 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 transition flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content body */}
            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="p-3 rounded bg-neutral-900 border border-neutral-850 text-emerald-400">
                <p className="font-bold">✓ VERBINDUNG AKTIV</p>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Cloud-Synchronisierung initialisiert.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-855 bg-neutral-950 text-right">
              <button
                onClick={() => setIsSqlGuideOpen(false)}
                className="px-4 py-2 rounded bg-white text-black font-bold font-mono text-xs tracking-wide uppercase"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
