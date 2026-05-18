import { createClient } from '@/lib/supabase/client'
import type { MonthlyReport, ReportCategorySnapshot, ReportWalletSnapshot } from '@/types/database.types'

export async function getReports(): Promise<MonthlyReport[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as MonthlyReport[]
}

export async function getReport(year: number, month: number): Promise<MonthlyReport | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as MonthlyReport | null
}

export async function generateReport(year: number, month: number): Promise<MonthlyReport> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDayNum = new Date(year, month, 0).getDate()
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`

  const [{ data: txns, error: txErr }, { data: categories }, { data: wallets }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, type, amount, amount_ars, amount_usd, category_id, wallet_id')
      .gte('transaction_date', firstDay)
      .lte('transaction_date', lastDay),
    supabase.from('categories').select('id, name, color'),
    supabase.from('wallets').select('id, name, color'),
  ])

  if (txErr) throw new Error(txErr.message)
  const transactions = txns ?? []

  const ars = (t: { amount_ars: number | null; amount: number }) => t.amount_ars ?? t.amount

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + ars(t), 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + ars(t), 0)

  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round((Math.max(0, balance) / totalIncome) * 100) : 0

  const grouped: Record<string, number> = {}
  for (const t of transactions.filter(t => t.type === 'expense')) {
    const key = t.category_id ?? '__none'
    grouped[key] = (grouped[key] ?? 0) + ars(t)
  }

  const topCategories: ReportCategorySnapshot[] = Object.entries(grouped)
    .map(([categoryId, amount]) => {
      const cat = (categories ?? []).find(c => c.id === categoryId)
      return {
        name: cat?.name ?? 'Sin categoría',
        color: cat?.color ?? '#6b7280',
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)

  const walletBreakdown: ReportWalletSnapshot[] = (wallets ?? [])
    .map(w => {
      const wTxns = transactions.filter(t => t.wallet_id === w.id)
      return {
        wallet_id: w.id,
        name: w.name,
        color: w.color,
        income: wTxns.filter(t => t.type === 'income').reduce((s, t) => s + ars(t), 0),
        expenses: wTxns.filter(t => t.type === 'expense').reduce((s, t) => s + ars(t), 0),
      }
    })
    .filter(w => w.income > 0 || w.expenses > 0)

  const { data, error } = await supabase
    .from('monthly_reports')
    .upsert(
      {
        user_id: user.id,
        year,
        month,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        balance,
        savings_rate: savingsRate,
        top_categories: topCategories,
        wallet_breakdown: walletBreakdown,
        transaction_count: transactions.length,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,year,month' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as MonthlyReport
}
