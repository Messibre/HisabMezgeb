import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export type ExpenseCategory = {
  id: string;
  accountId: string;
  name: string;
  group: 'business' | 'personal';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const listCategories = async (accountId: string): Promise<ExpenseCategory[]> => {
  const categories = await prisma.expenseCategory.findMany({
    where: {
      accountId,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  });

  return categories as ExpenseCategory[];
};

export const createCategory = async (
  accountId: string,
  data: {
    name: string;
    group: 'business' | 'personal';
  },
): Promise<ExpenseCategory> => {
  const existing = await prisma.expenseCategory.findUnique({
    where: {
      accountId_name: {
        accountId,
        name: data.name,
      },
    },
  });

  if (existing) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'This category already exists');
  }

  const created = await prisma.expenseCategory.create({
    data: {
      accountId,
      name: data.name,
      group: data.group,
      isActive: true,
    },
  });

  return created as ExpenseCategory;
};

export const updateCategory = async (
  accountId: string,
  categoryId: string,
  data: {
    name?: string;
    isActive?: boolean;
  },
): Promise<ExpenseCategory> => {
  const existing = await prisma.expenseCategory.findUnique({
    where: {
      id: categoryId,
      accountId,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Category not found');
  }

  // If updating name, check for duplicate (excluding the current category)
  if (data.name !== undefined && data.name !== existing.name) {
    const duplicate = await prisma.expenseCategory.findUnique({
      where: {
        accountId_name: {
          accountId,
          name: data.name,
        },
      },
    });

    // ✅ CRITICAL: Only throw if a DIFFERENT category already has this name
    if (duplicate && duplicate.id !== categoryId) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'This category already exists');
    }
  }

  const updateData: { name?: string; isActive?: boolean } = {};
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  if (Object.keys(updateData).length === 0) {
    return existing as ExpenseCategory;
  }

  const updated = await prisma.expenseCategory.update({
    where: { id: categoryId },
    data: updateData,
  });

  return updated as ExpenseCategory;
};
