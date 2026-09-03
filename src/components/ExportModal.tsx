import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Cloud,
  ExternalLink,
  Loader2,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { storageService, getTodayDateString } from '../services/storage';
import { Order } from '../types';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken
} from '../services/googleAuth';
import { syncOrdersToGoogleSheets, DriveSyncResult } from '../services/googleDriveService';
import { User } from 'firebase/auth';

interface ExportModalProps {
  orders: Order[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ orders, onClose }) => {
  const today = getTodayDateString();
  const [selectedFilter, setSelectedFilter] = useState<'today' | 'all'>('today');
  const [isExported, setIsExported] = useState(false);

  // Google OAuth & Drive state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [driveResult, setDriveResult] = useState<DriveSyncResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoSync24h, setAutoSync24h] = useState<boolean>(() => {
    return localStorage.getItem('auto_sync_drive_24h') === 'true';
  });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('last_drive_sync_timestamp');
  });

  const todayOrdersCount = orders.filter((o) => o.date === today).length;
  const allOrdersCount = orders.length;

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setHasToken(!!token);
      },
      () => {
        setCurrentUser(null);
        setHasToken(false);
      }
    );

    getAccessToken().then((token) => {
      if (token) setHasToken(true);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleToggleAutoSync = () => {
    const nextVal = !autoSync24h;
    setAutoSync24h(nextVal);
    localStorage.setItem('auto_sync_drive_24h', String(nextVal));
  };

  const handleLocalCSVDownload = () => {
    storageService.exportOrdersToCSV(selectedFilter === 'today' ? today : 'all');
    setIsExported(true);
    setTimeout(() => setIsExported(false), 3000);
  };

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setHasToken(true);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMessage(err.message || 'গুগল সাইন ইন ব্যর্থ হয়েছে');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setHasToken(false);
    setDriveResult(null);
  };

  const handleDriveBackup = async () => {
    setIsSyncingDrive(true);
    setErrorMessage(null);
    setDriveResult(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('গুগল অ্যাকাউন্ট সাইন ইন করা নেই। সাইন ইন বাটনে চাপুন।');
      }

      const ordersToSync =
        selectedFilter === 'today'
          ? orders.filter((o) => o.date === today)
          : orders;

      if (ordersToSync.length === 0) {
        throw new Error('ব্যাকআপ করার মতো কোনো অর্ডার পাওয়া যায়নি।');
      }

      const targetDateToSync = selectedFilter === 'today' ? today : '';
      const result = await syncOrdersToGoogleSheets(ordersToSync, targetDateToSync);
      setDriveResult(result);

      const nowStr = new Date().toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      setLastSyncTime(nowStr);
      localStorage.setItem('last_drive_sync_timestamp', nowStr);
      localStorage.setItem('last_drive_sync_epoch', String(Date.now()));
    } catch (err: any) {
      console.error('Drive sync error:', err);
      setErrorMessage(err.message || 'গুগল ড্রাইভে সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-3.5 border border-slate-200 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                ড্রাইভ ও এক্সেল ব্যাকআপ
              </h3>
              <p className="text-[11px] text-slate-500">
                গুগল ড্রাইভ ও এক্সেল ফাইল
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-0.5">
          {/* Filter options */}
          <div className="grid grid-cols-2 gap-2">
            <div
              onClick={() => setSelectedFilter('today')}
              className={`p-2.5 rounded-xl border cursor-pointer transition ${
                selectedFilter === 'today'
                  ? 'border-emerald-600 bg-emerald-50/50 font-bold'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <input
                  type="radio"
                  name="exportFilter"
                  checked={selectedFilter === 'today'}
                  onChange={() => setSelectedFilter('today')}
                  className="accent-emerald-600"
                />
              </div>
              <p className="text-xs text-slate-900">আজকের অর্ডার</p>
              <p className="text-[11px] text-slate-500">{todayOrdersCount} টি</p>
            </div>

            <div
              onClick={() => setSelectedFilter('all')}
              className={`p-2.5 rounded-xl border cursor-pointer transition ${
                selectedFilter === 'all'
                  ? 'border-emerald-600 bg-emerald-50/50 font-bold'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
                <input
                  type="radio"
                  name="exportFilter"
                  checked={selectedFilter === 'all'}
                  onChange={() => setSelectedFilter('all')}
                  className="accent-emerald-600"
                />
              </div>
              <p className="text-xs text-slate-900">সব অর্ডার</p>
              <p className="text-[11px] text-slate-500">{allOrdersCount} টি</p>
            </div>
          </div>

          {/* Google Drive Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-sky-600" />
                <h4 className="font-bold text-xs text-slate-900">
                  গুগল ড্রাইভ কানেকশন
                </h4>
              </div>

              {currentUser && (
                <button
                  onClick={handleGoogleLogout}
                  className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <LogOut className="w-3 h-3" />
                  <span>লগআউট</span>
                </button>
              )}
            </div>

            {!currentUser || !hasToken ? (
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 text-center">
                <p className="text-xs text-slate-600">
                  গুগল অ্যাকাউন্ট কানেক্ট করলে অর্ডার ড্রাইভ স্প্রেডশিটে সেভ হবে।
                </p>

                <button
                  id="btn-google-sign-in"
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn}
                  className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 active:scale-98 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>কানেক্ট হচ্ছে...</span>
                    </>
                  ) : (
                    <span>গুগল অ্যাকাউন্টে সাইন ইন করুন</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-900">
                        {currentUser.displayName || 'Google Account'}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[180px]">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                    কানেক্টেড
                  </span>
                </div>

                {/* Auto Sync Toggle */}
                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-900">
                      স্বয়ংক্রিয় ব্যাকআপ (২৪ ঘণ্টা)
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {lastSyncTime ? `শেষ ব্যাকআপ: ${lastSyncTime}` : 'অটোমেটিক ব্যাকআপ চালু'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAutoSync}
                    className={`w-10 h-5 rounded-full transition relative ${
                      autoSync24h ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                        autoSync24h ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sync Button */}
                <button
                  id="btn-sync-to-google-drive"
                  onClick={handleDriveBackup}
                  disabled={isSyncingDrive || (selectedFilter === 'today' ? todayOrdersCount === 0 : allOrdersCount === 0)}
                  className="w-full mt-1 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSyncingDrive ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>ড্রাইভে সেভ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5" />
                      <span>গুগল ড্রাইভে শিট তৈরি করুন</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {driveResult && (
              <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-2.5 text-xs text-emerald-950 space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ড্রাইভে সেভ হয়েছে!</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  ফাইল: {driveResult.spreadsheetName} ({driveResult.totalOrdersExported} টি অর্ডার)
                </p>
                <a
                  href={driveResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-sky-800 hover:underline pt-0.5"
                >
                  <span>শিট ফাইলটি খুলুন</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-2 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Local Download */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
            <h4 className="font-bold text-xs text-slate-900">
              ফোনে ডাউনলোড (.csv)
            </h4>
            {isExported && (
              <p className="text-xs text-emerald-700 font-bold">
                ফাইল ডাউনলোড হয়েছে!
              </p>
            )}
            <button
              id="btn-download-local-csv"
              onClick={handleLocalCSVDownload}
              disabled={allOrdersCount === 0}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>এক্সেল ফাইল ডাউনলোড</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
