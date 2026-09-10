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
  PATIENT: 'bg-gray-50 text-gray-600',
};

export default function Users() {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
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

  if (isLoading) return <Spinner className="py-24" />;

  const roleLabels: Record<string, string> = {
    OWNER: L('\u0627\u0644\u0645\u0627\u0644\u0643', 'Owner'),
    THERAPIST: L('\u0623\u062e\u0635\u0627\u0626\u064a', 'Therapist'),
    SECRETARY: L('\u0633\u0643\u0631\u062a\u0627\u0631\u064a\u0629', 'Secretary'),
    PATIENT: L('\u0645\u0631\u064a\u0636', 'Patient'),
  };

  const list = users || [];

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
          <div className="divide-y divide-gray-100">
            {list.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      roleColors[user.role] || 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {roleIcons[user.role]}
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>

                    <p className="text-sm text-gray-500" dir="ltr">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function NewUserForm({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'THERAPIST',
  });

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/users', data);
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
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${
                    roleColors[role]
                  }`}
                >
                  {roleIcons[role]}
                </div>

                <span className="text-sm font-medium text-gray-700">
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
          {createUser.isPending ? t('loading') : t('save')}
        </button>
      </div>
    </form>
  );
}
