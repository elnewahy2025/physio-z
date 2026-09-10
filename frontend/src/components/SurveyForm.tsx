// frontend/src/components/SurveyForm.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';

interface SurveyFormProps {
  appointmentId: string;
  therapistName: string;
  appointmentDate: string;
  onSubmitted?: () => void;
}

export default function SurveyForm({
  appointmentId,
  therapistName,
  appointmentDate,
  onSubmitted,
}: SurveyFormProps) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const submitSurvey = useMutation({
    mutationFn: async () => {
      await api.post('/surveys', {
        appointmentId,
        rating,
        feedback: feedback || undefined,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['my-records'] });
      queryClient.invalidateQueries({ queryKey: ['pending-surveys'] });
      onSubmitted?.();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || L('فشل الإرسال', 'Submission failed'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(L('يرجى اختيار تقييم', 'Please select a rating'));
      return;
    }
    setError(null);
    submitSurvey.mutate();
  };

  if (success) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
        <Check size={20} className="text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            {L('شكراً لتقييمك!', 'Thank you for your feedback!')}
          </p>
          <p className="text-xs text-green-600">
            {L('يساعدنا تقييمك على تحسين جودة الخدمة', 'Your feedback helps us improve our service')}
          </p>
        </div>
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

      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {L('كيف كانت جلستك مع', 'How was your session with')} {therapistName}؟
        </p>
        <p className="text-xs text-gray-400">
          {new Date(appointmentDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      {/* Star rating */}
      <div className="mb-4">
        <div className="flex gap-2" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={
                  star <= (hover ?? rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200'
                }
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            {rating === 5 ? L('ممتاز! 🎉', 'Excellent! 🎉')
              : rating === 4 ? L('جيد جداً', 'Very good')
              : rating === 3 ? L('جيد', 'Good')
              : rating === 2 ? L('مقبول', 'Fair')
              : L('يحتاج تحسين', 'Needs improvement')}
          </p>
        )}
      </div>

      {/* Feedback */}
      <div className="mb-4">
        <label className="label">
          {L('تعليقك (اختياري)', 'Your feedback (optional)')}
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="input !text-sm"
          rows={2}
          maxLength={500}
          placeholder={L('ما أعجبك؟ ما يمكن تحسينه؟', 'What did you like? What could be improved?')}
        />
      </div>

      <button
        type="submit"
        disabled={submitSurvey.isPending || rating === 0}
        className="btn-primary !py-2 !px-4 text-xs"
      >
        {submitSurvey.isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          L('إرسال التقييم', 'Submit Feedback')
        )}
      </button>
    </form>
  );
}