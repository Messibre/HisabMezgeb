import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { todayLocal } from '@/lib/date';
import type { IncomeEntry } from '@/types/api';

export const useTodayIncome = () => {
  const today = todayLocal();

  return useQuery({
    queryKey: [QUERY_KEYS.INCOME, 'today', today],
    queryFn: async () => {
      const { data } = await api.get<IncomeEntry[]>(`/income?from=${today}&to=${today}`);
      return data.length > 0 ? data[0] : null;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
