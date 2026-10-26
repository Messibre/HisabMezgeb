import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { IncomeEntry, ExpenseWithCategory, FundingEntry } from '@/types/api';

type EntryType = 'income' | 'expense' | 'funding';

type EntryMap = {
  income: IncomeEntry[];
  expense: ExpenseWithCategory[];
  funding: FundingEntry[];
};

export const useEntryHistory = <T extends EntryType>(type: T, from: string, to: string) => {
  const endpointMap = {
    income: '/income',
    expense: '/expenses',
    funding: '/funding',
  };

  const queryKeyMap = {
    income: QUERY_KEYS.INCOME,
    expense: QUERY_KEYS.EXPENSES,
    funding: QUERY_KEYS.FUNDING,
  } as const;

  return useQuery({
    queryKey: [queryKeyMap[type], from, to],
    queryFn: async () => {
      const { data } = await api.get<EntryMap[T]>(`${endpointMap[type]}?from=${from}&to=${to}`);
      return data;
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!from && !!to,
  });
};
