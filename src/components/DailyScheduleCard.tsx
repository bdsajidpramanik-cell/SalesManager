import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Calendar,
  Cloud,
  Loader2,
  FileSpreadsheet,
  LogIn
} from 'lucide-react';
import { Order } from '../types';
import {
  getCurrentScheduleStatus,
  getDailyBatchState,
  autoSyncTodayBatchToGoogleDrive,
  ScheduleStatus,
  DailyBatchState
} from '../services/dailyScheduleService';
import { getAccessToken, googleSignIn } from '../services/googleAuth';

interface DailyScheduleCardProps {
  orders: Order[];
  onOpenExportModal?: () => void;
  onShowToast?: (msg: string) => void;
}

export const DailyScheduleCard: React.FC<DailyScheduleCardProps> = ({
  orders,
  onOpenExportModal,
  onShowToast
}) => {
  const [schedule, setSchedule] = useState<ScheduleStatus>(() => getCurrentScheduleStatus());
  const [batchState, setBatchState] = useState<DailyBatchState>(() => getDailyBatchState());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Today's orders count
  const todayOrders = orders.filter((o) => o.date === schedule.todayDate);
  const hasTodayOrders = todayOrders.length > 0;

  // Real-time minute tick to update schedule status (e.g. at 20:00 or 21:00)
  useEffect(() => {
    const update = () => {
      const current = getCurrentScheduleStatus();
      setSchedule(current);
      setBatchState(getDailyBatchState(current.todayDate));
    };

    update();
    const interval = setInterval(update, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Update batch state whenever orders change
  useEffect(() => {
    const updated = getDailyBatchState(schedule.todayDate);
    setBatchState(updated);

    // If there is at least 1 order and user is already authenticated with Google, auto-sync
    if (hasTodayOrders) {
      getAccessToken().then((token) => {
        if (token && updated.sheetSyncStatus !== 'synced') {
          handleSyncNow(false);
        }
      });
    }
  }, [orders.length, schedule.todayDate]);

  const handleSyncNow = async (force: boolean = true) => {
    if (todayOrders.length === 0) {
      if (onShowToast) onShowToast('আজকের কোনো অর্ডার নেই। অর্ডার নিলে শিটে জমা হবে।');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await autoSyncTodayBatchToGoogleDrive(orders, force);
      if (res.success) {
        setBatchState(getDailyBatchState(schedule.todayDate));
        if (onShowToast) {
          onShowToast(`আজকের ${todayOrders.length}টি অর্ডার গুগল শিটে সংরক্ষিত হয়েছে`);
        }
      } else if (res.error) {
        if (onShowToast) onShowToast(res.error);
      }
    } catch (e: any) {
      console.error(e);
      if (onShowToast) onShowToast('শিট সিঙ্ক ব্যর্থ হয়েছে');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleConnect = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        if (onShowToast) onShowToast(`গুগল অ্যাকাউন্ট কানেক্ট হয়েছে: ${res.user.displayName || res.user.email}`);
        // Immediately sync today's orders if any exist
        if (todayOrders.length > 0) {
          await handleSyncNow(true);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (onShowToast) onShowToast('গুগল সাইন ইন সম্পন্ন হয়নি');
    } finally {
      setIsSigningIn(false);
    }
  };

  // User Requirement: During order collection window (সকাল ৯:০০ থেকে সন্ধ্যা ৮:০০),
  // do NOT show these boxes on the homepage. Only show when order time ends (সন্ধ্যা ৮টার পর বা সমাপনী/সম্পূর্ণ সময়ে).
  if (schedule.isCollectionWindowActive) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
              দৈনিক অর্ডার শিডিউল ও ড্রাইভ শিট
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              সকাল ৯:০০ - সন্ধ্যা ৮:০০ সাবমিট • রাত ৯:০০ টায় সম্পূর্ণ
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              schedule.isFinalizedWindow
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : schedule.isClosingWindow
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : schedule.isCollectionWindowActive
                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                : 'bg-slate-100 text-slate-700 border border-slate-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                schedule.isFinalizedWindow
                  ? 'bg-emerald-600'
                  : schedule.isClosingWindow
                  ? 'bg-amber-600 animate-pulse'
                  : schedule.isCollectionWindowActive
                  ? 'bg-sky-600 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            {schedule.isFinalizedWindow
              ? 'সম্পূর্ণ (Finalized)'
              : schedule.isClosingWindow
              ? 'সমাপনী চলছে'
              : schedule.isCollectionWindowActive
              ? 'সাবমিট চলছে'
              : 'অপেক্ষা'}
          </span>
        </div>
      </div>

      {/* Schedule Info Box */}
      <div
        className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          schedule.isFinalizedWindow
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
            : schedule.isClosingWindow
            ? 'bg-amber-50/60 border-amber-200 text-amber-950'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold">
            {schedule.isFinalizedWindow ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : schedule.isClosingWindow ? (
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
            )}
            <span>{schedule.badgeTitle}</span>
          </div>
          <p className="text-[11px] opacity-85">{schedule.badgeDescription}</p>
        </div>

        <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/50">
          <span className="text-[10px] text-slate-500 block">বর্তমান সময়</span>
          <span className="font-bold text-slate-800 text-xs">{schedule.formattedTime}</span>
        </div>
      </div>

      {/* Google Sheets / Drive Sync Status for Today */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-xs text-slate-900">
              আজকের গুগল শিট ({schedule.todayDate}):
            </span>
          </div>

          <div className="text-[11px]">
            {hasTodayOrders ? (
              <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                {todayOrders.length} টি অর্ডার তৈরি
              </span>
            ) : (
              <span className="text-slate-500">আজকে এখনো অর্ডার নেওয়া হয়নি</span>
            )}
          </div>
        </div>

        {/* Sync Status Banner */}
        {batchState.sheetSyncStatus === 'synced' && batchState.spreadsheetUrl ? (
          <div className="bg-white border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="truncate">শিটে আপলোড সম্পন্ন ({batchState.spreadsheetName})</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {batchState.lastSyncedAt ? `শেষ আপডেট: ${batchState.lastSyncedAt}` : 'সর্বশেষ ডাটা সিঙ্কড'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={batchState.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs transition"
              >
                <span>শিট খুলুন</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => handleSyncNow(true)}
                disabled={isSyncing}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                title="পুনরায় সিঙ্ক করুন"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs">
              <div className="flex items-center gap-1 text-slate-700 font-bold">
                <Cloud className="w-3.5 h-3.5 text-sky-600" />
                <span>ফাইল নাম: Sales_Orders_{schedule.todayDate}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {hasTodayOrders
                  ? 'অর্ডারগুলো রাত ৯টার মধ্যে স্বয়ংক্রিয় সম্পূর্ণ হিসেবে ড্রাইভে জমা হবে'
                  : '১টি অর্ডার সাবমিট হলেও আজকের তারিখ সহ গুগল ড্রাইভে চলে যাবে'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGoogleConnect}
                disabled={isSigningIn || isSyncing}
                className="w-full sm:w-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>কানেক্ট হচ্ছে...</span>
                  </>
                ) : isSyncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>শিটে সেভ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>ড্রাইভে সিঙ্ক করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Helper Note for Salesman */}
        <p className="text-[10px] text-slate-500 leading-tight">
          💡 <strong>সেলসম্যানের জন্য তথ্য:</strong> সকাল ৯টা থেকে সন্ধ্যা ৮টার মধ্যে অর্ডার এন্ট্রি করুন। ১টি অর্ডার হলেও তা রাত ৯টার মধ্যে চূড়ান্ত “সম্পূর্ণ” হিসেবে স্প্রেডশিটে আপলোড হবে।
        </p>
      </div>
    </div>
  );
};
