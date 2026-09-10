import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { IncomeEntry } from '@/types/api';

export const useTodayIncome = () => {
  const today = new Date();
  const from = today.toISOString().split('T')[0];
  const to = from;

  return useQuery({
    queryKey: [QUERY_KEYS.INCOME, 'today'],
    queryFn: async () => {
      const { data } = await api.get<IncomeEntry[]>(`/income?from=${from}&to=${to}`);
      return data.length > 0 ? data[0] : null;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
