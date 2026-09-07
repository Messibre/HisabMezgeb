import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ExportReportParams } from '@/types/api';

export const useExportReport = () => {
  return useMutation({
    mutationFn: async ({ from, to }: ExportReportParams) => {
      const response = await api.get(`/reports/export?from=${from}&to=${to}`, {
        responseType: 'blob',
      });
      // Returns a Blob; we'll create a download link in the component
      return response.data as Blob;
    },
  });
};
