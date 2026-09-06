import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export type CustomerWithBalance = {
  id: string;
  name: string;
  note: string | null;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerHistory = {
  id: string;
  kind: 'borrow' | 'payment';
  date: Date;
  amount: number;
  itemsDescription: string | null;
};

export type CustomerDetail = {
  id: string;
  name: string;
  note: string | null;
  balance: number;
  history: CustomerHistory[];
  createdAt: Date;
  updatedAt: Date;
};

export const calculateCustomerBalance = async (customerId: string): Promise<number> => {
  throw new Error('not implemented');
};

export const listCustomersWithBalance = async (
  accountId: string,
  search?: string,
): Promise<CustomerWithBalance[]> => {
  throw new Error('not implemented');
};

export const createCustomer = async (
  accountId: string,
  data: { name: string; note?: string },
): Promise<CustomerWithBalance> => {
  throw new Error('not implemented');
};

export const getCustomerWithHistory = async (
  accountId: string,
  customerId: string,
): Promise<CustomerDetail> => {
  throw new Error('not implemented');
};

export const updateCustomer = async (
  accountId: string,
  customerId: string,
  data: { name?: string; note?: string },
): Promise<CustomerWithBalance> => {
  throw new Error('not implemented');
};

export const softDeleteCustomer = async (accountId: string, customerId: string): Promise<void> => {
  throw new Error('not implemented');
};
