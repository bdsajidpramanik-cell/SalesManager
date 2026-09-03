import React, { useState, useMemo } from 'react';
import { X, Search, Package, Gift, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface ProductCatalogModalProps {
  products: Product[];
  onClose: () => void;
  onResetCatalog: () => void;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  products,
  onClose,
  onResetCatalog
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('সকল পণ্য');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.categoryBn || p.category));
    return ['সকল পণ্য', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.nameBn.includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.categoryBn.includes(q);

      const categoryName = p.categoryBn || p.category;
      const matchesCat = selectedCategory === 'সকল পণ্য' || categoryName === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleReset = () => {
    if (window.confirm('সকল পণ্যের রেট তালিকা রিসেট করতে চান?')) {
      onResetCatalog();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-lg rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 border border-slate-200 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                পণ্য ও মূল্য তালিকা
              </h3>
              <p className="text-[11px] text-slate-500">
                রেকিট বেনকিজার • সেপ্টেম্বর ২০২৬
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

        {/* Search & Category Filter */}
        <div className="space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="পণ্যের নাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Badges */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {resetSuccess && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>মূল্য তালিকা সফলভাবে আপডেট হয়েছে!</span>
          </div>
        )}

        {/* Products List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
            <span>মোট: {filteredProducts.length} টি পণ্য</span>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-700 text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {p.nameBn}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    প্যাক: {p.packSize}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">ট্রেড মূল্য</p>
                  <p className="text-base font-black text-slate-900 leading-tight">
                    ৳{p.unitPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Profit & MRP row */}
              <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
                {p.mrp && (
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                    এমআরপি: ৳{p.mrp}
                  </span>
                )}
                {p.netProfit && (
                  <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                    লাভ: ৳{p.netProfit}
                  </span>
                )}
                {p.effectivePrice && p.effectivePrice !== p.unitPrice && (
                  <span className="text-sky-700 font-medium">
                    ইফেক্টিভ: ৳{p.effectivePrice.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Offer */}
              {p.offerDetails && (
                <div className="bg-amber-50 rounded-lg p-1.5 flex items-center gap-1.5 text-xs text-amber-900">
                  <Gift className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="font-medium text-[11px]">
                    অফার: {p.offerDetails}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
