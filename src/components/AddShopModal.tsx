import React, { useState, useRef } from 'react';
import { X, Store, Camera, Trash2 } from 'lucide-react';
import { Shop } from '../types';

interface AddShopModalProps {
  onClose: () => void;
  onAddShop: (shop: Omit<Shop, 'id'>) => void;
  defaultRoute: string;
}

export const AddShopModal: React.FC<AddShopModalProps> = ({
  onClose,
  onAddShop,
  defaultRoute
}) => {
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [route, setRoute] = useState(defaultRoute);
  const [image, setImage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          const compressedData = canvas.toDataURL('image/jpeg', 0.8);
          setImage(compressedData);
        } else {
          setImage(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert('দোকানের নাম, মোবাইল ও ঠিকানা পূরণ করুন');
      return;
    }

    onAddShop({
      name: name.trim(),
      ownerName: ownerName.trim() || 'স্বত্বাধিকারী',
      phone: phone.trim(),
      address: address.trim(),
      route: route.trim() || defaultRoute,
      image: image
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 border border-slate-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              নতুন দোকান যোগ
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              দোকানের নাম *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: ভাই ভাই স্টোর"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                মালিকের নাম
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="যেমন: কাশেম ভাই"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                মোবাইল নম্বর *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              দোকানের ঠিকানা *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="যেমন: বাজার মোড়, দোকান ৩"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              রুট / এলাকা
            </label>
            <input
              type="text"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="যেমন: রুট ১"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Photo */}
          <div>
            {image ? (
              <div className="relative rounded-xl overflow-hidden border border-emerald-500 h-24">
                <img
                  src={image}
                  alt="Shop Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImage(undefined)}
                  className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-full shadow"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-600 font-medium flex items-center justify-center gap-1 hover:bg-slate-100"
              >
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                <span>দোকানের ছবি যোগ করুন</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl shadow-xs"
            >
              সেভ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
