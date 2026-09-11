// frontend/src/pages/Users.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  UserCheck,
  UserX,
  Search,
  Shield,
  Stethoscope,
  ClipboardList,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { ar } from '../ar';
import { Card, CardHeader, Badge, EmptyState, Spinner } from '../components/ui';
import { ResetPasswordButton, ChangeRoleButton } from '../components/UserActions';

interface User {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: 'OWNER' | 'THERAPIST' | 'SECRETARY' | 'PATIENT';
  isActive: boolean;
  createdAt: string;
}

const roleIcons: Record<string, React.ReactNode> = {
  OWNER: <Shield size={18} />,
  THERAPIST: <Stethoscope size={18} />,
  SECRETARY: <ClipboardList size={18} />,
  PATIENT: <UserCheck size={18} />,
};

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-50 text-purple-600',
  THERAPIST: 'bg-blue-50 text-blue-600',
  SECRETARY: 'bg-teal-50 text-teal-600',
  PATIENT: 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400',
};

export default function Users() {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', roleFilter, search],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const res = await api.get('/users', { params });
      return res.data as User[];
    },
  });

  const deactivateUser = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/users/${id}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirmId(null);
    },
  });

  if (isLoading) return <Spinner className="py-24" />;

  const roleLabels: Record<string, string> = {
    OWNER: L('\u0627\u0644\u0645\u0627\u0644\u0643', 'Owner'),
    THERAPIST: L('\u0623\u062e\u0635\u0627\u0626\u064a', 'Therapist'),
    SECRETARY: L('\u0633\u0643\u0631\u062a\u0627\u0631\u064a\u0629', 'Secretary'),
    PATIENT: L('\u0645\u0631\u064a\u0636', 'Patient'),
  };

  const list = users || [];
  const activeUsers = list.filter(u => u.isActive);
  const inactiveUsers = list.filter(u => !u.isActive);

  const renderUser = (user: User) => (
    <div key={user.id} className="flex items-center justify-between py-4 px-2 hover:bg-gray-50/50 dark:bg-gray-900/50 transition-colors rounded-lg">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${
            roleColors[user.role] || 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
          }`}
        >
          {roleIcons[user.role]}
        </div>

        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>

          <p className="text-sm text-gray-500 dark:text-gray-400" dir="ltr">
            {user.phone}
            {user.email && ` · ${user.email}`}
          </p>

          <div className="mt-1 flex items-center gap-2">
            <Badge
              status={
                user.role === 'OWNER' ? 'CONFIRMED' : 'PENDING'
              }
            >
              {roleLabels[user.role] || user.role}
            </Badge>

            {!user.isActive && (
              <Badge status="CANCELLED">
                {L('\u063a\u064a\u0631 \u0646\u0634\u0637', 'Inactive')}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">
          {new Date(user.createdAt).toLocaleDateString(
            lang === 'ar' ? 'ar-EG' : 'en-US',
            { month: 'short', year: 'numeric' },
          )}
        </span>

        <ResetPasswordButton
          userId={user.id}
          userName={user.name}
          currentRole={user.role}
        />

        {user.role !== 'OWNER' && (
          <ChangeRoleButton
            userId={user.id}
            userName={user.name}
            currentRole={user.role}
          />
        )}

        {user.isActive && user.role !== 'OWNER' && (
          <button
            onClick={() => deactivateUser.mutate(user.id)}
            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
            title={L('\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u0646\u0634\u064a\u0637', 'Deactivate')}
          >
            <UserX size={18} />
          </button>
        )}

        {!user.isActive && user.role !== 'OWNER' && (
          <button
            onClick={() => setDeleteConfirmId(user.id)}
            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
            title={L('حذف', 'Delete')}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('users')}
          subtitle={`${list.length} ${L('\u0645\u0633\u062a\u062e\u062f\u0645', 'users')}`}
          action={
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search')}
                  className="input !w-48 !ps-9"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input !w-auto"
              >
                <option value="">
                  {L('\u0643\u0644 \u0627\u0644\u0623\u062f\u0648\u0627\u0631', 'All roles')}
                </option>
                <option value="THERAPIST">{roleLabels['THERAPIST']}</option>
                <option value="SECRETARY">{roleLabels['SECRETARY']}</option>
                <option value="PATIENT">{roleLabels['PATIENT']}</option>
              </select>

              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-primary"
              >
                <Plus size={16} />
                {L('\u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u062a\u062e\u062f\u0645', 'Add User')}
              </button>
            </div>
          }
        />

        {showForm && <NewUserForm onClose={() => setShowForm(false)} />}

        {list.length === 0 ? (
          <EmptyState message={t('noData')} />
        ) : (
          <div className="flex flex-col gap-8 pb-4">
            {activeUsers.length > 0 && (
              <div className="divide-y divide-gray-100">
                {activeUsers.map(renderUser)}
              </div>
            )}
            
            {inactiveUsers.length > 0 && (
              <div>
                <div className="mb-4 flex items-center gap-2 px-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {L('المستخدمين غير النشطين', 'Inactive Users')}
                  </h3>
                  <div className="h-px flex-1 bg-gray-200"></div>
                </div>
                <div className="divide-y divide-gray-100 opacity-60 grayscale-[0.3]">
                  {inactiveUsers.map(renderUser)}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-3 text-red-600">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">
                {L('حذف المستخدم', 'Delete User')}
              </h3>
            </div>
            
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              {L(
                'هل أنت متأكد من حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
                'Are you sure you want to permanently delete this user? This action cannot be undone.'
              )}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary"
                disabled={deleteUser.isPending}
              >
                {t('cancel')}
              </button>
              
              <button
                onClick={() => deleteUser.mutate(deleteConfirmId)}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? L('جاري الحذف...', 'Deleting...') : L('تأكيد الحذف', 'Confirm Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewUserForm({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const roleLabels: Record<string, string> = {
    OWNER: L('المالك', 'Owner'),
    THERAPIST: L('أخصائي', 'Therapist'),
    SECRETARY: L('سكرتارية', 'Secretary'),
    PATIENT: L('مريض', 'Patient'),
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'THERAPIST',
  });

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data };
      if (!payload.email) payload.email = null;
      await api.post('/users', payload, { timeout: 10000 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create user');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createUser.mutate(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border border-purple-200 bg-purple-50/50 p-6"
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">
            {L('\u0627\u0644\u0627\u0633\u0645', 'Name')} *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="input"
            required
            minLength={2}
          />
        </div>

        <div>
          <label className="label">{t('phone')} *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="input"
            required
            minLength={8}
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </div>

        <div>
          <label className="label">{t('email')}</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="input"
          />
        </div>

        <div>
          <label className="label">{t('password')} *</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="input"
            required
            minLength={6}
            placeholder="••••••••"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">
            {L('\u0627\u0644\u062f\u0648\u0631', 'Role')} *
          </label>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {['THERAPIST', 'SECRETARY'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFormData({ ...formData, role })}
                className={`rounded-lg border-2 p-4 text-center transition-all ${
                  formData.role === role
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div
                  className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${
                    roleColors[role]
                  }`}
                >
                  {roleIcons[role]}
                </div>

                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {roleLabels[role]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">
          {t('cancel')}
        </button>

        <button
          type="submit"
          disabled={createUser.isPending}
          className="btn-primary"
        >
          {createUser.isPending ? L('جاري الحفظ...', 'Saving...') : t('save')}
        </button>
      </div>
    </form>
  );
}
