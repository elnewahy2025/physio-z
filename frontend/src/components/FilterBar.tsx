// frontend/src/components/FilterBar.tsx
import { X, Filter, Calendar } from 'lucide-react';
import { useI18n } from '../i18n';

interface FilterBarProps {
  showStatus?: boolean;
  showTherapist?: boolean;
  showPatient?: boolean;
  showDateRange?: boolean;
  therapists?: Array<{ id: string; name: string }>;
  patients?: Array<{ id: string; name: string }>;
  statuses?: Array<{ value: string; label: string }>;
  onFilterChange: (filters: {
    status?: string;
    therapistId?: string;
    patientId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
}

export function FilterBar({
  showStatus = false,
  showTherapist = false,
  showPatient = false,
  showDateRange = false,
  therapists = [],
  patients = [],
  statuses = [],
  onFilterChange,
}: FilterBarProps) {
  const { t, lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const defaultStatuses = [
    { value: 'PENDING', label: t('pending') },
    { value: 'CONFIRMED', label: t('confirmed') },
    { value: 'COMPLETED', label: t('completed') },
    { value: 'CANCELLED', label: t('cancelled') },
    { value: 'NO_SHOW', label: t('noShow') },
  ];

  const statusOptions = statuses.length > 0 ? statuses : defaultStatuses;

  // State for tracking if any filter is active
  const [activeFilters, setActiveFilters] = useState({
    status: '',
    therapistId: '',
    patientId: '',
    dateFrom: '',
    dateTo: '',
  });

  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== '');

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const cleared = {
      status: '',
      therapistId: '',
      patientId: '',
      dateFrom: '',
      dateTo: '',
    };
    setActiveFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
        <Filter size={16} />
        {L('تصفية', 'Filter')}
      </div>

      {/* Status filter */}
      {showStatus && (
        <select
          value={activeFilters.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="input !w-auto !py-1.5 text-sm"
        >
          <option value="">{L('كل الحالات', 'All statuses')}</option>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      )}

      {/* Therapist filter */}
      {showTherapist && therapists.length > 0 && (
        <select
          value={activeFilters.therapistId}
          onChange={(e) => handleChange('therapistId', e.target.value)}
          className="input !w-auto !py-1.5 text-sm"
        >
          <option value="">{L('كل الأخصائيين', 'All therapists')}</option>
          {therapists.map((th) => (
            <option key={th.id} value={th.id}>
              {th.name}
            </option>
          ))}
        </select>
      )}

      {/* Patient filter */}
      {showPatient && patients.length > 0 && (
        <select
          value={activeFilters.patientId}
          onChange={(e) => handleChange('patientId', e.target.value)}
          className="input !w-auto !py-1.5 text-sm"
        >
          <option value="">{L('كل المرضى', 'All patients')}</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* Date range */}
      {showDateRange && (
        <>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={activeFilters.dateFrom}
              onChange={(e) => handleChange('dateFrom', e.target.value)}
              className="input !w-auto !py-1.5 text-sm"
              placeholder={L('من', 'From')}
            />
            <span className="text-gray-400">→</span>
            <input
              type="date"
              value={activeFilters.dateTo}
              onChange={(e) => handleChange('dateTo', e.target.value)}
              className="input !w-auto !py-1.5 text-sm"
              placeholder={L('إلى', 'To')}
            />
          </div>
        </>
      )}

      {/* Clear button */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          <X size={14} />
          {L('مسح', 'Clear')}
        </button>
      )}
    </div>
  );
}

// Add useState import
import { useState } from 'react';