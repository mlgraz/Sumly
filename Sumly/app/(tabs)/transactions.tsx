import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryForm } from '@/components/CategoryForm';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { useBudget } from '@/hooks/useBudget';
import type { TransactionRecord } from '@/types/budget';

export default function TransactionsScreen() {
  const {
    transactions,
    categories,
    loading,
    refresh,
    addTransaction,
    editTransaction,
    removeTransaction,
    addCategory,
  } = useBudget();
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [activeTransaction, setActiveTransaction] = useState<TransactionRecord | null>(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  const openCreateForm = () => {
    setActiveTransaction(null);
    setFormMode('create');
  };

  const openEditForm = (transaction: TransactionRecord) => {
    setActiveTransaction(transaction);
    setFormMode('edit');
  };

  const closeTransactionForm = () => {
    setActiveTransaction(null);
    setFormMode(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Transactions</Text>
            <Text style={styles.subtitle}>Tap and hold an item to delete it.</Text>
          </View>
          <View style={styles.headerButtons}>
            <View style={[styles.headerButton, styles.headerButtonFirst]}>
              <Button title="New Category" onPress={() => setIsCategoryModalVisible(true)} />
            </View>
            <View style={styles.headerButton}>
              <Button title="Add" onPress={openCreateForm} />
            </View>
          </View>
        </View>

        <TransactionList
          transactions={transactions}
          onDelete={removeTransaction}
          refreshing={loading}
          onRefresh={refresh}
          onPressItem={openEditForm}
        />
      </View>

      <TransactionForm
        visible={formMode !== null}
        mode={formMode ?? 'create'}
        transaction={activeTransaction}
        onClose={closeTransactionForm}
        onSubmit={async (input, id) => {
          if (formMode === 'edit' && id) {
            await editTransaction(id, input);
          } else {
            await addTransaction(input);
          }
        }}
        categories={categories}
      />
      <CategoryForm
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        mode="create"
        onSubmit={async (input) => {
          await addCategory(input);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2f7',
  },
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 8,
  },
  headerButtonFirst: {
    marginLeft: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#102027',
  },
  subtitle: {
    fontSize: 12,
    color: '#5f6b7a',
  },
});
