import { BudgetContext } from '@/context/BudgetContext';
import { useContext } from 'react';

export function useBudget() {
  const context = useContext(BudgetContext);

  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }

  return context;
}
