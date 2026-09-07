import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { ReportSummary } from '@/types/api';

export const useReportSummary = (from: string, to: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.REPORT_SUMMARY, from, to],
    queryFn: async () => {
      const { data } = await api.get<ReportSummary>(`/reports/summary?from=${from}&to=${to}`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!from && !!to,
  });
};
