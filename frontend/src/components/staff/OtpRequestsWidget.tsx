import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Check, X, Smartphone } from 'lucide-react';
import api from '../../lib/api';
import { Card, CardHeader, EmptyState, Spinner } from '../ui';

interface OtpRequest {
  id: string;
  phone: string;
  status: string;
  createdAt: string;
}

export default function OtpRequestsWidget() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['otp-requests', 'pending'],
    queryFn: async () => {
      const res = await api.get('/otp-requests');
      return res.data as OtpRequest[];
    },
    refetchInterval: 10000 // poll every 10 seconds
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/otp-requests/${id}/approve`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['otp-requests'] });
      alert('Approved! Opening WhatsApp...');
      // Open wa.me link in new tab
      if (data.waLink) {
        window.open(data.waLink, '_blank');
      }
    },
    onError: () => {
      alert('Failed to approve request');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/otp-requests/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otp-requests'] });
      alert('Request rejected');
    }
  });

  if (isLoading) return <Spinner />;

  return (
    <Card>
      <CardHeader 
        title="Pending Portal Logins" 
        subtitle={`${requests?.length || 0} patient(s) waiting for OTP`} 
      />
      
      {!requests || requests.length === 0 ? (
        <EmptyState message="No pending requests" />
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {requests.map(req => (
            <div key={req.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-2 rounded-lg text-primary-600">
                  <Smartphone size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white" dir="ltr">{req.phone}</p>
                  <p className="text-xs text-gray-500">
                    Requested: {new Date(req.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approveMutation.mutate(req.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  title="Approve & Send via WhatsApp"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => rejectMutation.mutate(req.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  title="Reject"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
