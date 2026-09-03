import React, { useState, useRef } from 'react';
import { X, User, Phone, MapPin, Briefcase, Camera, Check, Edit2 } from 'lucide-react';
import { Salesman } from '../types';

interface SalesmanModalProps {
  salesman: Salesman;
  onClose: () => void;
  onUpdateSalesman: (salesman: Salesman) => void;
}

export const SalesmanModal: React.FC<SalesmanModalProps> = ({
  salesman,
  onClose,
  onUpdateSalesman
}) => {
  const [formData, setFormData] = useState<Salesman>({ ...salesman });
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          const updated = { ...formData, image: compressed };
          setFormData(updated);
          onUpdateSalesman(updated);
        } else {
          const updated = { ...formData, image: event.target?.result as string };
          setFormData(updated);
          onUpdateSalesman(updated);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('সেলসম্যানের নাম আবশ্যক');
      return;
    }
    onUpdateSalesman(formData);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              সেলসম্যান প্রোফাইল
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-2xl p-4 text-center space-y-3 shadow-md relative overflow-hidden">
          {/* Avatar with Camera Trigger */}
          <div className="relative mx-auto w-24 h-24">
            {formData.image ? (
              <img
                src={formData.image}
                alt={formData.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-400 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-emerald-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-emerald-400 shadow-md">
                MA
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full shadow-lg border-2 border-slate-900 active:scale-95 transition"
              title="ছবি পরিবর্তন করুন"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-lg font-bold tracking-tight text-white">
                {formData.name}
              </h2>
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-0.5">
              সেলস অফিসার • আইডি: {formData.id}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-700/80 text-left text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{formData.phone || 'মোবাইল নম্বর সেট করা হয়নি'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{formData.route}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{formData.company}</span>
            </div>
          </div>
        </div>

        {/* Edit Information Form or Quick Actions */}
        {!isEditing ? (
          <div className="space-y-2">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>তথ্য সম্পাদনা করুন</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>ঠিক আছে</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-2.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-0.5">
                নাম *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">
                  আইডি
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-0.5">
                রুট / এলাকা
              </label>
              <input
                type="text"
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-0.5">
                কোম্পানির নাম
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData(salesman);
                  setIsEditing(false);
                }}
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
