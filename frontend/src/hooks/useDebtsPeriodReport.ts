import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { DebtPeriodReport } from '@/types/api';

export const useDebtsPeriodReport = (from: string, to: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.REPORT_DEBTS_PERIOD, from, to],
    queryFn: async () => {
      const { data } = await api.get<DebtPeriodReport>(
        `/reports/debts-period?from=${from}&to=${to}`
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!from && !!to,
  });
};
