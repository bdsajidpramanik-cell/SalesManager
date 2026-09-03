import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, User, Download, History, Store, Package } from 'lucide-react';
import { Salesman } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  salesman: Salesman;
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  onSync: () => void;
  onOpenSalesmanModal: () => void;
  onOpenHistory: () => void;
  onOpenExport: () => void;
  onOpenCatalog: () => void;
  activeTab: 'home' | 'history';
  setActiveTab: (tab: 'home' | 'history') => void;
}

export const Header: React.FC<HeaderProps> = ({
  salesman,
  isOnline,
  pendingSyncCount,
  isSyncing,
  onSync,
  onOpenSalesmanModal,
  onOpenExport,
  onOpenCatalog,
  activeTab,
  setActiveTab
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-xs border-b border-slate-800">
      {/* Top Main Bar */}
      <div className="px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-xs border border-emerald-400/40 shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white leading-tight flex items-center gap-1.5">
              <span>অর্ডার কালেকশন</span>
            </h1>
            <p className="text-[11px] text-emerald-400 font-medium truncate max-w-[150px] sm:max-w-xs flex items-center gap-1">
              <span>জোন: মোহাম্মদপুর, ঢাকা</span>
            </p>
          </div>
        </div>

        {/* Right Status & Profile Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Online/Offline Status & Sync Button */}
          <button
            id="sync-status-button"
            onClick={onSync}
            disabled={isSyncing || !isOnline}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition ${
              !isOnline
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : pendingSyncCount > 0
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400 animate-pulse'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>অফলাইন</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : pendingSyncCount > 0 ? (
                  <span>{pendingSyncCount} বাকি</span>
                ) : (
                  <span>অনলাইন</span>
                )}
              </>
            )}
          </button>

          {/* Salesman Profile Button */}
          <button
            id="salesman-profile-button"
            onClick={onOpenSalesmanModal}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 pl-1 pr-2.5 py-1 rounded-full text-xs font-medium border border-slate-700 transition"
            title="সেলসম্যান প্রোফাইল দেখুন"
          >
            {salesman.image ? (
              <img
                src={salesman.image}
                alt={salesman.name}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover border border-emerald-400"
              />
            ) : (
              <User className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="font-semibold text-[11px]">{salesman.name.split(' ')[0]}</span>
          </button>
        </div>
      </div>

      {/* Offline Alert Strip */}
      {!isOnline && (
        <div id="offline-alert-banner" className="bg-amber-500 text-slate-950 px-3 py-1 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            <span>ইন্টারনেট নেই — অর্ডার মোবাইলে সেভ থাকবে, নেট পেলে ড্রাইভ ও ক্লাউডে যাবে</span>
          </div>
        </div>
      )}

      {/* Minimalist 4 Navigation Tabs */}
      <div className="grid grid-cols-4 border-t border-slate-800 bg-slate-950 text-xs">
        <button
          id="nav-tab-home"
          onClick={() => setActiveTab('home')}
          className={`py-2.5 font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'home'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-900/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Store className="w-4 h-4 shrink-0" />
          <span>দোকান</span>
        </button>

        <button
          id="nav-tab-products"
          onClick={onOpenCatalog}
          className="py-2.5 font-bold text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5"
        >
          <Package className="w-4 h-4 text-amber-400 shrink-0" />
          <span>পণ্য ও রেট</span>
        </button>

        <button
          id="nav-tab-history"
          onClick={() => setActiveTab('history')}
          className={`py-2.5 font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-900/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span>হিস্ট্রি</span>
        </button>

        <button
          id="nav-tab-export"
          onClick={onOpenExport}
          className="py-2.5 font-bold text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5"
        >
          <Download className="w-4 h-4 text-sky-400 shrink-0" />
          <span>ড্রাইভ</span>
        </button>
      </div>

      {/* PWA Install Banner */}
      {!isInstalled && isInstallable && (
        <div id="pwa-install-banner" className="bg-emerald-700 text-white px-3 py-1.5 flex items-center justify-between text-xs">
          <span>অ্যাপটি ফোনে ইনস্টল করুন</span>
          <button
            id="pwa-install-button"
            onClick={install}
            className="bg-white text-emerald-900 font-bold px-2.5 py-0.5 rounded text-xs hover:bg-slate-100"
          >
            ইনস্টল
          </button>
        </div>
      )}

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3">
            <h3 className="font-bold text-base">iPhone-এ ইনস্টল করার নিয়ম</h3>
            <ol className="text-xs space-y-1.5 text-slate-600 list-decimal list-inside">
              <li>Safari ব্রাউজারে নিচের <strong>Share</strong> চাপুন।</li>
              <li>স্ক্রোল করে <strong>Add to Home Screen</strong> দিন।</li>
              <li>উপরে ডানে <strong>Add</strong> চাপুন।</li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
