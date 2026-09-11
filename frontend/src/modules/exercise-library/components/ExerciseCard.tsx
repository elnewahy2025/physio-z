import React from 'react';
import { PlayIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ExerciseCardProps {
  exercise: any;
  onClick: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onClick }) => {
  const categoryLabels: Record<string, string> = {
    STRETCHING: 'تمديد',
    STRENGTHENING: 'تقوية',
    MOBILITY: 'مرونة',
    BALANCE: 'توازن',
    CARDIO: 'قلب وأوعية دموية',
    FUNCTIONAL: 'وظيفي',
  };

  const difficultyLabels: Record<string, string> = {
    BEGINNER: 'مبتدئ',
    INTERMEDIATE: 'متوسط',
    ADVANCED: 'متقدم',
  };

  const difficultyColors: Record<string, string> = {
    BEGINNER: 'bg-green-100 text-green-800',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
    ADVANCED: 'bg-red-100 text-red-800',
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="h-48 bg-gray-200 relative">
        {exercise.imageUrl ? (
          <img
            src={exercise.imageUrl}
            alt={exercise.nameAr || exercise.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
            <span className="text-white text-4xl font-bold">
              {exercise.nameAr?.charAt(0) || exercise.name.charAt(0)}
            </span>
          </div>
        )}
        
        {exercise.videoUrl && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
              <PlayIcon className="h-3 w-3 ml-1" />
              فيديو
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
          {exercise.nameAr || exercise.name}
        </h3>
        
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {categoryLabels[exercise.category] || exercise.category}
          </span>
          
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[exercise.difficulty]}`}>
            {difficultyLabels[exercise.difficulty] || exercise.difficulty}
          </span>
        </div>

        {/* Exercise parameters */}
        <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2 space-x-reverse">
          <span>
            {exercise.defaultSets} × {exercise.defaultReps}
          </span>
          
          {exercise.defaultHoldTime && (
            <>
              <span>•</span>
              <span className="flex items-center">
                <ClockIcon className="h-3 w-3 ml-1" />
                {exercise.defaultHoldTime}ث
              </span>
            </>
          )}
        </div>

        {/* Tags */}
        {exercise.tags && exercise.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {exercise.tags.slice(0, 3).map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseCard;
