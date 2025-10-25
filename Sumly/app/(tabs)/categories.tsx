import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryForm } from '@/components/CategoryForm';
import { useBudget } from '@/hooks/useBudget';
import type { Category } from '@/types/budget';

type CategorySection = {
  title: string;
  data: Category[];
};

export default function CategoriesScreen() {
  const { categories, loading, refresh, addCategory, editCategory } = useBudget();
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const sections = useMemo<CategorySection[]>(() => {
    const income = categories.filter((category) => category.type === 'income');
    const expenses = categories.filter((category) => category.type === 'expense');

    const nextSections: CategorySection[] = [];
    if (income.length > 0) {
      nextSections.push({ title: 'Income', data: income });
    }
    if (expenses.length > 0) {
      nextSections.push({ title: 'Expenses', data: expenses });
    }
    return nextSections;
  }, [categories]);

  const openCreate = () => {
    setActiveCategory(null);
    setFormMode('create');
  };

  const openEdit = (category: Category) => {
    setActiveCategory(category);
    setFormMode('edit');
  };

  const closeForm = () => {
    setActiveCategory(null);
    setFormMode(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Categories</Text>
            <Text style={styles.subtitle}>Organize how you track income and expenses.</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.addButton}
            onPress={openCreate}
          >
            <Text style={styles.addButtonLabel}>＋</Text>
          </TouchableOpacity>
        </View>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => openEdit(item)}>
              <View style={styles.rowLeft}>
                <View style={[styles.bullet, { backgroundColor: item.color }]} />
                <Text style={styles.rowLabel}>{item.name}</Text>
              </View>
              <Text
                style={[
                  styles.rowPill,
                  item.type === 'expense' ? styles.expensePill : styles.incomePill,
                ]}
              >
                {item.type === 'expense' ? 'Expense' : 'Income'}
              </Text>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
          SectionSeparatorComponent={() => <View style={styles.sectionDivider} />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No categories yet</Text>
              <Text style={styles.emptyDescription}>
                Default categories load automatically. Add more that match your budget.
              </Text>
            </View>
          }
          refreshing={loading}
          onRefresh={refresh}
        />
      </View>
      <CategoryForm
        visible={formMode !== null}
        mode={formMode ?? 'create'}
        category={activeCategory}
        onClose={closeForm}
        onSubmit={async (input, id) => {
          if (formMode === 'edit' && id) {
            await editCategory(id, input);
          } else {
            await addCategory(input);
          }
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#102027',
  },
  subtitle: {
    fontSize: 13,
    color: '#5f6b7a',
    marginTop: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1565c0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  addButtonLabel: {
    fontSize: 26,
    color: '#fff',
    marginTop: -2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c313a',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rowLabel: {
    fontSize: 15,
    color: '#102027',
    fontWeight: '500',
  },
  rowPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
    color: '#fff',
  },
  incomePill: {
    backgroundColor: '#2e7d32',
  },
  expensePill: {
    backgroundColor: '#c62828',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d0d7de',
  },
  sectionDivider: {
    height: 24,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#102027',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#5f6b7a',
  },
});
