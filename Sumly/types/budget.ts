export type CategoryType = 'income' | 'expense';

export type Category = {
  id: number;
  name: string;
  type: CategoryType;
  color: string;
  createdAt: string;
};

export type TransactionRecord = {
  id: number;
  description: string;
  amount: number;
  occurredOn: string;
  categoryId: number | null;
  categoryName: string | null;
  categoryType: CategoryType | null;
  createdAt: string;
};

export type CategoryInput = {
  name: string;
  type: CategoryType;
  color?: string;
};

export type TransactionInput = {
  description: string;
  amount: number;
  occurredOn: string;
  categoryId: number | null;
  type: CategoryType;
};

export type MonthlyTotals = {
  income: number;
  expenses: number;
  balance: number;
};

export type CategoryMonthlyTotal = {
  categoryId: number;
  categoryName: string;
  categoryType: CategoryType;
  total: number;
};
