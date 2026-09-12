import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { exerciseService } from '../services/exercise.service';
import ExerciseCard from './ExerciseCard';
import ExerciseDetailModal from './ExerciseDetailModal';
import { useI18n } from '../../../i18n';

const ExerciseLibrary: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    bodyPart: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      const response = await exerciseService.getExercises({
        ...filters,
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      
      setExercises(response.exercises);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, search, pagination.page, pagination.limit]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await exerciseService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const categoryLabels: Record<string, { ar: string; en: string }> = {
    STRETCHING: { ar: 'تمديد وإطالة', en: 'Stretching' },
    STRENGTHENING: { ar: 'تقوية عضلية', en: 'Strengthening' },
    MOBILITY: { ar: 'مرونة ومدى حركي', en: 'Mobility' },
    BALANCE: { ar: 'توازن وتوافق', en: 'Balance' },
    CARDIO: { ar: 'لياقة وقدرة تحمل', en: 'Cardio' },
    FUNCTIONAL: { ar: 'تدريب وظيفي', en: 'Functional' },
    MANUAL_THERAPY: { ar: 'علاج يدوي', en: 'Manual Therapy' },
    POST_SURGICAL: { ar: 'تأهيل بعد الجراحة', en: 'Post-Surgical' },
    SPORTS_SPECIFIC: { ar: 'رياضي تخصصي', en: 'Sports-Specific' },
    GERIATRIC: { ar: 'تأهيل كبار السن', en: 'Geriatric' },
    PEDIATRIC: { ar: 'تأهيل الأطفال', en: 'Pediatric' },
  };

  const difficultyLabels: Record<string, { ar: string; en: string }> = {
    BEGINNER: { ar: 'مبتدئ', en: 'Beginner' },
    INTERMEDIATE: { ar: 'متوسط', en: 'Intermediate' },
    ADVANCED: { ar: 'متقدم', en: 'Advanced' },
  };

  const bodyPartLabels: Record<string, { ar: string; en: string }> = {
    neck: { ar: 'الرقبة', en: 'Neck' },
    shoulder: { ar: 'الكتف', en: 'Shoulder' },
    back: { ar: 'الظهر', en: 'Back' },
    knee: { ar: 'الركبة', en: 'Knee' },
    hip: { ar: 'الورك', en: 'Hip' },
    ankle: { ar: 'الكاحل', en: 'Ankle' },
    core: { ar: 'عضلات الجذع والبطن', en: 'Core' },
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L('مكتبة التمارين العلاجية', 'Therapeutic Exercise Library')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {L('استعرض وابحث عن التمارين العلاجية وإرشاداتها للمرضى', 'Browse and search therapeutic exercises and rehabilitation instructions')}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400`} />
            <input
              type="text"
              placeholder={L('ابحث عن تمرين باسمه أو الغرض منه...', 'Search exercises by name or target...')}
              value={search}
              onChange={handleSearchChange}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-primary-500 focus:border-primary-500 text-sm`}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <FunnelIcon className="h-4 w-4" />
            {L('فلاتر', 'Filters')}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {L('الفئة العلاجية', 'Category')}
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="block w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2.5"
              >
                <option value="">{L('كافة الفئات', 'All Categories')}</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {isRTL ? label.ar : label.en}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {L('مستوى الصعوبة', 'Difficulty Level')}
              </label>
              <select
                name="difficulty"
                value={filters.difficulty}
                onChange={handleFilterChange}
                className="block w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2.5"
              >
                <option value="">{L('كافة المستويات', 'All Levels')}</option>
                {Object.entries(difficultyLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {isRTL ? label.ar : label.en}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {L('المنطقة المستهدفة من الجسم', 'Target Body Part')}
              </label>
              <select
                name="bodyPart"
                value={filters.bodyPart}
                onChange={handleFilterChange}
                className="block w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2.5"
              >
                <option value="">{L('كافة المناطق', 'All Body Parts')}</option>
                {Object.entries(bodyPartLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {isRTL ? label.ar : label.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {pagination.total} {L('تمريناً مسجلاً', 'exercises found')}
        </p>
      </div>

      {/* Exercise Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {L('لا توجد تمارين مطابقة للبحث أو الفلاتر المحددة', 'No exercises match the search criteria')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onClick={() => setSelectedExercise(exercise)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {L('السابق', 'Previous')}
          </button>
          
          <span className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            {L('صفحة', 'Page')} {pagination.page} {L('من', 'of')} {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {L('التالي', 'Next')}
          </button>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
};

export default ExerciseLibrary;
