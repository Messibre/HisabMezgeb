import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { FundingEntry, CreateFundingPayload } from '@/types/api';

export const useCreateFunding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateFundingPayload) => {
      const { data } = await api.post<FundingEntry>('/funding', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FUNDING] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FUNDING_OUTSTANDING] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_SUMMARY] });
    },
  });
};
