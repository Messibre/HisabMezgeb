import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { IncomeEntry, CreateIncomePayload } from '@/types/api';

export const useCreateIncome = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateIncomePayload) => {
      const { data } = await api.post<IncomeEntry>('/income', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INCOME] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_SUMMARY] });
    },
  });
};
