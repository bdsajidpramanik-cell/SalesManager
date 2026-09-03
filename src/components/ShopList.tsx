import React, { useState, useMemo } from 'react';
import { Search, Phone, MapPin, ChevronRight, Plus, ShoppingBag, Store } from 'lucide-react';
import { Shop } from '../types';

interface ShopListProps {
  shops: Shop[];
  onSelectShop: (shop: Shop) => void;
  onDirectOrder: (shop: Shop) => void;
  onAddNewShop: () => void;
}

export const ShopList: React.FC<ShopListProps> = ({
  shops,
  onSelectShop,
  onDirectOrder,
  onAddNewShop
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');

  // Extract unique routes
  const routes = useMemo(() => {
    const list = Array.from(new Set(shops.map((s) => s.route).filter(Boolean)));
    return ['all', ...list];
  }, [shops]);

  // Filtered shops
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        shop.name.toLowerCase().includes(q) ||
        (shop.nameBn && shop.nameBn.includes(q)) ||
        shop.phone.includes(q) ||
        shop.address.toLowerCase().includes(q) ||
        shop.ownerName.toLowerCase().includes(q);

      const matchesRoute = selectedRoute === 'all' || shop.route === selectedRoute;

      return matchesSearch && matchesRoute;
    });
  }, [shops, searchQuery, selectedRoute]);

  return (
    <div className="space-y-3">
      {/* Search and Filter Section */}
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Store className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              দোকান তালিকা ({filteredShops.length})
            </h3>
          </div>
          <button
            id="btn-add-new-shop"
            onClick={onAddNewShop}
            className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 font-bold px-2.5 py-1.5 rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন দোকান</span>
          </button>
        </div>

        {/* Minimal Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="shop-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="দোকানের নাম বা ঠিকানা দিয়ে খুঁজুন..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white font-medium"
          />
          {searchQuery && (
            <button
              id="btn-clear-shop-search"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Route Filter Pills */}
        {routes.length > 2 && (
          <div className="flex gap-1.5 overflow-x-auto pt-1 no-scrollbar text-xs">
            {routes.map((route) => (
              <button
                key={route}
                onClick={() => setSelectedRoute(route)}
                className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition ${
                  selectedRoute === route
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {route === 'all' ? 'সব রুট' : route}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Shop Cards List */}
      <div className="space-y-2.5">
        {filteredShops.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <Store className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-slate-700 font-bold text-sm">কোনো দোকান পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400">নাম যাচাই করুন বা নতুন দোকান যোগ করুন</p>
            <button
              onClick={onAddNewShop}
              className="mt-2 inline-flex items-center gap-1.5 bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন দোকান যোগ করুন</span>
            </button>
          </div>
        ) : (
          filteredShops.map((shop) => (
            <div
              key={shop.id}
              className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200 hover:border-slate-300 transition space-y-2.5"
            >
              {/* Header: Shop Info & Phone */}
              <div className="flex items-start justify-between gap-2">
                <div
                  onClick={() => onSelectShop(shop)}
                  className="cursor-pointer flex-1 min-w-0"
                >
                  <h4 className="font-black text-slate-900 text-base leading-tight hover:text-emerald-700 transition truncate">
                    {shop.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                    মালিক: {shop.ownerName}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{shop.address}</span>
                  </p>
                </div>

                {/* Call Button */}
                {shop.phone && (
                  <a
                    href={`tel:${shop.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 hover:bg-emerald-50 hover:text-emerald-700 transition"
                    title="ফোন করুন"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Last order summary */}
              {shop.lastOrderDate && (
                <div
                  onClick={() => onSelectShop(shop)}
                  className="cursor-pointer px-2.5 py-1 bg-slate-50 rounded-lg flex items-center justify-between text-[11px] text-slate-600"
                >
                  <span>আগের অর্ডার: {shop.lastOrderDate}</span>
                  <span className="font-bold text-slate-800">
                    ৳{shop.lastOrderAmount?.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id={`btn-shop-details-${shop.id}`}
                  onClick={() => onSelectShop(shop)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition"
                >
                  <span>বিবরণ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  id={`btn-shop-order-${shop.id}`}
                  onClick={() => onDirectOrder(shop)}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>অর্ডার কাটুন</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
