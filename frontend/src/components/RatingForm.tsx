// frontend/src/components/RatingForm.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare, Check, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { StarRating } from './StarRating';

export default function RatingForm({ appointmentId }: { appointmentId: string }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const submitRating = useMutation({
    mutationFn: async () => {
      await api.post('/ratings', {
        appointmentId,
        rating,
        comment: comment || undefined,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['my-records'] });
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || L('فشل إرسال التقييم', 'Failed to submit rating'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(L('يرجى اختيار تقييم', 'Please select a rating'));
      return;
    }
    setError(null);
    submitRating.mutate();
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
        <Check size={16} />
        <span>{L('شكراً لتقييمك!', 'Thank you for your rating!')}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <p className="mb-3 text-sm font-medium text-gray-700">
        {L('كيف كانت تجربتك؟', 'How was your experience?')}
      </p>

      <div className="mb-4">
        <StarRating
          value={rating}
          interactive={true}
          size={32}
          onChange={(r) => {
            setRating(r);
            setError(null);
          }}
        />
      </div>

      <div className="mb-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={L('اكتب تعليقك (اختياري)...', 'Write a comment (optional)...')}
          className="input !text-sm"
          rows={2}
          maxLength={500}
        />
      </div>

      <button
        type="submit"
        disabled={submitRating.isPending || rating === 0}
        className="btn-primary !py-2 !px-4 text-xs"
      >
        <Star size={14} />
        {submitRating.isPending
          ? L('جاري الإرسال...', 'Submitting...')
          : L('إرسال التقييم', 'Submit Rating')}
      </button>
    </form>
  );
}
