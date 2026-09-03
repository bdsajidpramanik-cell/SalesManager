import React, { useState } from 'react';
import { CheckCircle2, ArrowLeft, Store, Calendar, Clock, Copy, Check } from 'lucide-react';
import { Shop, OrderItem, Salesman, Order } from '../types';
import { getCurrentTimeString, getTodayDateString } from '../services/storage';

interface OrderConfirmationModalProps {
  shop: Shop;
  salesman: Salesman;
  items: OrderItem[];
  notes?: string;
  isOnline: boolean;
  onConfirm: (orderData: Partial<Order>) => Promise<Order>;
  onBackToEdit: () => void;
  onFinish: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  shop,
  salesman,
  items,
  notes,
  isOnline,
  onConfirm,
  onBackToEdit,
  onFinish
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const orderDate = getTodayDateString();
  const orderTime = getCurrentTimeString();

  const totalItemsCount = items.length;
  const totalQuantityPcs = items.reduce((acc, it) => acc + it.quantity, 0);
  const grandTotalBdt = items.reduce((acc, it) => acc + it.total, 0);

  const handleConfirmClick = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const order = await onConfirm({
        shopId: shop.id,
        shopName: shop.name,
        shopPhone: shop.phone,
        shopAddress: shop.address,
        items,
        totalItems: totalItemsCount,
        totalQuantity: totalQuantityPcs,
        totalAmount: grandTotalBdt,
        date: orderDate,
        time: orderTime,
        timestamp: Date.now(),
        salesmanId: salesman.id,
        salesmanName: salesman.name,
        status: isOnline ? 'synced' : 'pending_sync',
        notes: notes || undefined
      });
      setCompletedOrder(order);
    } catch (err) {
      console.error(err);
      alert('অর্ডার সেভ করতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOrderId = () => {
    if (completedOrder) {
      navigator.clipboard.writeText(completedOrder.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // SUCCESS VOUCHER SCREEN
  if (completedOrder) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-200">
          {/* Success Badge */}
          <div className="text-center space-y-1">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              অর্ডার সেভ হয়েছে!
            </h2>
            <p className="text-xs text-slate-500">
              {completedOrder.shopName}
            </p>
          </div>

          {/* Simple Slip */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">অর্ডার নং:</span>
              <button
                onClick={copyOrderId}
                className="font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1"
              >
                <span>{completedOrder.id}</span>
                <Copy className="w-3 h-3 text-slate-400" />
                {copiedId && <span className="text-[10px] text-emerald-700">কপি হয়েছে</span>}
              </button>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">তারিখ ও সময়:</span>
              <span className="font-semibold text-slate-800">{completedOrder.date} {completedOrder.time}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">পণ্য সংখ্যা:</span>
              <span className="font-semibold text-slate-800">{completedOrder.totalItems} পদ ({completedOrder.totalQuantity} পিস)</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-700">মোট মূল্য:</span>
              <span className="text-lg font-black text-emerald-600">
                ৳{completedOrder.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Next Shop Button */}
          <button
            onClick={onFinish}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-xs transition"
          >
            পরবর্তী দোকানে যান
          </button>
        </div>
      </div>
    );
  }

  // REVIEW SCREEN BEFORE SUBMISSION
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToEdit}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-bold text-base leading-tight">
              অর্ডার নিশ্চিতকরণ
            </h2>
            <p className="text-[11px] text-slate-400">
              {shop.name}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-100">
        {/* Shop Mini Card */}
        <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-sm truncate">
                {shop.name}
              </h3>
              <p className="text-xs text-slate-500 truncate">{shop.address}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{orderDate} {orderTime}</span>
            <span>সেলসম্যান: {salesman.name}</span>
          </div>
        </div>

        {/* Selected Products List */}
        <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200 space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="font-bold text-xs text-slate-800">
              অর্ডারের পণ্য ({totalItemsCount} পদ)
            </h4>
            <button
              onClick={onBackToEdit}
              className="text-xs text-emerald-600 font-bold hover:underline"
            >
              পরিবর্তন
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <div className="flex-1 pr-2">
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">
                    {item.productNameBn || item.productName}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {item.quantity} পিস × ৳{item.unitPrice}
                  </p>
                </div>
                <div className="text-right font-black text-slate-900 text-xs sm:text-sm shrink-0">
                  ৳{item.total.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {notes && (
            <div className="bg-amber-50 rounded-xl p-2 text-xs text-amber-900 border border-amber-200">
              <strong>নোট:</strong> {notes}
            </div>
          )}

          {/* Total Calculation */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-1 border border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>মোট পদ:</span>
              <span className="font-bold text-slate-900">{totalItemsCount} টি</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>মোট পরিমাণ:</span>
              <span className="font-bold text-slate-900">{totalQuantityPcs} পিস</span>
            </div>
            <div className="flex justify-between text-slate-900 pt-1.5 border-t border-slate-200 text-sm font-black">
              <span>সর্বমোট:</span>
              <span className="text-emerald-600 text-lg font-black">
                ৳{grandTotalBdt.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Bottom Bar */}
      <div className="bg-white border-t border-slate-200 p-3 sm:p-4 shadow-xl shrink-0">
        <div className="max-w-md mx-auto space-y-2">
          <button
            id="btn-final-confirm-order"
            onClick={handleConfirmClick}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-base rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
          >
            {isSubmitting ? (
              <span>অর্ডার সেভ হচ্ছে...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>অর্ডার সেভ করুন</span>
              </>
            )}
          </button>

          <button
            id="btn-back-to-edit-order"
            onClick={onBackToEdit}
            className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 text-center"
          >
            ← ফিরে যান
          </button>
        </div>
      </div>
    </div>
  );
};
