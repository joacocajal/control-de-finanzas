import type { Transaction, Category, CategoryTotal, BudgetAlert } from '@/types/database.types'

export function calcBalance(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount
  }, 0)
}

export function calcTotalByType(transactions: Transaction[], type: 'income' | 'expense'): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((acc, t) => acc + t.amount, 0)
}

export function calcCategoryTotals(
  transactions: Transaction[],
  categories: Category[]
): CategoryTotal[] {
  const expenseTransactions = transactions.filter((t) => t.type === 'expense')
  const total = expenseTransactions.reduce((acc, t) => acc + t.amount, 0)

  if (total === 0) return []

  const grouped = expenseTransactions.reduce<Record<string, number>>((acc, t) => {
    const key = t.category_id ?? 'sin-categoria'
    acc[key] = (acc[key] ?? 0) + t.amount
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([categoryId, amount]) => {
      const category = categories.find((c) => c.id === categoryId)
      return {
        categoryId,
        name: category?.name ?? 'Sin categoría',
        color: category?.color ?? '#6b7280',
        amount,
        percentage: Math.round((amount / total) * 100),
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

export function calcBudgetAlerts(
  transactions: Transaction[],
  categories: Category[]
): BudgetAlert[] {
  const grouped = transactions
    .filter(t => t.type === 'expense' && t.category_id)
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category_id!] = (acc[t.category_id!] ?? 0) + t.amount
      return acc
    }, {})

  return categories
    .filter(c => c.monthly_budget && c.monthly_budget > 0)
    .flatMap(c => {
      const spent = grouped[c.id] ?? 0
      const pct = spent / c.monthly_budget!
      if (pct < 0.8) return []
      return [{
        categoryId: c.id,
        name: c.name,
        color: c.color,
        spent,
        budget: c.monthly_budget!,
        percentage: Math.round(pct * 100),
        level: pct >= 1 ? ('danger' as const) : ('warning' as const),
      }]
    })
    .sort((a, b) => b.percentage - a.percentage)
}

export function getMonthRange(): { start: string; end: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    start: `${y}-${m}-01`,
    end: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}
