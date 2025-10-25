import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Category, CategoryInput, CategoryType } from '@/types/budget';

interface CategoryFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: CategoryInput, id?: number) => Promise<void>;
  mode?: 'create' | 'edit';
  category?: Category | null;
}

const COLOR_PRESETS = ['#2e7d32', '#00796b', '#1565c0', '#c62828', '#ef6c00', '#6a1b9a', '#00838f'];

const defaultColorForType = (type: CategoryType) => (type === 'expense' ? '#c62828' : '#2e7d32');

export function CategoryForm({ visible, onClose, onSubmit, mode = 'create', category = null }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [color, setColor] = useState(defaultColorForType('expense'));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorOptions = useMemo(() => {
    const base = mode === 'edit' && category ? [category.color, ...COLOR_PRESETS] : COLOR_PRESETS;
    return Array.from(new Set(base));
  }, [mode, category]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (mode === 'edit' && category) {
      setName(category.name);
      setType(category.type);
      setColor(category.color);
    } else {
      setName('');
      setType('expense');
      setColor(defaultColorForType('expense'));
    }
    setIsSubmitting(false);
  }, [visible, mode, category]);

  useEffect(() => {
    if (mode === 'create') {
      setColor(defaultColorForType(type));
    }
  }, [type, mode]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Missing name', 'Please provide a category name.');
      return;
    }

    setIsSubmitting(true);
    try {
  await onSubmit({ name: trimmedName, type, color }, category?.id);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Unable to save category', error.message);
      } else {
        Alert.alert('Unable to save category', 'Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.container}>
  <Text style={styles.title}>{mode === 'edit' ? 'Edit Category' : 'Add Category'}</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Subscriptions"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeToggleRow}>
          {(['income', 'expense'] as CategoryType[]).map((candidate) => {
            const isActive = type === candidate;
            return (
              <Pressable
                key={candidate}
                onPress={() => setType(candidate)}
                style={[styles.typePill, isActive && styles.typePillActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.typePillLabel, isActive && styles.typePillLabelActive]}>
                  {candidate === 'income' ? 'Income' : 'Expense'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Color</Text>
        <View style={styles.colorRow}>
          {colorOptions.map((preset) => {
            const isSelected = color === preset;
            return (
              <Pressable
                key={preset}
                onPress={() => {
                  setColor(preset);
                }}
                style={[styles.colorSwatch, { backgroundColor: preset }, isSelected && styles.colorSwatchActive]}
                accessibilityRole="button"
              />
            );
          })}
        </View>

        <View style={styles.footer}>
          <Button title="Cancel" color="#546e7a" onPress={onClose} disabled={isSubmitting} />
          <Button
            title={isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update' : 'Save'}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#102027',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
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
  typeToggleRow: {
    flexDirection: 'row',
    gap: 12,
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
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: '#102027',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 'auto',
  },
});
