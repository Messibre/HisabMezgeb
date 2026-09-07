import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      await api.patch('/auth/password', payload);
    },
  });
};
