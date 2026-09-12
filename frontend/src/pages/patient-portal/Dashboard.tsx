import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '../../store/patient-auth';
import GamificationDashboard from '../../components/patient/GamificationDashboard';
import { LogOut, Calendar, FileText, Activity } from 'lucide-react';

export default function PatientDashboard() {
  const { patient, logout } = usePatientAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!patient) {
      navigate('/portal/login');
    }
  }, [patient, navigate]);

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Physio-Z Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                Welcome, {patient.name.split(' ')[0]}
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate('/portal/login');
                }}
                className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-lg p-6 sm:p-10 text-white flex flex-col sm:flex-row justify-between items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Hello, {patient.name}!</h2>
            <p className="text-primary-100 max-w-lg">
              Welcome to your personal patient portal. Track your progress, manage appointments, and unlock achievements!
            </p>
          </div>
          <div className="mt-6 sm:mt-0 flex space-x-4">
            <button 
              onClick={() => navigate('/book')}
              className="flex items-center space-x-2 bg-white text-primary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Session</span>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Gamification) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Your Progress</h3>
              <GamificationDashboard patientId={patient.id} />
            </div>
          </div>

          {/* Right Column (Quick Links & Info) */}
          <div className="space-y-8">
            
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Links</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/appointments')}
                  className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-gray-100 dark:border-gray-700"
                >
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">My Appointments</p>
                    <p className="text-xs text-gray-500">View upcoming & past</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => navigate('/invoices')}
                  className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-gray-100 dark:border-gray-700"
                >
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-3">
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Invoices & Payments</p>
                    <p className="text-xs text-gray-500">Manage your billing</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Profile Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Phone</span>
                  <span className="font-medium text-gray-900 dark:text-white">{patient.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Email</span>
                  <span className="font-medium text-gray-900 dark:text-white">{patient.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Gender</span>
                  <span className="font-medium text-gray-900 dark:text-white">{patient.gender || '-'}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
