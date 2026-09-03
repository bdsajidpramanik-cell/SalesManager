import React, { useState, useMemo } from 'react';
import { Search, X, Plus, Minus, ArrowRight, Store, RotateCcw, AlertCircle, Camera, Package } from 'lucide-react';
import { Shop, Product, OrderItem } from '../types';

interface NewOrderModalProps {
  shop: Shop;
  products: Product[];
  initialItems?: OrderItem[];
  isRepeatOrder?: boolean;
  onClose: () => void;
  onProceedToConfirm: (selectedItems: OrderItem[], notes?: string) => void;
  onUpdateProduct?: (product: Product) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  shop,
  products,
  initialItems = [],
  isRepeatOrder = false,
  onClose,
  onProceedToConfirm,
  onUpdateProduct
}) => {
  // Map of productId -> quantity
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    initialItems.forEach((item) => {
      map[item.productId] = item.quantity;
    });
    return map;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('সকল পণ্য');
  const [notes, setNotes] = useState<string>('');

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

  const setProductQty = (productId: string, qty: number) => {
    const validQty = Math.max(0, Math.min(9999, isNaN(qty) ? 0 : qty));
    setQuantities((prev) => ({
      ...prev,
      [productId]: validQty
    }));
  };

  const incrementQty = (productId: string, delta: number = 1) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      return {
        ...prev,
        [productId]: Math.max(0, current + delta)
      };
    });
  };

  const decrementQty = (productId: string, delta: number = 1) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      return {
        ...prev,
        [productId]: Math.max(0, current - delta)
      };
    });
  };

  // Convert quantities into OrderItem array
  const orderItems: OrderItem[] = useMemo(() => {
    const items: OrderItem[] = [];
    products.forEach((product) => {
      const qty = quantities[product.id] || 0;
      if (qty > 0) {
        items.push({
          productId: product.id,
          productName: product.name,
          productNameBn: product.nameBn,
          packSize: product.packSize,
          unitPrice: product.unitPrice,
          quantity: qty,
          total: qty * product.unitPrice
        });
      }
    });
    return items;
  }, [products, quantities]);

  const totalItemsCount = orderItems.length;
  const totalQuantityPcs = orderItems.reduce((acc, it) => acc + it.quantity, 0);
  const totalAmountBdt = orderItems.reduce((acc, it) => acc + it.total, 0);

  const handleReview = () => {
    if (orderItems.length === 0) return;
    onProceedToConfirm(orderItems, notes);
  };

  const handleReset = () => {
    if (window.confirm('অর্ডারের সব আইটেম মুছে ফেলবেন?')) {
      setQuantities({});
    }
  };

  const handleProductPhotoUpload = (product: Product, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateProduct) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 600;
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
          onUpdateProduct({ ...product, image: compressed });
        } else {
          onUpdateProduct({ ...product, image: event.target?.result as string });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-base leading-tight truncate">
              {shop.name}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {isRepeatOrder ? 'রিপিট অর্ডার' : 'নতুন অর্ডার'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalItemsCount > 0 && (
            <button
              onClick={handleReset}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1"
            >
              মুছুন
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Repeat Order Indicator Banner */}
      {isRepeatOrder && (
        <div className="bg-sky-700 text-white px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 shrink-0">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>আগের অর্ডারের পণ্য লোড করা হয়েছে — সংখ্যা পরিবর্তন করতে পারেন</span>
        </div>
      )}

      {/* Search & Category Filter Section */}
      <div className="bg-slate-800 p-3 border-b border-slate-700 shrink-0 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="পণ্য খুঁজুন (যেমন: ডেটোল, হারপিক, লাইজল)..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-100">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-1">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-slate-700 font-bold text-sm">কোনো পণ্য পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400">বানান সঠিক কি না দেখুন</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const qty = quantities[product.id] || 0;
            const isSelected = qty > 0;
            const lineTotal = qty * product.unitPrice;

            return (
              <div
                key={product.id}
                className={`rounded-2xl p-3 transition bg-white shadow-xs ${
                  isSelected ? 'ring-2 ring-emerald-500' : 'border border-slate-200'
                }`}
              >
                {/* Product Name, Category & Price Row */}
                <div className="flex items-start gap-2.5">
                  {/* Thumbnail */}
                  <div className="relative shrink-0 mt-0.5">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    {onUpdateProduct && (
                      <label
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center cursor-pointer shadow"
                        title="ছবি পরিবর্তন"
                      >
                        <Camera className="w-2.5 h-2.5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleProductPhotoUpload(product, e)}
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                          {product.nameBn}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          প্যাক: {product.packSize}
                        </p>
                      </div>

                      {/* Unit Price */}
                      <div className="text-right shrink-0">
                        <p className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                          ৳{product.unitPrice}
                        </p>
                        {isSelected && (
                          <p className="text-xs font-bold text-emerald-600 mt-0.5">
                            মোট: ৳{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Simple Price & Offer row */}
                    <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] text-slate-600">
                      {product.mrp && (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          MRP: ৳{product.mrp}
                        </span>
                      )}
                      {product.netProfit && (
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                          লাভ: ৳{product.netProfit}
                        </span>
                      )}
                    </div>

                    {product.offerDetails && (
                      <div className="mt-1 text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded inline-block">
                        🎁 {product.offerDetails}
                      </div>
                    )}
                  </div>
                </div>

                {/* Minimal Stepper Controls */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Quick Pack Buttons */}
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      onClick={() => incrementQty(product.id, 6)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-lg transition"
                    >
                      +৬
                    </button>
                    <button
                      onClick={() => incrementQty(product.id, 12)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-lg transition"
                    >
                      +১২
                    </button>
                    <button
                      onClick={() => incrementQty(product.id, 24)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-lg transition"
                    >
                      +২৪
                    </button>
                  </div>

                  {/* +/- Stepper */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                    <button
                      onClick={() => decrementQty(product.id, 1)}
                      disabled={qty <= 0}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition ${
                        qty > 0 ? 'bg-slate-200 text-slate-700 active:scale-90' : 'text-slate-300 cursor-not-allowed'
                      }`}
                      aria-label="কমান"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={qty === 0 ? '' : qty}
                      placeholder="০"
                      onChange={(e) => setProductQty(product.id, parseInt(e.target.value, 10) || 0)}
                      className="w-12 h-9 text-center font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                    />

                    <button
                      onClick={() => incrementQty(product.id, 1)}
                      className="w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white flex items-center justify-center font-bold transition shadow-xs"
                      aria-label="বাড়ান"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Optional delivery note */}
        {totalItemsCount > 0 && (
          <div className="bg-white p-3 rounded-2xl border border-slate-200 mt-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ডেলিভারি নোট (প্রয়োজনে):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: কাল সকাল ১০টায় মাল দিতে হবে..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* Bottom Floating Bar */}
      <div className="bg-white border-t border-slate-200 p-3 sm:p-4 shadow-xl shrink-0">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 font-medium">
              {totalItemsCount} পদ • {totalQuantityPcs} পিস
            </p>
            <p className="text-lg sm:text-xl font-black text-emerald-600 leading-none">
              ৳{totalAmountBdt.toLocaleString('en-IN')}
            </p>
          </div>

          <button
            id="btn-proceed-review-order"
            onClick={handleReview}
            disabled={totalItemsCount === 0}
            className={`py-3 px-5 font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 ${
              totalItemsCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>এগিয়ে যান</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
