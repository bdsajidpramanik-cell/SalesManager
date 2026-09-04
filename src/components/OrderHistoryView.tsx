import React, { useState, useMemo } from 'react';
import { Search, Calendar, Store, Clock, ChevronRight, RotateCcw, FileText, X, CheckCircle2 } from 'lucide-react';
import { Order, Shop } from '../types';
import { getTodayDateString } from '../services/storage';
import { getCurrentScheduleStatus } from '../services/dailyScheduleService';
import { MonthlyTargetCard } from './MonthlyTargetCard';

interface OrderHistoryViewProps {
  orders: Order[];
  shops: Shop[];
  onRepeatOrder: (order: Order, shop: Shop) => void;
  onSelectShop: (shop: Shop) => void;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orders,
  shops,
  onRepeatOrder
}) => {
  const today = getTodayDateString();
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday'>('all');
  const [selectedShopId, setSelectedShopId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (dateFilter === 'today' && order.date !== today) return false;
      if (dateFilter === 'yesterday' && order.date !== yesterday) return false;
      if (selectedShopId !== 'all' && order.shopId !== selectedShopId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = order.shopName.toLowerCase().includes(q);
        const matchesId = order.id.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }

      return true;
    });
  }, [orders, dateFilter, selectedShopId, searchQuery, today, yesterday]);

  const totalFilteredAmount = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-3">
      {/* Monthly Target Tracker (Top of History view, 1-time change per month, tracks 100% completion) */}
      <MonthlyTargetCard orders={orders} />

      {/* Header & Filter Card */}
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              অর্ডার হিস্ট্রি ({filteredOrders.length})
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
            মোট: ৳{totalFilteredAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Date Filter Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setDateFilter('today')}
            className={`py-1.5 rounded-lg transition ${
              dateFilter === 'today'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            আজকে ({orders.filter((o) => o.date === today).length})
          </button>
          <button
            onClick={() => setDateFilter('yesterday')}
            className={`py-1.5 rounded-lg transition ${
              dateFilter === 'yesterday'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            গতকাল ({orders.filter((o) => o.date === yesterday).length})
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`py-1.5 rounded-lg transition ${
              dateFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            সব ({orders.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="অর্ডার নং বা দোকান খুঁজুন..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6 space-y-1">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-slate-700 font-bold text-sm">কোনো অর্ডার পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400">তারিখ বা ফিল্টার পরিবর্তন করে দেখুন</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const targetShop = shops.find((s) => s.id === order.shopId) || {
              id: order.shopId,
              name: order.shopName,
              ownerName: '',
              phone: order.shopPhone,
              address: order.shopAddress,
              route: ''
            };

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200 space-y-2"
              >
                {/* Header: Shop Name & Amount */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 font-mono">{order.id}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          order.status === 'synced'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {order.status === 'synced' ? 'সিঙ্কড' : 'পেন্ডিং'}
                      </span>
                      {order.date < today || (order.date === today && getCurrentScheduleStatus().isFinalizedWindow) ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>সম্পূর্ণ (রাত ৯টা)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          আজকের চলমান
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug truncate mt-0.5">
                      {order.shopName}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-emerald-600 leading-tight">
                      ৳{order.totalAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {order.totalItems} পদ • {order.totalQuantity} পিস
                    </p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{order.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{order.time}</span>
                  </span>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => setViewingOrder(order)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition"
                  >
                    <span>ভাউচার</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onRepeatOrder(order, targetShop)}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition shadow-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>রিপিট অর্ডার</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Viewing Order Full Voucher Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[88vh] flex flex-col shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  অর্ডার ভাউচার
                </p>
                <h3 className="font-bold text-sm text-slate-900">
                  {viewingOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 text-xs pr-0.5">
              <div className="bg-slate-50 p-2.5 rounded-xl space-y-1">
                <p className="font-bold text-slate-900 text-sm">{viewingOrder.shopName}</p>
                <p className="text-slate-500 text-[11px]">{viewingOrder.shopAddress}</p>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                  <span>{viewingOrder.date} {viewingOrder.time}</span>
                  <span>SR: {viewingOrder.salesmanName}</span>
                </div>
              </div>

              {/* Items */}
              <div className="bg-slate-50 rounded-xl p-2.5 divide-y divide-slate-200">
                {viewingOrder.items.map((item, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{item.productNameBn || item.productName}</p>
                      <p className="text-[10px] text-slate-500">
                        {item.quantity} পিস × ৳{item.unitPrice}
                      </p>
                    </div>
                    <span className="font-black text-slate-900">
                      ৳{item.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {viewingOrder.notes && (
                <div className="bg-amber-50 p-2 rounded-xl text-amber-900 text-xs">
                  <strong>নোট:</strong> {viewingOrder.notes}
                </div>
              )}

              <div className="bg-emerald-50 rounded-xl p-2.5 flex justify-between items-center text-xs font-bold">
                <span className="text-emerald-900">সর্বমোট:</span>
                <span className="text-emerald-700 text-base font-black">
                  ৳{viewingOrder.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => {
                  const targetShop = shops.find((s) => s.id === viewingOrder.shopId) || {
                    id: viewingOrder.shopId,
                    name: viewingOrder.shopName,
                    ownerName: '',
                    phone: viewingOrder.shopPhone,
                    address: viewingOrder.shopAddress,
                    route: ''
                  };
                  setViewingOrder(null);
                  onRepeatOrder(viewingOrder, targetShop);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>রিপিট অর্ডার করুন</span>
              </button>
              <button
                onClick={() => setViewingOrder(null)}
                className="px-3 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                বন্ধ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
