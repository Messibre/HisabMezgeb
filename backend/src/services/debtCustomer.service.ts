import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export const calculateCustomerBalance = async (customerId: string) => {
  throw new Error('not implemented');
};

export const listCustomersWithBalance = async (accountId: string, search?: string) => {
  throw new Error('not implemented');
};

export const createCustomer = async (
  accountId: string,
  data: {
    name: string;
    note?: string;
  },
) => {
  throw new Error('not implemented');
};

export const getCustomerWithHistory = async (accountId: string, customerId: string) => {
  throw new Error('not implemented');
};

export const updateCustomer = async (
  accountId: string,
  customerId: string,
  data: {
    name?: string;
    note?: string;
  },
) => {
  throw new Error('not implemented');
};

export const softDeleteCustomer = async (accountId: string, customerId: string) => {
  throw new Error('not implemented');
};
