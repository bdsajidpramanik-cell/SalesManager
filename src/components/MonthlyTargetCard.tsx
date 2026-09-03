import React, { useState, useEffect, useMemo } from 'react';
import { Target, TrendingUp, CheckCircle2, Edit3, Award, Calendar, AlertCircle, X, Sparkles } from 'lucide-react';
import { Order } from '../types';

interface MonthlyTargetCardProps {
  orders: Order[];
}

const BANGLA_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর'
];

export const MonthlyTargetCard: React.FC<MonthlyTargetCardProps> = ({ orders }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const monthKey = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;
  const monthNameBn = `${BANGLA_MONTHS[currentMonthIdx]} ${currentYear}`;

  // Days calculation
  const totalDaysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

  // Storage keys for target and 1-time change restriction
  const targetKey = `salesman_monthly_target_val_${monthKey}`;
  const changedKey = `salesman_monthly_target_changed_${monthKey}`;

  // Default target is 150,000 BDT
  const [targetAmount, setTargetAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(targetKey);
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return 150000;
  });

  // Has target been changed this month
  const [hasChangedThisMonth, setHasChangedThisMonth] = useState<boolean>(() => {
    try {
      return localStorage.getItem(changedKey) === 'true';
    } catch {
      return false;
    }
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [newTargetInput, setNewTargetInput] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');

  // Sync to localStorage if target changes
  useEffect(() => {
    try {
      localStorage.setItem(targetKey, targetAmount.toString());
    } catch (e) {
      console.error(e);
    }
  }, [targetAmount, targetKey]);

  // Calculate this month's orders and total sales
  const currentMonthOrders = useMemo(() => {
    return orders.filter((o) => o.date && o.date.startsWith(monthKey));
  }, [orders, monthKey]);

  const monthTotalSales = useMemo(() => {
    return currentMonthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [currentMonthOrders]);

  // Percentage towards 100%
  const percentAchieved = targetAmount > 0 ? (monthTotalSales / targetAmount) * 100 : 0;
  const roundedPercent = Math.round(percentAchieved * 10) / 10;
  const progressPercentClamped = Math.min(100, Math.max(0, roundedPercent));
  const isGoalAchieved = monthTotalSales >= targetAmount;

  // Remaining
  const remainingAmount = Math.max(0, targetAmount - monthTotalSales);
  const dailyRequiredRate = remainingAmount > 0 ? Math.ceil(remainingAmount / daysRemaining) : 0;

  const handleOpenEdit = () => {
    setNewTargetInput(targetAmount.toString());
    setInputError('');
    setShowEditModal(true);
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newTargetInput.trim());
    if (isNaN(val) || val <= 0) {
      setInputError('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন (যেমন: ২০০০০০)');
      return;
    }
    if (val < 10000) {
      setInputError('টার্গেট সর্বনিম্ন ১০,০০০ টাকা হতে হবে');
      return;
    }

    setTargetAmount(val);
    setHasChangedThisMonth(true);
    try {
      localStorage.setItem(targetKey, val.toString());
      localStorage.setItem(changedKey, 'true');
    } catch (err) {
      console.error(err);
    }
    setShowEditModal(false);
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-200 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-xs">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                মাসিক টার্গেট ট্র্যাকার
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                {monthNameBn}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              প্রতিদিনের বিক্রয়ের সাথে সাথে ১০০% পূরণ লক্ষ্যমাত্রা
            </p>
          </div>
        </div>

        {/* Change Target Button */}
        <div>
          <button
            id="btn-edit-monthly-target"
            onClick={handleOpenEdit}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition ${
              hasChangedThisMonth
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
            title={hasChangedThisMonth ? 'এই মাসে টার্গেট ১ বার পরিবর্তন করা হয়েছে' : 'মাসের টার্গেট বসান বা পরিবর্তন করুন'}
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{hasChangedThisMonth ? 'টার্গেট দেখুন' : 'টার্গেট সেট করুন'}</span>
          </button>
        </div>
      </div>

      {/* Visual Progress Bar to 100% */}
      <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 font-bold text-slate-900">
            <span>টার্গেট অর্জন:</span>
            <span
              className={`text-sm ${
                isGoalAchieved ? 'text-emerald-600 font-extrabold' : 'text-slate-900'
              }`}
            >
              {roundedPercent}%
            </span>
            {isGoalAchieved && (
              <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                <Sparkles className="w-2.5 h-2.5" /> ১০০% সম্পন্ন
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            লক্ষ্য: ৳{targetAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Progress Track */}
        <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ease-out rounded-full ${
              isGoalAchieved
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : progressPercentClamped >= 50
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                : 'bg-gradient-to-r from-amber-500 to-emerald-500'
            }`}
            style={{ width: `${progressPercentClamped}%` }}
          />
        </div>

        {/* Progress Milestones */}
        <div className="flex justify-between text-[10px] text-slate-600 font-medium px-0.5 pt-0.5">
          <span>০%</span>
          <span>২৫%</span>
          <span>৫০%</span>
          <span>৭৫%</span>
          <span className="font-bold text-emerald-700">১০০% টার্গেট</span>
        </div>
      </div>

      {/* 4 Stat Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Metric 1: Month Sales */}
        <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-emerald-800 text-[11px] font-semibold mb-1">
            <span>মাসের মোট সেলস</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="font-extrabold text-base text-emerald-950">
            ৳{monthTotalSales.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-emerald-700 mt-0.5">
            {currentMonthOrders.length} টি অর্ডার সম্পন্ন
          </p>
        </div>

        {/* Metric 2: Monthly Target */}
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-600 text-[11px] font-semibold mb-1">
            <span>নির্ধারিত টার্গেট</span>
            <Target className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="font-extrabold text-base text-slate-900">
            ৳{targetAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {hasChangedThisMonth ? 'মাসে ১ বার নির্ধারিত' : 'পরিবর্তনযোগ্য'}
          </p>
        </div>

        {/* Metric 3: Target Percentage */}
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-600 text-[11px] font-semibold mb-1">
            <span>টার্গেট পূরণ</span>
            <Award className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="font-extrabold text-base text-slate-900">
            {roundedPercent}%
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {isGoalAchieved ? '১০০% এর বেশি অর্জিত' : `বাকি ${(100 - progressPercentClamped).toFixed(1)}%`}
          </p>
        </div>

        {/* Metric 4: Remaining to reach 100% */}
        <div className={`p-2.5 rounded-xl border ${
          isGoalAchieved
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-amber-50/70 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
            <span>{isGoalAchieved ? 'অতিরিক্ত সেলস' : 'বাকি আছে'}</span>
            <CheckCircle2 className={`w-3.5 h-3.5 ${isGoalAchieved ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div className="font-extrabold text-base">
            ৳{isGoalAchieved
              ? (monthTotalSales - targetAmount).toLocaleString('en-IN')
              : remainingAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] opacity-85 mt-0.5">
            {isGoalAchieved ? 'টার্গেট পার হয়েছে' : '১০০% লক্ষ্য পূরণ করতে'}
          </p>
        </div>
      </div>

      {/* Advice Strip: Daily Sales Requirement */}
      <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-[11px] text-slate-700">
            {isGoalAchieved ? (
              <span className="font-semibold text-emerald-700">
                🎉 অসাধারণ সাফল্য! চলতি মাসের নির্ধারিত লক্ষ্যমাত্রা সম্পূর্ণ অর্জিত হয়েছে।
              </span>
            ) : (
              <span>
                চলতি মাসে বাকি <strong>{daysRemaining} দিন</strong> • ১০০% পূরণের জন্য প্রতিদিন গড়ে{' '}
                <strong className="text-emerald-700">৳{dailyRequiredRate.toLocaleString('en-IN')}</strong> টাকার অর্ডার প্রয়োজন।
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Target Change Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">
                    মাসিক সেলস টার্গেট সেটিং
                  </h4>
                  <p className="text-[11px] text-slate-500">{monthNameBn}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {hasChangedThisMonth ? (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>মাসে ১ বার পরিবর্তন নীতি</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    আপনি এই মাসে ইতোমধ্যে একবার টার্গেট নির্ধারণ করেছেন:{' '}
                    <strong>৳{targetAmount.toLocaleString('en-IN')}</strong>। নিয়ম অনুযায়ী প্রতি মাসে একবার টার্গেট পরিবর্তনযোগ্য।
                  </p>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span>চলতি মাসের সেলস:</span>
                    <strong className="text-emerald-700">৳{monthTotalSales.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>অর্জিত হয়েছে:</span>
                    <strong className="text-slate-900">{roundedPercent}%</strong>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
                  >
                    বুঝেছি, বন্ধ করুন
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveTarget} className="space-y-3 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-900">
                  💡 <strong>মাসে একবার পরিবর্তনযোগ্য:</strong> এই মাসে আপনার বিক্রয় লক্ষ্যমাত্রা কত টাকা নির্ধারণ করতে চান তা লিখুন। প্রতিদিনের অর্ডার অনুযায়ী এটি স্বয়ংক্রিয়ভাবে ১০০% পূরণ হিসাব করবে।
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {monthNameBn} মাসের টার্গেট (টাকায়) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">৳</span>
                    <input
                      type="number"
                      required
                      min={10000}
                      step={1000}
                      value={newTargetInput}
                      onChange={(e) => {
                        setNewTargetInput(e.target.value);
                        setInputError('');
                      }}
                      placeholder="যেমন: 150000"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-bold text-sm"
                    />
                  </div>
                  {inputError && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">{inputError}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    টার্গেট সেভ করুন
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
