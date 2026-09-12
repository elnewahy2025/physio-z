import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { whatsappService } from '../services/whatsapp.service';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

const WhatsAppReminders: React.FC = () => {
  const [pendingReminders, setPendingReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Custom simulation test box state
  const [customPhone, setCustomPhone] = useState('+201001234567');
  const [customMsg, setCustomMsg] = useState('تذكير بموعد جلسة العلاج الطبيعي غداً الساعة 11:00 صباحاً.');
  const [isSendingCustom, setIsSendingCustom] = useState(false);

  useEffect(() => {
    loadPendingReminders();
  }, []);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadPendingReminders = async () => {
    setLoading(true);
    try {
      const response = await whatsappService.getPendingReminders();
      setPendingReminders(response || []);
    } catch (error) {
      console.error('Failed to load pending reminders:', error);
      addToast('تعذر تحميل التذكيرات المعلقة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSimulatedReminder = async (appointmentId: string, patientName: string) => {
    setSendingId(appointmentId);
    try {
      await whatsappService.sendReminder({
        appointmentId,
      });

      setSentMap((prev) => ({ ...prev, [appointmentId]: true }));
      addToast(`تم إرسال تذكير واتساب للمريض ${patientName} بنجاح (وضع المحاكاة)`);
    } catch (error) {
      console.error('Failed to send reminder:', error);
      addToast('فشل إرسال التذكير، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      setSendingId(null);
    }
  };

  const handleOpenWhatsAppManual = async (appointmentId: string) => {
    try {
      const { link, message } = await whatsappService.generateReminderLink(appointmentId);
      window.open(link, '_blank');
      await whatsappService.logReminderSent({
        appointmentId,
        messageContent: message,
      });
      setSentMap((prev) => ({ ...prev, [appointmentId]: true }));
      addToast('تم فتح واتساب وتسجيل التذكير');
    } catch (error) {
      console.error('Failed to generate WhatsApp link:', error);
    }
  };

  const handleSendCustomSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;

    setIsSendingCustom(true);
    try {
      // Use any first appointment ID or a dummy test ID
      const testApptId = pendingReminders[0]?.appointments[0]?.id || 'test-simulation-id';
      await whatsappService.sendReminder({
        appointmentId: testApptId,
        message: customMsg,
      });
      addToast(`تمت محاكاة إرسال الرسالة إلى ${customPhone} بنجاح! راجع سجل الإشعارات.`);
    } catch (error) {
      addToast('حدث خطأ أثناء المحاكاة', 'error');
    } finally {
      setIsSendingCustom(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6" dir="rtl">
      {/* Toast notifications */}
      <div className="fixed top-5 left-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm text-white font-medium transition-all duration-300 transform translate-y-0 ${
              t.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-700 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold tracking-wide uppercase mb-2">
              <SparklesIcon className="w-4 h-4" />
              وضع المحاكاة نشط (Sandbox Mode)
            </div>
            <h1 className="text-2xl font-bold">تذكيرات رسائل واتساب الذكية</h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
              إرسال تذكيرات المواعيد تلقائياً أو يدوياً للمرضى. في وضع المحاكاة الحالي، يتم طباعة الرسائل في سجل النظام وتخزينها في جدول الإشعارات دون الحاجة لمزود مدفوع.
            </p>
          </div>
          <button
            onClick={loadPendingReminders}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition shadow-sm disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث القائمة
          </button>
        </div>
      </div>

      {/* Grid: Pending reminders list & Custom Sandbox Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Pending Reminders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-emerald-600" />
              المواعيد القادمة بحاجة لتذكير
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium px-2 py-0.5 rounded-full">
                {pendingReminders.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : pendingReminders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">لا توجد تذكيرات معلقة حالياً</h3>
              <p className="text-sm text-gray-500 mt-1">جميع المرضى للمواعيد القادمة تم إرسال تذكيرات لهم أو لا توجد مواعيد جديدة.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReminders.map((reminder) => {
                const appt = reminder.appointments?.[0];
                const isSent = appt ? sentMap[appt.id] : false;
                const isSendingThis = appt ? sendingId === appt.id : false;

                return (
                  <div
                    key={reminder.patient.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base flex-shrink-0">
                          {reminder.patient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              {reminder.patient.name}
                            </h3>
                            {isSent ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                تم الإرسال (محاكاة)
                              </span>
                            ) : (
                              <span className="text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                                في الانتظار
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" dir="ltr">
                            {reminder.patient.phone}
                          </p>

                          {appt && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                              <CalendarIcon className="w-4 h-4 text-emerald-600" />
                              <span>{new Date(appt.dateTime).toLocaleString('ar-EG')}</span>
                              <span>•</span>
                              <span>{appt.therapist?.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {appt && (
                          <>
                            <button
                              onClick={() => handleSendSimulatedReminder(appt.id, reminder.patient.name)}
                              disabled={isSendingThis}
                              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                            >
                              {isSendingThis ? (
                                <>
                                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                                  جارِ الإرسال...
                                </>
                              ) : (
                                <>
                                  <PaperAirplaneIcon className="w-3.5 h-3.5 -scale-x-100" />
                                  إرسال تذكير (محاكاة)
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleOpenWhatsAppManual(appt.id)}
                              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                              title="فتح محادثة واتساب ويب"
                            >
                              <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Interactive Sandbox Test Console */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <SparklesIcon className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                اختبار محاكاة واتساب السريع
              </h3>
            </div>

            <form onSubmit={handleSendCustomSimulation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  رقم الهاتف التجريبي
                </label>
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full text-xs rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-2.5 focus:ring-emerald-500 focus:border-emerald-500"
                  dir="ltr"
                  placeholder="+201000000000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  نص رسالة التذكير
                </label>
                <textarea
                  rows={4}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full text-xs rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-2.5 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="اكتب نص الرسالة هنا..."
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-[11px] text-emerald-800 dark:text-emerald-200 space-y-1">
                <p className="font-semibold">⚡ كيف تعمل المحاكاة؟</p>
                <p>1. يُطبع نص الرسالة في كونسول الخادم الخلفي فوراً.</p>
                <p>2. يُحفظ إشعار جديد في قاعدة البيانات ليظهر في جرس الإشعارات.</p>
              </div>

              <button
                type="submit"
                disabled={isSendingCustom}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
              >
                {isSendingCustom ? (
                  <>
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                    جارِ المحاكاة...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-3.5 h-3.5 -scale-x-100" />
                    محاكاة إرسال الرسالة
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppReminders;
