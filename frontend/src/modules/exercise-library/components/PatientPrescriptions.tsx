import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../services/prescription.service';
import PrescriptionCard from './PrescriptionCard';

interface PatientPrescriptionsProps {
  patientId: string;
}

const PatientPrescriptions: React.FC<PatientPrescriptionsProps> = ({ patientId }) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadPrescriptions();
  }, [patientId, statusFilter]);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await prescriptionService.getPatientPrescriptions(
        patientId,
        statusFilter || undefined,
      );
      setPrescriptions(response.prescriptions);
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Status Filter */}
      <div className="flex items-center space-x-2 space-x-reverse">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">الكل</option>
          <option value="ACTIVE">نشطة</option>
          <option value="COMPLETED">مكتملة</option>
          <option value="CANCELLED">ملغاة</option>
        </select>
      </div>

      {/* Prescriptions */}
      {prescriptions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">لا توجد وصفات تمارين</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <PrescriptionCard
              key={prescription.id}
              prescription={prescription}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptions;
