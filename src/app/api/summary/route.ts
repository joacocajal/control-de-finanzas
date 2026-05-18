import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMonthRange } from '@/lib/utils/calculations'
import type { TransactionWithCategory } from '@/types/database.types'

function computeSummary(transactions: TransactionWithCategory[]) {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenseTransactions = transactions.filter((t) => t.type === 'expense')
  const expenseTotal = expenses

  const grouped: Record<string, { name: string; amount: number }> = {}
  for (const t of expenseTransactions) {
    const key = t.category_id ?? '__none__'
    if (!grouped[key]) {
      grouped[key] = { name: t.categories?.name ?? 'Sin categoría', amount: 0 }
    }
    grouped[key].amount += t.amount
  }

  const topCategories = Object.values(grouped)
    .map(({ name, amount }) => ({
      name,
      amount,
      percentage: expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return { balance: income - expenses, totalIncome: income, totalExpenses: expenses, topCategories }
}

export async function GET(request: Request) {
  // API key authentication for n8n / external consumers
  const authHeader = request.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const expected = process.env.SUMMARY_API_KEY

  if (!expected) {
    return NextResponse.json({ error: 'SUMMARY_API_KEY no configurada en el servidor' }, { status: 500 })
  }
  if (token !== expected) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const { start, end } = getMonthRange()

    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name, color, icon)')
      .gte('transaction_date', start)
      .lte('transaction_date', end)

    if (error) throw new Error(error.message)

    const transactions = (data ?? []) as TransactionWithCategory[]
    const summary = computeSummary(transactions)

    return NextResponse.json({
      ...summary,
      period: { start, end },
      transactionCount: transactions.length,
    })
  } catch (err) {
    console.error('Summary endpoint error:', err)
    const msg = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
