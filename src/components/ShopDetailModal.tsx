import React, { useState, useRef } from 'react';
import { X, Phone, MapPin, Calendar, Clock, ShoppingBag, RotateCcw, ChevronDown, ChevronUp, Store, Camera, Trash2 } from 'lucide-react';
import { Shop, Order } from '../types';

interface ShopDetailModalProps {
  shop: Shop | null;
  previousOrders: Order[];
  onClose: () => void;
  onStartNewOrder: (shop: Shop) => void;
  onRepeatOrder: (order: Order, shop: Shop) => void;
  onUpdateShop?: (shop: Shop) => void;
}

export const ShopDetailModal: React.FC<ShopDetailModalProps> = ({
  shop,
  previousOrders,
  onClose,
  onStartNewOrder,
  onRepeatOrder,
  onUpdateShop
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    previousOrders[0]?.id || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!shop) return null;

  const lastOrder = previousOrders[0];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateShop) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          onUpdateShop({ ...shop, image: compressed });
        } else {
          onUpdateShop({ ...shop, image: event.target?.result as string });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (!onUpdateShop) return;
    if (window.confirm('দোকানের ছবিটি মুছে ফেলতে চান?')) {
      const updated = { ...shop };
      delete updated.image;
      onUpdateShop(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base leading-tight truncate">
                {shop.name}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {shop.ownerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 overflow-y-auto space-y-3 flex-1">
          {/* Shop Photo */}
          {shop.image ? (
            <div className="relative h-36 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={shop.image}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-black/60 text-white p-1.5 rounded-full"
                  title="ছবি পরিবর্তন"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRemovePhoto}
                  className="bg-rose-600 text-white p-1.5 rounded-full"
                  title="ছবি মুছুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 font-medium flex items-center justify-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-slate-400" />
              <span>দোকানের ছবি যোগ করুন</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          {/* Contact & Location */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px] block">স্বত্বাধিকারী</span>
                <span className="font-bold text-slate-900 text-sm">{shop.ownerName}</span>
              </div>
              {shop.phone && (
                <a
                  href={`tel:${shop.phone}`}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg"
                >
                  <Phone className="w-3 h-3" />
                  <span>{shop.phone}</span>
                </a>
              )}
            </div>

            <div className="flex items-start gap-1 text-slate-600 pt-1.5 border-t border-slate-200/60">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{shop.address}</span>
            </div>

            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-200/60">
              <span>রুট: <strong>{shop.route}</strong></span>
              <span>কোড: <strong>{shop.id}</strong></span>
            </div>
          </div>

          {/* Main Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onStartNewOrder(shop)}
              className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>নতুন অর্ডার</span>
            </button>

            {lastOrder ? (
              <button
                onClick={() => onRepeatOrder(lastOrder, shop)}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>রিপিট অর্ডার</span>
              </button>
            ) : (
              <div className="py-3 px-3 bg-slate-100 text-slate-400 font-medium text-xs rounded-xl flex items-center justify-center text-center">
                আগে অর্ডার নেই
              </div>
            )}
          </div>

          {/* Previous Orders */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>পূর্বের অর্ডার ({previousOrders.length})</span>
              </h4>
              {lastOrder && (
                <span className="text-[10px] text-slate-500">
                  সর্বশেষ: {lastOrder.date}
                </span>
              )}
            </div>

            {previousOrders.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-200 p-3">
                <p className="text-slate-500 text-xs">এই দোকানে পূর্বে কোনো অর্ডার নেওয়া হয়নি</p>
              </div>
            ) : (
              <div className="space-y-2">
                {previousOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2"
                    >
                      <div
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-800">{order.id}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              order.status === 'synced'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {order.status === 'synced' ? 'সিঙ্কড' : 'পেন্ডিং'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {order.date} • {order.time}
                          </p>
                        </div>

                        <div className="text-right flex items-center gap-1.5">
                          <div>
                            <p className="text-sm font-black text-emerald-600">
                              ৳{order.totalAmount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {order.totalItems} পদ ({order.totalQuantity} পিস)
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs animate-in fade-in duration-150">
                          <div className="bg-slate-50 rounded-xl p-2 divide-y divide-slate-200">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="py-1 flex justify-between text-xs">
                                <div>
                                  <span className="font-bold text-slate-900">{item.productNameBn || item.productName}</span>
                                  <span className="text-[10px] text-slate-500 block">
                                    {item.quantity} পিস × ৳{item.unitPrice}
                                  </span>
                                </div>
                                <span className="font-bold text-slate-900">
                                  ৳{item.total.toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => onRepeatOrder(order, shop)}
                            className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 active:scale-98 font-bold text-xs rounded-xl flex items-center justify-center gap-1 border border-emerald-200 transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>রিপিট অর্ডার করুন</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-200 text-slate-800 font-bold rounded-xl text-xs hover:bg-slate-300"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
