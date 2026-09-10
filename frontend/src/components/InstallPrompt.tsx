// frontend/src/components/InstallPrompt.tsx
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useI18n } from '../i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const { lang } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:bottom-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Download size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {L('تثبيت التطبيق', 'Install App')}
            </p>
            <p className="text-xs text-gray-500">
              {L('أضف إلى شاشة البداية', 'Add to your home screen')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrompt(false)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
          <button
            onClick={handleInstall}
            className="btn-primary !py-1.5 !px-4 text-xs"
          >
            {L('تثبيت', 'Install')}
          </button>
        </div>
      </div>
    </div>
  );
}