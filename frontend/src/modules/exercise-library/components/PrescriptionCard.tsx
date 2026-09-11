import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface PrescriptionCardProps {
  prescription: any;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ prescription }) => {
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'نشطة',
    COMPLETED: 'مكتملة',
    CANCELLED: 'ملغاة',
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {prescription.title}
            </h3>
            <div className="mt-1 flex items-center space-x-2 space-x-reverse text-xs text-gray-500 dark:text-gray-400">
              <span>
                {new Date(prescription.startDate).toLocaleDateString('ar-EG')}
              </span>
              {prescription.frequency && (
                <>
                  <span>•</span>
                  <span>{prescription.frequency}</span>
                </>
              )}
              <span>•</span>
              <span>
                {prescription.assignments?.length || 0} تمارين
              </span>
            </div>
          </div>
          
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[prescription.status]}`}>
            {statusLabels[prescription.status] || prescription.status}
          </span>
        </div>

        {/* Description */}
        {prescription.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {prescription.description}
          </p>
        )}

        {/* Toggle Exercises */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
        >
          <ChevronDownIcon
            className={`h-4 w-4 ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
          {expanded ? 'إخفاء التمارين' : 'عرض التمارين'}
        </button>
      </div>

      {/* Exercises List */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="space-y-2">
            {prescription.assignments?.map((assignment: any, index: number) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {assignment.exercise?.nameAr || assignment.exercise?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {assignment.sets || assignment.exercise?.defaultSets} × {' '}
                    {assignment.reps || assignment.exercise?.defaultReps}
                    {assignment.holdTime && ` • ${assignment.holdTime}ث`}
                  </p>
                  {assignment.notes && (
                    <p className="text-xs text-gray-400 mt-1">
                      {assignment.notes}
                    </p>
                  )}
                </div>
                
                {/* Progress */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {assignment.completedCount > 0 && (
                    <span className="flex items-center text-green-600">
                      <CheckIcon className="h-4 w-4 ml-1" />
                      {assignment.completedCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionCard;
