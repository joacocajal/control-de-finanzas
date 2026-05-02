export type TransactionType = 'income' | 'expense'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  description: string | null
  transaction_date: string
  created_at: string
  updated_at: string
}

export interface TransactionWithCategory extends Transaction {
  categories: Pick<Category, 'name' | 'color' | 'icon'> | null
}

export interface CategoryTotal {
  categoryId: string
  name: string
  color: string
  amount: number
  percentage: number
}

export interface CreateTransactionInput {
  type: TransactionType
  amount: number
  category_id: string | null
  description: string | null
  transaction_date: string
}

export interface CreateCategoryInput {
  name: string
  color: string
  icon?: string | null
}

export interface AIChatContext {
  balance: number
  totalIncome: number
  totalExpenses: number
  topCategories: Array<{
    name: string
    amount: number
    percentage: number
  }>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}
