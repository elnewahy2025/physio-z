import React, { useState, useEffect } from 'react';
import { PlayCircle, Search, BookOpen, Clock, Activity, FileText } from 'lucide-react';
import { cn } from '../components/ui';

const SAMPLE_ARTICLES = [
  { id: '1', title: 'تمارين أسفل الظهر', category: 'Back Pain', type: 'video', duration: '12 min' },
  { id: '2', title: 'التأهيل بعد جراحة الركبة', category: 'Post-Op Rehab', type: 'article', duration: '5 min read' },
  { id: '3', title: 'تمارين الكتف المكتبي', category: 'Ergonomics', type: 'video', duration: '8 min' },
  { id: '4', title: 'علاج الشد العضلي في الرقبة', category: 'Neck Pain', type: 'article', duration: '3 min read' },
];

const CATEGORIES = ['الكل', 'Back Pain', 'Post-Op Rehab', 'Ergonomics', 'Neck Pain'];

export default function EducationPortal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  const filteredArticles = SAMPLE_ARTICLES.filter((article) => {
    const matchesSearch = article.title.includes(searchTerm);
    const matchesCategory = selectedCategory === 'الكل' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 p-8 opacity-10">
          <BookOpen size={120} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-bold mb-4">بوابة التثقيف الصحي</h1>
          <p className="text-primary-100 text-lg mb-6">
            مكتبة شاملة من الفيديوهات والمقالات لمساعدتك في رحلة العلاج والتعافي.
          </p>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن التمارين، المقالات، أو الحالات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-xl pr-12 py-3 focus:ring-white/50 focus:border-white/50 backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border",
              selectedCategory === category
                ? "bg-primary-600 border-primary-600 text-white"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredArticles.map((article) => (
          <div key={article.id} className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer flex flex-col">
            {/* Thumbnail Placeholder */}
            <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                {article.type === 'video' ? (
                  <PlayCircle className="text-gray-400 group-hover:text-primary-500 transition-colors" size={48} />
                ) : (
                  <FileText className="text-gray-400 group-hover:text-primary-500 transition-colors" size={48} />
                )}
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-md">
                <Clock size={12} />
                <span>{article.duration}</span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
                  {article.category}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                {article.title}
              </h3>
            </div>
          </div>
        ))}
        
        {filteredArticles.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
            لا توجد نتائج مطابقة لبحثك.
          </div>
        )}
      </div>
    </div>
  );
}
