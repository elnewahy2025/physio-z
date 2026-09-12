import React, { useState, useEffect } from 'react';
import { Award, Flame, Gift, Star, Trophy, Users, ChevronRight } from 'lucide-react';
import { cn } from '../../../components/ui';

export default function LoyaltyWallet() {
  const [points, setPoints] = useState(1250);
  const [streak, setStreak] = useState(5);
  const [tier, setTier] = useState('SILVER');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Profile Section */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
              <Star className="text-yellow-300 fill-yellow-300" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">برنامج الولاء (PhysioRewards)</h2>
              <p className="text-primary-100 flex items-center gap-2">
                المستوى الحالي: <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-full text-xs">الفضي (Silver)</span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
              <p className="text-primary-100 text-sm mb-1">النقاط المتاحة</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{points}</span>
                <span className="text-sm mb-1 opacity-80">نقطة</span>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
              <p className="text-primary-100 text-sm mb-1">أيام التمرين المتتالية</p>
              <div className="flex items-end gap-2">
                <Flame className="text-orange-400 fill-orange-400" size={32} />
                <span className="text-3xl font-bold">{streak}</span>
                <span className="text-sm mb-1 opacity-80">أيام</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Next Tier */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">المستوى الذهبي (Gold)</h3>
            <p className="text-sm text-gray-500">باقي 750 نقطة للترقية</p>
          </div>
          <Award className="text-yellow-500" size={28} />
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-4">
          <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '62%' }}></div>
        </div>
      </div>

      {/* How to Earn */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">كيف تربح النقاط؟</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
          <div className="bg-orange-100 dark:bg-orange-900/30 w-10 h-10 rounded-full flex items-center justify-center mb-3">
            <Flame className="text-orange-600 dark:text-orange-400" size={20} />
          </div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">التمارين اليومية</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">أكمل التمارين المطلوبة يومياً للحصول على النقاط</p>
          <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold px-2 py-1 rounded">+10 نقطة يومياً</span>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
          <div className="bg-green-100 dark:bg-green-900/30 w-10 h-10 rounded-full flex items-center justify-center mb-3">
            <Users className="text-green-600 dark:text-green-400" size={20} />
          </div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">دعوة صديق</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">شارك رابط الدعوة الخاص بك مع الأصدقاء والعائلة</p>
          <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold px-2 py-1 rounded">+100 نقطة للطرفين</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
          <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-full flex items-center justify-center mb-3">
            <Gift className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">التقييمات</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">قم بتقييم الجلسات والمركز بعد الزيارة</p>
          <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold px-2 py-1 rounded">+25 نقطة للتقييم</span>
        </div>
      </div>
    </div>
  );
}
