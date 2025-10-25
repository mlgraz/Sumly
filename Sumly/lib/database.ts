import {
  Category,
  CategoryInput,
  CategoryMonthlyTotal,
  CategoryType,
  MonthlyTotals,
  TransactionInput,
  TransactionRecord,
} from '@/types/budget';
import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'dollarDown.db';

const DEFAULT_CATEGORIES: Array<Omit<Category, 'id' | 'createdAt'>> = [
  { name: 'Salary', type: 'income', color: '#2e7d32' },
  { name: 'Freelance', type: 'income', color: '#00796b' },
  { name: 'Investment Income', type: 'income', color: '#512da8' },
  { name: 'Groceries', type: 'expense', color: '#c62828' },
  { name: 'Housing', type: 'expense', color: '#ad1457' },
  { name: 'Transportation', type: 'expense', color: '#1565c0' },
  { name: 'Utilities', type: 'expense', color: '#ef6c00' },
  { name: 'Dining Out', type: 'expense', color: '#6a1b9a' },
  { name: 'Savings', type: 'expense', color: '#00838f' },
  { name: 'Health', type: 'expense', color: '#558b2f' },
];

let databaseInstance: SQLiteDatabase | null = null;

const createTablesStatement = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('income','expense')),
    color TEXT NOT NULL DEFAULT '#00695c',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    occurred_on TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_transactions_occurred_on ON transactions (occurred_on DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category_id);
`;

async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databaseInstance) {
    databaseInstance = await openDatabaseAsync(DB_NAME);
    await databaseInstance.execAsync(createTablesStatement);
    await seedDefaultCategories(databaseInstance);
  }

  return databaseInstance;
}

async function seedDefaultCategories(db: SQLiteDatabase) {
  const now = new Date().toISOString();

  for (const category of DEFAULT_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (name, type, color, created_at)
       VALUES ($name, $type, $color, $createdAt)`,
      {
        $name: category.name,
        $type: category.type,
        $color: category.color,
        $createdAt: now,
      }
    );
  }
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mapTransactionRow(row: any): TransactionRecord {
  return {
    id: row.id,
    description: row.description,
    amount: row.amount,
    occurredOn: row.occurred_on,
    categoryId: row.category_id ?? null,
    categoryName: row.category_name ?? null,
    categoryType: row.category_type ?? null,
    createdAt: row.created_at,
  };
}

export async function initializeDatabase() {
  await getDatabase();
}

export async function fetchCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT id, name, type, color, created_at as createdAt FROM categories ORDER BY type DESC, name ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type as CategoryType,
    color: row.color,
    createdAt: row.createdAt,
  }));
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const db = await getDatabase();
  const name = input.name.trim();
  if (!name) {
    throw new Error('Category name is required');
  }

  const color = (input.color ?? '').trim() || (input.type === 'expense' ? '#c62828' : '#2e7d32');
  const createdAt = new Date().toISOString();

  try {
    const result = await db.runAsync(
      `INSERT INTO categories (name, type, color, created_at)
       VALUES ($name, $type, $color, $createdAt)`,
      {
        $name: name,
        $type: input.type,
        $color: color,
        $createdAt: createdAt,
      }
    );

    const inserted = await db.getFirstAsync<{ id: number; name: string; type: string; color: string; created_at: string }>(
      `SELECT id, name, type, color, created_at
         FROM categories
        WHERE id = $id`,
      { $id: result.lastInsertRowId }
    );

    if (!inserted) {
      throw new Error('Unable to load new category');
    }

    return {
      id: inserted.id,
      name: inserted.name,
      type: inserted.type as CategoryType,
      color: inserted.color,
      createdAt: inserted.created_at,
    };
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.includes('UNIQUE')) {
      throw new Error('A category with that name already exists.');
    }
    throw error;
  }
}

export async function updateCategory(id: number, input: CategoryInput): Promise<Category> {
  const db = await getDatabase();
  const name = input.name.trim();
  if (!name) {
    throw new Error('Category name is required');
  }

  const color = (input.color ?? '').trim() || (input.type === 'expense' ? '#c62828' : '#2e7d32');

  try {
    const result = await db.runAsync(
      `UPDATE categories
          SET name = $name,
              type = $type,
              color = $color
        WHERE id = $id`,
      {
        $name: name,
        $type: input.type,
        $color: color,
        $id: id,
      }
    );

    if (result.changes === 0) {
      throw new Error('Category not found.');
    }

    await db.runAsync(
      `UPDATE transactions
          SET amount = CASE WHEN $type = 'expense' THEN -ABS(amount) ELSE ABS(amount) END
        WHERE category_id = $id`,
      { $id: id, $type: input.type }
    );

    const updated = await db.getFirstAsync<{
      id: number;
      name: string;
      type: string;
      color: string;
      created_at: string;
    }>(
      `SELECT id, name, type, color, created_at
         FROM categories
        WHERE id = $id`,
      { $id: id }
    );

    if (!updated) {
      throw new Error('Unable to load updated category');
    }

    return {
      id: updated.id,
      name: updated.name,
      type: updated.type as CategoryType,
      color: updated.color,
      createdAt: updated.created_at,
    };
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.includes('UNIQUE')) {
      throw new Error('A category with that name already exists.');
    }
    throw error;
  }
}

export async function fetchTransactions(limit = 50): Promise<TransactionRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT t.id, t.description, t.amount, t.occurred_on, t.category_id, t.created_at,
            c.name AS category_name, c.type AS category_type
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
      ORDER BY t.occurred_on DESC, t.created_at DESC
      LIMIT $limit`,
    { $limit: limit }
  );

  return rows.map(mapTransactionRow);
}

export async function fetchTransactionsForRange(
  startDate: string,
  endDate: string
): Promise<TransactionRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT t.id, t.description, t.amount, t.occurred_on, t.category_id, t.created_at,
            c.name AS category_name, c.type AS category_type
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.occurred_on BETWEEN $start AND $end
      ORDER BY t.occurred_on DESC, t.created_at DESC`,
    { $start: startDate, $end: endDate }
  );

  return rows.map(mapTransactionRow);
}

export async function createTransaction(input: TransactionInput): Promise<TransactionRecord> {
  const db = await getDatabase();

  let normalizedAmount = Math.abs(input.amount);
  let categoryType: CategoryType | null = null;
  const categoryId = typeof input.categoryId === 'number' ? input.categoryId : null;

  if (categoryId !== null) {
    const category = await db.getFirstAsync<{ type: CategoryType }>(
      'SELECT type FROM categories WHERE id = $id',
      { $id: categoryId }
    );
    if (category?.type) {
      categoryType = category.type;
      normalizedAmount = category.type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount);
    }
  } else {
    categoryType = input.type;
    normalizedAmount = input.type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount);
  }

  const createdAt = new Date().toISOString();
  const occurredOn = input.occurredOn || toDateOnlyString(new Date());

  const result = await db.runAsync(
    `INSERT INTO transactions (description, amount, occurred_on, category_id, created_at)
     VALUES ($description, $amount, $occurredOn, $categoryId, $createdAt)`,
    {
      $description: input.description,
      $amount: normalizedAmount,
      $occurredOn: occurredOn,
      $categoryId: categoryId,
      $createdAt: createdAt,
    }
  );

  const inserted = await db.getFirstAsync<any>(
    `SELECT t.id, t.description, t.amount, t.occurred_on, t.category_id, t.created_at,
            c.name AS category_name, c.type AS category_type
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.id = $id`,
    { $id: result.lastInsertRowId }
  );

  if (!inserted) {
    throw new Error('Unable to load inserted transaction');
  }

  return mapTransactionRow({ ...inserted, category_type: categoryType ?? inserted.category_type });
}

export async function updateTransaction(id: number, input: TransactionInput): Promise<TransactionRecord> {
  const db = await getDatabase();

  let normalizedAmount = Math.abs(input.amount);
  let categoryType: CategoryType | null = null;
  const categoryId = typeof input.categoryId === 'number' ? input.categoryId : null;

  if (categoryId !== null) {
    const category = await db.getFirstAsync<{ type: CategoryType }>(
      'SELECT type FROM categories WHERE id = $id',
      { $id: categoryId }
    );
    if (category?.type) {
      categoryType = category.type;
      normalizedAmount = category.type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount);
    }
  } else {
    categoryType = input.type;
    normalizedAmount = input.type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount);
  }

  const occurredOn = input.occurredOn || toDateOnlyString(new Date());

  const result = await db.runAsync(
    `UPDATE transactions
        SET description = $description,
            amount = $amount,
            occurred_on = $occurredOn,
            category_id = $categoryId
      WHERE id = $id`,
    {
      $description: input.description,
      $amount: normalizedAmount,
      $occurredOn: occurredOn,
      $categoryId: categoryId,
      $id: id,
    }
  );

  if (result.changes === 0) {
    throw new Error('Transaction not found.');
  }

  const updated = await db.getFirstAsync<any>(
    `SELECT t.id, t.description, t.amount, t.occurred_on, t.category_id, t.created_at,
            c.name AS category_name, c.type AS category_type
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.id = $id`,
    { $id: id }
  );

  if (!updated) {
    throw new Error('Unable to load updated transaction');
  }

  return mapTransactionRow({ ...updated, category_type: categoryType ?? updated.category_type });
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = $id', { $id: id });
}

export async function monthBounds(target = new Date()): Promise<{ start: string; end: string }> {
  const start = new Date(target.getFullYear(), target.getMonth(), 1);
  const end = new Date(target.getFullYear(), target.getMonth() + 1, 0);
  return {
    start: toDateOnlyString(start),
    end: toDateOnlyString(end),
  };
}

export async function fetchMonthlyTotals(target = new Date()): Promise<MonthlyTotals> {
  const db = await getDatabase();
  const { start, end } = await monthBounds(target);

  const row = await db.getFirstAsync<{ income: number | null; expenses: number | null }>(
    `SELECT
        SUM(CASE WHEN amount >= 0 THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) AS expenses
       FROM transactions
      WHERE occurred_on BETWEEN $start AND $end`,
    { $start: start, $end: end }
  );

  const income = row?.income ?? 0;
  const expenses = Math.abs(row?.expenses ?? 0);

  return {
    income,
    expenses,
    balance: income - expenses,
  };
}

export async function fetchMonthlyTotalsByCategory(
  target = new Date()
): Promise<CategoryMonthlyTotal[]> {
  const db = await getDatabase();
  const { start, end } = await monthBounds(target);

  const rows = await db.getAllAsync<any>(
    `SELECT c.id AS category_id,
            c.name AS category_name,
            c.type AS category_type,
            SUM(t.amount) AS total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
      WHERE t.occurred_on BETWEEN $start AND $end
      GROUP BY c.id, c.name, c.type
      ORDER BY c.type DESC, total DESC`,
    { $start: start, $end: end }
  );

  return rows.map((row) => ({
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryType: row.category_type as CategoryType,
    total: row.category_type === 'expense' ? -row.total : row.total,
  }));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function today(): string {
  return toDateOnlyString(new Date());
}
