import React from 'react';
import { Store, ShoppingCart, PackageCheck, Banknote, PlusCircle } from 'lucide-react';
import { DailySummary } from '../types';

interface TodaySummaryProps {
  summary: DailySummary;
  onStartNewOrder: () => void;
  targetShops?: number;
}

export const TodaySummary: React.FC<TodaySummaryProps> = ({
  summary,
  onStartNewOrder,
  targetShops = 20
}) => {
  const visitPercent = Math.min(100, Math.round((summary.shopsVisited / targetShops) * 100));

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-4">
      {/* Top Title & Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
            আজকের হিসাব
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            টার্গেট: {summary.shopsVisited} / {targetShops} দোকান ({visitPercent}%)
          </p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          আজকের বিক্রয়
        </span>
      </div>

      {/* Clean Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(4, visitPercent)}%` }}
        />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Sales Amount */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            <span>মোট বিক্রি</span>
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-600 leading-tight">
            ৳{summary.totalAmount.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
            <ShoppingCart className="w-3.5 h-3.5 text-sky-600" />
            <span>অর্ডার সংখ্যা</span>
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
            {summary.totalOrders} <span className="text-xs font-normal text-slate-400">টি</span>
          </p>
        </div>

        {/* Shops Visited */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
            <Store className="w-3.5 h-3.5 text-slate-600" />
            <span>দোকান ভিজিট</span>
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
            {summary.shopsVisited} <span className="text-xs font-normal text-slate-400">টি</span>
          </p>
        </div>

        {/* Total Items */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
            <PackageCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>মোট পণ্য</span>
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
            {summary.totalItems} <span className="text-xs font-normal text-slate-400">পিস</span>
          </p>
        </div>
      </div>

      {/* Main Order Action Button */}
      <button
        id="quick-start-order-button"
        onClick={onStartNewOrder}
        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
      >
        <PlusCircle className="w-5 h-5" />
        <span>নতুন অর্ডার কাটুন</span>
      </button>
    </div>
  );
};
