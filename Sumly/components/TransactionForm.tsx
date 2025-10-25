import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { today } from '@/lib/database';
import type { Category, CategoryType, TransactionInput, TransactionRecord } from '@/types/budget';

interface TransactionFormProps {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onSubmit: (input: TransactionInput, id?: number) => Promise<void>;
  mode?: 'create' | 'edit';
  transaction?: TransactionRecord | null;
}

const amountRegex = /^-?\d*(?:\.\d{0,2})?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
export function TransactionForm({
  visible,
  categories,
  onClose,
  onSubmit,
  mode = 'create',
  transaction = null,
}: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [occurredOn, setOccurredOn] = useState(today());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionType, setTransactionType] = useState<CategoryType>('expense');

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (mode === 'edit' && transaction) {
  setDescription(transaction.description);
  setAmount(String(Math.abs(transaction.amount)));
  setCategoryId(transaction.categoryId ?? null);
      setOccurredOn(transaction.occurredOn);
      setTransactionType(
        transaction.categoryType ?? (transaction.amount < 0 ? 'expense' : 'income')
      );
    } else {
      setDescription('');
      setAmount('');
  setCategoryId(null);
      setOccurredOn(today());
      setTransactionType('expense');
    }
    setIsSubmitting(false);
  }, [visible, mode, transaction]);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'income' ? -1 : 1;
      }),
    [categories]
  );

  const selectedCategory =
    categoryId !== null ? sortedCategories.find((category) => category.id === categoryId) ?? null : null;

  useEffect(() => {
    if (selectedCategory) {
      setTransactionType(selectedCategory.type);
    }
  }, [selectedCategory]);

  const handleAmountChange = (value: string) => {
    if (value === '' || amountRegex.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = async () => {
    const trimmedDescription = description.trim();
    const parsedAmount = Number(amount);

    if (!trimmedDescription) {
      Alert.alert('Missing description', 'Please add a short description.');
      return;
    }

    if (!amount || Number.isNaN(parsedAmount) || parsedAmount === 0) {
      Alert.alert('Invalid amount', 'Enter a non-zero amount.');
      return;
    }

    if (!dateRegex.test(occurredOn)) {
      Alert.alert('Invalid date', 'Use the YYYY-MM-DD format.');
      return;
    }

  const normalizedCategoryId = selectedCategory ? selectedCategory.id : null;
    const effectiveType = selectedCategory ? selectedCategory.type : transactionType;

    const payload: TransactionInput = {
      description: trimmedDescription,
      amount: Math.abs(parsedAmount),
      occurredOn,
      categoryId: normalizedCategoryId,
      type: effectiveType,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload, transaction?.id);
      onClose();
    } catch {
      Alert.alert('Unable to save transaction', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Transaction</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Grocery run"
            value={description}
            onChangeText={setDescription}
            autoFocus
          />

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={categoryId !== null ? String(categoryId) : ''}
              onValueChange={(rawValue) => {
                if (rawValue == null || rawValue === '') {
                  setCategoryId(null);
                  return;
                }

                const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
                setCategoryId(Number.isNaN(numericValue) ? null : numericValue);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Uncategorized" value="" />
              {sortedCategories.map((category) => (
                <Picker.Item
                  key={category.id}
                  label={`${category.type === 'expense' ? '−' : '+'} ${category.name}`}
                  value={`${category.id}`}
                  color={category.color}
                />
              ))}
            </Picker>
          </View>

          {!selectedCategory && (
            <View>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeToggleRow}>
                {(['income', 'expense'] as CategoryType[]).map((type) => {
                  const isActive = transactionType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setTransactionType(type)}
                      style={[styles.typePill, isActive && styles.typePillActive]}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.typePillLabel, isActive && styles.typePillLabelActive]}>
                        {type === 'income' ? 'Income' : 'Expense'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="2025-01-31"
            value={occurredOn}
            onChangeText={setOccurredOn}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.footer}>
          <Button title="Cancel" color="#546e7a" onPress={onClose} disabled={isSubmitting} />
          <Button
            title={isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update' : 'Save'}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#102027',
  },
  body: {
    flex: 1,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#263238',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 44,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  typePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#cfd8dc',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typePillActive: {
    backgroundColor: '#1565c0',
    borderColor: '#1565c0',
  },
  typePillLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#455a64',
  },
  typePillLabelActive: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 16,
  },
});
