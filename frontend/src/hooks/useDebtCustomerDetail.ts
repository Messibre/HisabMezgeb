import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type {
  DebtCustomerDetail,
  BorrowRecord,
  PaymentResult,
  CreateBorrowPayload,
  CreatePaymentPayload,
} from '@/types/api';

export const useDebtCustomerDetail = (customerId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DEBT_CUSTOMER_DETAIL, customerId],
    queryFn: async () => {
      const { data } = await api.get<DebtCustomerDetail>(`/debt-customers/${customerId}`);
      return data;
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!customerId,
  });
};

export const useCreateBorrowRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerId,
      payload,
    }: {
      customerId: string;
      payload: CreateBorrowPayload;
    }) => {
      const { data } = await api.post<BorrowRecord>(
        `/debt-customers/${customerId}/borrow-records`,
        payload
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DEBT_CUSTOMER_DETAIL, variables.customerId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEBT_CUSTOMERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_DEBTS_PERIOD] });
    },
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerId,
      payload,
    }: {
      customerId: string;
      payload: CreatePaymentPayload;
    }) => {
      const { data } = await api.post<PaymentResult>(
        `/debt-customers/${customerId}/payments`,
        payload
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DEBT_CUSTOMER_DETAIL, variables.customerId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEBT_CUSTOMERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_DEBTS_PERIOD] });
    },
  });
};
