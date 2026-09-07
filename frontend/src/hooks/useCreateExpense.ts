import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { ExpenseWithCategory, CreateExpensePayload } from '@/types/api';

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateExpensePayload) => {
      const { data } = await api.post<ExpenseWithCategory>('/expenses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXPENSES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_EXPENSE_BREAKDOWN] });
    },
  });
};
