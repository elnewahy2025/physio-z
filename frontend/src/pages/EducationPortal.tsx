import React, { useState } from 'react';
import { PlayCircle, Search, BookOpen, Clock, FileText } from 'lucide-react';
import { cn } from '../components/ui';
import { useI18n } from '../i18n';

export default function EducationPortal() {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const sampleArticles = [
    {
      id: '1',
      title: L('تمارين تقوية وإطالة أسفل الظهر', 'Lower Back Strengthening & Stretching Exercises'),
      category: L('آلام الظهر', 'Back Pain'),
      type: 'video',
      duration: '12 min',
    },
    {
      id: '2',
      title: L('بروتوكول التأهيل المنزلي بعد جراحة الركبة', 'Post-Op Knee Surgery Home Rehabilitation'),
      category: L('تأهيل الجراحة', 'Post-Op Rehab'),
      type: 'article',
      duration: '5 min read',
    },
    {
      id: '3',
      title: L('تمارين الكتف والرقبة للموظفين والمكاتب', 'Ergonomic Desk & Shoulder Exercises'),
      category: L('بيئة العمل', 'Ergonomics'),
      type: 'video',
      duration: '8 min',
    },
    {
      id: '4',
      title: L('إرشادات علاج الشد العضلي الحاد في الرقبة', 'Acute Neck Muscle Strain Management Guide'),
      category: L('آلام الرقبة', 'Neck Pain'),
      type: 'article',
      duration: '3 min read',
    },
  ];

  const categories = [
    L('الكل', 'All'),
    L('آلام الظهر', 'Back Pain'),
    L('تأهيل الجراحة', 'Post-Op Rehab'),
    L('بيئة العمل', 'Ergonomics'),
    L('آلام الرقبة', 'Neck Pain'),
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const filteredArticles = sampleArticles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === categories[0] || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} p-8 opacity-10`}>
          <BookOpen size={120} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-extrabold mb-3">
            {L('بوابة التثقيف الصحي وإرشادات المرضى', 'Patient Health Education & Guidelines')}
          </h1>
          <p className="text-primary-100 text-sm sm:text-base mb-6 leading-relaxed">
            {L(
              'مكتبة شاملة وموثقة من الفيديوهات التوضيحية والمقالات الطبية لمساعدتك في رحلة العلاج والتعافي والوقاية من الإصابات المتكررة.',
              'A comprehensive library of video demonstrations and clinical articles to support patient recovery, home programs, and injury prevention.'
            )}
          </p>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
            <input
              type="text"
              placeholder={L('ابحث عن التمارين، الفيديوهات، أو الحالات الطبية...', 'Search exercises, videos, or health topics...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-white/10 border border-white/20 text-white placeholder:text-gray-300 rounded-xl ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 focus:ring-white/50 focus:border-white/50 backdrop-blur-md text-sm`}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border",
              selectedCategory === category
                ? "bg-primary-600 border-primary-600 text-white shadow-sm"
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
          <div key={article.id} className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between">
            <div>
              {/* Thumbnail Placeholder */}
              <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {article.type === 'video' ? (
                    <PlayCircle className="text-gray-400 group-hover:text-primary-500 transition-colors" size={48} />
                  ) : (
                    <FileText className="text-gray-400 group-hover:text-primary-500 transition-colors" size={48} />
                  )}
                </div>
                <div className={`absolute bottom-2 ${isRTL ? 'right-2' : 'left-2'} bg-black/70 text-white text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 backdrop-blur-md`}>
                  <Clock size={12} />
                  <span>{article.duration}</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2.5 py-0.5 rounded-full">
                    {article.category}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </div>
            </div>

            <div className="p-4 pt-0 text-xs font-semibold text-primary-600 dark:text-primary-400">
              {article.type === 'video' ? L('مشاهدة الفيديو ←', 'Watch Video →') : L('قراءة المقال ←', 'Read Article →')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
