import React, { ReactElement } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@/lib/database';
import type { TransactionRecord } from '@/types/budget';

interface TransactionListProps {
  transactions: TransactionRecord[];
  onDelete?: (id: number) => Promise<void> | void;
  onPressItem?: (transaction: TransactionRecord) => void;
  refreshing?: boolean;
  onRefresh?: () => Promise<void> | void;
  ListHeaderComponent?: ReactElement | null;
}

export function TransactionList({
  transactions,
  onDelete,
  onPressItem,
  refreshing = false,
  onRefresh,
  ListHeaderComponent,
}: TransactionListProps) {
  const handleDelete = (id: number) => {
    if (!onDelete) {
      return;
    }

    Alert.alert('Delete transaction', 'This cannot be undone. Proceed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Promise.resolve(onDelete(id)).catch(() => {
            Alert.alert('Unable to delete transaction', 'Please try again.');
          });
        },
      },
    ]);
  };

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => `${item.id}`}
      contentContainerStyle={transactions.length === 0 ? styles.emptyContainer : undefined}
      ListHeaderComponent={ListHeaderComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      renderItem={({ item }) => {
        const isExpense = item.amount < 0;
        const amountColor = isExpense ? '#c62828' : '#2e7d32';
        const amountLabel = formatCurrency(Math.abs(item.amount));

        return (
          <Pressable
            style={styles.row}
            onPress={() => {
              if (onPressItem) {
                onPressItem(item);
              }
            }}
            onLongPress={() => handleDelete(item.id)}
          >
            <View style={styles.rowText}>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.meta}>
                {item.categoryName ?? 'Uncategorized'} · {item.occurredOn}
              </Text>
            </View>
            <Text style={[styles.amount, { color: amountColor }]}>{`${isExpense ? '-' : '+'} ${amountLabel}`}</Text>
          </Pressable>
        );
      }}
      ListEmptyComponent={() => (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptySubtitle}>Add your first transaction to track spending.</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0d1b2a',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: '#5f6b7a',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#102027',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#5f6b7a',
  },
});
