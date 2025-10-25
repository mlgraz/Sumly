import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { useBudget } from '@/hooks/useBudget';
import { formatCurrency } from '@/lib/database';
import type { CategoryMonthlyTotal } from '@/types/budget';

type SummaryVariant = 'positive' | 'negative' | 'neutral';

export default function HomeScreen() {
  const [formVisible, setFormVisible] = useState(false);
  const {
    transactions,
    categories,
    monthlyTotals,
    categoryTotals,
    loading,
    lastError,
  addTransaction,
    removeTransaction,
    refresh,
  } = useBudget();

  const categoryColorById = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((category) => {
      map.set(category.id, category.color);
    });
    return map;
  }, [categories]);

  const header = useMemo(() => {
    const topCategories = categoryTotals.slice(0, 4);
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>This Month</Text>
        <View style={styles.summaryRow}>
          <SummaryCard label="Income" value={monthlyTotals.income} variant="positive" />
          <SummaryCard label="Expenses" value={monthlyTotals.expenses} variant="negative" />
          <SummaryCard label="Balance" value={monthlyTotals.balance} variant="neutral" />
        </View>
        {topCategories.length > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            {topCategories.map((category) => (
              <CategoryRow
                key={category.categoryId}
                item={category}
                colorOverride={categoryColorById.get(category.categoryId)}
              />
            ))}
          </View>
        )}
        {lastError && <Text style={styles.errorText}>{lastError}</Text>}
      </View>
    );
  }, [categoryTotals, categoryColorById, lastError, monthlyTotals.balance, monthlyTotals.expenses, monthlyTotals.income]);

  const showInitialLoader = loading && transactions.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {showInitialLoader ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#1565c0" />
            <Text style={styles.loaderText}>Loading your budget...</Text>
          </View>
        ) : (
          <TransactionList
            transactions={transactions}
            onDelete={removeTransaction}
            refreshing={loading && transactions.length > 0}
            onRefresh={refresh}
            ListHeaderComponent={header}
          />
        )}
        <TouchableOpacity style={styles.fab} onPress={() => setFormVisible(true)} accessibilityRole="button">
          <Text style={styles.fabLabel}>＋</Text>
        </TouchableOpacity>
        <TransactionForm
          visible={formVisible}
          categories={categories}
          onClose={() => setFormVisible(false)}
          mode="create"
          onSubmit={async (input) => {
            await addTransaction(input);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function SummaryCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: SummaryVariant;
}) {
  const color = variant === 'positive' ? '#2e7d32' : variant === 'negative' ? '#c62828' : '#1c313a';

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{formatCurrency(value)}</Text>
    </View>
  );
}

function CategoryRow({
  item,
  colorOverride,
}: {
  item: CategoryMonthlyTotal;
  colorOverride?: string;
}) {
  const displayValue = formatCurrency(item.total);
  const prefix = item.categoryType === 'expense' ? '−' : '+';
  const fallbackColor = item.categoryType === 'expense' ? '#c62828' : '#2e7d32';

  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryLabelWrapper}>
        <View
          style={[
            styles.categoryBullet,
            { backgroundColor: colorOverride ?? fallbackColor },
          ]}
        />
        <Text style={styles.categoryLabel}>{item.categoryName}</Text>
      </View>
      <Text style={styles.categoryValue}>{`${prefix} ${displayValue}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e8f1f2',
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#102027',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#455a64',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  categorySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#102027',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBullet: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#102027',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c313a',
  },
  errorText: {
    fontSize: 13,
    color: '#c62828',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    backgroundColor: '#1565c0',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabLabel: {
    fontSize: 32,
    color: '#fff',
    marginTop: -2,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 15,
    color: '#455a64',
  },
});
