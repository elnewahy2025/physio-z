import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, HeartPulse, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Card, CardHeader, Spinner } from '../../components/ui';

export default function PatientProfile() {
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: async () => {
      const res = await api.get('/portal/me');
      return res.data.data;
    },
  });

  if (isLoading) return <Spinner className="py-24" />;

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button onClick={() => navigate('/portal/dashboard')} className="mr-4 p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Basic Info */}
        <Card>
          <CardHeader title="Personal Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{profile.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{profile.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{profile.address || '-'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">
                  {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Medical Info */}
        <Card>
          <CardHeader title="Medical History" />
          <div className="space-y-6 mt-4">
            <div>
              <div className="flex items-center space-x-2 text-primary-600 mb-2">
                <HeartPulse className="w-5 h-5" />
                <h3 className="font-semibold text-gray-900 dark:text-white">General Medical History</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                {profile.medicalHistory || 'No medical history recorded.'}
              </p>
            </div>
            
            <div>
              <div className="flex items-center space-x-2 text-red-500 mb-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Allergies</h3>
              </div>
              {profile.allergies && profile.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.map((allergy: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      {allergy}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No known allergies.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader title="Emergency Contact" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <p className="text-sm text-gray-500">Contact Name</p>
              <p className="font-medium text-gray-900 dark:text-white">{profile.emergencyContactName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900 dark:text-white">{profile.emergencyContactPhone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Relation</p>
              <p className="font-medium text-gray-900 dark:text-white">{profile.emergencyContactRelation || '-'}</p>
            </div>
          </div>
        </Card>

        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Please contact the clinic if any of the above information is incorrect or needs updating.</p>
        </div>

      </div>
    </div>
  );
}
