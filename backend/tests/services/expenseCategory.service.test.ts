import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { prisma } from '../../src/config/db.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  ExpenseCategory,
} from '../../src/services/expenseCategory.service.js';
import ApiError from '../../src/utils/ApiError.js';

vi.mock('../../src/config/db.js', () => ({
  prisma: {
    expenseCategory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockFindMany = prisma.expenseCategory.findMany as unknown as Mock<
  typeof prisma.expenseCategory.findMany
>;
const mockFindUnique = prisma.expenseCategory.findUnique as unknown as Mock<
  typeof prisma.expenseCategory.findUnique
>;
const mockCreate = prisma.expenseCategory.create as unknown as Mock<
  typeof prisma.expenseCategory.create
>;
const mockUpdate = prisma.expenseCategory.update as unknown as Mock<
  typeof prisma.expenseCategory.update
>;

describe('ExpenseCategory Service', () => {
  const accountId = 'acc-123';
  const categoryId = 'cat-456';

  const mockCategory: ExpenseCategory = {
    id: categoryId,
    accountId,
    name: 'Cost of Goods',
    group: 'business',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCategories', () => {
    it('should return list of active categories for the account', async () => {
      mockFindMany.mockResolvedValue([mockCategory]);

      const result = await listCategories(accountId);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          accountId,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockCategory]);
    });

    it('should return empty array when no categories exist', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await listCategories(accountId);

      expect(result).toEqual([]);
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockFindMany.mockRejectedValue(dbError);

      await expect(listCategories(accountId)).rejects.toThrow(dbError);
    });
  });

  describe('createCategory', () => {
    it('should create a new category successfully', async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockCategory);

      const result = await createCategory(accountId, {
        name: 'Cost of Goods',
        group: 'business',
      });

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          accountId_name: {
            accountId,
            name: 'Cost of Goods',
          },
        },
      });
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          accountId,
          name: 'Cost of Goods',
          group: 'business',
          isActive: true,
        },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw 409 if category name already exists', async () => {
      mockFindUnique.mockResolvedValue(mockCategory);

      await expect(
        createCategory(accountId, { name: 'Cost of Goods', group: 'business' }),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'This category already exists',
      });

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockFindUnique.mockRejectedValue(dbError);

      await expect(
        createCategory(accountId, { name: 'Cost of Goods', group: 'business' }),
      ).rejects.toThrow(dbError);
    });
  });

  describe('updateCategory', () => {
    it('should update name only', async () => {
      mockFindUnique.mockResolvedValue(mockCategory);
      mockUpdate.mockResolvedValue({ ...mockCategory, name: 'Updated Name' });

      const result = await updateCategory(accountId, categoryId, { name: 'Updated Name' });

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: categoryId,
          accountId,
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: { name: 'Updated Name' },
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should update isActive only', async () => {
      mockFindUnique.mockResolvedValue(mockCategory);
      mockUpdate.mockResolvedValue({ ...mockCategory, isActive: false });

      const result = await updateCategory(accountId, categoryId, { isActive: false });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });

    it('should update both name and isActive', async () => {
      mockFindUnique.mockResolvedValue(mockCategory);
      mockUpdate.mockResolvedValue({
        ...mockCategory,
        name: 'New Name',
        isActive: false,
      });

      const result = await updateCategory(accountId, categoryId, {
        name: 'New Name',
        isActive: false,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: { name: 'New Name', isActive: false },
      });
      expect(result.name).toBe('New Name');
      expect(result.isActive).toBe(false);
    });

    it('should throw 404 if category not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        updateCategory(accountId, categoryId, { name: 'New Name' }),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Category not found',
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should not check duplicate name if name is not being updated', async () => {
      mockFindUnique.mockResolvedValue(mockCategory);
      mockUpdate.mockResolvedValue({ ...mockCategory, isActive: false });

      await updateCategory(accountId, categoryId, { isActive: false });

      expect(mockFindUnique).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should check duplicate name when name is being updated', async () => {
      mockFindUnique.mockResolvedValueOnce(mockCategory);
      mockFindUnique.mockResolvedValueOnce(null);
      mockUpdate.mockResolvedValue({ ...mockCategory, name: 'New Name' });

      await updateCategory(accountId, categoryId, { name: 'New Name' });

      expect(mockFindUnique).toHaveBeenCalledTimes(2);
      expect(mockFindUnique).toHaveBeenNthCalledWith(2, {
        where: {
          accountId_name: {
            accountId,
            name: 'New Name',
          },
        },
      });
    });

    it('should throw 409 if new name already exists for another category', async () => {
      mockFindUnique.mockResolvedValueOnce(mockCategory);
      mockFindUnique.mockResolvedValueOnce({
        ...mockCategory,
        id: 'other-cat',
        name: 'Existing Name', // Must match the new name we are trying to set
      });

      await expect(
        updateCategory(accountId, categoryId, { name: 'Existing Name' }),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'This category already exists',
      });

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockFindUnique.mockRejectedValue(dbError);

      await expect(updateCategory(accountId, categoryId, { name: 'New Name' })).rejects.toThrow(
        dbError,
      );
    });
  });
});
