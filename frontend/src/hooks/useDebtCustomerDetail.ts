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

export const useUpdateBorrowRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recordId,
      payload,
    }: {
      customerId: string;
      recordId: string;
      payload: { amount?: number; itemsDescription?: string; note?: string };
    }) => {
      const { data } = await api.patch<BorrowRecord>(`/debt-borrow-records/${recordId}`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DEBT_CUSTOMER_DETAIL, variables.customerId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEBT_CUSTOMERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_SUMMARY] });
    },
  });
};

export const useDeleteBorrowRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recordId }: { customerId: string; recordId: string }) => {
      await api.delete(`/debt-borrow-records/${recordId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DEBT_CUSTOMER_DETAIL, variables.customerId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEBT_CUSTOMERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_SUMMARY] });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paymentId,
      payload,
    }: {
      customerId: string;
      paymentId: string;
      payload: { amount?: number; note?: string };
    }) => {
      const { data } = await api.patch(`/debt-payments/${paymentId}`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DEBT_CUSTOMER_DETAIL, variables.customerId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEBT_CUSTOMERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_SUMMARY] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId }: { customerId: string; paymentId: string }) => {
      await api.delete(`/debt-payments/${paymentId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DEBT_CUSTOMER_DETAIL, variables.customerId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEBT_CUSTOMERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_SUMMARY] });
    },
  });
};

export const useDeleteDebtCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customerId: string) => {
      await api.delete(`/debt-customers/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEBT_CUSTOMERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORT_SUMMARY] });
    },
  });
};
