import React, { useState } from 'react';
import { XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';

interface ExerciseDetailModalProps {
  exercise: any;
  onClose: () => void;
}

const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'instructions'>('details');

  const categoryLabels: Record<string, string> = {
    STRETCHING: 'تمديد',
    STRENGTHENING: 'تقوية',
    MOBILITY: 'مرونة',
    BALANCE: 'توازن',
    CARDIO: 'قلب وأوعية دموية',
  };

  const difficultyLabels: Record<string, string> = {
    BEGINNER: 'مبتدئ',
    INTERMEDIATE: 'متوسط',
    ADVANCED: 'متقدم',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background */}
        <div
          className="fixed inset-0 transition-opacity"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-50 dark:bg-gray-9000 opacity-75"></div>
        </div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {exercise.nameAr || exercise.name}
                </h3>
                <div className="mt-1 flex items-center space-x-2 space-x-reverse">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {categoryLabels[exercise.category] || exercise.category}
                  </span>
                  <span>•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {difficultyLabels[exercise.difficulty] || exercise.difficulty}
                  </span>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-400"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Media */}
          {exercise.videoUrl && (
            <div className="bg-gray-900 aspect-video">
              <video
                controls
                className="w-full h-full"
                poster={exercise.imageUrl}
              >
                <source src={exercise.videoUrl} type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو.
              </video>
            </div>
          )}
          {!exercise.videoUrl && exercise.imageUrl && (
            <div className="bg-gray-200">
              <img
                src={exercise.imageUrl}
                alt={exercise.nameAr || exercise.name}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6">
            <nav className="-mb-px flex space-x-8 space-x-reverse">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                }`}
              >
                التفاصيل
              </button>
              <button
                onClick={() => setActiveTab('instructions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'instructions'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                }`}
              >
                التعليمات
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6">
            {activeTab === 'details' && (
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    الوصف
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {exercise.descriptionAr || exercise.description}
                  </p>
                </div>

                {/* Parameters */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    المعايير
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                      <p className="text-xs text-gray-500 dark:text-gray-400">المجموعات</p>
                      <p className="text-sm font-medium">{exercise.defaultSets}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                      <p className="text-xs text-gray-500 dark:text-gray-400">التكرارات</p>
                      <p className="text-sm font-medium">{exercise.defaultReps}</p>
                    </div>
                    {exercise.defaultHoldTime && (
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                        <p className="text-xs text-gray-500 dark:text-gray-400">مدة الثبات (ثانية)</p>
                        <p className="text-sm font-medium">{exercise.defaultHoldTime}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                      <p className="text-xs text-gray-500 dark:text-gray-400">الراحة (ثانية)</p>
                      <p className="text-sm font-medium">{exercise.defaultRestTime}</p>
                    </div>
                  </div>
                </div>

                {/* Body Parts */}
                {exercise.bodyParts && exercise.bodyParts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      أجزاء الجسم المستهدفة
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {exercise.bodyParts.map((part: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contraindications */}
                {exercise.contraindications && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-red-900 mb-1">
                      ⚠️ موانع الاستعمال
                    </h4>
                    <p className="text-sm text-red-700">
                      {exercise.contraindications}
                    </p>
                  </div>
                )}

                {/* Precautions */}
                {exercise.precautions && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-yellow-900 mb-1">
                      احتياطات
                    </h4>
                    <p className="text-sm text-yellow-700">
                      {exercise.precautions}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'instructions' && (
              <div className="space-y-4">
                {/* Instructions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    خطوات الأداء
                  </h4>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400 font-sans">
                      {exercise.instructionsAr || exercise.instructions}
                    </pre>
                  </div>
                </div>

                {/* Common Errors */}
                {exercise.commonErrors && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      أخطاء شائعة
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {exercise.commonErrors}
                    </p>
                  </div>
                )}

                {/* Progressions */}
                {exercise.progressions && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-green-900 mb-1">
                      كيفية التقدم
                    </h4>
                    <p className="text-sm text-green-700">
                      {exercise.progressions}
                    </p>
                  </div>
                )}

                {/* Regressions */}
                {exercise.regressions && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      كيفية التسهيل
                    </h4>
                    <p className="text-sm text-blue-700">
                      {exercise.regressions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailModal;
