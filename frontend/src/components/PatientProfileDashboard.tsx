import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, User, Calendar, FileText, Activity, CreditCard, Folder, Phone, Mail, MapPin, Cake } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { Spinner, Badge } from './ui';

export default function PatientProfileDashboard({
  patientId,
  onClose,
}: {
  patientId: string;
  onClose: () => void;
}) {
  const { lang } = useI18n();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}`);
      return res.data;
    },
  });

  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const formatDate = (dateString: string, includeTime = false) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', month: 'short', day: 'numeric' 
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return d.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', options);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-xl bg-white p-8 dark:bg-gray-900 shadow-xl">
          <Spinner className="mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading patient profile...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-xl bg-white p-8 dark:bg-gray-900 shadow-xl">
          <p className="text-red-500">Failed to load patient data.</p>
          <button onClick={onClose} className="btn-secondary mt-4">Close</button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', icon: <User size={18} />, label: L('نظرة عامة', 'Overview') },
    { id: 'appointments', icon: <Calendar size={18} />, label: L('المواعيد', 'Appointments') },
    { id: 'sessions', icon: <Activity size={18} />, label: L('الجلسات', 'Sessions') },
    { id: 'invoices', icon: <CreditCard size={18} />, label: L('الفواتير', 'Billing') },
    { id: 'documents', icon: <Folder size={18} />, label: L('المستندات', 'Documents') },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/50 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Contact Info</h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-3"><Phone size={16} className="text-primary-500" /> {patient.phone}</div>
                  {patient.email && <div className="flex items-center gap-3"><Mail size={16} className="text-primary-500" /> {patient.email}</div>}
                  {patient.address && <div className="flex items-center gap-3"><MapPin size={16} className="text-primary-500" /> {patient.address}</div>}
                  {patient.dateOfBirth && <div className="flex items-center gap-3"><Cake size={16} className="text-primary-500" /> {formatDate(patient.dateOfBirth)}</div>}
                </div>
              </div>
              
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/50 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Medical History</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {patient.medicalHistory || 'No medical history recorded.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="rounded-xl bg-white border border-gray-100 p-4 dark:border-gray-800 dark:bg-gray-800/50 shadow-sm text-center">
                 <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{patient.appointments?.length || 0}</p>
                 <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Appointments</p>
               </div>
               <div className="rounded-xl bg-white border border-gray-100 p-4 dark:border-gray-800 dark:bg-gray-800/50 shadow-sm text-center">
                 <p className="text-3xl font-bold text-green-600 dark:text-green-400">{patient.invoices?.length || 0}</p>
                 <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Invoices</p>
               </div>
               <div className="rounded-xl bg-white border border-gray-100 p-4 dark:border-gray-800 dark:bg-gray-800/50 shadow-sm text-center">
                 <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {patient.appointments?.reduce((acc: number, app: any) => acc + (app.therapySessions?.length || 0), 0) || 0}
                 </p>
                 <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Sessions</p>
               </div>
               <div className="rounded-xl bg-white border border-gray-100 p-4 dark:border-gray-800 dark:bg-gray-800/50 shadow-sm text-center">
                 <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{patient.patientPackages?.length || 0}</p>
                 <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Packages</p>
               </div>
            </div>
          </div>
        );
      case 'appointments':
        return (
          <div className="space-y-4">
            {(!patient.appointments || patient.appointments.length === 0) ? (
              <p className="text-center text-gray-500 py-8">No appointments found.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {patient.appointments.map((app: any) => (
                  <div key={app.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(app.dateTime, true)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Dr. {app.therapist?.name} {app.room && `• Room ${app.room.number}`}
                      </p>
                    </div>
                    <Badge status={app.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'sessions':
        const sessions = patient.appointments?.flatMap((a: any) => a.therapySessions || []) || [];
        return (
          <div className="space-y-4">
             {sessions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No therapy sessions found.</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session: any) => (
                  <div key={session.id} className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-800/50 shadow-sm">
                     <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-50 dark:border-gray-700/50">
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{session.diagnosis}</h4>
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">{formatDate(session.createdAt)}</span>
                     </div>
                     <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                       {session.notes && <div><strong className="text-gray-900 dark:text-gray-100 block mb-1">Clinical Notes:</strong><p className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">{session.notes}</p></div>}
                       {session.treatmentPlan && <div><strong className="text-gray-900 dark:text-gray-100 block mb-1">Treatment Plan:</strong><p className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">{session.treatmentPlan}</p></div>}
                       {session.painLevel !== null && <div className="flex items-center gap-2"><strong className="text-gray-900 dark:text-gray-100">Pain Level:</strong> <Badge status="PENDING">{session.painLevel} / 10</Badge></div>}
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'invoices':
        return (
          <div className="space-y-4">
             {(!patient.invoices || patient.invoices.length === 0) ? (
              <p className="text-center text-gray-500 py-8">No invoices found.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {patient.invoices.map((inv: any) => (
                  <div key={inv.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {inv.number} <span className="text-gray-400 mx-2">•</span> {inv.total}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(inv.createdAt)}
                      </p>
                    </div>
                    <Badge status={inv.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'documents':
        const docsCount = (patient.files?.length || 0) + (patient.ConsentForm?.length || 0) + (patient.MedicalFile?.length || 0) + (patient.ProgressPhoto?.length || 0) + (patient.PainMap?.length || 0);
        return (
          <div className="space-y-4">
             {docsCount === 0 ? (
              <p className="text-center text-gray-500 py-8">No documents uploaded.</p>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {patient.files?.map((f: any) => (
                    <div key={f.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800/50 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                       <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                          <FileText size={24} />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{f.filename || 'Document'}</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(f.createdAt)}</p>
                       </div>
                    </div>
                  ))}
               </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/50 backdrop-blur-sm transition-opacity p-0 m-0">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-5">
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-2xl font-bold text-white shadow-lg">
               {patient.name.charAt(0)}
             </div>
             <div>
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{patient.name}</h2>
               <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">ID: {patient.id.slice(-6)}</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 px-6 bg-gray-50/50 dark:bg-gray-900/50 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-t-lg" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
