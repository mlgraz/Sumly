import {
  createCategory,
  createTransaction,
  deleteTransaction,
  fetchCategories,
  fetchMonthlyTotals,
  fetchMonthlyTotalsByCategory,
  fetchTransactions,
  initializeDatabase,
  updateCategory,
  updateTransaction,
} from '@/lib/database';
import type {
  Category,
  CategoryInput,
  CategoryMonthlyTotal,
  MonthlyTotals,
  TransactionInput,
  TransactionRecord,
} from '@/types/budget';
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

interface BudgetContextValue {
  categories: Category[];
  transactions: TransactionRecord[];
  monthlyTotals: MonthlyTotals;
  categoryTotals: CategoryMonthlyTotal[];
  loading: boolean;
  lastError: string | null;
  refresh: () => Promise<void>;
  addTransaction: (input: TransactionInput) => Promise<void>;
  editTransaction: (id: number, input: TransactionInput) => Promise<void>;
  removeTransaction: (id: number) => Promise<void>;
  addCategory: (input: CategoryInput) => Promise<void>;
  editCategory: (id: number, input: CategoryInput) => Promise<void>;
}

const defaultTotals: MonthlyTotals = { income: 0, expenses: 0, balance: 0 };

export const BudgetContext = React.createContext<BudgetContextValue | undefined>(undefined);

export function BudgetProvider({ children }: PropsWithChildren) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals>(defaultTotals);
  const [categoryTotals, setCategoryTotals] = useState<CategoryMonthlyTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLastError(null);

    try {
      await initializeDatabase();
      const [categoryList, transactionList, totals, categoryBreakdown] = await Promise.all([
        fetchCategories(),
        fetchTransactions(),
        fetchMonthlyTotals(),
        fetchMonthlyTotalsByCategory(),
      ]);

      setCategories(categoryList);
      setTransactions(transactionList);
      setMonthlyTotals(totals);
      setCategoryTotals(categoryBreakdown);
    } catch (error) {
      console.error('Failed to load data', error);
      setLastError('Unable to load budget data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addTransaction = useCallback(
    async (input: TransactionInput) => {
      try {
        await createTransaction(input);
        await loadData();
      } catch (error) {
        console.error('Failed to add transaction', error);
        setLastError('Unable to save transaction.');
        throw error;
      }
    },
    [loadData]
  );

  const editTransaction = useCallback(
    async (id: number, input: TransactionInput) => {
      try {
        await updateTransaction(id, input);
        await loadData();
      } catch (error) {
        console.error('Failed to update transaction', error);
        setLastError('Unable to update transaction.');
        throw error;
      }
    },
    [loadData]
  );

  const removeTransaction = useCallback(
    async (id: number) => {
      try {
        await deleteTransaction(id);
        await loadData();
      } catch (error) {
        console.error('Failed to remove transaction', error);
        setLastError('Unable to delete transaction.');
        throw error;
      }
    },
    [loadData]
  );

  const addCategory = useCallback(
    async (input: CategoryInput) => {
      try {
        await createCategory(input);
        await loadData();
      } catch (error) {
        console.error('Failed to add category', error);
        setLastError(error instanceof Error ? error.message : 'Unable to save category.');
        throw error;
      }
    },
    [loadData]
  );

  const editCategory = useCallback(
    async (id: number, input: CategoryInput) => {
      try {
        await updateCategory(id, input);
        await loadData();
      } catch (error) {
        console.error('Failed to update category', error);
        setLastError(error instanceof Error ? error.message : 'Unable to update category.');
        throw error;
      }
    },
    [loadData]
  );

  const value = useMemo<BudgetContextValue>(
    () => ({
      categories,
      transactions,
      monthlyTotals,
      categoryTotals,
      loading,
      lastError,
      refresh: loadData,
      addTransaction,
      editTransaction,
      removeTransaction,
      addCategory,
      editCategory,
    }),
    [
      categories,
      transactions,
      monthlyTotals,
      categoryTotals,
      loading,
      lastError,
      loadData,
      addTransaction,
      editTransaction,
      removeTransaction,
      addCategory,
      editCategory,
    ]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}
