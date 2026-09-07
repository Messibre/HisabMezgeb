import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { Settings, UpdateSettingsPayload } from '@/types/api';

export const useSettings = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.SETTINGS],
    queryFn: async () => {
      const { data } = await api.get<Settings>('/settings');
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateSettingsPayload) => {
      const { data } = await api.patch<Settings>('/settings', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SETTINGS] });
    },
  });
};
