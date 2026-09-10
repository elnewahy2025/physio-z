// frontend/src/components/PasswordStrength.tsx

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number; // 0-4
  label: string;
  labelAr: string;
  color: string;
  barColor: string;
  suggestions: string[];
  suggestionsAr: string[];
}

export function checkPasswordStrength(password: string): StrengthResult {
  let score = 0;
  const suggestions: string[] = [];
  const suggestionsAr: string[] = [];

  if (password.length >= 8) score++;
  else {
    suggestions.push('Use at least 8 characters');
    suggestionsAr.push('استخدم 8 أحرف على الأقل');
  }

  if (/[A-Z]/.test(password)) score++;
  else {
    suggestions.push('Add an uppercase letter');
    suggestionsAr.push('أضف حرفاً كبيراً');
  }

  if (/[a-z]/.test(password)) score++;
  else {
    suggestions.push('Add a lowercase letter');
    suggestionsAr.push('أضف حرفاً صغيراً');
  }

  if (/[0-9]/.test(password)) score++;
  else {
    suggestions.push('Add a number');
    suggestionsAr.push('أضف رقماً');
  }

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else {
    suggestions.push('Add a special character (!@#$...)');
    suggestionsAr.push('أضف رمزاً خاصاً (!@#$...)');
  }

  // Cap score at 4 for the visual bar
  const visualScore = Math.min(score, 4);

  const strengthMap: Array<Omit<StrengthResult, 'score' | 'suggestions' | 'suggestionsAr'>> = [
    { label: 'Very Weak', labelAr: 'ضعيف جداً', color: 'text-red-600', barColor: 'bg-red-500' },
    { label: 'Weak', labelAr: 'ضعيف', color: 'text-red-500', barColor: 'bg-red-400' },
    { label: 'Fair', labelAr: 'متوسط', color: 'text-yellow-600', barColor: 'bg-yellow-500' },
    { label: 'Good', labelAr: 'جيد', color: 'text-lime-600', barColor: 'bg-lime-500' },
    { label: 'Strong', labelAr: 'قوي', color: 'text-green-600', barColor: 'bg-green-500' },
  ];

  return {
    score: visualScore,
    ...strengthMap[visualScore],
    suggestions,
    suggestionsAr,
  };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const strength = checkPasswordStrength(password);
  const isRTL = document.documentElement.dir === 'rtl';

  return (
    <div className="mt-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength.score ? strength.barColor : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <div className="mt-1 flex items-center justify-between">
        <span className={`text-xs font-medium ${strength.color}`}>
          {isRTL ? strength.labelAr : strength.label}
        </span>
        <span className="text-xs text-gray-400">
          {password.length}/8+ {isRTL ? 'حرف' : 'chars'}
        </span>
      </div>

      {/* Suggestions (only show if weak) */}
      {strength.score < 3 && (isRTL ? strength.suggestionsAr : strength.suggestions).length > 0 && (
        <div className="mt-2 space-y-1">
          {(isRTL ? strength.suggestionsAr : strength.suggestions).map((s, i) => (
            <p key={i} className="text-xs text-gray-400">
              • {s}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}