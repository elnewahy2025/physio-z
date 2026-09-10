import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, Building2, Phone, Mail, MapPin, Globe, DollarSign, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { Card, CardHeader, Spinner } from '../components/ui';
import LogoUpload from '../components/LogoUpload';
import { MapCard } from '../components/GoogleMapsLink';

export default function Settings() {
  const { t, lang } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  const [formData, setFormData] = useState({
    centerName: '',
    phone: '',
    email: '',
    address: '',
    googleMapsLink: '',
    sessionPrice: '',
    currency: 'EGP',
    taxRate: '0',
    whatsappMessageTemplate: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        centerName: settings.centerName || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        googleMapsLink: settings.googleMapsLink || '',
        sessionPrice: String(settings.sessionPrice || ''),
        currency: settings.currency || 'EGP',
        taxRate: String(settings.taxRate || '0'),
        whatsappMessageTemplate: settings.whatsappMessageTemplate || '',
      });
    }
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: async (data: any) => {
      await api.put('/settings', {
        centerName: data.centerName,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        googleMapsLink: data.googleMapsLink || null,
        sessionPrice: parseFloat(data.sessionPrice) || 0,
        currency: data.currency,
        taxRate: parseFloat(data.taxRate) || 0,
        whatsappMessageTemplate: data.whatsappMessageTemplate || null,
      });
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to save settings');
    },
  });

  if (isLoading) return <Spinner className="py-24" />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    saveSettings.mutate(formData);
  };

  const label = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader
          title={t('settings')}
          subtitle={label('?�?�?�?�?�?�?? ?�?�?�?� ?�?�?�?�?�?� ?�?�?�?�???�??', 'Physio Center configuration')}
        />

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {saved && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            ✓ {label('???� ?�???� ?�?�?�?�?�?�?�?�?? ?�?�?�?�?�', 'Settings saved successfully')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
  {/* ─── Logo Upload (NEW) ─── */}
  <section>
    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
      <Building2 size={16} />
      {L('\u0634\u0639\u0627\u0631 \u0627\u0644\u0645\u0631\u0643\u0632', 'Center Logo')}
    </h3>
    <LogoUpload currentLogo={settings?.centerLogo || null} />
  </section>

          {/* Center Info */}
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Building2 size={16} />
              {label('?�?�?�?�?�?�?? ?�?�?�?�?�?�', 'Center Information')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{label('?�?�?� ?�?�?�?�?�?�', 'Center Name')} *</label>
                <input
                  type="text"
                  value={formData.centerName}
                  onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">{t('phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label">{t('email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">{label('?�?�?�?�?�?�?�', 'Address')}</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">{label('?�?�?�?� ?�?�?�?�?� ?�?�?�?�', 'Google Maps Link')}</label>
                <input
                  type="url"
                  value={formData.googleMapsLink}
                  onChange={(e) => setFormData({ ...formData, googleMapsLink: e.target.value })}
                  className="input"
                  dir="ltr"
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
          </section>

          {/* Financial */}
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <DollarSign size={16} />
              {label('?�?�?�?�?�?�?�?�?? ?�?�?�?�?�???�', 'Financial Settings')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">{label('?�?�?� ?�?�?�?�?�?�', 'Session Price')}</label>
                <input
                  type="number"
                  value={formData.sessionPrice}
                  onChange={(e) => setFormData({ ...formData, sessionPrice: e.target.value })}
                  className="input"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="label">{label('?�?�?�?�?�?�', 'Currency')}</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="input"
                >
                  <option value="EGP">EGP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>
              <div>
                <label className="label">{label('?�?�?�?� ?�?�?�?�???�?� %', 'Tax Rate %')}</label>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  className="input"
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>
            </div>
          </section>

          {/* WhatsApp */}
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Phone size={16} />
              {label('?�?�?�?� ?�?�?�?�?� ?�?�???�?�?�', 'WhatsApp Message Template')}
            </h3>
            <div>
              <textarea
                value={formData.whatsappMessageTemplate}
                onChange={(e) =>
                  setFormData({ ...formData, whatsappMessageTemplate: e.target.value })
                }
                className="input"
                rows={3}
                placeholder={'Hello {patient_name}, reminder for your appointment on {date_time} at {center_name}.'}
              />
              <p className="mt-2 text-xs text-gray-400">
                {label(
                  '?�?�???�?�?�: {patient_name}?� {date_time}?� {center_name}',
                  'Use: {patient_name}, {date_time}, {center_name}',
                )}
              </p>
            </div>
          </section>

          <div className="flex justify-end border-t border-gray-100 pt-4">
            <button
              type="submit"
              disabled={saveSettings.isPending}
              className="btn-primary"
            >
              <Save size={16} />
              {saveSettings.isPending
                ? t('loading')
                : lang === 'ar'
                  ? '?�???� ?�?�?�?�?�?�?�?�??'
                  : 'Save Settings'}
            </button>
          </div>
        </form>
        {/* ─── Google Maps (NEW) ─── */}
<div className="mt-6">
  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
    <MapPin size={16} />
    {L('\u0627\u0644\u0645\u0648\u0642\u0639 \u0639\u0644\u0649 \u0627\u0644\u062e\u0631\u064a\u0637\u0629', 'Location on Map')}
  </h3>
  <MapCard />
</div>
      </Card>
    </div>
  );
}