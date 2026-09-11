// frontend/src/components/LogoUpload.tsx
import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB original file
const MAX_DIMENSION = 256; // Resize to max 256x256
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

/**
 * Resizes an image file to a square with max dimension, converts to base64 PNG.
 */
async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions (maintain aspect ratio, max 256px)
        let { width, height } = img;
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        // Fill white background (for transparent PNGs)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 (PNG for best quality)
        const base64 = canvas.toDataURL('image/png', 0.9);
        resolve(base64);
      };

      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function LogoUpload({ currentLogo }: { currentLogo: string | null }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [preview, setPreview] = useState<string | null>(currentLogo);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const updateLogo = useMutation({
    mutationFn: async (logo: string | null) => {
      await api.put('/settings', { centerLogo: logo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || L('فشل حفظ الشعار', 'Failed to save logo'));
    },
  });

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError(null);

      // Validate type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(L('صيغة غير مدعومة. استخدم PNG أو JPG أو SVG', 'Unsupported format. Use PNG, JPG, or SVG'));
        return;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        setError(L('حجم الصورة كبير جداً (الحد الأقصى 2MB)', 'File too large (max 2MB)'));
        return;
      }

      try {
        // SVG files: read as text, keep as-is
        if (file.type === 'image/svg+xml') {
          const text = await file.text();
          const svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(text)))}`;
          setPreview(svgBase64);
          updateLogo.mutate(svgBase64);
        } else {
          // Raster images: resize and convert to base64
          const base64 = await resizeImage(file);
          setPreview(base64);
          updateLogo.mutate(base64);
        }
      } catch (err) {
        setError(L('فشل معالجة الصورة', 'Failed to process image'));
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [updateLogo, L],
  );

  const handleRemove = () => {
    setPreview(null);
    updateLogo.mutate(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <Check size={16} />
          <span>{L('تم حفظ الشعار بنجاح', 'Logo saved successfully')}</span>
        </div>
      )}

      <div className="flex items-start gap-6">
        {/* Preview */}
        <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {preview ? (
            <img
              src={preview}
              alt="Center logo"
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <ImageIcon size={32} />
              <span className="text-xs">{L('لا شعار', 'No logo')}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-1 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={updateLogo.isPending}
              className="btn-secondary !py-2 !px-4 text-sm"
            >
              <Upload size={16} />
              {updateLogo.isPending
                ? L('جاري الحفظ...', 'Saving...')
                : L('اختر شعار', 'Choose Logo')}
            </button>

            {preview && (
              <button
                onClick={handleRemove}
                disabled={updateLogo.isPending}
                className="btn-danger !py-2 !px-4 text-sm"
              >
                <Trash2 size={16} />
                {L('حذف', 'Remove')}
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400">
            {L(
              'PNG أو JPG أو SVG — سيتم تصغير الصورة تلقائياً إلى 256×256 بكسل',
              'PNG, JPG, or SVG — will be auto-resized to 256×256px',
            )}
          </p>
        </div>
      </div>
    </div>
  );
}