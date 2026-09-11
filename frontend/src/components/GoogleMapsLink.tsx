// frontend/src/components/GoogleMapsLink.tsx
import { MapPin, Navigation } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useI18n } from '../i18n';

interface Settings {
  centerName: string;
  address: string | null;
  googleMapsLink: string | null;
}

/**
 * Generates a Google Maps directions URL.
 * Uses custom link if available, otherwise falls back to address search.
 */
function getMapsUrl(settings: Settings | undefined): string | null {
  if (!settings) return null;

  // If custom link is provided, use it
  if (settings.googleMapsLink) return settings.googleMapsLink;

  // Otherwise, search by address or center name
  const query = settings.address || settings.centerName;
  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * "Get Directions" button — opens Google Maps.
 */
export function DirectionsButton({ compact = false }: { compact?: boolean }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data as Settings;
    },
  });

  const url = getMapsUrl(settings);
  if (!url) return null;

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg bg-blue-50 p-2 text-blue-600 transition-colors hover:bg-blue-100"
        title={L('الاتجاهات', 'Directions')}
      >
        <Navigation size={16} />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-secondary !py-2 !px-4 text-sm"
    >
      <Navigation size={16} />
      {L('الاتجاهات', 'Get Directions')}
    </a>
  );
}

/**
 * Full map card with embedded Google Maps iframe.
 */
export function MapCard() {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data as Settings;
    },
  });

  if (!settings) return null;

  const hasAddress = settings.address || settings.centerName;
  if (!hasAddress) return null;

  const embedQuery = encodeURIComponent(settings.address || settings.centerName);
  const embedUrl = `https://www.google.com/maps?q=${embedQuery}&output=embed`;
  const directionsUrl = getMapsUrl(settings);

  return (
    <div className="card overflow-hidden !p-0">
      {/* Map iframe */}
      <div className="relative h-64 w-full bg-gray-100">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          title={settings.centerName}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{settings.centerName}</p>
            {settings.address && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{settings.address}</p>
            )}
          </div>
        </div>

        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary !py-2 !px-4 text-xs whitespace-nowrap"
          >
            <Navigation size={14} />
            {L('الاتجاهات', 'Directions')}
          </a>
        )}
      </div>
    </div>
  );
}