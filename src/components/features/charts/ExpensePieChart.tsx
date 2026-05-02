'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts'
import { formatCurrency } from '@/lib/utils/formatters'
import { calcCategoryTotals } from '@/lib/utils/calculations'
import type { TransactionWithCategory, Category } from '@/types/database.types'

interface ExpensePieChartProps {
  transactions: TransactionWithCategory[]
  categories: Category[]
  loading?: boolean
}

interface TooltipPayload {
  name: string
  value: number
  payload: { color: string; percentage: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-xl border border-white/10 bg-gray-800/90 backdrop-blur-sm px-4 py-3 shadow-xl text-sm">
      <p className="font-semibold text-white">{item.name}</p>
      <p className="mt-0.5 text-gray-300">{formatCurrency(item.value)}</p>
      <p className="text-xs text-gray-500 mt-0.5">{item.payload.percentage}% del total</p>
    </div>
  )
}

interface CenterLabelProps {
  viewBox?: { cx?: number; cy?: number }
  total: number
}

function CenterLabel({ viewBox, total }: CenterLabelProps) {
  const cx = viewBox?.cx ?? 0
  const cy = viewBox?.cy ?? 0
  return (
    <g>
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fill="white"
        style={{ fontSize: '18px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
      >
        {formatCurrency(total)}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill="#6b7280"
        style={{ fontSize: '11px', fontWeight: 500 }}
      >
        Gastos del mes
      </text>
    </g>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="h-52 w-52 rounded-full animate-shimmer" />
      <div className="w-full space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full animate-shimmer" />
            <div className="h-2.5 flex-1 rounded animate-shimmer" />
            <div className="h-2.5 w-10 rounded animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExpensePieChart({ transactions, categories, loading }: ExpensePieChartProps) {
  const data = calcCategoryTotals(transactions, categories)
  const total = data.reduce((acc, d) => acc + d.amount, 0)

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-900 p-6 shadow-xl h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">Distribución de Gastos</h2>
        <p className="text-xs text-gray-500 mt-0.5">Por categoría · Este mes</p>
      </div>

      {loading ? (
        <ChartSkeleton />
      ) : data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="h-14 w-14 rounded-full bg-gray-800 flex items-center justify-center mb-3">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-sm text-gray-400 font-medium">Sin gastos registrados</p>
          <p className="text-xs text-gray-600 mt-1">
            Agregá tu primer gasto para ver la distribución
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Donut chart */}
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                  <Label
                    content={<CenterLabel total={total} />}
                    position="center"
                  />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-2.5 flex-1 overflow-y-auto">
            {data.map((cat) => (
              <div key={cat.categoryId} className="flex items-center gap-3">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1 text-xs text-gray-400 truncate">{cat.name}</span>
                <span className="text-xs font-semibold text-gray-300 tabular-nums">
                  {formatCurrency(cat.amount)}
                </span>
                <span
                  className="w-8 text-right text-[10px] font-medium"
                  style={{ color: cat.color }}
                >
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
