import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { ExpenseBreakdownItem } from '@/types/api';

export const useExpenseBreakdown = (from: string, to: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.REPORT_EXPENSE_BREAKDOWN, from, to],
    queryFn: async () => {
      const { data } = await api.get<ExpenseBreakdownItem[]>(
        `/reports/expenses-breakdown?from=${from}&to=${to}`
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!from && !!to,
  });
};
