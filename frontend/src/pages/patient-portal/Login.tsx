import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';
import api from '../../lib/api';
import { usePatientAuth } from '../../store/patient-auth';

type LoginMethod = 'phone' | 'email';
type Step = 'method' | 'input' | 'waiting' | 'otp' | 'register';

export default function PatientLogin() {
  const navigate = useNavigate();
  const { setAuth } = usePatientAuth();
  
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [regToken, setRegToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Registration Form
  const [name, setName] = useState('');
  const [gender, setGender] = useState('MALE');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (method === 'phone') {
        await api.post('/patient-auth/request-phone-otp', { phone: identifier });
        setStep('waiting');
      } else {
        await api.post('/patient-auth/request-email-otp', { email: identifier });
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/patient-auth/verify-otp', { identifier, code: otp });
      if (res.data.type === 'LOGIN') {
        setAuth(res.data.token, res.data.patient);
        navigate('/portal/dashboard');
      } else {
        setRegToken(res.data.registrationToken);
        setStep('register');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/patient-auth/register', { 
        registrationToken: regToken,
        identifier,
        name,
        gender
      });
      setAuth(res.data.token, res.data.patient);
      navigate('/portal/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Patient Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Secure, passwordless access to your medical records
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 overflow-hidden relative">
          
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

            
            {step === 'method' && (
              <div
                key="method"
                className="space-y-4"
              >
                <p className="text-center text-gray-700 dark:text-gray-300 mb-6">How would you like to log in?</p>
                <button
                  onClick={() => { setMethod('phone'); setStep('input'); }}
                  className="w-full flex items-center justify-between px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg">
                      <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">WhatsApp / Phone</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Receive code via WhatsApp</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </button>
                
                <button
                  onClick={() => { setMethod('email'); setStep('input'); }}
                  className="w-full flex items-center justify-between px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                      <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">Email Address</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Receive code via Email</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            )}

            {step === 'input' && (
              <div
                key="input"
              >
                <form onSubmit={handleRequestOtp} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {method === 'phone' ? 'Phone Number' : 'Email Address'}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {method === 'phone' ? (
                          <Phone className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Mail className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <input
                        type={method === 'phone' ? 'tel' : 'email'}
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="pl-10 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white py-3"
                        placeholder={method === 'phone' ? '01xxxxxxxxx' : 'you@example.com'}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Request Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('method')}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Go back
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 'waiting' && (
              <div
                key="waiting"
                className="text-center py-8"
              >
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
                  <ShieldCheck className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Request Sent!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  The clinic secretary will review your request and send the code to your WhatsApp shortly.
                </p>
                <button
                  onClick={() => setStep('otp')}
                  className="w-full py-3 px-4 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium"
                >
                  I have received the code
                </button>
              </div>
            )}

            {step === 'otp' && (
              <div
                key="otp"
              >
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center mb-4">
                      Enter the 6-digit code sent to <br/><span className="font-bold">{identifier}</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="block w-full text-center text-3xl tracking-widest font-mono border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white py-4"
                      placeholder="------"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>
                </form>
              </div>
            )}

            {step === 'register' && (
              <div
                key="register"
              >
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
                      <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Welcome!</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Let's set up your patient profile.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white py-2 px-3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white py-2 px-3"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !name}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 mt-6"
                  >
                    {loading ? 'Creating Profile...' : 'Complete Registration'}
                  </button>
                </form>
              </div>
            )}

        </div>
      </div>
    </div>
  );
}
