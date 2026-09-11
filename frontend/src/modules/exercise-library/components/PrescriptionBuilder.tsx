import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { prescriptionService } from '../services/prescription.service';
import { exerciseService } from '../services/exercise.service';

interface PrescriptionBuilderProps {
  patientId: string;
  appointmentId?: string;
  onClose: () => void;
  onPrescriptionCreated?: () => void;
}

const PrescriptionBuilder: React.FC<PrescriptionBuilderProps> = ({
  patientId,
  appointmentId,
  onClose,
  onPrescriptionCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (search.length >= 2) {
      searchExercises();
    } else {
      setSearchResults([]);
    }
  }, [search]);

  const searchExercises = async () => {
    try {
      const results = await exerciseService.searchExercises(search);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search exercises:', error);
    }
  };

  const addExercise = (exercise: any) => {
    setSelectedExercises(prev => [
      ...prev,
      {
        exerciseId: exercise.id,
        exercise: exercise,
        sets: exercise.defaultSets,
        reps: exercise.defaultReps,
        holdTime: exercise.defaultHoldTime,
        restTime: exercise.defaultRestTime,
        frequency: '',
        notes: '',
      },
    ]);
    setSearch('');
    setSearchResults([]);
    setShowExerciseSearch(false);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateExerciseParams = (index: number, field: string, value: any) => {
    setSelectedExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await prescriptionService.createPrescription({
        patientId,
        appointmentId,
        title,
        description: description || undefined,
        instructions: instructions || undefined,
        frequency: frequency || undefined,
        duration: duration || undefined,
        exercises: selectedExercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          holdTime: ex.holdTime,
          restTime: ex.restTime,
          frequency: ex.frequency || undefined,
          notes: ex.notes || undefined,
        })),
      });

      onPrescriptionCreated?.();
      onClose();
    } catch (error) {
      console.error('Failed to create prescription:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-50 dark:bg-gray-9000 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                إنشاء وصفة تمارين
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-400"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  عنوان الوصفة *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="مثال: تمارين تقوية الظهر"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  الوصف
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="وصف مختصر لهدف الوصفة..."
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  تعليمات للمريض
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="تعليمات عامة للمريض..."
                />
              </div>

              {/* Frequency and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    التكرار
                  </label>
                  <input
                    type="text"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="3 مرات أسبوعياً"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    المدة
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="4 أسابيع"
                  />
                </div>
              </div>

              {/* Exercise Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    التمارين ({selectedExercises.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowExerciseSearch(true)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="h-4 w-4 ml-1" />
                    إضافة تمرين
                  </button>
                </div>

                {selectedExercises.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
                    لم يتم اختيار تمارين بعد
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedExercises.map((ex, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {ex.exercise.nameAr || ex.exercise.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {ex.exercise.category}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExercise(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Parameters */}
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400">
                              مجموعات
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={ex.sets}
                              onChange={(e) => updateExerciseParams(index, 'sets', parseInt(e.target.value))}
                              className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400">
                              تكرارات
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={ex.reps}
                              onChange={(e) => updateExerciseParams(index, 'reps', parseInt(e.target.value))}
                              className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          {ex.holdTime && (
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400">
                                ثبات (ثانية)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={ex.holdTime}
                                onChange={(e) => updateExerciseParams(index, 'holdTime', parseInt(e.target.value))}
                                className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400">
                              راحة (ثانية)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={ex.restTime}
                              onChange={(e) => updateExerciseParams(index, 'restTime', parseInt(e.target.value))}
                              className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                            />
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-3">
                          <input
                            type="text"
                            value={ex.notes}
                            onChange={(e) => updateExerciseParams(index, 'notes', e.target.value)}
                            className="block w-full border-gray-300 rounded-md text-sm"
                            placeholder="ملاحظات خاصة لهذا التمرين..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving || selectedExercises.length === 0}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'جارٍ الحفظ...' : 'حفظ الوصفة'}
              </button>
            </div>
          </form>

          {/* Exercise Search Modal */}
          {showExerciseSearch && (
            <div className="fixed inset-0 z-60 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
                <div className="fixed inset-0 bg-gray-50 dark:bg-gray-9000 bg-opacity-75" onClick={() => setShowExerciseSearch(false)} />
                
                <div className="inline-block bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full relative">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      البحث عن تمرين
                    </h4>
                    <button
                      onClick={() => setShowExerciseSearch(false)}
                      className="text-gray-400 hover:text-gray-500 dark:text-gray-400"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <input
                      type="text"
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ابحث عن تمرين..."
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                    
                    {searchResults.length > 0 && (
                      <div className="mt-4 max-h-64 overflow-y-auto">
                        {searchResults.map((exercise) => (
                          <button
                            key={exercise.id}
                            onClick={() => addExercise(exercise)}
                            className="w-full text-right px-4 py-2 hover:bg-gray-50 dark:bg-gray-900 rounded-md"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {exercise.nameAr || exercise.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {exercise.category} • {exercise.difficulty}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionBuilder;
