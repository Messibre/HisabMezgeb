import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { DebtCustomer, CreateCustomerPayload, UpdateCustomerPayload } from '@/types/api';

export const useDebtCustomers = (search?: string) => {
  const queryKey = [QUERY_KEYS.DEBT_CUSTOMERS, search || 'all'];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = search
        ? `/debt-customers?search=${encodeURIComponent(search)}`
        : '/debt-customers';
      const { data } = await api.get<DebtCustomer[]>(url);
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateDebtCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCustomerPayload) => {
      const { data } = await api.post<DebtCustomer>('/debt-customers', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEBT_CUSTOMERS] });
    },
  });
};

export const useUpdateDebtCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateCustomerPayload }) => {
      const { data } = await api.patch<DebtCustomer>(`/debt-customers/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEBT_CUSTOMERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEBT_CUSTOMER_DETAIL, data.id] });
    },
  });
};
